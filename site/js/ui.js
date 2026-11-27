// Interface de la météo du sprint : accueil, page d'équipe (liens, lancement, évolution), vue participant
// et vue animateur (révélation automatique). Aucune règle métier ici : elles sont dans meteo-core.js,
// et les accès à la base dans meteo-store.js.

import {
  WEATHERS, STATUS, AUTO_REVEAL_DELAY_MS, FEW_VOTES, CHART_SPRINTS, NAME_MAX, normalizeCode, isValidCode, isValidTeamId,
  isValidKey, isValidVote, weatherFor, valuesOf, countsOf, totalOf, weatherIndex, formatIndex, distribution, topWeathers,
  joinNames, connectedUids, everyoneVoted, situationKey, historyList, sprintName, nextLabel, parseTeams, touchTeam,
  removeTeam, plural, formatDate, formatDay, validateName, tickerItems, skyFor, parseSessionId, weatherOfEntry, lastWeatherText, FORECAST_CARDS, ballotsOf,
} from './meteo-core.js?v=__VERSION__';

const $ = (id) => document.getElementById(id);
const UNREACHABLE = 'Service indisponible : réessayez depuis votre téléphone, hors VPN.';
const NOT_FOUND = 'Aucune météo avec ce code.';
const TEAM_NOT_FOUND = 'Équipe introuvable.';
const AUTO_KEY = 'meteo.autoReveal';

/* ---------------------------------------------------------------- Outils */

function readStored(key, fallback = null) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function writeStored(key, value) {
  try { localStorage.setItem(key, value); } catch { /* stockage indisponible */ }
}

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child !== null && child !== undefined) node.append(child);
  return node;
}

const SVG = 'http://www.w3.org/2000/svg';
function svg(tag, attrs = {}, ...children) {
  const node = document.createElementNS(SVG, tag);
  for (const [key, value] of Object.entries(attrs)) if (value !== null && value !== undefined) node.setAttribute(key, value);
  for (const child of children.flat()) if (child) node.append(child);
  return node;
}

/** Icône d'une météo (symbole défini dans index.html). */
function weatherIcon(weather, className = 'wicon') {
  return svg('svg', { class: className, viewBox: '0 0 48 48', 'aria-hidden': 'true', focusable: 'false' },
    svg('use', { href: `#w-${weather.key}` }));
}

function loadScript(src) {
  return new Promise((resolve) => {
    if (window.qrcode) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => resolve();
    document.head.append(script);
  });
}

function qrSvg(url) {
  try {
    const qr = window.qrcode(0, 'M');
    qr.addData(url);
    qr.make();
    return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true, alt: `QR code : ${url}` });
  } catch {
    return '';
  }
}

/** Boîte de confirmation (ou de saisie si `input` est donné) ; renvoie true / la valeur saisie, sinon false. */
function confirmAction(title, message, okLabel, { danger = true, input = null } = {}) {
  const dialog = $('confirm-dialog');
  $('confirm-title').textContent = title;
  $('confirm-text').textContent = message;
  $('confirm-text').hidden = !message;
  $('confirm-ok').textContent = okLabel;
  $('confirm-ok').classList.toggle('button-danger-solid', danger);
  const field = $('confirm-input');
  field.hidden = input === null;
  field.value = input ?? '';
  return new Promise((resolve) => {
    dialog.addEventListener('close', () => {
      if (dialog.returnValue !== 'ok') resolve(false);
      else resolve(input === null ? true : field.value);
    }, { once: true });
    dialog.returnValue = 'cancel';
    dialog.showModal();
    if (input !== null) { field.focus(); field.select(); }
  });
}

function bump(node, value) {
  if (node.textContent === String(value)) return;
  node.textContent = String(value);
  const counter = node.closest('.counter');
  counter?.classList.remove('bump');
  void counter?.offsetWidth; // relance l'animation
  counter?.classList.add('bump');
}

/** Copie `text` dans le presse-papiers ; true si la copie a réussi. */
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Repli : sélection d'un champ caché (navigateurs anciens ou presse-papiers refusé).
    const field = el('textarea', { readonly: true, 'aria-hidden': 'true', class: 'visually-hidden' });
    field.value = text;
    document.body.append(field);
    field.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    field.remove();
    return ok;
  }
}

/* ---------------------------------------------------------------- Résultats (partagés) */

/** Répartition, météo la plus choisie et indice dans `container` ; `mine` : la météo du participant. */
function renderResults(container, votes, mine = null) {
  const counts = countsOf(valuesOf(votes));
  const total = totalOf(counts);
  const tops = topWeathers(counts);
  const index = weatherIndex(counts);

  const top = el('div', { class: 'top', 'aria-label': total ? `Météo la plus choisie : ${joinNames(tops)}. Indice ${formatIndex(index)} sur 5, ${plural(total, 'vote')}.` : 'Aucun vote' },
    el('div', { class: 'top-icons', 'aria-hidden': 'true' }, tops.map((w) => weatherIcon(w))),
    el('p', { class: 'top-name', text: total ? joinNames(tops) : 'Aucun vote' }),
    el('p', { class: 'top-index' }, el('strong', { text: formatIndex(index) }), el('span', { text: '/ 5' })),
    el('p', { class: 'muted', text: `indice moyen, sur ${plural(total, 'vote')}` }),
  );
  if (total && total < FEW_VOTES) top.append(el('p', { class: 'few-votes', text: 'Peu de votes : chacun peut deviner le vote des autres.' }));
  const mineWeather = weatherFor(mine);
  if (mineWeather) top.append(el('p', { class: 'my-choice', text: `Votre météo : ${mineWeather.name}` }));

  const bars = el('ul', { class: 'bars' });
  for (const row of distribution(counts)) {
    bars.append(el('li', { class: 'bar-row', 'aria-label': `${row.weather.name} : ${plural(row.count, 'vote')} (${row.percent} %)` },
      weatherIcon(row.weather),
      el('span', { class: 'bar-name', 'aria-hidden': 'true', text: row.weather.name }),
      el('span', { class: 'bar-track', 'aria-hidden': 'true' }, el('span', { class: `bar-fill fill-${row.weather.key}`, style: `width:${row.percent}%` })),
      el('span', { class: 'bar-count', 'aria-hidden': 'true' }, el('strong', { text: String(row.count) }), ` · ${row.percent} %`),
    ));
  }
  container.replaceChildren(el('div', { class: 'results' },
    top,
    el('div', { class: 'distribution' }, el('h3', { text: 'Répartition' }), bars)));
}

/* ---------------------------------------------------------------- Graphique d'évolution */

/**
 * Graphique : une colonne par sprint, haute de l'indice moyen (axe de 0 à 5), colorée à l'intérieur
 * selon la répartition des votes (de bas en haut : Orage … Grand soleil), avec l'indice au-dessus.
 */
