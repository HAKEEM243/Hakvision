import { voterHash, jsonResponse, isValidArticleId, escapeHtml } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids') || url.searchParams.get('id') || '';
  const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(isValidArticleId))].slice(0, 30);
  if (!ids.length) return jsonResponse({});

  const voter = await voterHash(request, env);
  const placeholders = ids.map(() => '?').join(',');

  const [viewsRes, likesRes, votesRes, countRes, latestRes] = await Promise.all([
    env.DB.prepare(`SELECT article_id, count FROM views WHERE article_id IN (${placeholders})`).bind(...ids).all(),
    env.DB.prepare(`SELECT article_id, count FROM likes WHERE article_id IN (${placeholders})`).bind(...ids).all(),
    env.DB.prepare(`SELECT article_id FROM like_votes WHERE voter_hash = ? AND article_id IN (${placeholders})`).bind(voter, ...ids).all(),
    env.DB.prepare(`SELECT article_id, COUNT(*) AS n FROM comments WHERE article_id IN (${placeholders}) GROUP BY article_id`).bind(...ids).all(),
    // Les deux commentaires les plus recents de chaque article, pour l'apercu.
    env.DB.prepare(
      `SELECT article_id, author, text FROM (
         SELECT article_id, author, text,
                ROW_NUMBER() OVER (PARTITION BY article_id ORDER BY id DESC) AS rn
         FROM comments WHERE article_id IN (${placeholders})
       ) WHERE rn <= 2 ORDER BY article_id, rn DESC`
    ).bind(...ids).all(),
  ]);

  const viewsMap = Object.fromEntries((viewsRes.results || []).map(r => [r.article_id, r.count]));
  const likesMap = Object.fromEntries((likesRes.results || []).map(r => [r.article_id, r.count]));
  const countMap = Object.fromEntries((countRes.results || []).map(r => [r.article_id, r.n]));
  const likedSet = new Set((votesRes.results || []).map(r => r.article_id));

  const latestMap = {};
  for (const r of latestRes.results || []) {
    (latestMap[r.article_id] = latestMap[r.article_id] || []).push({
      author: escapeHtml(r.author),
      text: escapeHtml(r.text),
    });
  }

  const out = {};
  for (const id of ids) {
    out[id] = {
      views: viewsMap[id] || 0,
      likes: likesMap[id] || 0,
      liked: likedSet.has(id),
      comments: countMap[id] || 0,
      latest: latestMap[id] || [],
    };
  }
  return jsonResponse(out);
}
