import { readFileSync, readdirSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");

mkdirSync(dist, { recursive: true });

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.name.endsWith(".yaml")) out.push(p);
  }
  return out;
}

function loadArray(file) {
  const parsed = parse(readFileSync(file, "utf8"));
  if (parsed === null) return [];
  return Array.isArray(parsed) ? parsed : [];
}

const codes = walk(join(root, "data/codes")).flatMap(loadArray);

// Anzeigenamen der Antriebssysteme — muss mit schema/code.schema.json (system-enum)
// synchron bleiben. Reihenfolge = Anzeige-Reihenfolge auf der Landingpage.
const SYSTEM_LABELS = {
  bosch: "Bosch eBike Systems",
  "shimano-steps": "Shimano STEPS",
  yamaha: "Yamaha",
  brose: "Brose",
  specialized: "Specialized",
  bafang: "Bafang",
  fazua: "Fazua",
  mahle: "Mahle",
  giant: "Giant SyncDrive",
  panasonic: "Panasonic",
  tq: "TQ",
  pinion: "Pinion MGU",
  "dji-avinox": "DJI Avinox",
  continental: "Continental"
};
const systems = Object.keys(SYSTEM_LABELS);

// Coverage je System: enriched (mit Description) vs indexed (nur Minimal-Schema)
const coverage = {};
for (const sys of systems) coverage[sys] = { total: 0, enriched: 0, indexed: 0 };
for (const c of codes) {
  if (!coverage[c.system]) continue;
  coverage[c.system].total++;
  if (c.description?.en) coverage[c.system].enriched++;
  else coverage[c.system].indexed++;
}
const totalCodes = codes.length;
const totalEnriched = Object.values(coverage).reduce((a, b) => a + b.enriched, 0);
const totalIndexed = totalCodes - totalEnriched;
const totalSymptoms = codes.reduce((s, c) => s + (Array.isArray(c.symptoms) ? c.symptoms.length : 0), 0);
const totalCauses = codes.reduce((s, c) => s + (Array.isArray(c.common_causes) ? c.common_causes.length : 0), 0);
const totalSelfHelp = codes.reduce((s, c) => s + (Array.isArray(c.self_help) ? c.self_help.length : 0), 0);
const totalSources = codes.reduce((s, c) => s + (Array.isArray(c.sources) ? c.sources.length : 0), 0);
const totalRelated = codes.reduce((s, c) => s + (Array.isArray(c.related_codes) ? c.related_codes.length : 0), 0);

const meta = {
  generated_at: new Date().toISOString(),
  counts: {
    codes: {
      total: totalCodes,
      enriched: totalEnriched,
      indexed: totalIndexed,
      symptoms: totalSymptoms,
      causes: totalCauses,
      self_help: totalSelfHelp,
      sources: totalSources,
      related_codes: totalRelated,
      by_system: Object.fromEntries(
        systems
          .filter(s => coverage[s].total > 0)
          .map(s => [s, { total: coverage[s].total, enriched: coverage[s].enriched, indexed: coverage[s].indexed, label: SYSTEM_LABELS[s] }])
      )
    }
  }
};

function writePair(file, data) {
  writeFileSync(`${file}.json`, JSON.stringify(data, null, 2));
  writeFileSync(`${file}.min.json`, JSON.stringify(data));
}

writePair(join(dist, "codes"), codes);
writePair(join(dist, "all"), { codes });
writeFileSync(join(dist, "meta.json"), JSON.stringify(meta, null, 2));

const coverageRows = systems
  .filter(s => coverage[s].total > 0)
  .map(s => {
    const e = coverage[s].enriched;
    const t = coverage[s].total;
    const pct = t === 0 ? 0 : Math.round((e / t) * 100);
    return `      <tr><td><code>${s}</code> <span class="count">${SYSTEM_LABELS[s] || ""}</span></td><td class="num">${t.toLocaleString("en-US")}</td><td class="bar"><div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div><span class="bar-pct">${pct} %</span></div></td></tr>`;
  })
  .join("\n");

