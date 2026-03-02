#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const globalsPath = path.join(rootDir, "src/app/globals.css");
const reportPath = path.join(rootDir, "docs/ui/contrast-audit.md");
const shouldCheck = process.argv.includes("--check");

const pairs = [
  ["foreground", "background"],
  ["muted-foreground", "muted"],
  ["card-foreground", "card"],
  ["primary-foreground", "primary"],
  ["secondary-foreground", "secondary"],
  ["accent-foreground", "accent"],
  ["destructive-foreground", "destructive"],
  ["success-foreground", "success"],
  ["info-foreground", "info"],
  ["warning-foreground", "warning"],
];

const criticalPairsForCheck = new Set([
  "foreground on background",
  "card-foreground on card",
  "primary-foreground on primary",
  "secondary-foreground on secondary",
  "accent-foreground on accent",
  "destructive-foreground on destructive",
  "success-foreground on success",
  "info-foreground on info",
  "warning-foreground on warning",
]);

const readingModes = [
  { key: "normal", lightSelector: null, darkSelector: null },
  {
    key: "sepia",
    lightSelector: ".mushaf-reading-mode-sepia",
    darkSelector: ".dark .mushaf-reading-mode-sepia",
  },
  {
    key: "green",
    lightSelector: ".mushaf-reading-mode-green",
    darkSelector: ".dark .mushaf-reading-mode-green",
  },
  {
    key: "purple",
    lightSelector: ".mushaf-reading-mode-purple",
    darkSelector: ".dark .mushaf-reading-mode-purple",
  },
  {
    key: "blue",
    lightSelector: ".mushaf-reading-mode-blue",
    darkSelector: ".dark .mushaf-reading-mode-blue",
  },
  {
    key: "red",
    lightSelector: ".mushaf-reading-mode-red",
    darkSelector: ".dark .mushaf-reading-mode-red",
  },
  {
    key: "pink",
    lightSelector: ".mushaf-reading-mode-pink",
    darkSelector: ".dark .mushaf-reading-mode-pink",
  },
  {
    key: "high-contrast",
    lightSelector: ".mushaf-reading-mode-high-contrast",
    darkSelector: ".dark .mushaf-reading-mode-high-contrast",
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBlock(css, selector) {
  const pattern = new RegExp(`${escapeRegExp(selector)}\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m");
  const match = css.match(pattern);
  return match ? match[1] : "";
}

function parseVariables(block) {
  const result = {};
  const variablePattern = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match = variablePattern.exec(block);
  while (match) {
    result[match[1].toLowerCase()] = match[2].trim();
    match = variablePattern.exec(block);
  }
  return result;
}

function normalizeHex(value) {
  const hex = value.trim();
  if (!hex.startsWith("#")) return null;
  const raw = hex.slice(1);
  if (raw.length === 3 || raw.length === 4) {
    const [r, g, b] = raw;
    return `${r}${r}${g}${g}${b}${b}`;
  }
  if (raw.length === 6 || raw.length === 8) return raw.slice(0, 6);
  return null;
}

function hexToRgb(value) {
  const normalized = normalizeHex(value);
  if (!normalized) return null;
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16),
    g: Number.parseInt(normalized.slice(2, 4), 16),
    b: Number.parseInt(normalized.slice(4, 6), 16),
  };
}

function linearize(channel) {
  const srgb = channel / 255;
  return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb) {
  return 0.2126 * linearize(rgb.r) + 0.7152 * linearize(rgb.g) + 0.0722 * linearize(rgb.b);
}

function contrastRatio(first, second) {
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

function evaluatePalette(mode, theme, palette) {
  const rows = [];
  for (const [fgKey, bgKey] of pairs) {
    const foregroundValue = palette[fgKey];
    const backgroundValue = palette[bgKey];

    if (!foregroundValue || !backgroundValue) {
      rows.push({
        mode,
        theme,
        pair: `${fgKey} on ${bgKey}`,
        ratio: null,
        status: "N/A",
      });
      continue;
    }

    const fg = hexToRgb(foregroundValue);
    const bg = hexToRgb(backgroundValue);
    if (!fg || !bg) {
      rows.push({
        mode,
        theme,
        pair: `${fgKey} on ${bgKey}`,
        ratio: null,
        status: "N/A",
      });
      continue;
    }

    const ratio = contrastRatio(luminance(fg), luminance(bg));
    const pass = ratio >= 4.5;
    rows.push({
      mode,
      theme,
      pair: `${fgKey} on ${bgKey}`,
      ratio,
      status: pass ? "PASS" : "FAIL",
    });
  }
  return rows;
}

function toMarkdown(rows, generatedAt) {
  const measuredRows = rows.filter((row) => row.ratio !== null);
  const failingRows = measuredRows.filter((row) => row.status === "FAIL");
  const criticalFailingRows = failingRows.filter((row) => criticalPairsForCheck.has(row.pair));
  const lowest = measuredRows.reduce(
    (acc, row) => (acc === null || row.ratio < acc.ratio ? row : acc),
    null,
  );

  const lines = [];
  lines.push("# UI Contrast Audit");
  lines.push("");
  lines.push(`Generated on ${generatedAt}`);
  lines.push("");
  lines.push("## Scope");
  lines.push("- Source: `src/app/globals.css`");
  lines.push("- Themes: light + dark");
  lines.push("- Reading modes: normal, sepia, green, purple, blue, red, pink, high-contrast");
  lines.push("");
  lines.push("## Summary");
  lines.push(`- Checked pairs: ${measuredRows.length}`);
  lines.push(`- Failing pairs (AA 4.5:1): ${failingRows.length}`);
  lines.push(`- Critical failing pairs: ${criticalFailingRows.length}`);
  if (lowest) {
    lines.push(
      `- Lowest ratio: ${lowest.ratio.toFixed(2)} (${lowest.mode}/${lowest.theme}, ${lowest.pair})`,
    );
  }
  lines.push("");
  lines.push("## Results");
  lines.push("| Mode | Theme | Pair | Ratio | Status |");
  lines.push("| --- | --- | --- | ---: | --- |");
  for (const row of rows) {
    lines.push(
      `| ${row.mode} | ${row.theme} | ${row.pair} | ${row.ratio === null ? "N/A" : row.ratio.toFixed(2)} | ${row.status} |`,
    );
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("- Threshold used: WCAG AA normal text (4.5:1).");
  lines.push("- `--check` fails only on critical UI pairs (core foreground/surface + semantic states).");
  lines.push("- `N/A` means the color pair is not defined as a hex token in the selected palette.");
  lines.push("");

  return lines.join("\n");
}

async function run() {
  const css = await fs.readFile(globalsPath, "utf8");

  const rootVars = parseVariables(extractBlock(css, ":root"));
  const darkVars = { ...rootVars, ...parseVariables(extractBlock(css, ".dark")) };

  const rows = [];
  for (const mode of readingModes) {
    const lightPalette = mode.lightSelector
      ? { ...rootVars, ...parseVariables(extractBlock(css, mode.lightSelector)) }
      : rootVars;
    const darkPalette = mode.darkSelector
      ? { ...darkVars, ...parseVariables(extractBlock(css, mode.darkSelector)) }
      : darkVars;

    rows.push(...evaluatePalette(mode.key, "light", lightPalette));
    rows.push(...evaluatePalette(mode.key, "dark", darkPalette));
  }

  const now = new Date();
  const generatedAt = `${now.toISOString()} (UTC)`;
  const markdown = toMarkdown(rows, generatedAt);

  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, markdown, "utf8");
  console.log(`Contrast audit report generated at ${path.relative(rootDir, reportPath)}`);

  if (shouldCheck) {
    const failures = rows.filter(
      (row) => row.status === "FAIL" && criticalPairsForCheck.has(row.pair),
    );
    if (failures.length > 0) {
      console.error(`Contrast audit failed with ${failures.length} critical failing pair(s).`);
      process.exitCode = 1;
    }
  }
}

run().catch((error) => {
  console.error("Failed to run contrast audit.");
  console.error(error);
  process.exitCode = 1;
});
