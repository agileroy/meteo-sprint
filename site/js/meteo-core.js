// Logique pure de la météo du sprint : les 5 météos, codes et identifiants, validations, répartition,
// indice, historique, révélation automatique, liste « Mes équipes ».
// Ni DOM ni base : testée avec Node.js, utilisée par meteo-store.js et ui.js.

/** Les 5 météos, de la meilleure à la pire. `key` est le nom des totaux dans l'historique de la base. */
export const WEATHERS = Object.freeze([
  Object.freeze({ value: 5, key: 'soleil', name: 'Grand soleil', phrase: 'Super sprint, j\'en redemande' }),
  Object.freeze({ value: 4, key: 'eclaircies', name: 'Éclaircies', phrase: 'Bon sprint, quelques nuages' }),
  Object.freeze({ value: 3, key: 'nuageux', name: 'Nuageux', phrase: 'Mitigé, des hauts et des bas' }),
  Object.freeze({ value: 2, key: 'pluie', name: 'Pluie', phrase: 'Sprint difficile' }),
  Object.freeze({ value: 1, key: 'orage', name: 'Orage', phrase: 'Très dur, ça n\'a pas été' }),
]);
export const WEATHER_KEYS = Object.freeze(WEATHERS.map((w) => w.key));
export const NAME_MAX = 50;
export const LABEL_MAX = 40;
export const CODE_LENGTH = 4;
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
export const ID_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';
export const TEAM_ID_LENGTH = 12;
export const KEY_LENGTH = 20;
export const ROOM_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const AUTO_REVEAL_DELAY_MS = 3000;
export const FEW_VOTES = 3;
export const CHART_SPRINTS = 10;
export const TEAMS_MAX = 50;
export const STATUS = Object.freeze({ open: 'open', revealed: 'revealed' });

/* ---------- Météos ---------- */

export function isValidVote(value) {
  return Number.isInteger(value) && value >= 1 && value <= 5;
}

/** Météo d'une valeur (1 à 5), ou null. */
export function weatherFor(value) {
  return WEATHERS.find((w) => w.value === value) ?? null;
}

/* ---------- Codes et identifiants ---------- */

/** Code saisi : majuscules, sans espaces. */
export function normalizeCode(code) {
  return String(code ?? '').replace(/\s+/g, '').toUpperCase();
}

export function isValidCode(code) {
  return new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(String(code ?? ''));
}

function pick(alphabet, length, random) {
  let out = '';
  for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(random() * alphabet.length)];
  return out;
}

export function generateCode(random = Math.random) {
  return pick(CODE_ALPHABET, CODE_LENGTH, random);
}

/** Identifiant d'équipe : 12 caractères impossibles à deviner (le lien public de l'équipe). */
export function generateTeamId(random = Math.random) {
  return pick(ID_ALPHABET, TEAM_ID_LENGTH, random);
}

/** Clé d'animation : 20 caractères, jamais lisible dans la base. */
export function generateKey(random = Math.random) {
  return pick(ID_ALPHABET, KEY_LENGTH, random);
}

export function isValidTeamId(id) {
  return new RegExp(`^[a-z0-9]{${TEAM_ID_LENGTH}}$`).test(String(id ?? ''));
}

export function isValidKey(key) {
  return new RegExp(`^[a-z0-9]{${KEY_LENGTH}}$`).test(String(key ?? ''));
}

/** Clé d'une entrée d'historique : heure de création de la salle et code (un code peut resservir après la purge). */
export function sessionId(createdAt, code) {
  return `${createdAt}-${code}`;
}

/** Code et heure de création d'une clé d'historique, ou null. */
export function parseSessionId(sid) {
  if (!isValidSessionId(sid)) return null;
  const [createdAt, code] = sid.split('-');
  return { createdAt: Number(createdAt), code };
}

export function isValidSessionId(sid) {
  return new RegExp(`^[0-9]{13}-[${CODE_ALPHABET}]{${CODE_LENGTH}}$`).test(String(sid ?? ''));
}