const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>pedelex — e-bike error codes</title>
  <meta name="description" content="Open, machine-readable database of ${totalCodes.toLocaleString("en-US")} e-bike drive system error codes (Bosch, Shimano STEPS, Yamaha, …). CC0 data, MIT tooling.">
  <meta property="og:title" content="pedelex — e-bike error codes">
  <meta property="og:description" content="Open, machine-readable database of ${totalCodes.toLocaleString("en-US")} e-bike error codes with causes, self-help steps and sources. CC0.">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://foerbsnavi.github.io/pedelex/">
  <meta name="twitter:card" content="summary">
  <link rel="canonical" href="https://foerbsnavi.github.io/pedelex/">
  <style>
    :root { color-scheme: light dark; --fg: #111; --muted: #666; --bg: #fff; --accent: #0f9d58; --border: #d0d7de; --code-bg: #f6f8fa; --card: #f6f8fa; --pill-bg: #dcfce7; --pill-fg: #15803d; --warn-bg: #fff8c5; --warn-fg: #7d4e00; }
    @media (prefers-color-scheme: dark) {
      :root { --fg: #e6edf3; --muted: #8b949e; --bg: #0d1117; --accent: #4ade80; --border: #30363d; --code-bg: #161b22; --card: #161b22; --pill-bg: #16653433; --pill-fg: #4ade80; --warn-bg: #4d350033; --warn-fg: #d4a72c; }
    }
    * { box-sizing: border-box; }
    body { font: 16px/1.6 system-ui, -apple-system, "Segoe UI", sans-serif; color: var(--fg); background: var(--bg); margin: 0; padding: 2rem 1.5rem; }
    main { max-width: 760px; margin: 0 auto; }
    h1 { font-size: 2rem; margin: 0 0 .25rem; letter-spacing: -0.02em; }
    h2 { font-size: 1.1rem; margin: 2rem 0 .75rem; padding-bottom: .25rem; border-bottom: 1px solid var(--border); }
    p.tagline { color: var(--muted); margin: 0 0 1.5rem; }
    code { font: 0.92em ui-monospace, "SF Mono", Consolas, monospace; background: var(--code-bg); padding: 0.1em 0.35em; border-radius: 4px; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { padding: .35rem 0; display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; border-bottom: 1px solid var(--border); }
    li:last-child { border-bottom: none; }
    .count { color: var(--muted); font: 0.85em ui-monospace, "SF Mono", Consolas, monospace; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem 1.5rem; margin: 1.5rem 0 0; padding: 1.25rem 1.5rem; background: var(--card); border: 1px solid var(--border); border-radius: 10px; }
    .stat { color: var(--muted); font-size: .82rem; text-transform: uppercase; letter-spacing: .04em; }
    .stat strong { color: var(--fg); font-size: 1.7em; font-weight: 700; display: block; line-height: 1.05; letter-spacing: -.02em; font-variant-numeric: tabular-nums; margin-bottom: .15rem; text-transform: none; }
    .stat strong.accent { color: var(--accent); }
    .demo-cta { display: flex; align-items: center; gap: 1rem; padding: 1.25rem 1.5rem; margin: 1.5rem 0 0; background: linear-gradient(135deg, var(--pill-bg), transparent); border: 1px solid var(--accent); border-radius: 10px; }
    .demo-cta-text { flex: 1; }
    .demo-cta strong { display: block; font-size: 1rem; color: var(--fg); margin-bottom: .15rem; }
    .demo-cta span { color: var(--muted); font-size: .9rem; }
    .demo-cta a.btn { background: var(--accent); color: white; padding: .6rem 1.1rem; border-radius: 8px; font-weight: 600; white-space: nowrap; text-decoration: none; }
    .demo-cta a.btn:hover { opacity: .9; text-decoration: none; }
    footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.92em; }
    footer a { color: var(--muted); text-decoration: underline; }

    .search { margin: 1.5rem 0 0; }
    .search input { width: 100%; padding: .75rem 1rem; font: 1rem ui-monospace, "SF Mono", Consolas, monospace; color: var(--fg); background: var(--bg); border: 1px solid var(--border); border-radius: 8px; outline: none; transition: border-color .12s; }
    .search input:focus { border-color: var(--accent); }
    .search input:disabled { opacity: .5; cursor: progress; }

    #result { margin-top: 1rem; }
    #result:empty { display: none; }
    .card { background: var(--card); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem 1.5rem; }
    .card-head { display: flex; align-items: baseline; gap: .75rem; flex-wrap: wrap; margin-bottom: .25rem; }
    .card-code { font: 600 1.4rem ui-monospace, "SF Mono", Consolas, monospace; letter-spacing: -0.01em; }
    .card-cat { font-size: .8rem; color: var(--muted); text-transform: uppercase; letter-spacing: .05em; }
    .card-title { font-size: 1.05rem; font-weight: 500; margin: 0 0 .25rem; }
    .card-title-de { font-size: .98rem; color: var(--muted); margin: 0 0 1rem; }
    .card h3 { font-size: .82rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); margin: 1.25rem 0 .4rem; font-weight: 600; }
    .card .desc { margin: 0 0 .5rem; }
    .card .desc-de { color: var(--muted); margin: 0; }
    .i18n-secondary { color: var(--muted); }
    .causes { padding: 0; margin: 0; }
    .causes li { display: grid; grid-template-columns: auto 1fr; gap: .75rem; align-items: baseline; padding: .25rem 0; border: none; }
    .lik { font-size: .72rem; text-transform: uppercase; letter-spacing: .05em; padding: .15rem .5rem; border-radius: 999px; font-weight: 600; min-width: 4.2rem; text-align: center; }
    .lik-high { background: var(--warn-bg); color: var(--warn-fg); }
    .lik-medium { background: var(--pill-bg); color: var(--pill-fg); }
    .lik-low { background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); }
    .steps { padding-left: 1.2rem; margin: 0; }
    .steps li { display: list-item; border: none; padding: .2rem 0; }
    .repair-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: .75rem 1.5rem; }
    .repair-grid div { display: flex; flex-direction: column; }
    .repair-grid .label { font-size: .75rem; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; }
    .repair-grid .value { font-weight: 500; }
    .sources { padding: 0; margin: 0; }
    .sources li { display: block; padding: .15rem 0; border: none; word-break: break-all; }
    .matches { padding: 0; margin: 0; }
    .matches li { padding: .5rem 0; display: grid; grid-template-columns: auto auto 1fr; gap: .75rem; cursor: pointer; align-items: baseline; }
    .matches li:hover { color: var(--accent); }
    .matches code { background: transparent; font-weight: 600; }
    .matches .kind { font-size: .7rem; padding: .1rem .45rem; border-radius: 999px; background: var(--code-bg); color: var(--muted); border: 1px solid var(--border); text-transform: uppercase; letter-spacing: .05em; }
    .empty { color: var(--muted); padding: 1rem; text-align: center; }
    .hint { color: var(--muted); font-size: .85rem; margin: .5rem 0 0; }
    .hint code { font-size: .9em; }
    .ex { font-size: .85rem; color: var(--muted); margin: .5rem 0 0; }
    .ex code { font-size: .9em; cursor: pointer; transition: background-color .12s, color .12s; }
    .ex code:hover { background: var(--pill-bg); color: var(--pill-fg); }

    table.coverage { width: 100%; border-collapse: collapse; font-size: .92rem; }
    table.coverage td, table.coverage th { padding: .35rem .25rem; text-align: left; border-bottom: 1px solid var(--border); }
    table.coverage th { font-size: .75rem; text-transform: uppercase; letter-spacing: .05em; color: var(--muted); font-weight: 600; }
    table.coverage th.num, table.coverage td.num { text-align: right; font-variant-numeric: tabular-nums; font-family: ui-monospace, "SF Mono", Consolas, monospace; font-size: .9em; }
    table.coverage th.num { font-family: inherit; font-size: .75rem; }
    table.coverage th.bar-h { padding-left: .75rem; }
    table.coverage td.bar { width: 40%; padding-left: .75rem; }
    .bar-row { display: flex; align-items: center; gap: .6rem; }
    .bar-track { flex: 1; height: 6px; background: var(--code-bg); border-radius: 3px; overflow: hidden; border: 1px solid var(--border); }
    .bar-fill { height: 100%; background: var(--accent); transition: width .3s; }
    .bar-pct { font-size: .78rem; color: var(--muted); font-variant-numeric: tabular-nums; min-width: 2.5rem; text-align: right; }
    table.coverage tfoot td { font-weight: 600; padding-top: .55rem; border-top: 2px solid var(--border); border-bottom: none; }
  </style>
