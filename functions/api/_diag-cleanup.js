import { jsonResponse } from '../_utils.js';

// Endpoint temporaire : supprime uniquement les commentaires de diagnostic
// (author = 'Diag CI') inseres pendant l'investigation d'un bug. Ne touche
// a aucun commentaire reel. A retirer une fois le nettoyage effectue.
export async function onRequestPost(context) {
  const { env } = context;
  const res = await env.DB.prepare(
    "DELETE FROM comments WHERE author = 'Diag CI' AND text LIKE 'Test diagnostic automatise%'"
  ).run();
  return jsonResponse({ deleted: res.meta && res.meta.changes || 0 });
}
