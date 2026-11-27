// Parcours complets sur un serveur en mémoire soumis aux vraies règles de la branche meteo
// (tests/database.rules.json, copie de celui du dépôt roti), évaluées par tests/rules-sim.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createMemoryServer } from '../site/js/memory-db.js';
import { createMeteoStore, ROOT } from '../site/js/meteo-store.js';
import { historyList, ROOM_TTL_MS } from '../site/js/meteo-core.js';
import { createRulesChecker } from './rules-sim.mjs';

const rulesJson = JSON.parse(await readFile(new URL('./database.rules.json', import.meta.url), 'utf8'));
const checker = createRulesChecker(rulesJson);

function setup() {
  let clock = 1_800_000_000_000;
  const server = createMemoryServer({ now: () => clock, rules: checker });
  const make = (uid) => {
    const db = server.client(uid);
    return { db, store: createMeteoStore(db) };
  };
  return { server, make, tick: (ms) => { clock += ms; } };
}

const flush = () => new Promise((resolve) => setImmediate(resolve));

test('la copie des règles contient la branche meteo, et tous les chemins du store sont sous meteo/', async () => {
  assert.ok(rulesJson.rules.meteo);
  assert.equal(ROOT, 'meteo');
  // Aucune lecture ni écriture hors de la branche.
  const { server, make } = setup();
  const anim = make('anim');
  const { teamId } = await anim.store.createTeam('Phénix');
  const { code } = await anim.store.createSession(teamId, 'Sprint 1');
  await make('alice').store.vote(code, 4);
  for (const { path } of server.reads) assert.ok(path.startsWith('meteo/') || path === 'meteo', path);
  assert.deepEqual(Object.keys(server.data), ['meteo']);
});

test('équipe : créée avec une clé illisible, retrouvée par le lien d\'animation', async () => {
  const { server, make } = setup();
  const anim = make('anim');
  const { teamId, key } = await anim.store.createTeam('  Équipe   Phénix ');
  assert.equal(server.read(`meteo/teams/${teamId}/meta/name`), 'Équipe Phénix');
  assert.equal(await anim.store.myKey(teamId), key);
  await assert.rejects(anim.db.get(`meteo/teams/${teamId}/secret`), /PERMISSION_DENIED/);
  await assert.rejects(anim.store.createTeam(' '), /Donnez un nom/);

  const portable = make('portable');
  assert.equal(await portable.store.myKey(teamId), null);
  assert.equal(await portable.store.claimTeam(teamId, 'z'.repeat(20)), false);
  assert.equal(await portable.store.claimTeam(teamId, key), true);
  assert.equal(await portable.store.myKey(teamId), key);
  assert.equal(await portable.store.renameTeam(teamId, 'Phénix'), true);

  const membre = make('membre');
  const summary = await membre.store.teamSummary(teamId);
  assert.equal(summary.name, 'Phénix');
  assert.equal(summary.isOwner, false);
  assert.equal(await membre.store.renameTeam(teamId, 'Piraté'), false);
  assert.equal(await membre.store.deleteTeam(teamId), false);
});