function renderChart(box, tip, entries, { onOpen } = {}) {
  const width = Math.max(300, Math.round(box.clientWidth || 640));
  const narrow = width < 520;
  const height = narrow ? 240 : 300;
  const m = { top: 46, right: 8, bottom: 30, left: 26 };
  const plotW = width - m.left - m.right;
  const plotH = height - m.top - m.bottom;
  const slot = plotW / entries.length;
  const barW = Math.min(48, slot * 0.62);
  const yOf = (v) => m.top + plotH * (1 - v / 5);
  const order = [...WEATHERS].reverse(); // de bas en haut : Orage … Grand soleil

  const root = svg('svg', {
    viewBox: `0 0 ${width} ${height}`, width, height, role: 'img',
    'aria-label': `Évolution sur ${plural(entries.length, 'sprint')} : indice ${entries.map((e) => formatIndex(e.index)).join(', ')} sur 5. Détail dans le tableau.`,
  });

  for (let v = 0; v <= 5; v += 1) {
    root.append(svg('line', { class: 'grid-line', x1: m.left, x2: width - m.right, y1: yOf(v), y2: yOf(v) }));
    const label = svg('text', { class: 'axis-text', x: m.left - 8, y: yOf(v) + 4, 'text-anchor': 'end' });
    label.textContent = String(v);
    root.append(label);
  }

  const maxChars = Math.max(3, Math.floor(slot / 7.5));
  const showValues = !narrow || entries.length <= 8;
  const points = [];
  entries.forEach((entry, i) => {
    const cx = m.left + slot * (i + 0.5);
    const group = svg('g', { class: 'sprint', tabindex: '0', 'data-index': String(i) });
    group.append(svg('rect', { class: 'hit', x: cx - slot / 2 + 1, y: 4, width: slot - 2, height: m.top + plotH + 2, rx: 8 }));
    const top = yOf(entry.index);
    const barH = m.top + plotH - top;
    let y = m.top + plotH;
    for (const weather of order) {
      const count = entry.counts[weather.key];
      if (!count) continue;
      const h = (count / entry.total) * barH;
      y -= h;
      group.append(svg('rect', { class: `seg-${weather.key}`, x: cx - barW / 2, y, width: barW, height: Math.max(h - 1, 0.5), rx: 2 }));
    }
    const iconSize = Math.max(16, Math.min(28, slot * 0.5));
    const weather = weatherOfEntry(entry);
    if (showValues) {
      const value = svg('text', { class: 'index-text', x: cx, y: top - 7, 'text-anchor': 'middle' });
      value.textContent = formatIndex(entry.index);
      group.append(value);
    }
    if (weather) {
      group.append(svg('use', { class: 'col-icon', href: `#w-${weather.key}`, x: cx - iconSize / 2, y: top - (showValues ? 22 : 6) - iconSize, width: iconSize, height: iconSize }));
    }
    const name = sprintName(entry);
    const label = svg('text', { class: 'x-text', x: cx, y: height - 10, 'text-anchor': 'middle' });
    // Trop étroit pour le libellé : son numéro final (« Sprint 41 » → « 41 »), sinon le libellé tronqué.
    const short = entry.label.match(/(\d+)$/)?.[1];
    label.textContent = name.length <= maxChars ? name : (short && short.length <= maxChars ? short : `${name.slice(0, maxChars - 1)}…`);
    group.append(label);
    root.append(group);
    points.push([cx, top]);
  });

  box.replaceChildren(root);

  function show(i) {
    const entry = entries[i];
    const [x] = points[i];
    for (const g of root.querySelectorAll('.sprint')) g.classList.toggle('is-active', Number(g.dataset.index) === i);
    tip.replaceChildren(
      el('strong', { text: sprintName(entry) }),
      el('span', { class: 'muted small', text: `${formatDay(entry.date)} · indice ${formatIndex(entry.index)} · ${plural(entry.total, 'vote')}` }),
      el('ul', {}, WEATHERS.filter((w) => entry.counts[w.key]).map((w) =>
        el('li', {}, el('span', { class: `dot dot-${w.key}` }), `${w.name} : ${entry.counts[w.key]}`))),
      onOpen ? el('span', { class: 'tip-hint', text: 'Cliquez pour ouvrir' }) : null,
    );
    tip.hidden = false;
    const left = Math.min(Math.max((x / width) * 100, 18), 82);
    tip.style.left = `${left}%`;
    tip.style.top = `${Math.max(0, points[i][1] + 8)}px`;
  }
  function hide() {
    tip.hidden = true;
    for (const g of root.querySelectorAll('.sprint')) g.classList.remove('is-active');
  }
  for (const group of root.querySelectorAll('.sprint')) {
    const i = Number(group.dataset.index);
    group.addEventListener('pointerenter', () => show(i));
    group.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') hide(); });
    group.addEventListener('focus', () => show(i));
    group.addEventListener('blur', hide);
    group.setAttribute('role', 'link');
    group.setAttribute('aria-label', `Ouvrir ${sprintName(entries[i])}, indice ${formatIndex(entries[i].index)}`);
    group.addEventListener('click', () => onOpen?.(entries[i]));
    group.addEventListener('keydown', (event) => { if (event.key === 'Enter') { event.preventDefault(); onOpen?.(entries[i]); } });
  }
}


/* ---------------------------------------------------------------- Ciel vivant */

const CLOUD_D = 'M15 38a7 7 0 0 1-.6-14A10 10 0 0 1 33.6 21a8.5 8.5 0 0 1 .4 17z';

/** Générateur pseudo-aléatoire déterministe : le ciel est le même à chaque chargement. */
function seeded(seed) {
  let x = seed;
  return () => { x = (x * 16807) % 2147483647; return (x - 1) / 2147483646; };
}

function cloud({ w, x, top, d, delay, color = null, opacity = 1 }) {
  const node = svg('svg', { class: 'cloud', viewBox: '6 12 38 28', style: `--w:${w}px;--x:${x}cqw;--d:${d}s;--delay:${delay}s;top:${top}cqh;opacity:${opacity};${color ? `--c:${color};` : ''}` },
    svg('path', { d: CLOUD_D }));
  return node;
}

function sun(className = 'sky-sun') {
  return svg('svg', { class: className, viewBox: '0 0 100 100' },
    svg('g', { class: 'rays', stroke: 'var(--sky-sun)', 'stroke-width': '5', 'stroke-linecap': 'round', opacity: '0.85' },
      ...Array.from({ length: 12 }, (_, i) => {
        const a = (i * Math.PI) / 6;
        return svg('line', { x1: 50 + Math.cos(a) * 34, y1: 50 + Math.sin(a) * 34, x2: 50 + Math.cos(a) * 46, y2: 50 + Math.sin(a) * 46 });
      })),
    svg('circle', { class: 'disc', cx: '50', cy: '50', r: '24', fill: 'var(--sky-sun)' }));
}

