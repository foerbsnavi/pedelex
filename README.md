# pedelex

[![validate](https://github.com/foerbsnavi/pedelex/actions/workflows/validate.yml/badge.svg)](https://github.com/foerbsnavi/pedelex/actions/workflows/validate.yml)
[![data: CC0-1.0](https://img.shields.io/badge/data-CC0--1.0-blue.svg)](LICENSE-DATA)
[![code: MIT](https://img.shields.io/badge/code-MIT-green.svg)](LICENSE-CODE)

**The open, machine-readable database of e-bike drive system error codes — Bosch, Shimano STEPS, Yamaha, Brose, Bafang, Fazua, Mahle and more. With bilingual descriptions, common causes, roadside self-help steps, and sources.**

If your e-bike display shows a cryptic code like `503`, `W013` or `E010`, this is a single source you can read, fork, and embed without paywalls or per-API fees.

> Sister project of [obdex](https://github.com/foerbsnavi/obdex) (OBD-II codes for cars) — same pipeline, same licensing, same quality rules.

## 🔍 Try it now

| | |
|---|---|
| 🚲 **Live search app** | **<https://ebike.signalwelt.de/>** — full DE/EN UI, PWA, deep-linkable, PDF export. Try `503`, `W013`, `Akku`. |
| 📊 **Data browser** | <https://foerbsnavi.github.io/pedelex/> — search the raw database, download JSON bundles. |

## What you get

- Error and warning codes of the major e-bike drive systems in one repository, one YAML file per system.
- **Bilingual (English + German)** title, description, affected components, common causes with likelihood, symptoms, **ordered roadside self-help steps**, assist behavior while the code is active, repair difficulty + dealer-tool flag + cost estimate, related codes, and at least one public source per code.
- **CC0 data, MIT tooling.** Use it in your app, workshop software, training material — no attribution required, no licence fee.
- **Static JSON over CDN.** No API key, no rate limit, no account.

Unlike OBD-II, e-bike codes are manufacturer-specific: the identity of an entry is always **system + code** (`bosch:503`, `shimano-steps:W013`).

## Quick start

```js
const r = await fetch("https://foerbsnavi.github.io/pedelex/codes.min.json");
const codes = await r.json();
const e503 = codes.find(c => c.system === "bosch" && c.code === "503");
console.log(e503.title.en);  // "Speed sensor fault"
```

## Endpoints

Direct JSON over GitHub Pages — no auth, no rate limit. Each file also exists as a minified `.min.json` variant for production.

```
https://foerbsnavi.github.io/pedelex/codes.json   # flat array of all codes
https://foerbsnavi.github.io/pedelex/all.json     # wrapper object { codes: [...] }
https://foerbsnavi.github.io/pedelex/meta.json    # counts by system, build time
```

## What an entry looks like

```yaml
- system: bosch
  code: "503"
  category: sensor
  title:
    en: Speed sensor fault
    de: Fehler des Geschwindigkeitssensors
  description:
    en: The drive unit is not receiving a valid signal from the speed sensor …
    de: Die Antriebseinheit erhält kein gültiges Signal vom Geschwindigkeitssensor …
  applies_to: ["Gen2-Gen4 (BES2/BES3)"]
  affected_components: [speed_sensor, spoke_magnet]
  common_causes:
    - id: magnet_misaligned
      likelihood: high
      label: { en: Spoke magnet shifted, de: Speichenmagnet verrutscht }
  symptoms:
    - { en: Motor assistance cuts out, de: Motorunterstützung schaltet ab }
  self_help:
    - { en: Check the spoke magnet position, de: Position des Speichenmagneten prüfen }
    - { en: Restart the system, de: System neu starten }
  behavior:
    assist: off
  repair:
    difficulty: easy
    diy_possible: true
    dealer_tool_required: false
  related_codes: ["bosch:504"]
  sources:
    - https://help.bosch-ebike.com/v1/error_code?externalID=503&languageId=en
```

## Develop locally

```bash
git clone https://github.com/foerbsnavi/pedelex.git
cd pedelex
npm install
npm run check     # validate + duplicates + relations
npm run build     # generate dist/
```

Requires Node.js ≥ 20.

## Structure

```
data/
└── codes/
    └── <system>.yaml      one file per drive system (bosch.yaml, shimano-steps.yaml, …)

schema/                    JSON Schema (Draft 2020-12)
tools/                     Node.js validation + build scripts
RECHERCHE.md               research plan: sources per manufacturer, wave roadmap
```

## Coverage

Live counts are in [`meta.json`](https://foerbsnavi.github.io/pedelex/meta.json) and visualised on the [landing page](https://foerbsnavi.github.io/pedelex/). The database is built in research waves per manufacturer — see [RECHERCHE.md](RECHERCHE.md) for the roadmap.

## Maintainer notes

GitHub Pages must be configured with **Source: GitHub Actions** in the repository settings before the first push to `main` for the release workflow to succeed.

## Schema

- [`schema/code.schema.json`](schema/code.schema.json)

JSON Schema Draft 2020-12. CI rejects any pull request that fails validation or introduces duplicate system:code pairs.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Short version: one PR per code or coherent batch, sources required, schema-validated automatically.

## License

- Data: [CC0-1.0](LICENSE-DATA) — public domain dedication.
- Code: [MIT](LICENSE-CODE).

Error code identifiers (`503`, `W013`, …) and bit-level technical facts are not copyrightable. All descriptions in this repository are independently authored — contributors must write their own descriptions in their own words, never verbatim text from manuals or service documents.

**Trademark note:** Bosch, Shimano, STEPS, Yamaha, Brose, Bafang, Fazua, Mahle, Specialized, Giant, Panasonic, TQ, Pinion, DJI and other names are trademarks of their respective owners, used here nominatively to identify the systems the data describes. pedelex is an independent project and is not affiliated with or endorsed by any of these manufacturers.

## Disclaimer

The data in this repository is provided **as is**, without warranty of any kind. Error codes describe symptoms, not definitive faults — incorrect interpretation can lead to wrong repairs and damage. Never open e-bike batteries or drive units yourself; always cross-check with the manufacturer's documentation and a qualified dealer before acting on any information from this database. Contributors and maintainers accept no liability for decisions made based on this data.
