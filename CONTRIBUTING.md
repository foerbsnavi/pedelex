# Contributing to pedelex

Thanks for helping. A few rules keep the data trustworthy.

## Scope

pedelex covers **error and warning codes of e-bike drive systems** as shown to the rider on the display or app — Bosch, Shimano STEPS, Yamaha, Brose, Bafang, Fazua, Mahle, Specialized, Giant, Panasonic, TQ, Pinion, DJI Avinox, Continental. Internal service-tool-only fault memory entries are welcome too if publicly documented. Codes of other vehicle types (cars, scooters) are out of scope — for cars see [obdex](https://github.com/foerbsnavi/obdex).

## License of contributions

By submitting a pull request you agree that your contribution is dedicated to the public domain under [CC0-1.0](LICENSE-DATA) for any data files (YAML/JSON in `data/`, `schema/`, generated output) and released under the [MIT License](LICENSE-CODE) for any code (anything in `tools/` or build configuration). If you cannot make that dedication — for example because you are reproducing copyrighted text — please open an issue first instead of a PR.

## Ground rules

1. **Sources required.** Every new code or correction must reference at least one source: official manufacturer help page or manual, dealer documentation that is publicly accessible, or a reproducible diagnostic procedure. Forum posts alone are not enough — they may be cited additionally, never as sole source.
2. **No copyrighted text.** Do not paste manual or help-center descriptions verbatim. Write your own description in your own words. Identifiers and technical facts are not copyrightable; prose is.
3. **Schema-valid.** PRs are validated automatically. Run `npm run check` locally before pushing — this runs schema validation, duplicate detection and relation checks.
4. **system + code is the identity.** The same code string may exist in several systems; `related_codes` references are always fully qualified (`bosch:504`).

## Adding a code

1. Find the right file by system: `data/codes/<system>.yaml` (e.g. `bosch.yaml`).
2. Insert the code in ascending order (numeric where possible, otherwise lexicographic).
3. For **enriched** entries, fill: `system`, `code`, `category`, `title.en+de`, `description.en+de`, `common_causes` (where known), `symptoms`, `self_help`, `behavior.assist`, `repair`, `sources`.
4. For **stub** entries, fill at minimum: `system`, `code`, `category`, `title.en`, `sources`.
5. Run `npm run check` locally, open PR.

## Field guidance

- **self_help** — ordered steps a layperson can safely do at the roadside (restart, reseat battery, check spoke magnet). Never include steps that require opening batteries or drive units.
- **behavior.assist** — what the motor does while the code is active: `off`, `reduced`, `unaffected`, or `unknown` if sources disagree.
- **repair.dealer_tool_required** — `true` if diagnosing/clearing needs the manufacturer's dealer software (Bosch DiagnosticTool, Shimano E-TUBE dealer mode, …).
- **estimated_cost_eur** — only for typical part/repair market prices you can defend; omit when unsure.

## Likelihood field

Use sparingly and honestly:

- `high` — confirmed by manufacturer documentation or multiple independent shop reports.
- `medium` — common but not dominant cause.
- `low` — known to occur, rare in practice.

If unsure, omit `common_causes` rather than guess.

## Style

- YAML, two-space indent, no trailing whitespace.
- Lowercase IDs, `snake_case` for cause IDs, `kebab-case` for system slugs.
- Code identifiers always uppercase and quoted in YAML: `"503"`, `"W013"`.
- ISO 4217 for currencies, ISO 639-1 for languages.

## Review

Reviewers check: schema validity, source quality, no verbatim copyrighted text, plausibility. Maintainers may rephrase or drop sources without further discussion.