/* ---------- Nom d'équipe et libellé ---------- */

export function normalizeText(text) {
  return String(text ?? '').trim().replace(/\s+/g, ' ');
}

/** Message d'erreur pour un nom d'équipe, null s'il convient (longueur comptée comme la base, en UTF-16). */
export function validateName(name) {
  const value = normalizeText(name);
  if (!value) return 'Donnez un nom à l\'équipe.';
  if (value.length > NAME_MAX) return `Le nom fait ${NAME_MAX} caractères au plus.`;
  return null;
}

/** Message d'erreur pour un libellé (facultatif), null s'il convient. */
export function validateLabel(label) {
  if (normalizeText(label).length > LABEL_MAX) return `Le libellé fait ${LABEL_MAX} caractères au plus.`;
  return null;
}

/** Libellé proposé après `last` : « Sprint 41 » → « Sprint 42 » ; vide si `last` ne finit pas par un nombre. */
export function nextLabel(last) {
  const match = normalizeText(last).match(/^(.*?)(\d+)$/);
  if (!match) return '';
  const next = String(Number(match[2]) + 1).padStart(match[2].length, '0');
  const label = `${match[1]}${next}`;
  return label.length <= LABEL_MAX ? label : '';
}

/* ---------- Résultats ---------- */

/** Votes valides d'une salle, à partir du nœud `votes` ({ uid → valeur }). */
export function valuesOf(votes) {
  return Object.values(votes ?? {}).filter(isValidVote);
}

/** Totaux par météo : { soleil, eclaircies, nuageux, pluie, orage }. */
export function countsOf(values) {
  const counts = Object.fromEntries(WEATHER_KEYS.map((key) => [key, 0]));
  for (const value of values) {
    const weather = weatherFor(value);
    if (weather) counts[weather.key] += 1;
  }
  return counts;
}

export function totalOf(counts) {
  return WEATHER_KEYS.reduce((sum, key) => sum + (Number.isInteger(counts?.[key]) ? counts[key] : 0), 0);
}

/** Indice moyen (1 à 5) arrondi à une décimale, à partir des totaux ; null sans vote. */
export function weatherIndex(counts) {
  const total = totalOf(counts);
  if (!total) return null;
  const sum = WEATHERS.reduce((acc, w) => acc + w.value * (counts[w.key] ?? 0), 0);
  return Math.round((sum / total) * 10) / 10;
}

/** Indice écrit à la française : « 3,9 ». */
export function formatIndex(value) {
  if (value === null || value === undefined) return '–';
  return value.toFixed(1).replace('.', ',');
}

/** Répartition de Grand soleil à Orage : [{ weather, count, percent }], percent arrondi à l'entier. */
export function distribution(counts) {
  const total = totalOf(counts);
  return WEATHERS.map((weather) => {
    const count = counts?.[weather.key] ?? 0;
    return { weather, count, percent: total ? Math.round((count / total) * 100) : 0 };
  });
}

/** Météos les plus choisies (plusieurs en cas d'égalité, aucune sans vote). */
export function topWeathers(counts) {
  const max = Math.max(0, ...WEATHER_KEYS.map((key) => counts?.[key] ?? 0));
  return max ? WEATHERS.filter((w) => counts[w.key] === max) : [];
}

