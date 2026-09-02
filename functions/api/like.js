import { voterHash, jsonResponse, isValidArticleId, articleMeta, knownName } from '../_utils.js';
import { broadcast } from '../_push.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'bad_request' }, 400); }
  const id = body && body.id;
  if (!isValidArticleId(id)) return jsonResponse({ error: 'bad_request' }, 400);

  const voter = await voterHash(request, env);
  const now = new Date().toISOString();

  const existing = await env.DB.prepare(
    'SELECT 1 FROM like_votes WHERE article_id = ? AND voter_hash = ?'
  ).bind(id, voter).first();

  let liked;
  if (existing) {
    await env.DB.prepare('DELETE FROM like_votes WHERE article_id = ? AND voter_hash = ?').bind(id, voter).run();
    await env.DB.prepare('UPDATE likes SET count = MAX(0, count - 1) WHERE article_id = ?').bind(id).run();
    liked = false;
  } else {
    await env.DB.prepare('INSERT INTO like_votes (article_id, voter_hash, created_at) VALUES (?, ?, ?)').bind(id, voter, now).run();
    await env.DB.prepare(
      'INSERT INTO likes (article_id, count) VALUES (?, 1) ON CONFLICT(article_id) DO UPDATE SET count = count + 1'
    ).bind(id).run();
    liked = true;
  }

  const row = await env.DB.prepare('SELECT count FROM likes WHERE article_id = ?').bind(id).first();

  // On ne notifie qu'a l'ajout d'un j'aime, jamais au retrait.
  if (liked) {
    const meta = articleMeta(id);
    const name = await knownName(env, voter);
    context.waitUntil(broadcast(env, {
      title: `${name} a aime`,
      body: `${name} a aime ${meta.title}.`,
      url: meta.url,
      tag: 'like-' + id,
    }, voter));
  }

  return jsonResponse({ likes: (row && row.count) || 0, liked });
}
