import { voterHash, jsonResponse, isValidArticleId } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const idsParam = url.searchParams.get('ids') || url.searchParams.get('id') || '';
  const ids = [...new Set(idsParam.split(',').map(s => s.trim()).filter(isValidArticleId))].slice(0, 30);
  if (!ids.length) return jsonResponse({});

  const voter = await voterHash(request, env);
  const placeholders = ids.map(() => '?').join(',');

  const [viewsRes, likesRes, votesRes] = await Promise.all([
    env.DB.prepare(`SELECT article_id, count FROM views WHERE article_id IN (${placeholders})`).bind(...ids).all(),
    env.DB.prepare(`SELECT article_id, count FROM likes WHERE article_id IN (${placeholders})`).bind(...ids).all(),
    env.DB.prepare(`SELECT article_id FROM like_votes WHERE voter_hash = ? AND article_id IN (${placeholders})`).bind(voter, ...ids).all(),
  ]);

  const viewsMap = Object.fromEntries((viewsRes.results || []).map(r => [r.article_id, r.count]));
  const likesMap = Object.fromEntries((likesRes.results || []).map(r => [r.article_id, r.count]));
  const likedSet = new Set((votesRes.results || []).map(r => r.article_id));

  const out = {};
  for (const id of ids) {
    out[id] = { views: viewsMap[id] || 0, likes: likesMap[id] || 0, liked: likedSet.has(id) };
  }
  return jsonResponse(out);
}
