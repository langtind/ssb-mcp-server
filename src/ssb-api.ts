/**
 * SSB PxWeb API v2 client
 * Wraps https://data.ssb.no/api/v0/
 */

const SSB_BASE = "https://data.ssb.no/api/v0";

interface SSBSearchResult {
  id: string;
  label: string;
  description: string;
  updated: string;
  firstPeriod: string;
  lastPeriod: string;
  timeUnit: string;
  variableNames: string[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
}

interface SSBSelection {
  variableCode: string;
  valueCodes: string[];
  codelist?: string;
}

interface SSBError {
  error: true;
  code: string;
  message: string;
  suggestion: string;
}

interface SSBColumn {
  code: string;
  label: string;
  type: "dimension" | "value";
  unit?: string;
}

interface SSBDataResult {
  metadata: {
    tableId: string;
    title: string;
    source: string;
    updated: string;
    totalCells: number;
  };
  columns: SSBColumn[];
  rows: Array<Record<string, string | number | null>>;
}

function ssbError(code: string, message: string, suggestion: string): SSBError {
  return { error: true, code, message, suggestion };
}

export async function ssbSearch(
  query: string,
  language: string = "no",
  includeDiscontinued: boolean = false,
  pageSize: number = 20,
  page: number = 1
): Promise<SSBSearchResult[]> {
  const params = new URLSearchParams({
    query,
    lang: language,
    pageSize: pageSize.toString(),
    page: page.toString(),
    ...(includeDiscontinued && { includeDiscontinued: "true" }),
  });

  const res = await fetch(`${SSB_BASE}/${language}/table/?${params}`);
  if (!res.ok) {
    throw ssbError(
      "SEARCH_FAILED",
      `Search failed: HTTP ${res.status}`,
      "Try different search terms or check your network connection."
    );
  }

  const tables: Array<{
    id: string;
    title: string;
    description: string;
    updated: string;
    firstPeriod: string;
    lastPeriod: string;
    category: string;
    variables: Array<{ code: string; text: string }>;
  }> = await res.json();

  // Extract numeric table ID from title (e.g. "14577: Title..." → "14577")
  // SSB v0 API uses internal slugs as id, but the real table number is in the title
  const withTableId = tables.map((t) => {
    const match = t.title.match(/^(\d+):\s*/);
    return { ...t, tableId: match ? match[1] : t.id };
  });

  // Deduplicate by table ID (SSB returns same table under multiple categories)
  const seen = new Set<string>();
  const deduped = withTableId.filter((t) => {
    if (seen.has(t.tableId)) return false;
    seen.add(t.tableId);
    return true;
  });

  const totalResults = deduped.length;
  const startIdx = (page - 1) * pageSize;
  const paged = deduped.slice(startIdx, startIdx + pageSize);

  return paged.map((t) => ({
    id: t.tableId,
    label: `${t.tableId}: ${t.title.replace(/^\d+:\s*/, "")}`,
    description: t.description || "",
    updated: t.updated,
    firstPeriod: t.firstPeriod,
    lastPeriod: t.lastPeriod,
    timeUnit: t.category === "t" ? "Annual" : t.category,
    variableNames: t.variables?.map((v) => v.text) ?? [],
    totalResults,
    currentPage: page,
    totalPages: Math.ceil(totalResults / pageSize),
  }));
}

export async function ssbTableMetadata(
  tableId: string,
  language: string = "no"
): Promise<unknown> {
  const res = await fetch(`${SSB_BASE}/${language}/table/${tableId}`);
  if (!res.ok) {
    if (res.status === 404) {
      throw ssbError(
        "TABLE_NOT_FOUND",
        `Table '${tableId}' was not found.`,
        "Use ssb_search to find the correct table ID."
      );
    }
    throw ssbError(
      "METADATA_FAILED",
      `Metadata request failed: HTTP ${res.status}`,
      "Check the table ID and try again."
    );
  }
  return res.json();
}

function buildPxWebQuery(selection: SSBSelection[]): {
  query: Array<{
    code: string;
    selection: { filter: string; values: string[] };
  }>;
  response: { format: string };
} {
  const query = selection.map((s) => {
    let filter = "item";
    let values = s.valueCodes;

    if (s.codelist) {
      filter = s.codelist.startsWith("vs:")
        ? `vs:${s.codelist.slice(3)}`
        : s.codelist.startsWith("agg_")
          ? `agg:${s.codelist.slice(4)}`
          : s.codelist;
    } else if (values.length === 1) {
      const v = values[0];
      if (v.startsWith("top(")) {
        filter = "top";
        values = [v.match(/\d+/)![0]];
      } else if (v.startsWith("from(")) {
        filter = "from";
        values = [v.match(/\((.+)\)/)![1]];
      } else if (v.startsWith("to(")) {
        filter = "to";
        values = [v.match(/\((.+)\)/)![1]];
      } else if (v.startsWith("range(")) {
        const match = v.match(/range\((.+),(.+)\)/);
        if (match) {
          filter = "between";
          values = [match[1], match[2]];
        }
      } else if (v.startsWith("bottom(")) {
        filter = "bottom";
        values = [v.match(/\d+/)![0]];
      } else if (v.includes("*") || v.includes("?")) {
        filter = "glob";
      }
    } else if (values.some((v) => v.includes("*") || v.includes("?"))) {
      filter = "glob";
    }

    return {
      code: s.variableCode,
      selection: { filter, values },
    };
  });

  return { query, response: { format: "json-stat2" } };
}

export async function ssbGetData(
  tableId: string,
  selection: SSBSelection[] = [],
  language: string = "no",
  format: string = "json-stat2"
): Promise<SSBDataResult | SSBError | { raw: string }> {
  // If no selection, first check metadata to estimate cell count
  if (selection.length === 0) {
    const meta = await ssbTableMetadata(tableId, language) as {
      variables?: Array<{ values?: string[]; elimination?: boolean }>;
    };
    if (meta.variables) {
      const cellCount = meta.variables.reduce(
        (acc, v) => acc * (v.values?.length ?? 1),
        1
      );
      if (cellCount > 800_000) {
        throw ssbError(
          "TOO_MANY_CELLS",
          `Empty selection would return ~${cellCount.toLocaleString()} cells (max 800,000).`,
          "Add filters using the selection parameter. Use ssb_table_metadata to see available variables, then filter on Tid, Region, or other dimensions."
        );
      }
    }
  }

  const body = buildPxWebQuery(selection);
  body.response.format = format;

  const res = await fetch(`${SSB_BASE}/${language}/table/${tableId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    let parsed: { type?: string; title?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {}

    if (res.status === 400) {
      const title = parsed.title || text;
      let suggestion =
        "Check variable codes and value codes using ssb_table_metadata. Ensure filter expressions like from(), top(), range() use valid values.";
      if (title.includes("mandantory") || title.includes("mandatory")) {
        suggestion =
          "A required variable is missing from the selection. Use ssb_table_metadata to check which variables have elimination=false — those MUST be included.";
      } else if (title.includes("Non-existent value")) {
        suggestion =
          "One or more value codes don't exist. Use ssb_table_metadata to see valid codes. Note: time format varies — Annual: '2024', Monthly: '2024M01', Quarterly: '2024K1', Academic year: '2022-2023'.";
      }
      throw ssbError("INVALID_FILTER", `Invalid filter or selection: HTTP 400: ${text}`, suggestion);
    }
    if (res.status === 404) {
      throw ssbError(
        "TABLE_NOT_FOUND",
        `Table '${tableId}' was not found.`,
        "Use ssb_search to find the correct table ID."
      );
    }
    throw ssbError(
      "REQUEST_FAILED",
      `SSB data request failed: HTTP ${res.status}: ${text}`,
      "Try again later or reduce the query size."
    );
  }

  if (format === "json-stat2") {
    const jsonStat = await res.json();
    return parseJsonStat2(tableId, jsonStat);
  }

  return { raw: await res.text() };
}

function parseJsonStat2(
  tableId: string,
  data: Record<string, unknown>
): SSBDataResult {
  const dimensions = data.id as string[];
  const sizes = data.size as number[];
  const values = data.value as (number | null)[];
  const dimensionInfo = data.dimension as Record<
    string,
    {
      label: string;
      category: {
        index: Record<string, number> | string[];
        label: Record<string, string>;
        unit?: Record<string, { base: string; decimals: number }>;
      };
    }
  >;

  const dimKeys: string[][] = dimensions.map((dim) => {
    const cat = dimensionInfo[dim].category;
    if (Array.isArray(cat.index)) {
      return cat.index;
    }
    return Object.entries(cat.index)
      .sort(([, a], [, b]) => a - b)
      .map(([k]) => k);
  });

  const dimLabels: Record<string, Record<string, string>> = {};
  for (const dim of dimensions) {
    dimLabels[dim] = dimensionInfo[dim].category.label;
  }

  // Build structured columns like the remote server
  const columns: SSBColumn[] = [];
  const valueVarCodes: string[] = [];

  for (const dim of dimensions) {
    const info = dimensionInfo[dim];
    const unitInfo = info.category.unit;

    if (dim === "ContentsCode" && unitInfo) {
      // ContentsCode represents value columns — expand into value columns
      for (const code of dimKeys[dimensions.indexOf(dim)]) {
        const unit = unitInfo[code];
        columns.push({
          code,
          label: dimLabels[dim][code] || code,
          type: "value",
          unit: unit?.base,
        });
        valueVarCodes.push(code);
      }
    } else if (dim !== "ContentsCode") {
      columns.push({
        code: dim,
        label: info.label,
        type: "dimension",
      });
    }
  }

  // If no ContentsCode was found, add a generic value column
  if (valueVarCodes.length === 0) {
    columns.push({ code: "value", label: "value", type: "value" });
  }

  // Build rows with clean key format: "code label" (matching remote)
  const rows: Array<Record<string, string | number | null>> = [];
  const contentsIdx = dimensions.indexOf("ContentsCode");
  const totalCells = values.length;

  for (let i = 0; i < totalCells; i++) {
    const row: Record<string, string | number | null> = {};
    let idx = i;
    let contentsCode = "";

    for (let d = dimensions.length - 1; d >= 0; d--) {
      const dimSize = sizes[d];
      const keyIdx = idx % dimSize;
      idx = Math.floor(idx / dimSize);
      const code = dimKeys[d][keyIdx];
      const label = dimLabels[dimensions[d]][code] || code;

      if (d === contentsIdx) {
        contentsCode = code;
      } else {
        row[dimensions[d]] = `${code} ${label}`;
      }
    }

    if (valueVarCodes.length > 0 && contentsCode) {
      row[contentsCode] = values[i];
    } else {
      row["value"] = values[i];
    }

    rows.push(row);
  }

  // Merge rows that only differ by ContentsCode (multiple measures per observation)
  const mergedRows: Array<Record<string, string | number | null>> = [];
  if (valueVarCodes.length > 1) {
    const keyFn = (r: Record<string, string | number | null>) =>
      columns
        .filter((c) => c.type === "dimension")
        .map((c) => r[c.code])
        .join("|");

    const groups = new Map<string, Record<string, string | number | null>>();
    for (const row of rows) {
      const key = keyFn(row);
      const existing = groups.get(key);
      if (existing) {
        for (const vc of valueVarCodes) {
          if (row[vc] !== undefined) existing[vc] = row[vc];
        }
      } else {
        groups.set(key, { ...row });
      }
    }
    mergedRows.push(...groups.values());
  }

  const finalRows = valueVarCodes.length > 1 ? mergedRows : rows;

  return {
    metadata: {
      tableId,
      title: data.label as string,
      source: data.source as string,
      updated: data.updated as string,
      totalCells: finalRows.length,
    },
    columns,
    rows: finalRows,
  };
}

export function ssbGetUrl(
  tableId: string,
  selection: SSBSelection[] = [],
  language: string = "no",
  format: string = "json-stat2"
): string {
  const base = `${SSB_BASE}/${language}/table/${tableId}`;

  if (selection.length === 0) {
    return base;
  }

  const body = buildPxWebQuery(selection);
  body.response.format = format;

  return `${base}\n\nPOST body:\n${JSON.stringify(body, null, 2)}`;
}

export async function ssbConfig(): Promise<unknown> {
  const res = await fetch("https://data.ssb.no/api/v0/no/table/?config");
  if (!res.ok) {
    return {
      apiVersion: "2.2.0",
      languages: [
        { id: "no", label: "Norsk" },
        { id: "en", label: "English" },
      ],
      defaultLanguage: "no",
      maxDataCells: 800000,
      license: "https://www.ssb.no/en/diverse/lisens",
      sourceReferences: [
        { language: "en", text: "Source: Statistics Norway" },
        { language: "no", text: "Kilde: Statistisk sentralbyrå" },
      ],
      defaultDataFormat: "json-stat2",
      dataFormats: ["json-stat2", "csv", "px", "xlsx", "html", "json-px"],
    };
  }
  return res.json();
}