test('météo : votes cachés, révélation qui inscrit les seuls totaux, réouverture sans doublon', async () => {
  const { server, make } = setup();
  const anim = make('anim');
  const { teamId } = await anim.store.createTeam('Phénix');
  const { code, createdAt } = await anim.store.createSession(teamId, 'Sprint 42');
  const alice = make('alice');
  const bob = make('bob');
  assert.ok(await alice.store.vote(code, 3));
  assert.ok(await alice.store.vote(code, 2));
  assert.ok(await bob.store.vote(code, 5));
  assert.equal(await alice.store.vote(code, 6), false);

  // Avant la révélation : chacun voit son vote, l'animateur compte, les autres ne voient rien.
  let mine = 'pas encore';
  alice.store.watchMine(code, (v) => { mine = v; });
  await flush();
  assert.equal(mine, 2);
  let results = 'pas encore';
  alice.store.watchResults(code, (v) => { results = v; });
  await flush();
  assert.equal(results, null);
  let host = null;
  anim.store.watchHost(code, (v) => { host = v; });
  await flush();
  assert.deepEqual(host.votes, { alice: 2, bob: 5 });

  // Un participant ne peut pas révéler.
  const meta = await anim.store.getMeta(code);
  assert.equal(await alice.store.reveal(code, meta, { alice: 2 }), false);

  assert.ok(await anim.store.reveal(code, meta, host.votes));
  const entries = historyList(server.read(`meteo/teams/${teamId}/history`));
  assert.equal(entries.length, 1);
  assert.equal(entries[0].sid, `${createdAt}-${code}`);
  assert.deepEqual(entries[0].counts, { soleil: 1, eclaircies: 0, nuageux: 0, pluie: 1, orage: 0 });
  assert.ok(!JSON.stringify(server.read(`meteo/teams/${teamId}`)).includes('alice'));
  assert.equal(await alice.store.vote(code, 4), false);
  // Après révélation, alice lit les résultats (réabonnement au changement d'état, comme dans l'interface).
  alice.store.watchResults(code, (v) => { results = v; });
  await flush();
  assert.deepEqual(results, { alice: 2, bob: 5 });

  // Rouvrir, un retardataire vote, révéler de nouveau : toujours une seule entrée, mise à jour.
  assert.ok(await anim.store.reopen(code));
  assert.ok(await make('carl').store.vote(code, 4));
  assert.ok(await anim.store.reveal(code, await anim.store.getMeta(code), server.read(`meteo/sessions/${code}/votes`)));
  const after = historyList(server.read(`meteo/teams/${teamId}/history`));
  assert.equal(after.length, 1);
  assert.equal(after[0].total, 3);

  // Sans vote, pas de révélation.
  const empty = await anim.store.createSession(teamId, '');
  assert.equal(await anim.store.reveal(empty.code, await anim.store.getMeta(empty.code), null), false);
});

test('seul un animateur de l\'équipe lance une météo, retire un sprint, supprime l\'équipe', async () => {
  const { server, make } = setup();
  const anim = make('anim');
  const { teamId } = await anim.store.createTeam('Phénix');
  const intrus = make('intrus');
  await assert.rejects(intrus.store.createSession(teamId, 'Volé'));
  assert.equal(server.read('meteo/sessions'), null, 'la salle refusée n\'existe pas');
  assert.equal(server.read('meteo/expiry'), null, 'et son code est libéré');

  const { code } = await anim.store.createSession(teamId, 'Test');
  await make('a').store.vote(code, 1);
  await anim.store.reveal(code, await anim.store.getMeta(code), server.read(`meteo/sessions/${code}/votes`));
  const [entry] = historyList(server.read(`meteo/teams/${teamId}/history`));
  assert.equal(await intrus.store.removeHistory(teamId, entry.sid), false);
  assert.equal(await anim.store.removeHistory(teamId, entry.sid), true);
  assert.deepEqual(historyList(server.read(`meteo/teams/${teamId}/history`)), []);

  assert.equal(await anim.store.deleteTeam(teamId), true);
  assert.equal(await anim.store.teamSummary(teamId), null);
});

test('présence : un navigateur compte une fois, l\'animateur seul la lit', async () => {
  const { make } = setup();
  const anim = make('anim');
  const { teamId } = await anim.store.createTeam('Phénix');
  const { code } = await anim.store.createSession(teamId, '');
  const alice = make('alice');
  alice.store.openPresence(code);
  alice.store.openPresence(code);
  let host = null;
  anim.store.watchHost(code, (v) => { host = v; });
  await flush();
  assert.equal(Object.keys(host.participants.alice.connections).length, 1);
  await assert.rejects(alice.db.get(`meteo/sessions/${code}/participants`), /PERMISSION_DENIED/);
  await alice.store.closePresence();
  await flush();
  assert.equal(host.participants, null);
});

test('purge : salles de plus de 30 jours supprimées au lancement suivant, historique intact', async () => {
  const { server, make, tick } = setup();
  const anim = make('anim');
  const { teamId } = await anim.store.createTeam('Phénix');
  const old = await anim.store.createSession(teamId, 'Sprint 1');
  await make('a').store.vote(old.code, 5);
  await anim.store.reveal(old.code, await anim.store.getMeta(old.code), server.read(`meteo/sessions/${old.code}/votes`));
  tick(ROOM_TTL_MS + 1000);
  const other = make('autre-animateur');
  const second = await other.store.createTeam('Autre');
  await other.store.createSession(second.teamId, '');
  assert.equal(server.read(`meteo/sessions/${old.code}`), null);
  assert.equal(server.read(`meteo/expiry/${old.code}`), null);
  assert.equal(historyList(server.read(`meteo/teams/${teamId}/history`)).length, 1);
});
