/**
 * ELUCCO Cloudflare Worker - Email & Notification Service
 * Handles subscriptions via Brevo API (no CORS issues) and protects
 * admin-only actions (broadcast, subscriber export) behind a signed
 * session token — no secret ever ships to the browser.
 *
 * Required Worker secrets (Cloudflare dashboard → Worker → Settings →
 * Variables and Secrets, or `wrangler secret put <NAME>`):
 *   BREVO_KEY       Brevo transactional API key
 *   ADMIN_PASSWORD  Password for the ELUCCO admin panel
 *   SESSION_SECRET  Long random string used to sign admin session tokens
 *                    (e.g. `openssl rand -hex 32`)
 *
 * None of these values should ever be committed to source control.
 */

const SENDER_EMAIL = 'arenalse22@gmail.com';
const SENDER_NAME = 'ELUCCO — Masambukidiste';
const SITE_URL = 'https://elucco.pages.dev';
const LIST_ID = 2;
const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4h

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS });
}

/* ── Session tokens: stateless, HMAC-SHA256 signed, short-lived ── */
async function hmacSign(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function createSessionToken(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const sig = await hmacSign(secret, String(expires));
  return `${expires}.${sig}`;
}

async function verifySessionToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const [expiresStr, sig] = token.split('.');
  if (!expiresStr || !sig) return false;
  const expected = await hmacSign(secret, expiresStr);
  if (expected !== sig) return false;
  const expires = parseInt(expiresStr, 10);
  return Number.isFinite(expires) && Date.now() / 1000 < expires;
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  return verifySessionToken(token, env.SESSION_SECRET);
}

/* ── Brevo helpers ── */
async function addBrevoContact(email, firstName, env) {
  return fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: firstName || 'Masambukidiste' },
      listIds: [LIST_ID],
      updateEnabled: true,
    }),
  });
}