</head>
<body>
<main>
  <h1>pedelex</h1>
  <p class="tagline">The open database of e-bike drive system error codes.</p>

  <div class="stats" aria-label="Database statistics">
    <div class="stat"><strong class="accent">${totalCodes.toLocaleString("en-US")}</strong>codes</div>
    <div class="stat"><strong>${Object.keys(meta.counts.codes.by_system).length}</strong>systems</div>
    <div class="stat"><strong>${totalCauses.toLocaleString("en-US")}</strong>causes</div>
    <div class="stat"><strong>${totalSymptoms.toLocaleString("en-US")}</strong>symptoms</div>
    <div class="stat"><strong>${totalSelfHelp.toLocaleString("en-US")}</strong>self-help steps</div>
    <div class="stat"><strong>${totalSources.toLocaleString("en-US")}</strong>sources</div>
  </div>

  <div class="demo-cta">
    <div class="demo-cta-text">
      <strong>Need a friendly UI?</strong>
      <span>Search, filter and read every code in DE/EN at ebike.signalwelt.de</span>
    </div>
    <a class="btn" href="https://ebike.signalwelt.de/" target="_blank" rel="noopener">Open search app →</a>
  </div>

  <h2>Quick search</h2>
  <p class="hint">Look up any code or keyword right here — the full database is loaded into your browser. Prefix with a system to disambiguate: <code>bosch:503</code>.</p>
  <div class="search">
    <input id="q" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Loading database…" disabled>
  </div>
  <p class="ex">Try: <code data-q="503">503</code> · <code data-q="bosch:530">bosch:530</code> · <code data-q="W013">W013</code> · <code data-q="speed sensor">speed sensor</code> · <code data-q="Akku">Akku</code></p>
  <div id="result"></div>

  <h2>Coverage</h2>
  <p class="hint">Every enriched code carries the full schema: bilingual title and description, affected components, common causes with likelihood, roadside self-help steps, assist behavior, repair difficulty, and at least one public source.</p>
  <table class="coverage">
    <thead><tr><th>System</th><th class="num">Codes</th><th class="bar-h">Coverage</th></tr></thead>
    <tbody>
