/**
 * Web Push (RFC 8291 aes128gcm + RFC 8292 VAPID) pour Cloudflare Workers.
 * Aucune dependance externe : uniquement l'API Web Crypto.
 */

const enc = new TextEncoder();

export function b64uToBytes(s) {
  const pad = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(pad + '='.repeat((4 - (pad.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToB64u(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function concat(...arrays) {
  let len = 0;
  for (const a of arrays) len += a.length;
  const out = new Uint8Array(len);
  let off = 0;
  for (const a of arrays) { out.set(a, off); off += a.length; }
  return out;
}

async function hmac(keyBytes, data) {
  const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return new Uint8Array(await crypto.subtle.sign('HMAC', key, data));
}

/** HKDF-Extract puis HKDF-Expand sur un seul bloc (longueur <= 32). */
async function hkdf(salt, ikm, info, length) {
  const prk = await hmac(salt, ikm);
  const okm = await hmac(prk, concat(info, new Uint8Array([1])));
  return okm.slice(0, length);
}

/**
 * Chiffre le message pour un abonnement donne (aes128gcm).
 * @returns {Uint8Array} corps de la requete POST
 */
export async function encryptPayload(payload, p256dhB64u, authB64u) {
  const uaPublic = b64uToBytes(p256dhB64u);
  const authSecret = b64uToBytes(authB64u);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Paire de cles ephemere du serveur applicatif.
  const asKeys = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
  const asPublic = new Uint8Array(await crypto.subtle.exportKey('raw', asKeys.publicKey));

  const uaKey = await crypto.subtle.importKey('raw', uaPublic, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  const ecdhSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: uaKey }, asKeys.privateKey, 256)
  );

  // RFC 8291 section 3.4
  const keyInfo = concat(enc.encode('WebPush: info\0'), uaPublic, asPublic);
  const ikm = await hkdf(authSecret, ecdhSecret, keyInfo, 32);

  const cek = await hkdf(salt, ikm, enc.encode('Content-Encoding: aes128gcm\0'), 16);
  const nonce = await hkdf(salt, ikm, enc.encode('Content-Encoding: nonce\0'), 12);

  // Delimiteur 0x02 = dernier enregistrement.
  const plaintext = concat(enc.encode(payload), new Uint8Array([2]));

  const aesKey = await crypto.subtle.importKey('raw', cek, { name: 'AES-GCM' }, false, ['encrypt']);
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: 128 }, aesKey, plaintext)
  );

  // En-tete : salt(16) | rs(4) | idlen(1) | cle publique ephemere(65)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096);
  return concat(salt, rs, new Uint8Array([asPublic.length]), asPublic, ciphertext);
}

/** Construit l'en-tete Authorization VAPID pour un endpoint donne. */
export async function vapidHeader(endpoint, publicKeyB64u, privateJwk, subject) {
  const aud = new URL(endpoint).origin;
  const header = { typ: 'JWT', alg: 'ES256' };
  const body = { aud, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: subject };

  const signingInput = bytesToB64u(enc.encode(JSON.stringify(header)))
    + '.' + bytesToB64u(enc.encode(JSON.stringify(body)));

  const key = await crypto.subtle.importKey(
    'jwk',
    { ...privateJwk, key_ops: ['sign'], ext: true },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(signingInput))
  );

  const jwt = signingInput + '.' + bytesToB64u(sig);
  return `vapid t=${jwt}, k=${publicKeyB64u}`;
}

/**
 * Envoie une notification a un abonnement.
 * @returns {number} code HTTP renvoye par le service de push
 */
export async function sendPush(sub, payload, vapid) {
  const bodyBytes = await encryptPayload(payload, sub.p256dh, sub.auth);
  const auth = await vapidHeader(sub.endpoint, vapid.publicKey, vapid.privateJwk, vapid.subject);

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': auth,
      'Content-Encoding': 'aes128gcm',
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
      'Urgency': 'normal',
    },
    body: bodyBytes,
  });
  return res.status;
}

/** Charge la configuration VAPID depuis la table config. */
export async function loadVapid(env) {
  const rows = await env.DB.prepare("SELECT key, value FROM config WHERE key IN ('vapid_public','vapid_private','vapid_subject')").all();
  const map = Object.fromEntries((rows.results || []).map(r => [r.key, r.value]));
  if (!map.vapid_public || !map.vapid_private) return null;
  return {
    publicKey: map.vapid_public,
    privateJwk: JSON.parse(map.vapid_private),
    subject: map.vapid_subject || 'mailto:contact@elucco.org',
  };
}

/**
 * Diffuse une notification a tous les abonnes, en excluant l'auteur de l'action.
 * Les abonnements expires (404/410) sont supprimes.
 */
export async function broadcast(env, payload, excludeVoterHash) {
  const vapid = await loadVapid(env);
  if (!vapid) return;

  const rows = await env.DB.prepare(
    'SELECT endpoint, p256dh, auth FROM push_subs WHERE voter_hash IS NULL OR voter_hash != ? LIMIT 2000'
  ).bind(excludeVoterHash || '').all();

  const subs = rows.results || [];
  if (!subs.length) return;

  const body = JSON.stringify(payload);
  const dead = [];

  for (let i = 0; i < subs.length; i += 20) {
    const batch = subs.slice(i, i + 20);
    const results = await Promise.allSettled(batch.map(s => sendPush(s, body, vapid)));
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled' && (r.value === 404 || r.value === 410)) dead.push(batch[idx].endpoint);
    });
  }

  if (dead.length) {
    const placeholders = dead.map(() => '?').join(',');
    await env.DB.prepare(`DELETE FROM push_subs WHERE endpoint IN (${placeholders})`).bind(...dead).run();
  }
}
