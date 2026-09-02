import { jsonResponse } from '../_utils.js';
import { broadcast } from '../_push.js';
import { currentSlot } from '../_culte.js';

/**
 * Appele frequemment (toutes les 15 min environ) par une tache planifiee
 * externe (GitHub Actions, qui a acces libre au reseau contrairement a
 * l'agent). Aucune authentification necessaire : l'heure est verifiee
 * cote serveur, donc un appel a un mauvais moment ne fait jamais rien
 * (dateKey ci-dessous protege aussi contre les appels repetes pendant
 * la meme fenetre).
 */
export async function onRequest(context) {
  const { env } = context;
  const slot = currentSlot();
  if (!slot) return jsonResponse({ sent: false, reason: 'hors fenetre de culte' });

  const memoKey = 'culte_notif_' + slot.id;
  const row = await env.DB.prepare('SELECT value FROM config WHERE key = ?').bind(memoKey).first();
  if (row && row.value === slot.dateKey) {
    return jsonResponse({ sent: false, reason: 'deja envoye pour ce creneau', slot: slot.id });
  }

  await broadcast(env, {
    title: 'C’est l’heure du culte',
    body: `${slot.label} — appuyez pour la priere en musique.`,
    url: '/culte-priere.html',
    tag: 'culte',
  });

  await env.DB.prepare(
    "INSERT INTO config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(memoKey, slot.dateKey).run();

  return jsonResponse({ sent: true, slot: slot.id });
}
