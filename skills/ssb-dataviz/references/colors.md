# Fargepalett for SSB-visualiseringer

Basert på SSBs offentlige designsystem og Plotly-mal.

## Kategorisk palett

Bruk i denne rekkefølgen. For N serier, bruk farge 1 til N.

| Nr | Navn | Hex | Bruk |
|---|---|---|---|
| 1 | Grønn | `#1A9D49` | Primær dataserie |
| 2 | Blå | `#1D9DE2` | Sekundær |
| 3 | Gull | `#C78800` | Tertiær |
| 4 | Rosa | `#C775A7` | Fjerde serie |
| 5 | Mørk grønn | `#075745` | Femte serie |
| 6 | Mørk blå | `#0F2080` | Sjette serie |
| 7 | Mørk rosa | `#A3136C` | Syvende serie |
| 8 | Mørk brun | `#471F00` | Åttende serie |
| 9 | Grå | `#909090` | "Andre" / nedtonet |

Maks 6–7 kategorier per diagram. Grupper resten som "Andre" med grå.

## Arrays

```js
const SSB_COLORS = [
  '#1A9D49', '#1D9DE2', '#C78800', '#C775A7',
  '#075745', '#0F2080', '#A3136C', '#471F00', '#909090'
];
```

```python
SSB_COLORS = [
    '#1A9D49', '#1D9DE2', '#C78800', '#C775A7',
    '#075745', '#0F2080', '#A3136C', '#471F00', '#909090'
]
```

## Sekvensielt (for heatmaps)

`#ECFEED` → `#B6E8B8` → `#1A9D49` → `#075745` → `#274247`

## Divergerende (negativ → nøytral → positiv)

`#A3136C` → `#F0F8F9` → `#1A9D49`

## Semantisk

| Betydning | Farge | Symbol |
|---|---|---|
| Vekst / positiv | `#1A9D49` | ▲ |
| Nedgang / negativ | `#A3136C` | ▼ |
| Nøytral | `#909090` | — |

## UI-farger

| Element | Farge |
|---|---|
| Tekst, akser | `#274247` |
| Bakgrunn | `#FFFFFF` |
| Rutenett | `#C3DCDC` (stiplet) |
| Kilde/fotnote | `#909090` |
| Tabell-header bakgrunn | `#274247` |
| Tabell-header tekst | `#FFFFFF` |
| Zebra-rader | `#ECFEED` |

## Typografi

| Element | Font | Størrelse |
|---|---|---|
| Tittel | Roboto Condensed Bold | 20px |
| Aksetittel | Open Sans | 14px |
| Labels | Open Sans | 12px |
| Kilde | Open Sans | 11px |

Fallback: Arial, Helvetica, sans-serif.
