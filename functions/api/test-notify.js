import { jsonResponse } from '../_utils.js';
import { broadcast } from '../_push.js';

/**
 * Envoi manuel unique pour verifier que la chaine de bout en bout
 * fonctionne (utilise pour un test a la demande, sans attendre un vrai
 * horaire de culte). Pas de verification d'heure ici.
 */
export async function onRequest(context) {
  const { env } = context;
  await broadcast(env, {
    title: 'C’est l’heure du culte',
    body: 'Test — appuyez pour la priere en musique.',
    url: '/culte-priere.html',
    tag: 'culte',
  });
  return jsonResponse({ sent: true });
}
