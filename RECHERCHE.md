# pedelex — Rechercheplan

Interner Arbeitsplan für den Aufbau der Datenbank. Sprache bewusst Deutsch
(Arbeitssprache des Maintainers); die Daten selbst sind zweisprachig EN/DE.

## Grundregeln (gelten für jede Welle)

1. **Jeder Code braucht mindestens eine tatsächlich geprüfte Quelle** —
   bevorzugt die offizielle Hersteller-Hilfeseite oder das offizielle
   Handbuch. Händler-Ratgeber und Fachmagazine als Zweitquelle,
   Foren nie als Alleinquelle.
2. **Alle Texte selbst formulieren** — niemals Handbuch- oder
   Hilfeseiten-Text kopieren (Urheberrecht). Identifier und technische
   Fakten sind frei.
3. **Identität = system + code.** Gleiche Code-Nummern verschiedener
   Hersteller sind verschiedene Einträge.
4. **Widersprüche dokumentieren:** Wenn Quellen sich widersprechen
   (kommt bei E-Bike-Codes häufig vor!), gewinnt die offizielle Quelle;
   unklare Angaben werden weggelassen statt geraten
   (`behavior.assist: unknown`, keine Kosten).
5. Nach jeder Welle: `npm run check` + `npm run build`, Commit mit
   deutscher Nachricht, Push → Pages aktualisiert sich automatisch.

## Quellenlage pro Hersteller

### Bosch eBike Systems (`bosch`)
- **Offiziell (beste Quelle):** help.bosch-ebike.com — pro Code eine Seite
  (`/us/help-center/error/{code}`); dahinter eine offene JSON-API:
  `https://help.bosch-ebike.com/v1/error_code?externalID={code}&languageId=en`
  (liefert Titel + offizielle Maßnahmen; 404 = Code existiert nicht).
  Damit lässt sich der komplette Codebestand systematisch abklopfen.
- Sekundär: ebike-mtb.com (EN), ebikediagnose.de, upway.de, fahrrad.de.
- **Achtung:** ebiketreff.de weicht bei mehreren Codes von der offiziellen
  Bosch-Doku ab (z. B. 502/503) — nicht als Quelle verwenden.
- Zwei Codewelten: **BES2/BES3 (Gen2–Gen4)** = 3-stellig (4xx/5xx/6xx),
  **Smart System** = 6-stellig (z. B. 506003) → eigene Welle.

### Shimano STEPS (`shimano-steps`)
- **Offiziell:** si.shimano.com (Händler-/Nutzerhandbücher als PDF/HTML,
  Fehlercode-Tabellen in den STEPS-Manuals, z. B. UM-70F0A), plus
  productinfo.shimano.com. W-Codes (Warnung) vs. E-Codes (Fehler).
- Sekundär: Händlerseiten (z. B. bike-discount, e-bike-finder),
  Fachmagazine.

### Yamaha (`yamaha`) und Giant SyncDrive (`giant`)
- Yamaha-PW-Serien-Handbücher (yamaha-motor.eu, Display-Manuals);
  Fehlercodes meist „ER01"–„ER89" bzw. E-Nummern je Display.
- Giant nutzt Yamaha-basierte SyncDrive-Motoren mit eigenen
  RideControl-Codes — als eigenes System führen, mit
  `related_codes`-Querverweisen wo belegbar.

### Brose (`brose`) und Specialized (`specialized`)
- Brose liefert an OEMs; öffentliche Doku dünn. Specialized (nutzt
  Brose-Motoren, eigene Codes im TCD/Mastermind-Display) hat gute
  offizielle Support-Seiten (support.specialized.com) → Specialized als
  eigenes System zuerst, generisches Brose danach.

### Bafang (`bafang`)
- Offizielle Handbücher (bafang-e.com), Codes zweistellig (04, 05, 07,
  08, 10, 12, 21, 25, 30 …), viele Display-Varianten (DP C18, 850C …).
- Sekundär: greenbikekit, elektrofahrrad24, YouTube-Werkstattkanäle
  (nur als Bestätigung).

### Fazua (`fazua`)
- fazua.com Support/FAQ, Ride 50/60 Doku; Codes teils als Zahlen,
  teils LED-Blinkmuster → Blinkmuster ggf. als Code „LED-…" modellieren
  oder weglassen (erst in später Welle entscheiden).

### Mahle (`mahle`)
- mahle-smartbike.com Support (X35/X20), My SmartBike App; viele Fehler
  nur als LED-Farbcodes am iWoc-Button → gleiche Modellierungsfrage
  wie Fazua.

### Panasonic (`panasonic`), TQ (`tq`), Pinion (`pinion`), DJI Avinox (`dji-avinox`), Continental (`continental`)
- Panasonic: Handbücher der Systeme GX/FX (flyer-bikes u. a. OEM-Doku).
- TQ: tq-ebike.com Support (HPR50/HPR60).
- Pinion MGU: pinion.eu Support (E1.9/E1.12, Smart.Shift).
- DJI Avinox: dji.com Support (Avinox-App-Fehlermeldungen) — neu ab 2024,
  Quellen noch dünn, spät einplanen.
- Continental: System eingestellt, aber Bestandsräder existieren —
  niedrige Priorität.

## Wellenplan

| Welle | Inhalt | Umfang (geschätzt) | Status |
|---|---|---|---|
| 0 | Bosch BES2/3-Kerncodes + Shimano-Kerncodes | ~30 | ✅ mit Projekt-Setup erledigt |
| 1 | Bosch BES2/BES3 vollständig (per Help-Center-API systematisch: 4xx, 5xx, 6xx, 7xx durchprobieren) | ~60–100 | offen |
| 2 | Bosch Smart System (6-stellige Codes, eBike-Flow-Welt) | ~50–150 | offen |
| 3 | Shimano STEPS vollständig (W0xx/E0xx über alle Generationen E5000–EP801) | ~40–60 | offen |
| 4 | Yamaha + Giant SyncDrive | ~60–100 | offen |
| 5 | Bafang + Specialized | ~40–60 | offen |
| 6 | Fazua + Mahle + Panasonic | ~40–80 | offen |
| 7 | TQ + Pinion + DJI Avinox + Continental | ~30–60 | offen |

Erwarteter Endstand: **400–800 Codes**, jede Welle einzeln committen und
deployen — die Coverage-Tabelle auf der Landingpage zeigt den Fortschritt.

## Arbeitsweise pro Welle (bewährt aus obdex)

1. Codeliste aus offizieller Quelle erheben (bei Bosch: API-Scan).
2. Pro Code: Titel/Maßnahmen aus offizieller Quelle, Ursachen/Kosten aus
   Zweitquellen, alles selbst formulieren, EN+DE.
3. In `data/codes/<system>.yaml` einsortieren (aufsteigend).
4. `npm run check` (Schema, Duplikate, Relationen) — muss grün sein.
5. `npm run build` lokal prüfen (Landingpage, meta.json).
6. Commit (deutsch), Push, Pages-Deploy prüfen.
7. Frontend ebike.signalwelt.de: `api/data.php?type=codes&refresh=1`
   aufrufen oder 6 h warten (Cache-TTL).

## Kostenangaben

`estimated_cost_eur` nur setzen, wenn Marktpreise belegbar sind
(Ersatzteil-Listenpreise, typische Werkstattsätze). Angaben aus Welle 0:
Ladegerät 70–150 €, Akku 500–900 €, Speichenmagnet/Sensor 5–80 €,
Lichtanlage 10–60 € — konservative Marktpreis-Spannen, im Frontend
ausdrücklich als „Kosten grob" ausgewiesen.