function stars(random) {
  const box = svg('svg', { class: 'sky-stars', viewBox: '0 0 100 60', preserveAspectRatio: 'none' });
  for (let i = 0; i < 40; i += 1) box.append(svg('circle', { cx: (random() * 100).toFixed(1), cy: (random() * 60).toFixed(1), r: (0.12 + random() * 0.18).toFixed(2), fill: '#fff', opacity: (0.4 + random() * 0.5).toFixed(2) }));
  return box;
}

function clouds(random, count, { minW, maxW, maxTop, color = null, opacity = 1, speed = [70, 130] }) {
  return Array.from({ length: count }, (_, i) => {
    const d = speed[0] + random() * (speed[1] - speed[0]);
    return cloud({
      w: Math.round(minW + random() * (maxW - minW)), x: Math.round(((i + 0.5) / count) * 90 - 5), top: (random() * maxTop).toFixed(1),
      d: d.toFixed(0), delay: (-random() * d).toFixed(1), color, opacity,
    });
  });
}

function rain(random, count) {
  return Array.from({ length: count }, () => el('span', {
    class: 'drop',
    style: `left:${(random() * 100).toFixed(1)}cqw;--y:${(random() * 100).toFixed(0)}cqh;--d:${(0.7 + random() * 0.5).toFixed(2)}s;--delay:${(-random() * 1.2).toFixed(2)}s;`,
  }));
}

/** Construit une fois les six calques du ciel (neutre et une par météo). */
function buildSky(container) {
  const r = seeded(42);
  const layer = (key, ...children) => el('div', { class: `sky-layer sky-${key}` }, ...children);
  const bolt = svg('svg', { class: 'bolt', viewBox: '0 0 20 40' }, svg('path', { d: 'M12 0 2 22h7l-3 18 12-25h-7l5-15z', fill: '#ffe066' }));
  container.replaceChildren(
    layer('aube', stars(r), sun(), clouds(r, 2, { minW: 150, maxW: 220, maxTop: 30, opacity: 0.85, speed: [130, 190] })),
    layer('neutre', clouds(r, 2, { minW: 160, maxW: 240, maxTop: 30, opacity: 0.55, speed: [120, 180] })),
    layer('soleil', stars(r), sun(), clouds(r, 2, { minW: 120, maxW: 180, maxTop: 35, opacity: 0.9, speed: [110, 160] })),
    layer('eclaircies', stars(r), sun('sky-sun sky-sun-small'), clouds(r, 5, { minW: 150, maxW: 280, maxTop: 45 })),
    layer('nuageux', clouds(r, 4, { minW: 220, maxW: 360, maxTop: 25, color: 'var(--sky-cloud-dark)', speed: [90, 140] }),
      clouds(r, 5, { minW: 180, maxW: 320, maxTop: 55 })),
    layer('pluie', clouds(r, 6, { minW: 240, maxW: 420, maxTop: 20, color: 'var(--sky-cloud-dark)', speed: [80, 120] }), rain(r, 70)),
    layer('orage', el('div', { class: 'flash' }), clouds(r, 6, { minW: 260, maxW: 440, maxTop: 18, color: 'var(--sky-storm-cloud)', speed: [60, 100] }), bolt, rain(r, 90)),
  );
}

/** Ciel affiché : une météo, « neutre », ou aucun (null) hors de la vue participant. */
function setSky(key) {
  if (key) document.body.dataset.sky = key;
  else delete document.body.dataset.sky;
}

/* ---------------------------------------------------------------- Bulletin de révélation */

const MAP_SPOTS = { soleil: [140, 96], eclaircies: [258, 92], nuageux: [272, 196], pluie: [184, 170], orage: [150, 228] };
// « Hexagone » stylisé, façon bulletin télé, et une petite île.
const LAND = 'M150 28 L214 34 L252 46 L332 84 L322 132 L314 176 L346 236 L300 252 L236 270 L176 262 L140 246 L96 226 L104 176 L92 150 L52 116 L74 92 L118 82 Z';
const ISLAND = 'M376 222 l10 6 l-2 22 l-10 10 l-6 -14 z';

/** Bulletin météo télé : carte de l'équipe, prévision, indice, répartition, bandeau (sans comparaison avec d'autres sprints). */
function renderBulletin(container, { teamName, label, counts, live = true }) {
  const total = totalOf(counts);
  const tops = topWeathers(counts);
  const index = weatherIndex(counts);

  const map = svg('svg', { viewBox: '0 0 420 290', role: 'img', 'aria-label': `Carte de l'équipe : ${distribution(counts).filter((r) => r.count).map((r) => `${r.weather.name} ${r.count}`).join(', ')}` });
  for (let x = 30; x < 420; x += 40) map.append(svg('line', { class: 'grid', x1: x, y1: 0, x2: x, y2: 290 }));
  for (let y = 25; y < 290; y += 40) map.append(svg('line', { class: 'grid', x1: 0, y1: y, x2: 420, y2: y }));
  map.append(svg('path', { class: 'land', d: LAND }), svg('path', { class: 'land', d: ISLAND }));
  for (const w of WEATHERS) {
    const count = counts[w.key];
    if (!count) continue;
    const size = 46 + 70 * (count / total);
    const [cx, cy] = MAP_SPOTS[w.key];
    map.append(svg('use', { href: `#w-${w.key}`, x: cx - size / 2, y: cy - size / 2, width: size, height: size }));
    const t = svg('text', { class: 'count', x: cx + size / 2 - 6, y: cy + size / 2 - 2, 'text-anchor': 'middle' });
    t.textContent = `×${count}`;
    map.append(t);
  }

  const bar = el('div', { class: 'bul-bar', 'aria-hidden': 'true' },
    distribution(counts).filter((r) => r.count).map((r) => el('span', { class: `fill-${r.weather.key}`, style: `width:${(r.count / total) * 100}%`, title: `${r.weather.name} : ${r.count}` })));
  const items = tickerItems(counts);

  container.replaceChildren(el('div', { class: 'bulletin' },
    el('div', { class: 'bul-top' }, live ? el('span', { class: 'bul-live', text: 'Direct' }) : null,
      el('span', { text: [live ? 'Bulletin météo' : 'Bilan météo', teamName, label].filter(Boolean).join(' · ') })),
    el('div', { class: 'bul-body' },
      el('div', { class: 'bul-map' }, map),
      el('div', { class: 'bul-forecast' },
        el('p', { class: 'bul-kicker', text: 'Prévision de l\'équipe' }),
        el('p', { class: 'bul-name', text: total ? joinNames(tops) : 'Aucun vote' }),
        el('p', { class: 'bul-index', 'aria-label': `Indice moyen ${formatIndex(index)} sur 5` }, el('strong', { text: formatIndex(index) }), el('span', { text: '/ 5' })),
        el('p', { class: 'bul-meta', text: `indice moyen · ${plural(total, 'vote')}` }),
        bar,
        total && total < FEW_VOTES ? el('p', { class: 'bul-few', text: 'Peu de votes : chacun peut deviner le vote des autres.' }) : null,
      )),
    el('div', { class: 'bul-ticker', 'aria-label': items.join(', ') },
      el('div', { class: 'bul-track', 'aria-hidden': 'true' }, [...items, ...items].map((text) => el('span', { text })))),
  ));
}

