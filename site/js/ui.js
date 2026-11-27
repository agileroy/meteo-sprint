// Interface de la météo du sprint : accueil, page d'équipe (liens, lancement, évolution), vue participant
// et vue animateur (révélation automatique). Aucune règle métier ici : elles sont dans meteo-core.js,
// et les accès à la base dans meteo-store.js.

import {
  WEATHERS, STATUS, AUTO_REVEAL_DELAY_MS, FEW_VOTES, CHART_SPRINTS, NAME_MAX, normalizeCode, isValidCode, isValidTeamId,
  isValidKey, isValidVote, weatherFor, valuesOf, countsOf, totalOf, weatherIndex, formatIndex, distribution, topWeathers,
  joinNames, connectedUids, everyoneVoted, situationKey, historyList, sprintName, nextLabel, parseTeams, touchTeam,
  removeTeam, plural, formatDate, formatDay, validateName,
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
function renderChart(box, tip, entries, { onSelect } = {}) {
  const width = Math.max(300, Math.round(box.clientWidth || 640));
  const narrow = width < 520;
  const height = narrow ? 240 : 300;
  const m = { top: 22, right: 8, bottom: 30, left: 26 };
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
    group.append(svg('rect', { class: 'hit', x: cx - slot / 2 + 1, y: m.top - 16, width: slot - 2, height: plotH + 22, rx: 8 }));
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
    if (showValues) {
      const value = svg('text', { class: 'index-text', x: cx, y: top - 7, 'text-anchor': 'middle' });
      value.textContent = formatIndex(entry.index);
      group.append(value);
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
    );
    tip.hidden = false;
    const left = Math.min(Math.max((x / width) * 100, 18), 82);
    tip.style.left = `${left}%`;
    tip.style.top = `${Math.max(0, points[i][1] + 8)}px`;
    onSelect?.(i);
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
    group.addEventListener('click', () => show(i));
  }
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
      const name = el('span', { class: 'item-name', text: '…' });
      const meta = el('span', { class: 'item-meta', text: ' ' });
      const open = el('a', { class: 'button button-ghost button-small', href: urlFor({ equipe: entry.id }), text: 'Ouvrir' });
      open.addEventListener('click', (event) => { event.preventDefault(); go({ equipe: entry.id }); });
      const item = el('li', { class: 'list-item' }, el('div', { class: 'item-main' }, name, meta), el('div', { class: 'item-actions' }, open));
      const drop = () => { forgetTeam(entry.id); item.remove(); $('teams-panel').hidden = !readTeams().length; };
      store.teamSummary(entry.id).then((summary) => {
        if (summary === undefined) { name.textContent = 'Équipe'; meta.textContent = 'Indisponible pour l\'instant'; return; }
        if (summary === null || !summary.isOwner) { drop(); return; }
        const sprints = historyList(summary.history);
        name.textContent = summary.name;
        meta.textContent = sprints.length
          ? `${plural(sprints.length, 'sprint')} · dernière météo le ${formatDay(sprints.at(-1).date)}`
          : 'Aucune météo';
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

  const team = { id: null, key: null, meta: null, entries: [], showAll: false, resize: null };

  async function showTeam(teamId, keyFromUrl) {
    showScreen('screen-team');
    Object.assign(team, { id: teamId, key: null, meta: null, entries: [], showAll: false });
    $('team-name').textContent = '';
    $('team-error-msg').hidden = true;
    $('team-owner').hidden = true;
    $('team-owner-actions').hidden = true;
    $('key-callout').hidden = !(history.state?.justCreated);
    $('key-row').hidden = !(history.state?.justCreated);
    $('key-toggle').setAttribute('aria-expanded', String(!!history.state?.justCreated));
    $('key-toggle').textContent = history.state?.justCreated ? 'Masquer' : 'Afficher';
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
    $('public-link').value = absoluteUrl({ equipe: teamId });
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

  function visibleEntries() {
    return team.showAll ? team.entries : team.entries.slice(-CHART_SPRINTS);
  }

  let lastChartWidth = 0;
  function renderChartOnly(force = false) {
    if (!team.entries.length || $('chart-wrap').hidden) return;
    const width = $('chart').clientWidth;
    if (!force && Math.abs(width - lastChartWidth) < 8) return;
    lastChartWidth = width;
    renderChart($('chart'), $('chart-tip'), visibleEntries());
  }

  function renderHistory() {
    const entries = team.entries;
    const owner = Boolean(team.key);
    $('history-empty').hidden = entries.length > 0;
    $('chart-wrap').hidden = !entries.length;
    $('table-wrap').hidden = !entries.length;
    $('history-all').hidden = entries.length <= CHART_SPRINTS;
    $('history-all').textContent = team.showAll ? `${CHART_SPRINTS} derniers sprints` : 'Tout afficher';
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
      remove?.addEventListener('click', async () => {
        if (!(await confirmAction('Retirer ce sprint ?', `« ${sprintName(entry)} » sera retiré de l'historique de l'équipe.`, 'Retirer'))) return;
        if (!(await store.removeHistory(team.id, entry.sid))) {
          $('team-error-msg').textContent = 'Retrait impossible pour l\'instant : réessayez.';
          $('team-error-msg').hidden = false;
        }
      });
      return el('tr', {},
        el('th', { scope: 'row', text: sprintName(entry) }),
        el('td', { class: 'col-date', text: formatDay(entry.date) }),
        WEATHERS.map((w) => el('td', { class: entry.counts[w.key] ? null : 'zero', text: String(entry.counts[w.key]) })),
        el('td', { text: String(entry.total) }),
        el('td', { class: 'col-index', text: formatIndex(entry.index) }),
        owner ? el('td', {}, remove) : null,
      );
    });
    $('history-table').replaceChildren(
      el('caption', { class: 'visually-hidden', text: 'Historique des météos, du plus récent au plus ancien' }),
      el('thead', {}, head), el('tbody', {}, rows));
  }

  $('history-all').addEventListener('click', () => { team.showAll = !team.showAll; renderHistory(); });

  $('key-toggle').addEventListener('click', () => {
    const open = $('key-row').hidden;
    $('key-row').hidden = !open;
    $('key-toggle').setAttribute('aria-expanded', String(open));
    $('key-toggle').textContent = open ? 'Masquer' : 'Afficher';
  });
  for (const button of document.querySelectorAll('[data-copy]')) {
    button.addEventListener('click', async () => {
      const input = $(button.dataset.copy);
      const copied = await copyText(input.value);
      if (!copied) { input.select(); }
      $('copy-status').textContent = copied ? 'Lien copié.' : 'Copie impossible : sélectionnez le lien et copiez-le.';
    });
  }

  $('launch-form').addEventListener('submit', async (event) => {
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
  const host = { code: null, joinUrl: '', meta: null, data: { votes: null, participants: null }, timer: null, heldAt: null, deadline: 0 };

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
    document.querySelector('.host-grid').classList.toggle('is-revealed', revealed);
    $('host-results').hidden = !revealed;
    if (revealed) { stopCountdown(); renderResults($('host-results'), data.votes); }
    checkAutoReveal();
  }

  function showHost(code) {
    showScreen('screen-host');
    Object.assign(host, { code, meta: null, data: { votes: null, participants: null }, heldAt: null });
    stopCountdown();
    const joinUrl = absoluteUrl({ meteo: code });
    const joinLabel = joinUrl.replace(/^https?:\/\//, '');
    host.joinUrl = joinUrl;
    $('join-code').textContent = code;
    $('qr-dialog-code').textContent = code;
    $('join-url').textContent = joinLabel;
    $('qr-dialog-url').textContent = joinLabel;
    $('room-copy').classList.remove('is-done');
    $('room-copy-status').textContent = '';
    $('qr').innerHTML = '';
    $('qr-large').innerHTML = '';
    qrReady.then(() => {
      const qr = qrSvg(joinUrl);
      $('qr').innerHTML = qr;
      $('qr-large').innerHTML = qr;
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
  const qrDialog = $('qr-dialog');
  $('qr-open').addEventListener('click', () => qrDialog.showModal());
  $('qr-close').addEventListener('click', () => qrDialog.close());
  qrDialog.addEventListener('click', (event) => { if (event.target === qrDialog) qrDialog.close(); });

  // Copier le lien en un clic, depuis la carte du QR code.
  let copyTimer;
  $('room-copy').addEventListener('click', async () => {
    const copied = await copyText(host.joinUrl);
    $('room-copy').classList.toggle('is-done', copied);
    $('room-copy-status').className = copied ? 'copy-status' : 'copy-status is-error';
    $('room-copy-status').textContent = copied ? 'Lien copié' : `Copie impossible : ${host.joinUrl}`;
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      $('room-copy').classList.remove('is-done');
      $('room-copy-status').textContent = '';
    }, 2500);
  });

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