/** « Grand soleil », « Éclaircies et Nuageux », « Grand soleil, Pluie et Orage ». */
export function joinNames(weathers) {
  const names = weathers.map((w) => w.name);
  if (names.length < 2) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} et ${names.at(-1)}`;
}

/* ---------- Présence et révélation automatique ---------- */

/** Identifiants des participants connectés (au moins un onglet ouvert). */
export function connectedUids(participants) {
  return Object.entries(participants ?? {})
    .filter(([, p]) => p?.connections && Object.keys(p.connections).length > 0)
    .map(([uid]) => uid)
    .sort();
}

/** Tout le monde a voté : au moins un vote, et chaque participant connecté a voté. */
export function everyoneVoted(votes, participants) {
  const voters = new Set(Object.entries(votes ?? {}).filter(([, v]) => isValidVote(v)).map(([uid]) => uid));
  return voters.size > 0 && connectedUids(participants).every((uid) => voters.has(uid));
}

/**
 * Empreinte de la situation (votants et connectés) : « Attendre » met en pause la révélation automatique
 * pour cette situation, qui reprend quand elle change (nouveau vote, nouveau participant).
 */
export function situationKey(votes, participants) {
  const voters = Object.entries(votes ?? {}).filter(([, v]) => isValidVote(v)).map(([uid]) => uid).sort();
  return `${voters.join(',')}|${connectedUids(participants).join(',')}`;
}

/* ---------- Historique ---------- */

/** Entrée d'historique d'une salle révélée : totaux seulement, jamais de vote individuel. */
export function historyEntry({ label = '', createdAt, votes }) {
  const counts = countsOf(valuesOf(votes));
  return { label: normalizeText(label), date: createdAt, counts, total: totalOf(counts) };
}

/** Historique lisible, du plus ancien au plus récent : [{ sid, label, date, counts, total, index }]. */
export function historyList(history) {
  return Object.entries(history ?? {})
    .filter(([sid, e]) => isValidSessionId(sid) && e && typeof e.date === 'number' && e.counts)
    .map(([sid, e]) => {
      const counts = Object.fromEntries(WEATHER_KEYS.map((key) => [key, Number.isInteger(e.counts[key]) ? e.counts[key] : 0]));
      return { sid, label: typeof e.label === 'string' ? e.label : '', date: e.date, counts, total: totalOf(counts), index: weatherIndex(counts) };
    })
    .filter((e) => e.total > 0)
    .sort((a, b) => a.date - b.date || (a.sid < b.sid ? -1 : 1));
}

/** Nom affiché d'un sprint de l'historique : son libellé, sinon sa date et son heure (« 27 nov. 16:20 »). */
export function sprintName(entry) {
  return entry.label || formatShort(entry.date);
}

/* ---------- Mes équipes (mémorisées dans le navigateur) ---------- */

/** Lit la liste mémorisée : [{ id, usedAt }], valide, sans doublon, la plus récemment utilisée d'abord. */
export function parseTeams(raw) {
  let list;
  try { list = JSON.parse(raw ?? '[]'); } catch { list = []; }
  if (!Array.isArray(list)) list = [];
  const seen = new Set();
  return list
    .filter((e) => e && isValidTeamId(e.id) && typeof e.usedAt === 'number')
    .sort((a, b) => b.usedAt - a.usedAt)
    .filter((e) => (seen.has(e.id) ? false : seen.add(e.id)))
    .slice(0, TEAMS_MAX)
    .map(({ id, usedAt }) => ({ id, usedAt }));
}

export function touchTeam(list, id, usedAt) {
  return parseTeams(JSON.stringify([{ id, usedAt }, ...list.filter((e) => e.id !== id)]));
}

export function removeTeam(list, id) {
  return list.filter((e) => e.id !== id);
}

/* ---------- Mise en forme ---------- */

export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count > 1 ? pluralForm : singular}`;
}

/** Date courte à la française : « 3 nov. 2026, 14:05 ». */
export function formatDate(ms) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(ms));
}

/** Date courte et heure : « 27 nov. 16:20 ». */
export function formatShort(ms) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(ms)).map((part) => [part.type, part.value]));
  return `${parts.day} ${parts.month} ${parts.hour}:${parts.minute}`;
}

/** Jour à la française : « 3 nov. 2026 ». */
export function formatDay(ms) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(ms));
}

/* ---------- Bulletin de révélation ---------- */

/** Éléments du bandeau défilant : la répartition du sprint révélé, sans comparaison avec d'autres sprints. */
export function tickerItems(counts) {
  return WEATHERS.map((w) => `${w.name} ${counts?.[w.key] ?? 0}`);
}

/** Ciel de la vue participant : la météo choisie, sinon « neutre ». */
export function skyFor(value) {
  return weatherFor(value)?.key ?? 'neutre';
}