${coverageRows}
    </tbody>
    <tfoot><tr><td><strong>All systems</strong></td><td class="num">${totalCodes.toLocaleString("en-US")}</td><td class="bar"><div class="bar-row"><div class="bar-track"><div class="bar-fill" style="width:${totalCodes ? Math.round((totalEnriched / totalCodes) * 100) : 0}%"></div></div><span class="bar-pct">${totalCodes ? Math.round((totalEnriched / totalCodes) * 100) : 0} %</span></div></td></tr></tfoot>
  </table>

  <h2>Use the data</h2>
  <p class="hint">All endpoints are static JSON over GitHub Pages. No auth, no rate limit. Each has a minified <code>.min.json</code> sibling for production.</p>
  <ul>
    <li><a href="codes.json"><code>codes.json</code></a> <span class="count">${codes.length.toLocaleString("en-US")} codes, flat array</span></li>
    <li><a href="all.json"><code>all.json</code></a> <span class="count">wrapper object</span></li>
    <li><a href="meta.json"><code>meta.json</code></a> <span class="count">counts &amp; build time</span></li>
  </ul>

  <footer>
    <p>Source on <a href="https://github.com/foerbsnavi/pedelex">GitHub</a> · <a href="https://github.com/foerbsnavi/pedelex/blob/main/CONTRIBUTING.md">contributing</a> · <a href="https://github.com/foerbsnavi/pedelex/issues">report a wrong description</a> · <a href="https://ebike.signalwelt.de/">live search</a></p>
    <p>Error code identifiers and technical facts are not copyrightable; all descriptions are independently authored with public sources on each code. pedelex is an independent project and is not affiliated with or endorsed by Bosch, Shimano, Yamaha or any other manufacturer named in the data.</p>
    <p>Data <a href="https://github.com/foerbsnavi/pedelex/blob/main/LICENSE-DATA">CC0-1.0</a> · code <a href="https://github.com/foerbsnavi/pedelex/blob/main/LICENSE-CODE">MIT</a></p>
  </footer>
