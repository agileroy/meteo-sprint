// Actions de la météo du sprint sur la base (Firebase en production, mémoire pour les tests et la démo).
// Tout vit sous la branche `meteo` du projet roti-vleroy, partagé avec le ROTI. Les règles de cette branche
// sont dans database.rules.json du dépôt roti (copie de test : tests/database.rules.json).
// Aucune règle de lecture globale sur une équipe ni sur une salle : chaque rôle ne lit que ce qui lui est permis,
// et la clé d'animation (`secret`) ne se lit jamais.

import {
  ROOM_TTL_MS, STATUS, generateCode, generateKey, generateTeamId, historyEntry, isValidKey, isValidTeamId,
  isValidVote, normalizeText, sessionId, validateLabel, validateName, valuesOf,
} from './meteo-core.js?v=__VERSION__';

export const ROOT = 'meteo';
const teamPath = (id) => `${ROOT}/teams/${id}`;
const sessionPath = (code) => `${ROOT}/sessions/${code}`;

function cryptoRandom() {
  return crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
}

export function createMeteoStore(db, { random = cryptoRandom } = {}) {
  let stopPresence = null;
  let presenceFor = null;

  /** Abonnement à plusieurs nœuds : `callback({ clé → valeur })` dès que tous ont répondu, puis à chaque changement. */
  function watchMany(paths, callback) {
    const values = {};
    const pending = new Set(Object.keys(paths));
    const stops = Object.entries(paths).map(([key, path]) => db.onValue(path, (value) => {
      values[key] = value;
      pending.delete(key);
      if (!pending.size) callback({ ...values });
    }));
    return () => stops.forEach((stop) => stop());
  }

  const ok = (promise) => promise.then(() => true, () => false);

  const store = {
    get uid() { return db.uid; },
    start: () => db.start(),
    serverNow: () => db.serverNow(),
    onConnection: (callback) => db.onConnection(callback),

    // ------------------------------------------------------------ Équipes

    /** Crée une équipe ; ce navigateur en devient animateur. Renvoie { teamId, key }. */
    async createTeam(rawName) {
      const error = validateName(rawName);
      if (error) throw new Error(error);
      const name = normalizeText(rawName);
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const teamId = generateTeamId(random);
        const key = generateKey(random);
        try {
          await db.update(teamPath(teamId), {
            meta: { name, createdAt: db.TIMESTAMP },
            secret: key,
            [`owners/${db.uid}`]: key,
          });
          return { teamId, key };
        } catch {
          // Identifiant déjà pris (improbable) : on en tire un autre.
        }
      }
      throw new Error('Création de l\'équipe impossible.');
    },

    /** Devient animateur avec le lien d'animation ; false si la clé est fausse. */
    claimTeam(teamId, key) {
      if (!isValidTeamId(teamId) || !isValidKey(key)) return Promise.resolve(false);
      return ok(db.set(`${teamPath(teamId)}/owners/${db.uid}`, key));
    },

    /** Clé d'animation de ce navigateur pour l'équipe (null s'il ne l'anime pas). */
    async myKey(teamId) {
      const key = await db.get(`${teamPath(teamId)}/owners/${db.uid}`);
      return isValidKey(key) ? key : null;
    },

    getTeamMeta(teamId) {
      return db.get(`${teamPath(teamId)}/meta`);
    },

    /** En-tête et historique de l'équipe, en temps réel : `callback({ meta, history })`. */
    watchTeam(teamId, callback) {
      return watchMany({ meta: `${teamPath(teamId)}/meta`, history: `${teamPath(teamId)}/history` }, callback);
    },

    /** Résumé pour « Mes équipes » : undefined si illisible (réseau), null si l'équipe n'existe plus. */
    async teamSummary(teamId) {
      const meta = await db.get(`${teamPath(teamId)}/meta`).catch(() => undefined);
      if (meta === undefined) return undefined;
      if (!meta) return null;
      const [history, key] = await Promise.all([
        db.get(`${teamPath(teamId)}/history`).catch(() => null),
        db.get(`${teamPath(teamId)}/owners/${db.uid}`).catch(() => null),
      ]);
      return { teamId, name: meta.name, createdAt: meta.createdAt, history: history ?? {}, isOwner: isValidKey(key) };
    },

    /** Historique de l'équipe (lisible par tout connecté) ; null si illisible. */
    getHistory(teamId) {
      return db.get(`${teamPath(teamId)}/history`).catch(() => null);
    },

    renameTeam(teamId, rawName) {
      if (validateName(rawName)) return Promise.resolve(false);
      return ok(db.set(`${teamPath(teamId)}/meta/name`, normalizeText(rawName)));
    },

    deleteTeam(teamId) {
      return ok(db.remove(teamPath(teamId)));
    },

    removeHistory(teamId, sid) {
      return ok(db.remove(`${teamPath(teamId)}/history/${sid}`));
    },

    // ------------------------------------------------------------ Salles (animateur)

    /** Supprime les salles de plus de 30 jours (les règles l'autorisent à tous au-delà de ce délai). */
    async sweepExpired() {
      const expiry = (await db.get(`${ROOT}/expiry`).catch(() => null)) ?? {};
      const limit = db.serverNow() - ROOM_TTL_MS;
      const old = Object.entries(expiry).filter(([, e]) => typeof e?.createdAt === 'number' && e.createdAt < limit);
      await Promise.all(old.map(([code]) =>
        db.update(ROOT, { [`sessions/${code}`]: null, [`expiry/${code}`]: null }).catch(() => {})));
      return old.map(([code]) => code);
    },

    /** Lance une météo pour l'équipe ; ce navigateur anime la salle. Renvoie { code, createdAt }. */
    async createSession(teamId, rawLabel = '') {
      const error = validateLabel(rawLabel);
      if (error) throw new Error(error);
      const label = normalizeText(rawLabel);
      await store.sweepExpired();
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const code = generateCode(random);
        const reserved = await db.claim(`${ROOT}/expiry/${code}`, { createdAt: db.TIMESTAMP, hostUid: db.uid });
        if (!reserved) continue;
        const createdAt = (await db.get(`${ROOT}/expiry/${code}/createdAt`)) ?? db.serverNow();
        try {
          await db.set(`${sessionPath(code)}/meta`, { teamId, hostUid: db.uid, createdAt, label, status: STATUS.open });
        } catch (failure) {
          await db.remove(`${ROOT}/expiry/${code}`).catch(() => {});
          throw failure;
        }
        return { code, createdAt };
      }
      throw new Error('Impossible de trouver un code de salle libre.');
    },

    /** Révèle et inscrit les totaux dans l'historique de l'équipe, en une seule écriture. */
    reveal(code, meta, votes) {
      if (!valuesOf(votes).length) return Promise.resolve(false);
      const entry = historyEntry({ label: meta.label, createdAt: meta.createdAt, votes });
      return ok(db.update(ROOT, {
        [`sessions/${code}/meta/status`]: STATUS.revealed,
        [`teams/${meta.teamId}/history/${sessionId(meta.createdAt, code)}`]: entry,
      }));
    },

    reopen(code) {
      return ok(db.set(`${sessionPath(code)}/meta/status`, STATUS.open));
    },

    deleteSession(code) {
      return ok(db.update(ROOT, { [`sessions/${code}`]: null, [`expiry/${code}`]: null }));
    },

    /** Vue animateur : votes et présences, en temps réel. */
    watchHost(code, callback) {
      return watchMany({ votes: `${sessionPath(code)}/votes`, participants: `${sessionPath(code)}/participants` }, callback);
    },

    // ------------------------------------------------------------ Salles (tous)

    watchMeta(code, callback) {
      return db.onValue(`${sessionPath(code)}/meta`, callback);
    },

    getMeta(code) {
      return db.get(`${sessionPath(code)}/meta`);
    },

    /** Votes d'une salle révélée (refusés par la base avant la révélation). */
    watchResults(code, callback) {
      return db.onValue(`${sessionPath(code)}/votes`, callback);
    },

    // ------------------------------------------------------------ Participant

    /** Mon vote : `callback(valeur ou null)`. */
    watchMine(code, callback) {
      return db.onValue(`${sessionPath(code)}/votes/${db.uid}`, (value) => callback(isValidVote(value) ? value : null));
    },

    /** Donne ou change sa météo ; false si refusé (salle révélée ou supprimée). */
    vote(code, value) {
      if (!isValidVote(value)) return Promise.resolve(false);
      return ok(db.set(`${sessionPath(code)}/votes/${db.uid}`, value));
    },

    /** Présence dans la salle (une entrée par onglet, retirée à la déconnexion). */
    openPresence(code) {
      if (presenceFor === code) return;
      stopPresence?.();
      presenceFor = code;
      stopPresence = db.presence(`${sessionPath(code)}/participants/${db.uid}/connections`);
    },

    async closePresence() {
      const stop = stopPresence;
      stopPresence = null;
      presenceFor = null;
      await stop?.();
    },
  };
  return store;
}