async function sendWelcomeEmail(email, firstName, env) {
  const name = firstName || 'Masambukidiste';
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Bienvenue chez ELUCCO</title>
</head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a1a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#0d1b2a 0%,#1a2a1a 100%);border-radius:16px;overflow:hidden;border:1px solid #c9a84c;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a3a1a,#0d2a0d);padding:40px 30px;text-align:center;border-bottom:2px solid #c9a84c;">
            <div style="font-size:40px;font-weight:bold;color:#c9a84c;letter-spacing:8px;font-family:serif;">✦ ELUCCO ✦</div>
            <div style="color:#90ee90;font-size:13px;letter-spacing:4px;margin-top:8px;text-transform:uppercase;">Eglise Lumière du Christ au Congo</div>
          </td>
        </tr>
        <!-- Welcome message -->
        <tr>
          <td style="padding:40px 30px;color:#e8e8e8;">
            <h2 style="color:#c9a84c;font-size:24px;margin-bottom:20px;text-align:center;">
              Bienvenue, ${name} !
            </h2>
            <p style="font-size:16px;line-height:1.8;color:#d4d4d4;margin-bottom:20px;">
              Cher(e) Masambukidiste,
            </p>
            <p style="font-size:15px;line-height:1.8;color:#c0c0c0;margin-bottom:20px;">
              Vous êtes maintenant abonné(e) au site officiel d'<strong style="color:#c9a84c;">ELUCCO</strong> —
              Eglise Lumière du Christ au Congo, sous la guidance spirituelle de
              <strong style="color:#c9a84c;">Sa Majesté Masambukidi Samuel I</strong>,
              Roi Divin du Bassin du Kongo.
            </p>
            <p style="font-size:15px;line-height:1.8;color:#c0c0c0;margin-bottom:30px;">
              Vous recevrez désormais :
            </p>
            <ul style="color:#c0c0c0;font-size:14px;line-height:2;padding-left:20px;">
              <li>Les actualités et annonces de l'Eglise</li>
              <li>Les rappels des jours de culte (dimanche, mercredi, vendredi)</li>
              <li>Les notifications pour les dates sacrées importantes</li>
              <li>Les messages spirituels de Sa Majesté</li>
            </ul>
            <!-- Dates sacrées -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:30px 0;background:rgba(201,168,76,0.1);border-radius:12px;border:1px solid rgba(201,168,76,0.3);overflow:hidden;">
              <tr>
                <td style="padding:20px;text-align:center;">
                  <div style="color:#c9a84c;font-size:14px;letter-spacing:2px;text-transform:uppercase;margin-bottom:15px;">Dates Sacrées à Retenir</div>
                  <table width="100%" cellpadding="8" cellspacing="0">
                    <tr><td style="color:#90ee90;font-size:13px;">6 Mars</td><td style="color:#d4d4d4;font-size:13px;">Naissance de Papa Samy Masambukidi (1958)</td></tr>
                    <tr><td style="color:#90ee90;font-size:13px;">30 Juillet</td><td style="color:#d4d4d4;font-size:13px;">Naissance de Sa Majesté Samuel I</td></tr>
                    <tr><td style="color:#90ee90;font-size:13px;">30 Octobre</td><td style="color:#d4d4d4;font-size:13px;">Intronisation de Sa Majesté (2025)</td></tr>
                    <tr><td style="color:#90ee90;font-size:13px;">20 Octobre</td><td style="color:#d4d4d4;font-size:13px;">Date Importante ELUCCO</td></tr>
                    <tr><td style="color:#90ee90;font-size:13px;">11 Janvier</td><td style="color:#d4d4d4;font-size:13px;">Date Sacrée ELUCCO</td></tr>
                  </table>
                </td>
              </tr>
            </table>
            <!-- CTA Button -->
            <div style="text-align:center;margin:30px 0;">
              <a href="${SITE_URL}" style="background:linear-gradient(135deg,#c9a84c,#f0d060);color:#0a0a1a;padding:14px 40px;border-radius:50px;text-decoration:none;font-size:15px;font-weight:bold;letter-spacing:2px;display:inline-block;">
                VISITER LE SITE ELUCCO
              </a>
            </div>
            <!-- Horaires -->
            <div style="background:rgba(144,238,144,0.08);border:1px solid rgba(144,238,144,0.2);border-radius:12px;padding:20px;margin-top:20px;">
              <div style="color:#90ee90;font-size:13px;letter-spacing:2px;text-align:center;margin-bottom:12px;">HORAIRES DES CULTES</div>
              <p style="color:#c0c0c0;font-size:13px;line-height:1.8;margin:0;">
                <strong style="color:#c9a84c;">Paris (France):</strong> Dimanche 15h30 — 47 Bd de la Muette, 95140 Garges-lès-Gonesse<br>
                <strong style="color:#c9a84c;">Kinshasa (RDC):</strong> Dimanche 9h30 | Mercredi 16h00 | Vendredi 16h00 — Av. Mbandaka n°40, Kimbanseke
              </p>
            </div>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:rgba(0,0,0,0.4);padding:25px 30px;text-align:center;border-top:1px solid #c9a84c;">
            <p style="color:#888;font-size:12px;margin:0 0 10px;">
              Suivez-nous sur les réseaux sociaux
            </p>
            <p style="margin:0;">
              <a href="https://youtube.com/@masambukidirtmasofficiel2016" style="color:#c9a84c;margin:0 10px;font-size:12px;text-decoration:none;">YouTube</a>
              <a href="https://x.com/masambukidi4" style="color:#c9a84c;margin:0 10px;font-size:12px;text-decoration:none;">X/Twitter</a>
              <a href="https://www.tiktok.com/@masambukidiofficielle6" style="color:#c9a84c;margin:0 10px;font-size:12px;text-decoration:none;">TikTok</a>
            </p>
            <p style="color:#555;font-size:11px;margin:15px 0 0;">
              © ${new Date().getFullYear()} ELUCCO — Eglise Lumière du Christ au Congo<br>
              <a href="${SITE_URL}" style="color:#666;text-decoration:none;">${SITE_URL}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': env.BREVO_KEY,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email, name }],
      subject: `Bienvenue chez ELUCCO, ${name} !`,
      htmlContent: html,
    }),
  });
  const data = await resp.json();
  return { status: resp.status, data };
}

