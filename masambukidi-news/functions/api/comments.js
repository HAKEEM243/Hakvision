import { voterHash, jsonResponse, isValidArticleId, escapeHtml } from '../_utils.js';

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!isValidArticleId(id)) return jsonResponse({ error: 'bad_request' }, 400);

  const res = await env.DB.prepare(
    'SELECT author, text, created_at FROM comments WHERE article_id = ? ORDER BY id ASC LIMIT 500'
  ).bind(id).all();

  return jsonResponse((res.results || []).map(r => ({
    author: escapeHtml(r.author),
    text: escapeHtml(r.text),
    created_at: r.created_at,
  })));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  let body;
  try { body = await request.json(); } catch { return jsonResponse({ error: 'bad_request' }, 400); }

  const id = body && body.id;
  let author = (body && body.author || '').toString().trim().slice(0, 60);
  const text = (body && body.text || '').toString().trim().slice(0, 600);

  if (!isValidArticleId(id)) return jsonResponse({ error: 'bad_request' }, 400);
  if (!text || text.length < 2) return jsonResponse({ error: 'empty_text' }, 400);
  if (!author) author = 'Masambukidiste';

  const voter = await voterHash(request, env);
  const now = new Date();
  const nowIso = now.toISOString();

  // Anti-spam : un commentaire toutes les 15 secondes maximum par visiteur.
  const last = await env.DB.prepare('SELECT last_comment_at FROM rate_limit WHERE voter_hash = ?').bind(voter).first();
  if (last) {
    const elapsed = now.getTime() - new Date(last.last_comment_at).getTime();
    if (elapsed < 15000) return jsonResponse({ error: 'rate_limited' }, 429);
  }

  await env.DB.prepare(
    'INSERT INTO rate_limit (voter_hash, last_comment_at) VALUES (?, ?) ON CONFLICT(voter_hash) DO UPDATE SET last_comment_at = ?'
  ).bind(voter, nowIso, nowIso).run();

  await env.DB.prepare(
    'INSERT INTO comments (article_id, author, text, created_at, voter_hash) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, author, text, nowIso, voter).run();

  return jsonResponse({
    author: escapeHtml(author),
    text: escapeHtml(text),
    created_at: nowIso,
  }, 201);
}
