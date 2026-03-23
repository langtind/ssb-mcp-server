#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ssbSearch,
  ssbTableMetadata,
  ssbGetData,
  ssbGetUrl,
  ssbConfig,
} from "./ssb-api.js";

const server = new McpServer({
  name: "ssb-mcp-server",
  version: "1.0.0",
});

// --- Shared schemas ---

const selectionSchema = z.array(
  z.object({
    variableCode: z
      .string()
      .describe("Variable code, e.g. 'Region', 'Tid', 'ContentsCode'"),
    valueCodes: z
      .array(z.string())
      .describe(
        "Value codes or filter expressions. Examples: ['0301','1103'], ['from(2020)'], ['top(5)'], ['03*']"
      ),
    codelist: z
      .string()
      .optional()
      .describe("Optional codelist for aggregation, e.g. 'agg_KommFylker'"),
  })
);

// --- Tool annotations (all tools are read-only) ---

const readOnlyAnnotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

// --- Tools ---

server.registerTool(
  "ssb_search",
  {
    title: "Search SSB Tables",
    description:
      "Search for SSB (Statistics Norway) tables by keyword. Returns table IDs, titles, time periods, and variables. Use Norwegian search terms for best results (e.g. 'folkemengde' instead of 'population').",
    annotations: readOnlyAnnotations,
    inputSchema: {
      query: z
        .string()
        .describe(
          "Search keywords. Use Norwegian terms. Supports 'title:' prefix for title-only search."
        ),
      language: z
        .enum(["no", "en"])
        .default("no")
        .describe("Language: 'no' (Norwegian) or 'en' (English)"),
      include_discontinued: z
        .boolean()
        .default(false)
        .describe("Include tables that are no longer updated"),
      page_size: z
        .number()
        .min(1)
        .max(100)
        .default(20)
        .describe("Results per page (max 100)"),
      page: z.number().min(1).default(1).describe("Page number"),
    },
  },
  async ({ query, language, include_discontinued, page_size, page }) => {
    try {
      const results = await ssbSearch(
        query,
        language,
        include_discontinued,
        page_size,
        page
      );
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(results, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(e, null, 2) },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "ssb_table_metadata",
  {
    title: "Get Table Metadata",
    description:
      "Get full metadata for an SSB table including variables, value codes, codelists, and available aggregations. Always call this before ssb_get_data to understand the table structure.",
    annotations: readOnlyAnnotations,
    inputSchema: {
      table_id: z.string().describe("Table ID, e.g. '07459'"),
      language: z
        .enum(["no", "en"])
        .default("no")
        .describe("Language: 'no' (Norwegian) or 'en' (English)"),
    },
  },
  async ({ table_id, language }) => {
    try {
      const metadata = await ssbTableMetadata(table_id, language);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(metadata, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(e, null, 2) },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "ssb_get_data",
  {
    title: "Fetch Table Data",
    description:
      "Fetch data from an SSB table with filters. Always filter on Tid (time) to avoid huge result sets. Returns structured tabular data with metadata. Max 800,000 cells per query.",
    annotations: readOnlyAnnotations,
    inputSchema: {
      table_id: z.string().describe("Table ID, e.g. '07459'"),
      selection: selectionSchema
        .default([])
        .describe("Filters per variable. Empty = default selection from SSB."),
      language: z.enum(["no", "en"]).default("no").describe("Language"),
      format: z
        .enum(["json-stat2", "csv", "xlsx"])
        .default("json-stat2")
        .describe("Output format. json-stat2 is parsed into a flat table."),
    },
  },
  async ({ table_id, selection, language, format }) => {
    try {
      const data = await ssbGetData(table_id, selection, language, format);
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    } catch (e) {
      return {
        content: [
          { type: "text" as const, text: JSON.stringify(e, null, 2) },
        ],
        isError: true,
      };
    }
  }
);

server.registerTool(
  "ssb_get_url",
  {
    title: "Generate Shareable URL",
    description:
      "Generate a shareable URL for an SSB data query. Useful for sharing with colleagues or opening in a browser.",
    annotations: readOnlyAnnotations,
    inputSchema: {
      table_id: z.string().describe("Table ID, e.g. '07459'"),
      selection: selectionSchema
        .default([])
        .describe("Filters per variable (same format as ssb_get_data)"),
      language: z.enum(["no", "en"]).default("no").describe("Language"),
      format: z
        .enum(["json-stat2", "csv", "xlsx"])
        .default("json-stat2")
        .describe("Output format"),
    },
  },
  async ({ table_id, selection, language, format }) => {
    const url = ssbGetUrl(table_id, selection, language, format);
    return {
      content: [{ type: "text" as const, text: url }],
    };
  }
);

// --- Resources ---

server.resource("ssb-config", "ssb://config", async (uri) => {
  const config = await ssbConfig();
  return {
    contents: [
      {
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(config, null, 2),
      },
    ],
  };
});

// --- Prompts (domain knowledge / skills) ---

function loadSkill(skillDir: string, filename: string): string {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    return readFileSync(
      join(__dirname, "..", "skills", skillDir, filename),
      "utf-8"
    );
  } catch {
    return "";
  }
}

function loadSkillWithRefs(skillDir: string): string {
  const main = loadSkill(skillDir, "SKILL.md");
  if (!main) return "";

  const refs: string[] = [];
  const refFiles = [
    "common-tables.md",
    "filter-syntax.md",
    "troubleshooting.md",
    "colors.md",
    "charts.md",
  ];
  for (const ref of refFiles) {
    const content = loadSkill(skillDir, `references/${ref}`);
    if (content) refs.push(content);
  }

  return refs.length > 0
    ? `${main}\n\n---\n\n${refs.join("\n\n---\n\n")}`
    : main;
}

server.registerPrompt("ssb-api-guide", {
  title: "SSB API Guide",
  description:
    "Comprehensive guide for querying Norwegian public statistics from SSB. Includes workflow (search -> metadata -> query -> present), filter syntax, common table IDs, and troubleshooting.",
}, () => ({
  messages: [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text:
          loadSkillWithRefs("ssb-api") ||
          "SSB API skill files not found. Install skills by placing them in the skills/ directory.",
      },
    },
  ],
}));

server.registerPrompt("ssb-dataviz-guide", {
  title: "SSB Data Visualization Guide",
  description:
    "SSB's official design system for data visualization. Color palettes (hex codes for all frameworks), chart selection matrix, typography, and formatting rules for React, Python, Excel, and PowerPoint.",
}, () => ({
  messages: [
    {
      role: "user" as const,
      content: {
        type: "text" as const,
        text:
          loadSkillWithRefs("ssb-dataviz") ||
          "SSB dataviz skill files not found. Install skills by placing them in the skills/ directory.",
      },
    },
  ],
}));

server.registerPrompt(
  "ssb-query-builder",
  {
    title: "SSB Query Builder",
    description:
      "Interactive guide to find and query SSB statistics. Describe what you need and get walked through the full workflow.",
    argsSchema: {
      topic: z
        .string()
        .describe(
          "What statistics are you looking for? E.g. 'befolkning i Oslo', 'KPI siste 5 ar', 'arbeidsledighet per fylke'"
        ),
    },
  },
  ({ topic }) => ({
    messages: [
      {
        role: "user" as const,
        content: {
          type: "text" as const,
          text: `Help me find and query SSB statistics about: "${topic}"

Follow this workflow:
1. Use ssb_search to find relevant tables
2. Use ssb_table_metadata to understand the table structure
3. Use ssb_get_data with appropriate filters
4. Present the results in a clean markdown table with source attribution

Important:
- Use Norwegian search terms for better results
- Always filter on Tid (time) to limit data
- Check ContentsCode for the right measurement unit
- Format numbers with Norwegian conventions (space as thousands separator)
- Always cite: "Kilde: SSB, tabell {id}"`,
        },
      },
    ],
  })
);

// --- Start ---

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SSB MCP Server running on stdio");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
