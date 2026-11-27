// Logique pure de la météo du sprint.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  WEATHERS, WEATHER_KEYS, isValidVote, weatherFor, normalizeCode, isValidCode, generateCode, generateTeamId, generateKey,
  isValidTeamId, isValidKey, sessionId, isValidSessionId, validateName, validateLabel, nextLabel, normalizeText,
  valuesOf, countsOf, totalOf, weatherIndex, formatIndex, distribution, topWeathers, joinNames, connectedUids,
  everyoneVoted, situationKey, historyEntry, historyList, sprintName, parseTeams, touchTeam, removeTeam, plural,
  CODE_ALPHABET, NAME_MAX, LABEL_MAX, ROOM_TTL_MS, AUTO_REVEAL_DELAY_MS,
} from '../site/js/meteo-core.js';

const seq = (...values) => { let i = 0; return () => values[i++ % values.length]; };

test('les 5 météos, de Grand soleil (5) à Orage (1), avec leurs phrases', () => {
  assert.deepEqual(WEATHERS.map((w) => [w.value, w.name]), [
    [5, 'Grand soleil'], [4, 'Éclaircies'], [3, 'Nuageux'], [2, 'Pluie'], [1, 'Orage'],
  ]);
  assert.equal(weatherFor(5).phrase, 'Super sprint, j\'en redemande');
  assert.equal(weatherFor(1).phrase, 'Très dur, ça n\'a pas été');
  assert.deepEqual(WEATHER_KEYS, ['soleil', 'eclaircies', 'nuageux', 'pluie', 'orage']);
  assert.equal(weatherFor(6), null);
  for (const v of [1, 2, 3, 4, 5]) assert.ok(isValidVote(v));
  for (const v of [0, 6, 2.5, '3', null]) assert.ok(!isValidVote(v), String(v));
});

test('codes de salle : 4 lettres sans I, L ni O, saisie tolérante', () => {
  assert.equal(CODE_ALPHABET.length, 23);
  assert.ok(!/[ILO]/.test(CODE_ALPHABET));
  assert.equal(normalizeCode(' k rtw '), 'KRTW');
  assert.ok(isValidCode('KRTW'));
  for (const code of ['AB', 'ABCDE', 'ABCI', 'abcd', '']) assert.ok(!isValidCode(code), code);
  assert.equal(generateCode(seq(0)), 'AAAA');
  assert.equal(generateCode(seq(0.999)), 'ZZZZ');
});

test('identifiant d\'équipe (12) et clé d\'animation (20), aléatoires', () => {
  assert.ok(isValidTeamId(generateTeamId()));
  assert.ok(isValidKey(generateKey()));
  assert.notEqual(generateTeamId(), generateTeamId());
  assert.ok(!isValidTeamId('COURT'));
  assert.ok(!isValidKey('a'.repeat(19)));
});

test('clé d\'historique : heure de création et code', () => {
  assert.equal(sessionId(1800000000000, 'KRTW'), '1800000000000-KRTW');
  assert.ok(isValidSessionId('1800000000000-KRTW'));
  assert.ok(!isValidSessionId('KRTW'));
});

test('nom d\'équipe de 1 à 50 caractères, libellé de 40 au plus', () => {
  assert.equal(validateName('   '), 'Donnez un nom à l\'équipe.');
  assert.equal(validateName('Phénix'), null);
  assert.equal(validateName('n'.repeat(NAME_MAX)), null);
  assert.match(validateName('n'.repeat(NAME_MAX + 1)), /50 caractères/);
  assert.equal(validateLabel(''), null);
  assert.match(validateLabel('l'.repeat(LABEL_MAX + 1)), /40 caractères/);
  assert.equal(normalizeText('  Sprint   42 '), 'Sprint 42');
});

test('libellé suivant : « Sprint 41 » → « Sprint 42 », sinon vide', () => {
  assert.equal(nextLabel('Sprint 41'), 'Sprint 42');
  assert.equal(nextLabel('S09'), 'S10');
  assert.equal(nextLabel('Itération 2026-12'), 'Itération 2026-13');
  assert.equal(nextLabel('Rétro de Noël'), '');
  assert.equal(nextLabel(''), '');
  assert.equal(nextLabel(undefined), '');
});

