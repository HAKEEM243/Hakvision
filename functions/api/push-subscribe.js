import { voterHash, jsonResponse } from '../_utils.js';
import { loadVapid } from '../_push.js';

/** Renvoie la cle publique VAPID au navigateur. */
export async function onRequestGet(context) {
  const vapid = await loadVapid(context.env);
  if (!vapid) return jsonResponse({ error: 'not_configured' }, 503);
  return jsonResponse({ publicKey: vapid.publicKey });
}

/** Enregistre (ou met a jour) un abonnement aux notifications. */
export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'bad_request' }, 400); }

  const endpoint = body && body.endpoint;
  const p256dh = body && body.keys && body.keys.p256dh;
  const auth = body && body.keys && body.keys.auth;

  if (typeof endpoint !== 'string' || !/^https:\/\//.test(endpoint) || endpoint.length > 1000) {
    return jsonResponse({ error: 'bad_endpoint' }, 400);
  }
  if (typeof p256dh !== 'string' || typeof auth !== 'string') {
    return jsonResponse({ error: 'bad_keys' }, 400);
  }

  const voter = await voterHash(request, env);
  await env.DB.prepare(
    `INSERT INTO push_subs (endpoint, p256dh, auth, voter_hash, created_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET p256dh = excluded.p256dh, auth = excluded.auth, voter_hash = excluded.voter_hash`
  ).bind(endpoint, p256dh, auth, voter, new Date().toISOString()).run();

  return jsonResponse({ ok: true });
}

/** Desabonnement. */
export async function onRequestDelete(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'bad_request' }, 400); }
  const endpoint = body && body.endpoint;
  if (typeof endpoint !== 'string') return jsonResponse({ error: 'bad_request' }, 400);
  await env.DB.prepare('DELETE FROM push_subs WHERE endpoint = ?').bind(endpoint).run();
  return jsonResponse({ ok: true });
}