</main>

<script>
(function () {
  const input = document.getElementById('q');
  const result = document.getElementById('result');
  let db = null;

  const SYSTEM_LABELS = ${JSON.stringify(SYSTEM_LABELS)};

  fetch('codes.min.json')
    .then(r => r.json())
    .then(d => {
      db = (Array.isArray(d) ? d : []).map(c => Object.assign({ _key: c.system + ':' + c.code }, c));
      input.disabled = false;
      input.placeholder = 'Search by code (503, W013), system:code (bosch:503) or keyword…';
      input.focus();
      handleHash();
    })
    .catch(() => { input.placeholder = 'Failed to load database.'; });

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
  }

  function fmtRange(arr, suffix) {
    if (!Array.isArray(arr) || arr.length !== 2) return '';
    return arr[0] + '–' + arr[1] + ' ' + suffix;
  }

  function renderSources(arr) {
    if (!Array.isArray(arr) || !arr.length) return '';
    return '<h3>Sources</h3><ul class="sources">' +
      arr.map(s => /^https?:\\/\\//.test(s)
        ? '<li><a href="' + esc(s) + '" target="_blank" rel="noopener">' + esc(s) + '</a></li>'
        : '<li>' + esc(s) + '</li>'
      ).join('') +
      '</ul>';
  }

  function renderList(title, arr, ordered) {
    if (!Array.isArray(arr) || !arr.length) return '';
    const tag = ordered ? 'ol' : 'ul';
    return '<h3>' + esc(title) + '</h3><' + tag + ' class="steps">' +
      arr.map(x => '<li>' + esc(x.en || '') + (x.de ? ' <span class="i18n-secondary">— ' + esc(x.de) + '</span>' : '') + '</li>').join('') +
      '</' + tag + '>';
  }

  function renderCard(c) {
    const sysLabel = SYSTEM_LABELS[c.system] || c.system;
    const titleEn = c.title?.en ? '<p class="card-title">' + esc(c.title.en) + '</p>' : '';
    const titleDe = c.title?.de ? '<p class="card-title-de">' + esc(c.title.de) + '</p>' : '';
    const descEn = c.description?.en ? '<p class="desc">' + esc(c.description.en) + '</p>' : '';
    const descDe = c.description?.de ? '<p class="desc-de">' + esc(c.description.de) + '</p>' : '';

    let causes = '';
    if (Array.isArray(c.common_causes) && c.common_causes.length) {
      causes = '<h3>Common causes</h3><ul class="causes">' +
        c.common_causes.map(x => {
          const lab = x.label?.en || x.id;
          const labDe = x.label?.de ? ' <span class="i18n-secondary">— ' + esc(x.label.de) + '</span>' : '';
          return '<li><span class="lik lik-' + esc(x.likelihood) + '">' + esc(x.likelihood) + '</span><span>' + esc(lab) + labDe + '</span></li>';
        }).join('') +
        '</ul>';
    }

    let repair = '';
    if (c.repair || c.behavior) {
      const r = c.repair || {};
      const fields = [];
      if (c.behavior?.assist) fields.push('<div><span class="label">Assist</span><span class="value">' + esc(c.behavior.assist) + '</span></div>');
      if (r.difficulty) fields.push('<div><span class="label">Difficulty</span><span class="value">' + esc(r.difficulty) + '</span></div>');
      if (typeof r.diy_possible === 'boolean') fields.push('<div><span class="label">DIY</span><span class="value">' + (r.diy_possible ? 'possible' : 'shop recommended') + '</span></div>');
      if (typeof r.dealer_tool_required === 'boolean') fields.push('<div><span class="label">Dealer tool</span><span class="value">' + (r.dealer_tool_required ? 'required' : 'not required') + '</span></div>');
      const cost = fmtRange(r.estimated_cost_eur, '€');
      if (cost) fields.push('<div><span class="label">Cost</span><span class="value">' + cost + '</span></div>');
      const hours = fmtRange(r.estimated_hours, 'h');
      if (hours) fields.push('<div><span class="label">Time</span><span class="value">' + hours + '</span></div>');
      if (fields.length) repair = '<h3>Repair estimate</h3><div class="repair-grid">' + fields.join('') + '</div>';
    }

    return '<div class="card">' +
      '<div class="card-head"><span class="card-code">' + esc(c.code) + '</span><span class="card-cat">' + esc(sysLabel) + (c.category ? ' · ' + esc(c.category) : '') + '</span></div>' +
      titleEn + titleDe + descEn + descDe +
      renderList('Self-help', c.self_help, true) +
      causes + repair + renderSources(c.sources) +
      '</div>';
  }

  function renderMatchList(items) {
    return '<ul class="matches">' +
      items.map(item =>
        '<li data-key="' + esc(item._key) + '"><span class="kind">' + esc(SYSTEM_LABELS[item.system] || item.system) + '</span><code>' + esc(item.code) + '</code><span>' + esc(item.title?.en || '') + '</span></li>'
      ).join('') +
      '</ul>';
  }

  function search(q) {
    if (!db) return;
    q = q.trim();
    if (!q) { result.innerHTML = ''; history.replaceState(null, '', location.pathname); return; }

    const upper = q.toUpperCase();

    // Exakter Composite-Key "system:CODE"
    const exact = db.find(item => item._key.toUpperCase() === upper);
    if (exact) {
      result.innerHTML = renderCard(exact);
      history.replaceState(null, '', '#' + exact._key);
      return;
    }

    // Exakter Code über alle Systeme
    const codeMatches = db.filter(item => item.code.toUpperCase() === upper);
    if (codeMatches.length === 1) {
      result.innerHTML = renderCard(codeMatches[0]);
      history.replaceState(null, '', '#' + codeMatches[0]._key);
      return;
    }
    if (codeMatches.length > 1) {
      result.innerHTML = renderMatchList(codeMatches);
      return;
    }

    // Präfix- und Textsuche
    const prefix = db.filter(item => item.code.toUpperCase().startsWith(upper));
    let text = [];
    if (q.length >= 3) {
      for (const item of db) {
        if (prefix.includes(item)) continue;
        const blob = [
          item.system, SYSTEM_LABELS[item.system] || '',
          item.title?.en || '', item.title?.de || '',
          item.description?.en || '', item.description?.de || ''
        ].join(' ').toUpperCase();
        if (blob.includes(upper)) text.push(item);
      }
    }
    const all = [...prefix, ...text];
    if (!all.length) {
      result.innerHTML = '<p class="empty">No code or title matches "' + esc(q) + '".</p>';
      return;
    }
    if (all.length === 1) {
      result.innerHTML = renderCard(all[0]);
      history.replaceState(null, '', '#' + all[0]._key);
      return;
    }
    result.innerHTML = renderMatchList(all.slice(0, 30));
  }

  // 150ms-Debounce wie in der Haupt-App — hält die Suche auch bei
  // wachsender Codemenge (Wellen-Ausbau) flüssig.
  let debounce = null;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => search(input.value), 150);
  });

  result.addEventListener('click', e => {
    const li = e.target.closest('li[data-key]');
    if (!li) return;
    input.value = li.dataset.key;
    search(input.value);
  });

  document.querySelectorAll('.ex code[data-q]').forEach(el => {
    el.addEventListener('click', () => {
      input.value = el.dataset.q;
      input.focus();
      search(input.value);
    });
  });

  function handleHash() {
    const h = decodeURIComponent(location.hash.replace('#', ''));
    if (h) { input.value = h; search(h); }
  }
  window.addEventListener('hashchange', handleHash);
})();
</script>
</body>
</html>
`;

writeFileSync(join(dist, "index.html"), indexHtml);

console.log(JSON.stringify(meta.counts, null, 2));
