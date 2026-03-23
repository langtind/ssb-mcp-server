---
name: ssb-dataviz
description: >
  Visualiser norsk statistikk i SSBs stil. Bruk når SSB-data skal presenteres som
  diagram, graf, chart, tabell, dashboard eller visuell fremstilling. Trigger på
  "vis som graf", "lag diagram", "visualiser", "plot", "tidsserie", "søylediagram",
  "kakediagram", "dashboard" når det handler om SSB-data.
user-invocable: false
---

# SSB Datavisualisering

Guide for visuell presentasjon av SSB-statistikk.

## Prinsipper

1. **Én innsikt per diagram.** Flere historier → flere diagrammer.
2. **Statistisk integritet.** Y-akse starter på 0 for søyler. Jevne tidsintervaller. Enheter synlige.
3. **Tilgjengelighet (WCAG AA).** Ikke stol på farge alene — bruk form eller direkte merking.
4. **Kilde.** Hvert diagram: "Kilde: SSB, tabell {id}"

## Diagramvalg

| Mål | Bruk | Unngå |
|---|---|---|
| Trend over tid | Linjediagram | Kakediagram, søyler med >8 perioder |
| Sammenligne kategorier | Horisontale søyler (sortert) | 3D, usortert |
| Del av helhet | Ringdiagram (maks 5) | Kakediagram med >6 segmenter |
| Rangering | Horisontale søyler (sortert) | Usorterte søyler |
| Geografi | Kart (choropleth) | Tabell med 400 kommuner |
| Enkelttall / KPI | Scorecard | Diagram der ett tall holder |

**Aldri bruk:** 3D-effekter, doble y-akser, avkortet y-akse på søyler.

SSB-spesifikt:
- Tidsserier → linje, ikke søyler
- Kommunesammenligninger → kart eller horisontale søyler
- Indekser (KPI, boligpris) → vis basisår med annotasjon
- Prognoser → stiplet linje

## Tekst

**Deklarative titler** — oppsummer innsikten:
- Nei: "Befolkningsutvikling 2015–2025"
- Ja: "Norges befolkning passerte 5,6 millioner i 2025"

**Direkte merking** fremfor legend. Legend kun ved overlapp — plasser over eller til høyre.

**Kilde** nederst: `Kilde: SSB, tabell 07459. Sist oppdatert: 2026-02-27.`

## Tallformat

- Tusenskilletegn: mellomrom (`5 609 000`)
- Desimaltegn: komma (`3,2 %`)
- Forkortelser: `720 k`, `1,2 mill.`, `3,4 mrd.`

Se [references/colors.md](references/colors.md) for komplett fargepalett.
Se [references/charts.md](references/charts.md) for detaljerte diagramregler.