/* ---------------------------------------------------------------- Application */

export function showFatal(message) {
  $('loading').hidden = false;
  $('loading').textContent = message;
}

export async function startApp(store, { demo = false } = {}) {
  let offline = false;
  let everConnected = false;
  let teardown = null;

  $('demo-chip').hidden = !demo;
  buildSky($('sky'));
  buildSky($('team-sky'));
  buildSky($('host-sky'));
  buildSky($('home-sky'));

  try {
    await Promise.race([
      store.start(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('délai dépassé')), 15000)),
    ]);
  } catch (error) {
    console.error('Connexion refusée :', error?.code ?? error);
    offline = true;
  }

  // En démo, tous les onglets partagent le localStorage : la liste est propre à chaque onglet (utilisateur).
  const TEAMS_KEY = demo ? `meteo.demo-teams.${store.uid}` : 'meteo.teams';

  if (!offline) {
    store.onConnection((connected) => {
      everConnected ||= connected;
      $('banner').hidden = connected || !everConnected;
      $('banner').textContent = 'Connexion perdue, reconnexion…';
    });
  }

  /* ------------------------------------------------------------ Navigation */

  function urlFor(params = {}) {
    const parts = [];
    if (demo) parts.push('demo');
    for (const [key, value] of Object.entries(params)) parts.push(`${key}=${encodeURIComponent(value)}`);
    return `${location.pathname}${parts.length ? `?${parts.join('&')}` : ''}`;
  }
  const absoluteUrl = (params) => `${location.origin}${urlFor(params)}`;

  function go(params, { replace = false, message = '', state = null } = {}) {
    history[replace ? 'replaceState' : 'pushState'](state, '', urlFor(params));
    route(message);
  }

  function showScreen(id) {
    $('loading').hidden = true;
    setSky(id === 'screen-vote' ? 'neutre' : null);
    for (const screen of document.querySelectorAll('.screen')) screen.hidden = screen.id !== id;
    window.scrollTo(0, 0);
  }

  async function route(message = '') {
    teardown?.();
    teardown = null;
    const params = new URLSearchParams(location.search);
    if (offline) { showHome(UNREACHABLE); return; }

    const teamId = params.get('equipe');
    if (teamId !== null) {
      if (!isValidTeamId(teamId)) { history.replaceState(null, '', urlFor()); showHome(TEAM_NOT_FOUND); return; }
      if (params.get('sprint') !== null) { showSprint(teamId, params.get('sprint')); return; }
      showTeam(teamId, params.get('cle'));
      return;
    }

    const hostCode = normalizeCode(params.get('animer'));
    const voteCode = normalizeCode(params.get('meteo'));
    const code = hostCode || voteCode;
    if (!code) { showHome(message); return; }
    if (!isValidCode(code)) { history.replaceState(null, '', urlFor()); showHome(NOT_FOUND); return; }
    $('loading').hidden = false;
    $('loading').textContent = 'Connexion…';
    const meta = await store.getMeta(code).catch(() => undefined);
    if (meta === undefined) { showHome(UNREACHABLE); return; }
    if (!meta) { history.replaceState(null, '', urlFor()); showHome(hostCode ? 'Cette météo n\'existe plus.' : NOT_FOUND); return; }
    if (hostCode && meta.hostUid === store.uid) { showHost(code); return; }
    if (hostCode) history.replaceState(null, '', urlFor({ meteo: code }));
    showVote(code);
  }

  /** Fenêtre du QR code agrandi (vue animateur et carte « Partager » de l'équipe). */
  const qrDialog = $('qr-dialog');
  function openQrDialog({ title, url, code = '' }) {
    $('qr-dialog-title').textContent = title;
    $('qr-large').innerHTML = qrSvg(url);
    $('qr-dialog-url').textContent = url.replace(/^https?:\/\//, '');
    $('qr-dialog-code').textContent = code;
    $('qr-dialog-code').hidden = !code;
    qrDialog.showModal();
  }
  $('qr-close').addEventListener('click', () => qrDialog.close());
  qrDialog.addEventListener('click', (event) => { if (event.target === qrDialog) qrDialog.close(); });

  /** Copie en un clic : l'icône devient une coche et « Lien copié » s'affiche 2,5 s. */
  function wireCopy(button, status, getText) {
    let timer;
    button.addEventListener('click', async () => {
      const text = getText();
      const copied = await copyText(text);
      button.classList.toggle('is-done', copied);
      status.className = copied ? 'copy-status' : 'copy-status is-error';
      status.textContent = copied ? 'Lien copié' : `Copie impossible : ${text}`;
      clearTimeout(timer);
      timer = setTimeout(() => { button.classList.remove('is-done'); status.textContent = ''; }, 2500);
    });
  }

  window.addEventListener('popstate', () => route());
  $('brand-link').addEventListener('click', (event) => { event.preventDefault(); go({}); });
  $('brand-link').href = urlFor();

  /* ------------------------------------------------------------ Mes équipes */

  const readTeams = () => parseTeams(readStored(TEAMS_KEY));
  const saveTeams = (list) => writeStored(TEAMS_KEY, JSON.stringify(list));
  const rememberTeam = (id) => saveTeams(touchTeam(readTeams(), id, Date.now()));
  const forgetTeam = (id) => saveTeams(removeTeam(readTeams(), id));

  function renderTeams() {
    const list = readTeams();
    $('teams-panel').hidden = !list.length;
    if (!list.length) return;
    const items = list.map((entry) => {
      // Carte comme les prévisions de la page d'équipe : icône de la dernière météo, indice, nom, sprints.
      const icon = el('span', { class: 'fc-icon' }, weatherIcon(WEATHERS[2]));
      const index = el('span', { class: 'fc-index', text: '…' });
      const name = el('span', { class: 'fc-team', text: 'Équipe' });
      const meta = el('span', { class: 'fc-name', text: ' ' });
      const card = el('a', { class: 'forecast-card team-card is-empty', href: urlFor({ equipe: entry.id }) }, icon, index, name, meta);
      card.addEventListener('click', (event) => { event.preventDefault(); go({ equipe: entry.id }); });
      const item = el('li', {}, card);
      const drop = () => { forgetTeam(entry.id); item.remove(); $('teams-panel').hidden = !readTeams().length; };
      store.teamSummary(entry.id).then((summary) => {
        if (summary === undefined) { index.textContent = ''; meta.textContent = 'Indisponible pour l\'instant'; return; }
        if (summary === null || !summary.isOwner) { drop(); return; }
        const sprints = historyList(summary.history);
        const last = sprints.at(-1);
        const weather = weatherOfEntry(last);
        name.textContent = summary.name;
        card.title = summary.name;
        if (weather) {
          icon.replaceChildren(weatherIcon(weather));
          index.replaceChildren(formatIndex(last.index), el('span', { text: ' / 5' }));
          meta.textContent = `${plural(sprints.length, 'sprint')} · ${formatDay(last.date)}`;
          card.classList.remove('is-empty');
          card.setAttribute('aria-label', `Ouvrir ${summary.name} : dernière météo ${weather.name}, ${formatIndex(last.index)} sur 5, ${plural(sprints.length, 'sprint')}`);
        } else {
          index.textContent = '–';
          meta.textContent = 'Aucune météo';
          card.setAttribute('aria-label', `Ouvrir ${summary.name} : aucune météo`);
        }
      });
      return item;
    });
    $('teams-list').replaceChildren(...items);
  }

  /* ------------------------------------------------------------ Accueil */

  function showHome(message = '') {
    document.title = 'Météo du sprint';
    showScreen('screen-home');
    $('home-error').hidden = !message;
    $('home-error').textContent = message;
    $('team-error').textContent = '';
    $('join-error').textContent = '';
    $('team-submit').disabled = offline;
    $('join-submit').disabled = offline;
    if (!offline) renderTeams();
  }

  $('code-input').addEventListener('input', () => { $('code-input').value = normalizeCode($('code-input').value); });

  $('team-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (offline) return;
    const error = validateName($('team-input').value);
    if (error) { $('team-error').textContent = error; $('team-input').focus(); return; }
    $('team-submit').disabled = true;
    $('team-error').textContent = '';
    try {
      const { teamId } = await store.createTeam($('team-input').value);
      rememberTeam(teamId);
      $('team-input').value = '';
      go({ equipe: teamId }, { state: { justCreated: true } });
    } catch (failure) {
      console.error(failure);
      $('team-error').textContent = 'Création impossible : vérifiez votre connexion, puis réessayez.';
    } finally {
      $('team-submit').disabled = false;
    }
  });

  $('join-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (offline) return;
    const code = normalizeCode($('code-input').value);
    if (!isValidCode(code)) { $('join-error').textContent = 'Le code fait 4 lettres.'; return; }
    $('join-submit').disabled = true;
    $('join-error').textContent = '';
    const meta = await store.getMeta(code).catch(() => undefined);
    $('join-submit').disabled = false;
    if (meta === undefined) { $('join-error').textContent = UNREACHABLE; return; }
    if (!meta) { $('join-error').textContent = NOT_FOUND; return; }
    $('code-input').value = '';
    go({ meteo: code });
  });

  /* ------------------------------------------------------------ Page d'équipe */

  const team = { id: null, key: null, meta: null, entries: [], resize: null };

  async function showTeam(teamId, keyFromUrl) {
    showScreen('screen-team');
    Object.assign(team, { id: teamId, key: null, meta: null, entries: [] });
    $('team-name').textContent = '';
    $('team-error-msg').hidden = true;
    $('team-owner').hidden = true;
    $('team-owner-actions').hidden = true;
    const justCreated = Boolean(history.state?.justCreated);
    $('key-callout').hidden = !justCreated;
    setKeyPanel(justCreated);
    $('team-hero').dataset.sky = 'neutre';
    $('team-last').textContent = '';
    $('forecast-panel').hidden = true;
    $('copy-status').textContent = '';
    $('launch-error').textContent = '';

    // Lien d'animation : on devient animateur, puis la clé disparaît de la barre d'adresse.
    if (keyFromUrl !== null) {
      history.replaceState(null, '', urlFor({ equipe: teamId }));
      const meta = await store.getTeamMeta(teamId).catch(() => undefined);
      if (meta === null) { history.replaceState(null, '', urlFor()); showHome(TEAM_NOT_FOUND); return; }
      if (!isValidKey(keyFromUrl) || !(await store.claimTeam(teamId, keyFromUrl))) {
        $('team-error-msg').textContent = 'Ce lien d\'animation n\'est pas valide.';
        $('team-error-msg').hidden = false;
      } else {
        rememberTeam(teamId);
      }
    }

    const exists = await store.getTeamMeta(teamId).catch(() => undefined);
    if (exists === undefined) { showHome(UNREACHABLE); return; }
    if (!exists) { forgetTeam(teamId); history.replaceState(null, '', urlFor()); showHome(TEAM_NOT_FOUND); return; }

    team.key = await store.myKey(teamId).catch(() => null);
    const owner = Boolean(team.key);
    if (owner) rememberTeam(teamId);
    $('team-owner').hidden = !owner;
    $('team-owner-actions').hidden = !owner;
    $('key-toggle').hidden = !owner;
    if (!owner) setKeyPanel(false);
    team.publicUrl = absoluteUrl({ equipe: teamId });
    $('public-url').textContent = team.publicUrl.replace(/^https?:\/\//, '');
    $('public-copy').classList.remove('is-done');
    $('public-copy-status').textContent = '';
    $('team-qr').innerHTML = '';
    qrReady.then(() => { $('team-qr').innerHTML = qrSvg(team.publicUrl); });
    $('key-link').value = owner ? absoluteUrl({ equipe: teamId, cle: team.key }) : '';

    let first = true;
    let stop = () => {};
    let observer = null;
    function cleanup() { stop(); observer?.disconnect(); }
    teardown = cleanup;
    stop = store.watchTeam(teamId, ({ meta, history: raw }) => {
      if (!meta) {
        cleanup();
        forgetTeam(teamId);
        history.replaceState(null, '', urlFor());
        showHome(TEAM_NOT_FOUND);
        return;
      }
      team.meta = meta;
      team.entries = historyList(raw);
      $('team-name').textContent = meta.name;
      document.title = `${meta.name} · Météo du sprint`;
      if (first && owner) {
        $('label-input').value = nextLabel(team.entries.at(-1)?.label ?? '');
      }
      first = false;
      renderHistory();
    });

    if (teardown !== cleanup) return; // équipe supprimée pendant l'abonnement
    observer = new ResizeObserver(() => renderChartOnly());
    observer.observe($('chart-wrap'));
  }

  /** Le graphique se limite aux 10 derniers sprints ; le tableau garde tout. */
  function visibleEntries() {
    return team.entries.slice(-CHART_SPRINTS);
  }

  const openSprint = (entry) => go({ equipe: team.id, sprint: entry.sid });

  let lastChartWidth = 0;
  function renderChartOnly(force = false) {
    if (!team.entries.length || $('chart-wrap').hidden) return;
    const width = $('chart').clientWidth;
    if (!force && Math.abs(width - lastChartWidth) < 8) return;
    lastChartWidth = width;
    renderChart($('chart'), $('chart-tip'), visibleEntries(), { onOpen: openSprint });
  }

  function renderHero() {
    const weather = weatherOfEntry(team.entries.at(-1));
    $('team-hero').dataset.sky = weather?.key ?? 'neutre';
    $('team-last').textContent = lastWeatherText(team.entries);
  }

  /** Cartes « Les dernières météos », du plus ancien au plus récent (lancer une météo reste dans le bandeau). */
  function renderForecast() {
    const recent = team.entries.slice(-FORECAST_CARDS);
    $('forecast-panel').hidden = !recent.length;
    const cards = recent.map((entry, i) => {
      const weather = weatherOfEntry(entry);
      const latest = i === recent.length - 1;
      const card = el('button', {
        type: 'button', class: `forecast-card${latest ? ' is-latest' : ''}`,
        'aria-label': `Ouvrir ${sprintName(entry)} : ${weather.name}, indice ${formatIndex(entry.index)} sur 5${latest ? ', dernière météo' : ''}`,
      },
      el('span', { class: 'fc-label', 'aria-hidden': 'true', text: latest ? `${sprintName(entry)} · dernière` : sprintName(entry) }),
      weatherIcon(weather),
      el('span', { class: 'fc-index', 'aria-hidden': 'true' }, formatIndex(entry.index), el('span', { text: ' / 5' })),
      el('span', { class: 'fc-name', 'aria-hidden': 'true', text: weather.name }));
      card.addEventListener('click', () => openSprint(entry));
      return el('li', {}, card);
    });
    $('forecast').replaceChildren(...cards);
  }

  function renderHistory() {
    renderHero();
    renderForecast();
    const entries = team.entries;
    const owner = Boolean(team.key);
    $('history-empty').hidden = entries.length > 0;
    $('chart-wrap').hidden = !entries.length;
    $('table-wrap').hidden = !entries.length;
    $('chart-tip').hidden = true;
    if (!entries.length) return;

    $('chart-legend').replaceChildren(
      ...WEATHERS.map((w) => el('li', {}, el('span', { class: `dot dot-${w.key}` }), w.name)),
    );
    $('chart-note').textContent = 'Hauteur de la colonne : indice moyen de l\'équipe, sur 5. Couleurs : répartition des votes.';
    renderChartOnly(true);

    const head = el('tr', {},
      el('th', { scope: 'col', class: 'col-sprint', text: 'Sprint' }),
      el('th', { scope: 'col', class: 'col-date', text: 'Date' }),
      WEATHERS.map((w) => el('th', { scope: 'col', title: w.name }, weatherIcon(w), el('span', { class: 'visually-hidden', text: w.name }))),
      el('th', { scope: 'col', text: 'Votes' }),
      el('th', { scope: 'col', text: 'Indice' }),
      owner ? el('th', { scope: 'col' }, el('span', { class: 'visually-hidden', text: 'Actions' })) : null,
    );
    const rows = [...entries].reverse().map((entry) => {
      const remove = owner ? el('button', { type: 'button', class: 'button button-ghost button-small button-danger remove-button', 'aria-label': `Retirer ${sprintName(entry)}`, title: 'Retirer de l\'historique' },
        el('span', { class: 'label-long', 'aria-hidden': 'true', text: 'Retirer' }),
        el('span', { class: 'label-short', 'aria-hidden': 'true', text: '✕' })) : null;
      remove?.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (!(await confirmAction('Retirer ce sprint ?', `« ${sprintName(entry)} » sera retiré de l'historique de l'équipe.`, 'Retirer'))) return;
        if (!(await store.removeHistory(team.id, entry.sid))) {
          $('team-error-msg').textContent = 'Retrait impossible pour l\'instant : réessayez.';
          $('team-error-msg').hidden = false;
        }
      });
      const link = el('a', { class: 'sprint-link', href: urlFor({ equipe: team.id, sprint: entry.sid }), text: sprintName(entry) });
      link.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); openSprint(entry); });
      const row = el('tr', { title: 'Ouvrir cette météo' },
        el('th', { scope: 'row' }, link),
        el('td', { class: 'col-date', text: formatDay(entry.date) }),
        WEATHERS.map((w) => el('td', { class: entry.counts[w.key] ? null : 'zero', text: String(entry.counts[w.key]) })),
        el('td', { text: String(entry.total) }),
        el('td', { class: 'col-index', text: formatIndex(entry.index) }),
        owner ? el('td', {}, remove) : null,
      );
      row.addEventListener('click', () => openSprint(entry));
      return row;
    });
    $('history-table').replaceChildren(
      el('caption', { class: 'visually-hidden', text: 'Historique des météos, du plus récent au plus ancien' }),
      el('thead', {}, head), el('tbody', {}, rows));
  }


  /** Encart « Lien d'animation » (ouvert d'office juste après la création de l'équipe). */
  function setKeyPanel(open) {
    $('key-panel').hidden = !open;
    $('key-toggle').setAttribute('aria-expanded', String(open));
  }
  $('key-toggle').addEventListener('click', () => {
    const open = $('key-panel').hidden;
    $('key-callout').hidden = true;
    setKeyPanel(open);
    if (open) $('key-panel').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
  $('key-close').addEventListener('click', () => { setKeyPanel(false); $('key-toggle').focus(); });
  wireCopy($('public-copy'), $('public-copy-status'), () => team.publicUrl);
  $('team-qr-open').addEventListener('click', () => openQrDialog({ title: 'Consulter l\'historique', url: team.publicUrl }));

  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const input = $(button.dataset.copy);
      const copied = await copyText(input.value);
      if (!copied) { input.select(); }
      $('copy-status').textContent = copied ? 'Lien copié.' : 'Copie impossible : sélectionnez le lien et copiez-le.';
    });
  }

  $('team-owner').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('launch-submit').disabled = true;
    $('launch-error').textContent = '';
    try {
      const { code } = await store.createSession(team.id, $('label-input').value);
      rememberTeam(team.id);
      go({ animer: code });
    } catch (error) {
      console.error(error);
      $('launch-error').textContent = /caractères/.test(error?.message ?? '')
        ? error.message
        : 'Lancement impossible : vérifiez votre connexion, puis réessayez.';
    } finally {
      $('launch-submit').disabled = false;
    }
  });

  $('team-rename').addEventListener('click', async () => {
    const value = await confirmAction('Renommer l\'équipe', '', 'Renommer', { danger: false, input: team.meta?.name ?? '' });
    if (value === false) return;
    const error = validateName(value);
    if (error || !(await store.renameTeam(team.id, value))) {
      $('team-error-msg').textContent = error ?? 'Renommage impossible pour l\'instant : réessayez.';
      $('team-error-msg').hidden = false;
    } else {
      $('team-error-msg').hidden = true;
    }
  });
  $('confirm-input').maxLength = NAME_MAX;

  $('team-delete').addEventListener('click', async () => {
    if (!(await confirmAction('Supprimer l\'équipe ?', `L'historique de l'équipe « ${team.meta?.name ?? ''} » sera effacé définitivement.`, 'Supprimer'))) return;
    const id = team.id;
    teardown?.();
    teardown = null;
    if (await store.deleteTeam(id)) {
      forgetTeam(id);
      go({}, { replace: true });
    } else {
      route();
      $('team-error-msg').textContent = 'Suppression impossible pour l\'instant : réessayez.';
      $('team-error-msg').hidden = false;
    }
  });

  /* ------------------------------------------------------------ Bilan d'une météo passée */

  /** Ouvre une météo de l'historique : sa vue animateur si ce navigateur l'a lancée et qu'elle existe, sinon son bilan. */
  async function showSprint(teamId, sid) {
    const parsed = parseSessionId(sid);
    if (!parsed) { go({ equipe: teamId }, { replace: true }); return; }
    $('loading').hidden = false;
    $('loading').textContent = 'Connexion…';
    const summary = await store.teamSummary(teamId);
    if (summary === undefined) { showHome(UNREACHABLE); return; }
    if (summary === null) { history.replaceState(null, '', urlFor()); showHome(TEAM_NOT_FOUND); return; }
    const entry = historyList(summary.history).find((e) => e.sid === sid);
    if (!entry) { go({ equipe: teamId }, { replace: true }); return; }
    const room = await store.getMeta(parsed.code).catch(() => null);
    const sameRoom = Boolean(room && room.createdAt === parsed.createdAt && room.teamId === teamId);
    if (sameRoom && room.hostUid === store.uid) { go({ animer: parsed.code }, { replace: true }); return; }

    showScreen('screen-sprint');
    $('sprint-team').textContent = `${summary.name} · ${formatDate(entry.date)}`;
    $('sprint-title').textContent = sprintName(entry);
    document.title = `${summary.name} · ${sprintName(entry)} · Météo du sprint`;
    $('sprint-back').href = urlFor({ equipe: teamId });
    $('sprint-back').onclick = (event) => { event.preventDefault(); go({ equipe: teamId }); };
    renderBulletin($('sprint-results'), { teamName: summary.name, label: sprintName(entry), counts: entry.counts, live: false });
    $('sprint-note').textContent = sameRoom
      ? 'Seul le navigateur qui a lancé cette météo peut rouvrir ses votes.'
      : 'Les votes de cette météo ont été effacés : seul le bilan est conservé.';
  }

  /* ------------------------------------------------------------ Vue participant */

  const choiceButtons = WEATHERS.map((weather) => el('button', {
    type: 'button', class: 'weather-choice', role: 'radio', 'aria-checked': 'false', 'data-value': String(weather.value),
    'aria-label': `${weather.name} : ${weather.phrase}`,
  },
  weatherIcon(weather),
  el('span', { class: 'weather-text', 'aria-hidden': 'true' },
    el('span', { class: 'weather-name', text: weather.name }),
    el('span', { class: 'weather-phrase', text: weather.phrase })),
  el('span', { class: 'weather-check', 'aria-hidden': 'true', text: '✓' })));
  $('weather-choices').replaceChildren(...choiceButtons);

  const vote = { code: null, value: null, open: true };

  function paintChoices() {
    if (!$('screen-vote').hidden) setSky(skyFor(vote.value));
    choiceButtons.forEach((button) => {
      const value = Number(button.dataset.value);
      const selected = vote.value === value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
      button.tabIndex = (vote.value ?? 5) === value ? 0 : -1;
      button.disabled = !vote.open;
    });
  }

  async function castVote(value) {
    if (!vote.open || !isValidVote(value) || !vote.code) return;
    const previous = vote.value;
    vote.value = value;
    paintChoices();
    $('vote-status').className = 'hint';
    $('vote-status').textContent = 'Enregistrement…';
    if (await store.vote(vote.code, value)) {
      $('vote-status').className = 'hint is-ok';
      $('vote-status').textContent = 'C\'est noté ! Vous pouvez changer d\'avis jusqu\'à la révélation.';
    } else {
      vote.value = previous;
      paintChoices();
      $('vote-status').className = 'hint is-error';
      $('vote-status').textContent = 'Vote refusé : les résultats ont peut-être déjà été révélés.';
    }
  }

  for (const button of choiceButtons) {
    button.addEventListener('click', () => castVote(Number(button.dataset.value)));
    button.addEventListener('keydown', (event) => {
      // Flèches : vers le bas = météo suivante dans la liste (moins bonne), vers le haut = précédente.
      const step = { ArrowDown: -1, ArrowRight: -1, ArrowUp: 1, ArrowLeft: 1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const next = Math.min(5, Math.max(1, (vote.value ?? 6) + step));
      castVote(next);
      choiceButtons.find((b) => Number(b.dataset.value) === next)?.focus();
    });
  }

  function showVote(code) {
    showScreen('screen-vote');
    Object.assign(vote, { code, value: null, open: true });
    $('vote-code').textContent = code;
    $('vote-title').textContent = '';
    $('vote-status').textContent = '';
    $('vote-results').hidden = true;
    paintChoices();
    store.openPresence(code);

    let stopResults = null;
    let status = null;
    let teamName = null;
    let lastVotes = null;
    let stopMeta = () => {};
    let stopMine = () => {};
    function cleanup() {
      stopMeta();
      stopMine();
      stopResults?.();
      store.closePresence();
    }
    teardown = cleanup;
    stopMeta = store.watchMeta(code, async (meta) => {
      if (!meta) { cleanup(); history.replaceState(null, '', urlFor()); showHome('Cette météo a été supprimée par son animateur.'); return; }
      if (teamName === null) {
        teamName = (await store.getTeamMeta(meta.teamId).catch(() => null))?.name ?? '';
      }
      const title = [teamName, meta.label].filter(Boolean).join(' — ') || 'Météo du sprint';
      $('vote-title').textContent = title;
      document.title = `${title} · Météo du sprint`;
      vote.open = meta.status !== STATUS.revealed;
      paintChoices();
      if (meta.status === status) return;
      status = meta.status;
      stopResults?.();
      stopResults = null;
      if (status === STATUS.revealed) {
        $('vote-status').className = 'hint';
        $('vote-status').textContent = vote.value ? 'Résultats révélés : votre météo est figée.' : 'Résultats révélés.';
        stopResults = store.watchResults(code, (votes) => {
          if (!votes) return;
          lastVotes = votes;
          $('vote-results').hidden = false;
          renderResults($('vote-results'), votes, vote.value);
        });
      } else {
        lastVotes = null;
        $('vote-results').hidden = true;
        if (/révélés/.test($('vote-status').textContent)) $('vote-status').textContent = '';
      }
    });
    stopMine = store.watchMine(code, (value) => {
      vote.value = value;
      paintChoices();
      if (lastVotes) renderResults($('vote-results'), lastVotes, vote.value);
    });
  }

  /* ------------------------------------------------------------ Vue animateur */

  const qrReady = loadScript('vendor/qrcode-generator-1.4.4.js?v=__VERSION__');
  const host = { code: null, joinUrl: '', teamName: '', meta: null, data: { votes: null, participants: null }, timer: null, heldAt: null, deadline: 0 };

  const autoEnabled = () => readStored(AUTO_KEY) === 'on';   // désactivée par défaut
  $('auto-reveal').checked = autoEnabled();

  function stopCountdown() {
    clearInterval(host.timer);
    host.timer = null;
    $('countdown').hidden = true;
  }

  async function doReveal() {
    stopCountdown();
    if (!host.meta || host.meta.status === STATUS.revealed) return;
    $('reveal').disabled = true;
    if (!(await store.reveal(host.code, host.meta, host.data.votes))) {
      $('live-hint').textContent = 'Révélation impossible pour l\'instant : réessayez.';
      $('reveal').disabled = false;
    }
  }

  /** Révélation automatique : décompte de 3 s quand tout le monde a voté, annulé dès que ce n'est plus vrai. */
  function checkAutoReveal() {
    const { votes, participants } = host.data;
    const ready = host.meta?.status === STATUS.open && $('auto-reveal').checked && everyoneVoted(votes, participants);
    const situation = situationKey(votes, participants);
    if (!ready || host.heldAt === situation) { stopCountdown(); return; }
    host.heldAt = null;
    if (host.timer) return;
    host.deadline = Date.now() + AUTO_REVEAL_DELAY_MS;
    const tick = () => {
      const left = Math.ceil((host.deadline - Date.now()) / 1000);
      if (left <= 0) { doReveal(); return; }
      $('countdown-text').textContent = `Tout le monde a voté : révélation dans ${left} s`;
    };
    $('countdown').hidden = false;
    tick();
    host.timer = setInterval(tick, 200);
  }

  function renderHost() {
    const { meta, data } = host;
    if (!meta) return;
    const revealed = meta.status === STATUS.revealed;
    const values = valuesOf(data.votes);
    const online = connectedUids(data.participants).length;
    bump($('count-votes'), values.length);
    $('count-votes-label').textContent = values.length > 1 ? 'votes' : 'vote';
    bump($('count-online'), online);
    $('count-online-label').textContent = online > 1 ? 'connectés' : 'connecté';
    $('reveal').hidden = revealed;
    $('reveal').disabled = !values.length;
    $('reopen').hidden = !revealed;
    $('auto-switch').hidden = revealed;
    $('live-hint').textContent = revealed
      ? 'Résultats révélés et inscrits dans l\'historique de l\'équipe. Rouvrez les votes pour un retardataire.'
      : (values.length ? `${plural(values.length, 'vote')} sur ${plural(online, 'connecté')}. Les météos restent cachées jusqu'à la révélation.` : 'En attente des premiers votes…');
    $('host-top').classList.toggle('is-revealed', revealed);
    if (!revealed) renderBallots();
    $('host-results').hidden = !revealed;
    if (revealed) { stopCountdown(); renderHostBulletin(); }
    checkAutoReveal();
  }

  /** Bulletins de vote anonymes : un nuage par participant, coché quand il a voté. */
  const CLOUD_BALLOT = 'M10 30a7 7 0 0 1-.6-14A10 10 0 0 1 28.6 13a8.5 8.5 0 0 1 .4 17z';
  function renderBallots() {
    const { items, more } = ballotsOf(host.data.votes, host.data.participants);
    const previous = new Map([...$('ballots').children].map((li) => [li.dataset.uid, li.classList.contains('is-voted')]));
    const nodes = items.map(({ uid, voted }) => {
      const li = el('li', { class: `ballot${voted ? ' is-voted' : ''}`, 'data-uid': uid });
      li.append(svg('svg', { viewBox: '0 6 40 28' },
        svg('path', { class: 'cloud-shape', d: CLOUD_BALLOT }),
        svg('path', { class: 'tick', d: 'M13 22l4.5 4.5L27 17' })));
      if (voted && previous.get(uid) === true) li.querySelector('svg').style.animation = 'none';
      return li;
    });
    if (more) nodes.push(el('li', { class: 'ballot-more', text: `+${more}` }));
    $('ballots').replaceChildren(...nodes);
  }

  /** Bulletin de révélation. */
  function renderHostBulletin() {
    renderBulletin($('host-results'), { teamName: host.teamName, label: host.meta.label, counts: countsOf(valuesOf(host.data.votes)) });
  }

  function showHost(code) {
    showScreen('screen-host');
    Object.assign(host, { code, meta: null, data: { votes: null, participants: null }, heldAt: null, teamName: '' });
    stopCountdown();
    const joinUrl = absoluteUrl({ meteo: code });
    const joinLabel = joinUrl.replace(/^https?:\/\//, '');
    host.joinUrl = joinUrl;
    $('join-code').textContent = code;
    $('join-url').textContent = joinLabel;
    $('room-copy').classList.remove('is-done');
    $('room-copy-status').textContent = '';
    $('qr').innerHTML = '';
    qrReady.then(() => {
      const qr = qrSvg(joinUrl);
      $('qr').innerHTML = qr;
      $('qr-open').hidden = !qr;
    });
    $('host-results').hidden = true;
    $('auto-reveal').checked = autoEnabled();

    let teamLoaded = false;
    let stopMeta = () => {};
    let stopData = () => {};
    function cleanup() { stopMeta(); stopData(); stopCountdown(); }
    teardown = cleanup;
    stopMeta = store.watchMeta(code, async (value) => {
      if (!value) { cleanup(); history.replaceState(null, '', urlFor()); showHome('Cette météo n\'existe plus.'); return; }
      host.meta = value;
      $('host-title').textContent = value.label || 'Météo du sprint';
      $('host-back').href = urlFor({ equipe: value.teamId });
      if (!teamLoaded) {
        teamLoaded = true;
        const teamMeta = await store.getTeamMeta(value.teamId).catch(() => null);
        host.teamName = teamMeta?.name ?? '';
        if (host.meta?.status === STATUS.revealed) renderHost();
        $('host-team').textContent = `${teamMeta?.name ?? 'Équipe'} · ${formatDate(value.createdAt)}`;
        document.title = `${teamMeta?.name ?? 'Météo'} · ${value.label || code} (animateur)`;
      }
      renderHost();
    });
    stopData = store.watchHost(code, (value) => { host.data = value; renderHost(); });
  }

  $('host-back').addEventListener('click', (event) => {
    event.preventDefault();
    if (host.meta) go({ equipe: host.meta.teamId });
  });
  $('qr-open').addEventListener('click', () => openQrDialog({ title: 'Rejoindre avec un téléphone', url: host.joinUrl, code: host.code }));
  wireCopy($('room-copy'), $('room-copy-status'), () => host.joinUrl);

  $('reveal').addEventListener('click', doReveal);
  $('reopen').addEventListener('click', async () => {
    $('reopen').disabled = true;
    // La situation actuelle ne relance pas la révélation automatique : il faut un nouveau vote ou un nouvel arrivant.
    host.heldAt = situationKey(host.data.votes, host.data.participants);
    await store.reopen(host.code);
    $('reopen').disabled = false;
  });
  $('countdown-hold').addEventListener('click', () => {
    host.heldAt = situationKey(host.data.votes, host.data.participants);
    stopCountdown();
  });
  $('auto-reveal').addEventListener('change', () => {
    writeStored(AUTO_KEY, $('auto-reveal').checked ? 'on' : 'off');
    checkAutoReveal();
  });

  route();
}