async function sendBroadcastEmail(toList, subject, htmlContent, env) {
  const results = [];
  for (const contact of toList) {
    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': env.BREVO_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: contact.email, name: contact.name || 'Masambukidiste' }],
        subject,
        htmlContent,
      }),
    });
    results.push({ email: contact.email, status: resp.status });
    await new Promise((r) => setTimeout(r, 100)); // stay under Brevo rate limits
  }
  return results;
}

async function getSubscribers(env) {
  const resp = await fetch(`https://api.brevo.com/v3/contacts?listId=${LIST_ID}&limit=500`, {
    headers: { 'api-key': env.BREVO_KEY, 'Accept': 'application/json' },
  });
  if (!resp.ok) return [];
  const data = await resp.json();
  return data.contacts || [];
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (!env.BREVO_KEY || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
      return json({ success: false, message: 'Worker mal configuré : secrets manquants (BREVO_KEY / ADMIN_PASSWORD / SESSION_SECRET).' }, 500);
    }

    // POST /api/subscribe — public
    if (request.method === 'POST' && url.pathname === '/api/subscribe') {
      try {
        const body = await request.json();
        const { email, firstName } = body;
        if (!email || !email.includes('@')) {
          return json({ success: false, message: 'Email invalide.' }, 400);
        }
        await addBrevoContact(email, firstName, env);
        const emailResult = await sendWelcomeEmail(email, firstName, env);
        return json({
          success: true,
          message: `Bienvenue ${firstName || ''} ! Un email de bienvenue vous a été envoyé à ${email}.`,
          emailStatus: emailResult.status,
        });
      } catch (err) {
        return json({ success: false, message: 'Erreur serveur: ' + err.message }, 500);
      }
    }

    // POST /api/admin/login — issues a short-lived signed session token
    if (request.method === 'POST' && url.pathname === '/api/admin/login') {
      try {
        const { password } = await request.json();
        if (!timingSafeEqual(String(password || ''), env.ADMIN_PASSWORD)) {
          return json({ success: false, message: 'Identifiants incorrects.' }, 401);
        }
        const token = await createSessionToken(env.SESSION_SECRET);
        return json({ success: true, token, expiresIn: SESSION_TTL_SECONDS });
      } catch (err) {
        return json({ success: false, message: 'Erreur: ' + err.message }, 500);
      }
    }

    // POST /api/broadcast — admin only (Authorization: Bearer <token>)
    if (request.method === 'POST' && url.pathname === '/api/broadcast') {
      if (!(await requireAdmin(request, env))) {
        return json({ success: false, message: 'Non autorisé.' }, 401);
      }
      try {
        const { subject, htmlContent, contacts } = await request.json();
        if (!subject || !htmlContent) {
          return json({ success: false, message: 'Sujet et contenu requis.' }, 400);
        }
        let toList = contacts;
        if (!toList || toList.length === 0) {
          const subs = await getSubscribers(env);
          toList = subs.map((s) => ({ email: s.email, name: (s.attributes && s.attributes.FIRSTNAME) || 'Masambukidiste' }));
        }
        if (!toList || toList.length === 0) {
          return json({ success: false, message: 'Aucun abonné trouvé.' });
        }
        const results = await sendBroadcastEmail(toList, subject, htmlContent, env);
        return json({ success: true, sent: results.length, results });
      } catch (err) {
        return json({ success: false, message: 'Erreur: ' + err.message }, 500);
      }
    }

    // GET /api/subscribers — admin only (Authorization: Bearer <token>)
    if (request.method === 'GET' && url.pathname === '/api/subscribers') {
      if (!(await requireAdmin(request, env))) {
        return json({ success: false, message: 'Non autorisé.' }, 401);
      }
      const subs = await getSubscribers(env);
      return json({ success: true, count: subs.length, subscribers: subs });
    }

    // Health check
    if (url.pathname === '/api/health' || url.pathname === '/') {
      return json({ status: 'ok', service: 'ELUCCO Email Worker', version: '3.0' });
    }

    return json({ error: 'Route non trouvée' }, 404);
  },
};
