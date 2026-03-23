# Filtersyntaks

Referanse for alle filteruttrykk som støttes i `valueCodes` i `ssb_get_data`.

## Uttrykk

| Uttrykk | Eksempel | Beskrivelse |
|---|---|---|
| Eksplisitte koder | `["0301", "4601"]` | Spesifikke verdier |
| `top(N)` | `["top(5)"]` | De siste N verdiene (nyeste) |
| `bottom(N)` | `["bottom(3)"]` | De første N verdiene (eldste) |
| `from(X)` | `["from(2020)"]` | Fra og med verdi X |
| `to(X)` | `["to(2022)"]` | Til og med verdi X |
| `range(X,Y)` | `["range(2018,2023)"]` | Intervall, inklusivt |
| `*` wildcard | `["03*"]` | Matcher null eller flere tegn |
| `?` wildcard | `["?301"]` | Matcher nøyaktig ett tegn |

## Tidsformat

Formatet avhenger av tabellens frekvens:

| Frekvens | Format | Eksempel |
|---|---|---|
| Årlig | `YYYY` | `"2024"` |
| Månedlig | `YYYYMNN` | `"2024M06"` |
| Kvartalsvis | `YYYYKN` | `"2024K2"` |
| Akademisk år | `YYYY-YYYY` | `"2022-2023"` |

## Kodelister

Kodelister grupperer verdier til høyere nivåer:

```json
{
  "variableCode": "Region",
  "valueCodes": ["03", "11", "46"],
  "codelist": "agg_KommFylker"
}
```

Vanlige kodelister:
- `agg_KommFylker` — kommuner til fylker
- `agg_FemAarigGruppering` — 5-årige aldersgrupper
- `agg_TiAarigGruppering` — 10-årige aldersgrupper

## Vanlige geografiske koder

| Sted | Kode |
|---|---|
| Hele Norge | `0` |
| Oslo | `0301` |
| Bergen | `4601` |
| Trondheim | `5001` |
| Stavanger | `1103` |
| Alle kommuner i Vestland | `46*` |
