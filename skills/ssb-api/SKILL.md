---
name: ssb-api
description: >
  Norsk offentlig statistikk fra SSB. Bruk denne når noen spør om norske tall,
  statistikk, befolkningsdata, KPI, arbeidsledighet, priser, økonomi, handel,
  utdanning, helse, kommunedata eller fylkesdata. Trigger også på "finn tall på",
  "hva er statistikken for", "hvor mange bor i", "hva koster", "gjennomsnittsinntekt",
  "arbeidsledigheten", "befolkningsvekst", "eksportstatistikk" og lignende.
user-invocable: false
---

# SSB API — Arbeidsflyt

Følg stegene i rekkefølge: forstå → søk → metadata → query → presenter.

## Tilgjengelige verktøy

Serveren har disse MCP-verktøyene:

- `ssb_search` — Søk etter tabeller med fritekst
- `ssb_table_metadata` — Hent metadata (variabler, koder, kodelister)
- `ssb_get_data` — Hent data med filtre
- `ssb_get_url` — Generer delbar URL

## Steg 1: Forstå behovet

Avklar før du kaller verktøy:

- **Tema** — Befolkning, priser, arbeid, økonomi, utdanning, helse?
- **Geografi** — Hele Norge, fylke, kommune?
- **Tidsperiode** — Siste år, siste 10 år, spesifikk periode?
- **Nedbrytning** — Kjønn, alder, næring?

Hvis brukeren er vag, still **ett** oppfølgingsspørsmål — ikke flere.

## Steg 2: Søk etter riktig tabell

Bruk `ssb_search` med norske fagtermer:

- Befolkning: "folkemengde", "befolkningsendringer"
- Priser: "konsumprisindeks" (ikke "KPI"), "boligprisindeksen"
- Arbeid: "sysselsatte" (ikke "jobber"), "registrerte arbeidsledige"
- Navn: "fornavn" (10501 for levende, 10467 for fødte)

Tips:
- `title:` prefix for presise treff
- Sjekk `lastPeriod` for oppdatert tabell
- Avsluttede tabeller har "(avslutta serie)" i tittelen

Presenter 3–5 relevante treff med ID, tittel og siste oppdatering. Anbefal den mest passende.

Se [references/common-tables.md](references/common-tables.md) for vanlige tabeller.

## Steg 3: Utforsk metadata

Bruk `ssb_table_metadata`:

- **Variabler** — Dimensjoner som Region, Kjonn, Alder, Tid, ContentsCode
- **Verdier** — Gyldige koder (kommunekoder, årstall, aldersgrupper)
- **Kodelister** — Aggregeringer (fylke i stedet for kommune)
- **elimination** — `false` betyr variabelen MÅ inkluderes i query

`ContentsCode` forteller hva som måles. Sjekk `unit` for enhet (antall, prosent, indeks, NOK).

## Steg 4: Bygg og kjør query

Bruk `ssb_get_data`. Filtrer i denne rekkefølgen:

1. **Tid** — Alltid begrens (`top(5)`, `range(2020,2025)`)
2. **Region** — Riktig geografisk nivå
3. **ContentsCode** — Riktig måleenhet
4. **Andre variabler** — Etter behov

Start smalt — lettere å utvide enn å håndtere for mye data.

Se [references/filter-syntax.md](references/filter-syntax.md) for alle filteruttrykk.

## Steg 5: Presenter

- Ryddig markdown-tabell
- Kilde: **Kilde: SSB, tabell {id}, sist oppdatert {dato}**
- Norsk tallformat: mellomrom som tusenskilletegn
- Forklar hva tallene betyr
- Tilby visualisering eller mer data

## Regler

**Gjør alltid:** Søk først. Sjekk metadata. Filtrer på tid. Vis kilde.

**Gjør aldri:** Hent uten filtre fra store tabeller. Gjett på tabell-IDer. Bland koder fra forskjellige kodelister.

Se [references/troubleshooting.md](references/troubleshooting.md) ved feil.
