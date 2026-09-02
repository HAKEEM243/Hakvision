import { voterHash, jsonResponse, isValidArticleId, todayStr } from '../_utils.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'bad_request' }, 400); }
  const id = body && body.id;
  if (!isValidArticleId(id)) return jsonResponse({ error: 'bad_request' }, 400);

  const voter = await voterHash(request, env);
  const day = todayStr();

  // Une vue par visiteur et par article, une seule fois par jour (pas de fausses vues via F5).
  const dedup = await env.DB.prepare(
    'INSERT OR IGNORE INTO view_dedup (article_id, voter_hash, day) VALUES (?, ?, ?)'
  ).bind(id, voter, day).run();

  if (dedup.meta.changes > 0) {
    await env.DB.prepare(
      'INSERT INTO views (article_id, count) VALUES (?, 1) ON CONFLICT(article_id) DO UPDATE SET count = count + 1'
    ).bind(id).run();
  }

  const row = await env.DB.prepare('SELECT count FROM views WHERE article_id = ?').bind(id).first();
  return jsonResponse({ views: (row && row.count) || 0 });
}
