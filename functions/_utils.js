export async function voterHash(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || '0.0.0.0';
  const ua = request.headers.get('User-Agent') || '';
  const data = new TextEncoder().encode(ip + '|' + ua + '|' + (env.VOTER_SALT || 'elucco-engagement-salt-2026'));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export function isValidArticleId(id) {
  return typeof id === 'string' && /^[a-zA-Z0-9_-]{1,64}$/.test(id);
}

export function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Titre court et lien de destination pour les notifications. */
const ARTICLE_META = {
  feat_eclipse: { title: 'la ceremonie du 12 aout', url: '/article-eclipse-aout2026.html' },
  feat_mumengi: { title: 'la visite de Didier Mumengi', url: '/article-mumengi-aout2026.html' },
  feat_livre_roi_bassin_kongo: { title: 'le livre Roi du Bassin du Kongo', url: '/article-livre-roi-bassin-kongo.html' },
  feat_1: { title: 'l’article du 6 Mars', url: '/actualites.html' },
};

export function articleMeta(id) {
  return ARTICLE_META[id] || { title: 'une publication', url: '/actualites.html' };
}

/** Nom deja utilise par ce visiteur dans un commentaire, sinon un libelle neutre. */
export async function knownName(env, voter) {
  try {
    const row = await env.DB.prepare(
      'SELECT author FROM comments WHERE voter_hash = ? ORDER BY id DESC LIMIT 1'
    ).bind(voter).first();
    return (row && row.author) || 'Un fidele';
  } catch {
    return 'Un fidele';
  }
}
