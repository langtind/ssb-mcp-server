# SSB MCP Server

MCP-server for **SSB (Statistisk sentralbyrå)** — tilgang til 7 000+ tabeller med norsk offentlig statistikk direkte fra AI-assistenter.

Fungerer med Claude Desktop, Claude Code, Cursor, VS Code og alle MCP-kompatible klienter.

Ingen API-nøkkel nødvendig. SSBs data er åpne og gratis.

## Hva du får

**4 verktøy:**

| Verktøy | Beskrivelse |
|---|---|
| `ssb_search` | Søk etter tabeller med fritekst (norsk eller engelsk) |
| `ssb_table_metadata` | Se en tabells variabler, koder og kodelister |
| `ssb_get_data` | Hent data med filtre — ferdig parset til ren tabellstruktur |
| `ssb_get_url` | Generer en delbar URL for en spørring |

**3 prompts (innebygd domenekunnskap):**

| Prompt | Beskrivelse |
|---|---|
| `ssb-api-guide` | Komplett arbeidsflyt: søk → metadata → query → presenter |
| `ssb-dataviz-guide` | SSBs designsystem — farger, diagramtyper, typografi |
| `ssb-query-builder` | Interaktiv hjelper — beskriv hva du trenger på vanlig norsk |

## Hurtigstart

### Claude Desktop

Åpne **Settings → Developer → Edit Config** og legg til:

```json
{
  "mcpServers": {
    "ssb": {
      "command": "npx",
      "args": ["-y", "ssb-mcp-server"]
    }
  }
}
```

Start Claude Desktop på nytt. Du ser hammersikonet (🔨) — klikk for å se SSB-verktøyene.

### Claude Code

#### Bare MCP-server:

```bash
claude mcp add ssb -- npx -y ssb-mcp-server
```

#### MCP-server + skills (anbefalt):

```bash
claude plugin install https://github.com/langtind/ssb-mcp-server
```

Dette installerer både MCP-serveren og Claude Code-skills som gir AI-en domenekunnskap om SSB API og datavisualisering.

### Cursor / VS Code

Legg til i MCP-innstillinger (`.cursor/mcp.json` eller VS Code MCP config):

```json
{
  "mcpServers": {
    "ssb": {
      "command": "npx",
      "args": ["-y", "ssb-mcp-server"]
    }
  }
}
```

### Fra kildekode

```bash
git clone https://github.com/langtind/ssb-mcp-server.git
cd ssb-mcp-server
npm install && npm run build
```

Konfigurer klienten:

```json
{
  "mcpServers": {
    "ssb": {
      "command": "node",
      "args": ["/sti/til/ssb-mcp-server/dist/index.js"]
    }
  }
}
```

## Eksempler

### "Hvor mange bor i Oslo?"

AI-en vil:
1. Søke etter befolkningstabeller → finner tabell `07459`
2. Sjekke metadata → identifiserer `Region`, `ContentsCode`, `Tid`
3. Hente data med filtre → `Region: 0301, ContentsCode: Personer1, Tid: top(1)`
4. Presentere: **728 714 innbyggere** (Kilde: SSB, tabell 07459)

### "Vis KPI-utviklingen de siste 5 årene"

→ Tabell `14700`, månedlig KPI-indeks (2025=100), formatert som tidsserie.

### "Sammenlign arbeidsledighet per fylke"

→ Tabell `13760`, med kodeliste `agg_KommFylker` for fylkesnivå.

### "Hvor mange heter Arild?"

→ Tabell `10501`, kode `2ARILD` → **9 134 personer** (2025).

## Prompts

Serveren leverer domenekunnskap som hjelper AI-assistenter bruke verktøyene riktig.

### SSB API Guide (`ssb-api-guide`)

- Steg-for-steg arbeidsflyt (søk → metadata → query → presenter)
- Vanlige tabell-IDer (befolkning, KPI, arbeid, bolig, handel)
- Filtersyntaks (`top()`, `from()`, `range()`, wildcards)
- Feilsøking (TOO_MANY_CELLS, INVALID_FILTER, osv.)

### SSB Datavisualisering (`ssb-dataviz-guide`)

- SSBs fargepalett (9 kategoriske farger + sekvensielt/divergerende)
- Diagramvalg (når bruke linje, søyle, ring, scatter)
- Typografi (Roboto Condensed + Open Sans)
- Tallformat og kildeangivelse

### SSB Query Builder (`ssb-query-builder`)

Interaktiv — beskriv hva du trenger på vanlig norsk, og AI-en leder deg gjennom hele arbeidsflyten.

## Filtersyntaks

`selection`-parameteren i `ssb_get_data` støtter:

| Uttrykk | Eksempel | Beskrivelse |
|---|---|---|
| Eksplisitte koder | `["0301", "4601"]` | Spesifikke verdier |
| `top(N)` | `["top(5)"]` | Siste N verdier (nyeste) |
| `from(X)` | `["from(2020)"]` | Fra og med X |
| `range(X,Y)` | `["range(2018,2023)"]` | Intervall |
| `bottom(N)` | `["bottom(3)"]` | Første N verdier (eldste) |
| Wildcards | `["03*"]` | Mønstermatching |

Kodelister aggregerer verdier (f.eks. kommuner → fylker):
```json
{ "variableCode": "Region", "valueCodes": ["03", "11"], "codelist": "agg_KommFylker" }
```

## Feilhåndtering

Serveren returnerer strukturerte feil med forslag til løsning:

```json
{
  "error": true,
  "code": "TOO_MANY_CELLS",
  "message": "Empty selection would return ~8,600,000 cells (max 800,000).",
  "suggestion": "Add filters using the selection parameter..."
}
```

Feilkoder: `TABLE_NOT_FOUND`, `INVALID_FILTER`, `TOO_MANY_CELLS`, `SEARCH_FAILED`, `REQUEST_FAILED`.

## Datakilde

All data hentes fra SSBs åpne [Statistikkbanken API](https://data.ssb.no/api/v0/) (PxWeb). Ingen autentisering nødvendig. Data er lisensiert under [SSBs åpne datalisens](https://www.ssb.no/en/diverse/lisens).

## Lisens

MIT
