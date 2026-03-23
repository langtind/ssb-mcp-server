# Feilsøking

## Feilkoder

### TOO_MANY_CELLS
Resultatet overskrider 800 000 celler. Legg til filtre — spesielt på Tid og Region.

### TABLE_NOT_FOUND
Tabellen finnes ikke. Bruk `ssb_search` for å finne riktig ID.

### INVALID_FILTER
Ugyldig filter. Vanlige årsaker:
- Variabelkoder matcher ikke metadata (case-sensitive)
- Verdikoder finnes ikke i tabellen
- Feil tidsformat (årlig vs månedlig vs kvartalsvis)
- Variabler med `elimination: false` mangler i selection

### Tomme resultater
- Prøv andre søkeord eller synonymer
- "folkemengde" og "befolkning" gir ulike treff
- Bruk `title:` prefix for presise søk

### Uventede NULL-verdier
Normalt — ikke alle kombinasjoner har data. Spesielt vanlig for detaljerte nedbrytninger.

### Feil kommunekoder
Kommunesammenslåinger i 2020 endret mange koder. Sjekk metadata for gyldige koder.
