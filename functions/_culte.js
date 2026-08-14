/**
 * Definition des horaires de culte et verification "est-ce l'heure, maintenant ?"
 * Calcule en heure locale de chaque ville via Intl (gere le changement
 * d'heure de Paris automatiquement, Kinshasa n'en a pas).
 */

const SLOTS = [
  { id: 'kin-dim', tz: 'Africa/Kinshasa', weekday: 0, hour: 9, minute: 30, label: 'Kinshasa — Dimanche 9h30' },
  { id: 'kin-mer', tz: 'Africa/Kinshasa', weekday: 3, hour: 16, minute: 0, label: 'Kinshasa — Mercredi 16h00' },
  { id: 'kin-ven', tz: 'Africa/Kinshasa', weekday: 5, hour: 16, minute: 0, label: 'Kinshasa — Vendredi 16h00' },
  { id: 'par-dim', tz: 'Europe/Paris', weekday: 0, hour: 15, minute: 30, label: 'Paris — Dimanche 15h30' },
];

const WEEKDAY_NUM = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function localParts(tz, now) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
  return {
    weekday: WEEKDAY_NUM[parts.weekday],
    hour: parseInt(parts.hour, 10) % 24,
    minute: parseInt(parts.minute, 10),
    dateKey: new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now), // YYYY-MM-DD stable par ville
  };
}

/**
 * Renvoie le creneau de culte en cours si l'heure locale tombe dans une
 * fenetre de 10 minutes apres le debut du culte, sinon null.
 */
export function currentSlot(now = new Date()) {
  for (const slot of SLOTS) {
    const { weekday, hour, minute, dateKey } = localParts(slot.tz, now);
    if (weekday !== slot.weekday) continue;
    const diffMinutes = (hour * 60 + minute) - (slot.hour * 60 + slot.minute);
    if (diffMinutes >= 0 && diffMinutes < 10) {
      return { ...slot, dateKey };
    }
  }
  return null;
}