test('exemple de la spec : 2 Grand soleil, 3 Éclaircies, 1 Nuageux, 1 Pluie → indice 3,9', () => {
  const votes = { a: 5, b: 5, c: 4, d: 4, e: 4, f: 3, g: 2, h: 'triche' };
  const values = valuesOf(votes);
  assert.equal(values.length, 7);
  const counts = countsOf(values);
  assert.deepEqual(counts, { soleil: 2, eclaircies: 3, nuageux: 1, pluie: 1, orage: 0 });
  assert.equal(totalOf(counts), 7);
  assert.equal(formatIndex(weatherIndex(counts)), '3,9');
  assert.deepEqual(distribution(counts).map((r) => [r.weather.name, r.count, r.percent]), [
    ['Grand soleil', 2, 29], ['Éclaircies', 3, 43], ['Nuageux', 1, 14], ['Pluie', 1, 14], ['Orage', 0, 0],
  ]);
  assert.deepEqual(topWeathers(counts).map((w) => w.name), ['Éclaircies']);
});

test('sans vote, ex æquo', () => {
  const empty = countsOf([]);
  assert.equal(weatherIndex(empty), null);
  assert.equal(formatIndex(null), '–');
  assert.deepEqual(topWeathers(empty), []);
  assert.ok(distribution(empty).every((r) => r.percent === 0));
  const tie = countsOf([5, 1, 3, 3, 5, 1]);
  assert.equal(joinNames(topWeathers(tie)), 'Grand soleil, Nuageux et Orage');
  assert.equal(joinNames(topWeathers(countsOf([4, 2]))), 'Éclaircies et Pluie');
});

test('tout le monde a voté : chaque connecté a voté, au moins un vote', () => {
  const on = (...uids) => Object.fromEntries(uids.map((u) => [u, { connections: { c1: true } }]));
  assert.deepEqual(connectedUids({ ...on('b', 'a'), parti: { connections: {} } }), ['a', 'b']);
  assert.ok(!everyoneVoted({}, {}));
  assert.ok(!everyoneVoted({}, on('a')));
  assert.ok(everyoneVoted({ a: 3 }, on('a')));
  assert.ok(!everyoneVoted({ a: 3 }, on('a', 'b')));
  // Un votant parti reste compté ; un connecté qui n'a pas voté bloque.
  assert.ok(everyoneVoted({ a: 3, parti: 4 }, on('a')));
  assert.ok(!everyoneVoted({ a: 3, b: 9 }, on('a', 'b')));
  // L'empreinte change quand quelqu'un vote ou arrive.
  const s1 = situationKey({ a: 3 }, on('a'));
  assert.equal(situationKey({ a: 4 }, on('a')), s1, 'changer d\'avis ne relance pas');
  assert.notEqual(situationKey({ a: 3, b: 1 }, on('a', 'b')), s1);
  assert.equal(AUTO_REVEAL_DELAY_MS, 3000);
});

test('entrée d\'historique : totaux seulement, sans identifiant', () => {
  const entry = historyEntry({ label: ' Sprint  42 ', createdAt: 1800000000000, votes: { alice: 4, bob: 4, carl: 1 } });
  assert.deepEqual(entry, {
    label: 'Sprint 42', date: 1800000000000, counts: { soleil: 0, eclaircies: 2, nuageux: 0, pluie: 0, orage: 1 }, total: 3,
  });
  assert.ok(!JSON.stringify(entry).includes('alice'));
});

test('historique du plus ancien au plus récent, entrées invalides ignorées', () => {
  const list = historyList({
    '1800000200000-BBBB': { label: 'Sprint 2', date: 1800000200000, counts: { soleil: 1, eclaircies: 0, nuageux: 0, pluie: 0, orage: 0 }, total: 1 },
    '1800000100000-AAAA': { label: '', date: 1800000100000, counts: { soleil: 0, eclaircies: 0, nuageux: 2, pluie: 0, orage: 0 }, total: 2 },
    'invalide': { label: 'X', date: 1, counts: { soleil: 1 }, total: 1 },
  });
  assert.deepEqual(list.map((e) => [e.sid, e.index]), [['1800000100000-AAAA', 3], ['1800000200000-BBBB', 5]]);
  assert.equal(sprintName(list[1]), 'Sprint 2');
  assert.match(sprintName(list[0]), /^\d{1,2} \S+ \d{2}:\d{2}$/);
  assert.deepEqual(historyList(null), []);
});

test('Mes équipes : valides, sans doublon, la plus récemment utilisée d\'abord', () => {
  const a = 'aaaaaaaaaaaa';
  const b = 'bbbbbbbbbbbb';
  let list = parseTeams('pas du json');
  assert.deepEqual(list, []);
  list = touchTeam(list, a, 1);
  list = touchTeam(list, b, 2);
  list = touchTeam(list, a, 3);
  assert.deepEqual(list, [{ id: a, usedAt: 3 }, { id: b, usedAt: 2 }]);
  assert.deepEqual(removeTeam(list, a), [{ id: b, usedAt: 2 }]);
  assert.deepEqual(parseTeams(JSON.stringify([{ id: 'X', usedAt: 1 }, { id: b }])), []);
});

test('purge à 30 jours, pluriels', () => {
  assert.equal(ROOM_TTL_MS, 2592000000);
  assert.equal(plural(1, 'vote'), '1 vote');
  assert.equal(plural(2, 'vote'), '2 votes');
  assert.equal(plural(0, 'sprint'), '0 sprint');
});

import { tickerItems, skyFor } from '../site/js/meteo-core.js';

test('bandeau du bulletin et ciel du participant', () => {
  const counts = { soleil: 2, eclaircies: 3, nuageux: 1, pluie: 0, orage: 0 };
  assert.deepEqual(tickerItems(counts), ['Grand soleil 2', 'Éclaircies 3', 'Nuageux 1', 'Pluie 0', 'Orage 0']);
  assert.equal(skyFor(null), 'neutre');
  assert.equal(skyFor(2), 'pluie');
});

import { parseSessionId, formatShort, CHART_SPRINTS } from '../site/js/meteo-core.js';

test('sprint sans libellé : date courte et heure ; clé d\'historique décodée ; 10 sprints au graphique', () => {
  const at = new Date(2026, 10, 27, 16, 20).getTime();
  assert.equal(formatShort(at), '27 nov. 16:20');
  assert.equal(sprintName({ label: '', date: at }), '27 nov. 16:20');
  assert.notEqual(sprintName({ label: '', date: at + 25 * 60000 }), sprintName({ label: '', date: at }));
  assert.deepEqual(parseSessionId('1800000000000-KRTW'), { createdAt: 1800000000000, code: 'KRTW' });
  assert.equal(parseSessionId('pas-un-sid'), null);
  assert.equal(CHART_SPRINTS, 10);
});

import { weatherOfEntry, lastWeatherText, FORECAST_CARDS } from '../site/js/meteo-core.js';

test('page d\'équipe : météo d\'un sprint par l\'indice arrondi, dernière météo', () => {
  assert.equal(weatherOfEntry({ index: 4.7 }).name, 'Grand soleil');
  assert.equal(weatherOfEntry({ index: 4.3 }).name, 'Éclaircies');
  assert.equal(weatherOfEntry({ index: 2.5 }).name, 'Nuageux');
  assert.equal(weatherOfEntry({ index: 1 }).name, 'Orage');
  assert.equal(weatherOfEntry({ index: null }), null);
  assert.equal(weatherOfEntry(undefined), null);
  assert.equal(lastWeatherText([]), 'Pas encore de météo');
  assert.equal(lastWeatherText([{ index: 4 }, { index: 4.3 }, { index: 4.7 }]), 'Dernière météo : Grand soleil · 4,7 / 5 · 3 sprints');
  assert.equal(FORECAST_CARDS, 6);
});

import { ballotsOf } from '../site/js/meteo-core.js';

test('bulletins de vote : connectés et votants, sans la météo, limités à 24', () => {
  const on = (...uids) => Object.fromEntries(uids.map((u) => [u, { connections: { c: true } }]));
  const { items, more } = ballotsOf({ b: 5, parti: 1, triche: 9 }, on('c', 'a', 'b'));
  assert.deepEqual(items, [{ uid: 'a', voted: false }, { uid: 'b', voted: true }, { uid: 'c', voted: false }, { uid: 'parti', voted: true }]);
  assert.equal(more, 0);
  assert.ok(!JSON.stringify(items).includes('5'), 'aucune météo');
  const many = Object.fromEntries(Array.from({ length: 30 }, (_, i) => [`u${String(i).padStart(2, '0')}`, { connections: { c: true } }]));
  const big = ballotsOf({}, many);
  assert.equal(big.items.length, 24);
  assert.equal(big.more, 6);
  assert.deepEqual(ballotsOf(null, null), { items: [], more: 0 });
});
