#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "src");
const supportedExtensions = new Set([".ts", ".tsx", ".js", ".jsx"]);

const IGNORE_MARKER = "ui-guardrails-ignore";

const hexAllowList = new Set([
  "src/components/mushaf/DisplaySettings.tsx",
  "src/app/mushaf/students/[id]/page.tsx",
]);

const rules = [
  {
    id: "legacy-header-offset",
    message: "Use `pt-[var(--header-height)]` instead of `pt-16/pt-20`.",
    pattern: /\bpt-(?:16|20)\b/g,
    appliesTo: () => true,
  },
  {
    id: "numeric-z-arbitrary",
    message: "Use z-index CSS vars (for example `z-[var(--z-modal)]`) instead of numeric arbitrary values.",
    pattern: /\bz-\[(?:\d+)\]/g,
    appliesTo: () => true,
  },
  {
    id: "fixed-high-z",
    message: "Fixed layers must use the shared z-index scale variables.",
    pattern:
      /\bfixed\b.*\bz-(?:40|50|60|70|80|90|100)\b|\bz-(?:40|50|60|70|80|90|100)\b.*\bfixed\b/g,
    appliesTo: () => true,
  },
  {
    id: "raw-tailwind-color",
    message: "Avoid raw palette classes. Use design tokens/semantic colors instead.",
    pattern:
      /\b(?:bg|text|border|ring|from|via|to|stroke|fill|shadow)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}(?:\/[0-9]{1,3})?\b/g,
    appliesTo: () => true,
  },
  {
    id: "raw-hex-in-components",
    message: "Avoid raw hex colors in TS/TSX files. Move colors to tokens.",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    appliesTo: (relativePath) => !hexAllowList.has(relativePath),
  },
];

async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
      continue;
    }
    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name);
    if (supportedExtensions.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function createFindingsForFile(relativePath, contents) {
  const findings = [];
  const lines = contents.split("\n");

  lines.forEach((line, index) => {
    if (line.includes(IGNORE_MARKER)) return;

    for (const rule of rules) {
      if (!rule.appliesTo(relativePath)) continue;
      rule.pattern.lastIndex = 0;
      const match = rule.pattern.exec(line);
      if (!match) continue;

      findings.push({
        file: relativePath,
        line: index + 1,
        ruleId: rule.id,
        message: rule.message,
        snippet: line.trim(),
      });
    }
  });

  return findings;
}

async function run() {
  const files = await collectFiles(sourceDir);
  const findings = [];

  for (const fullPath of files) {
    const relativePath = path.relative(rootDir, fullPath).split(path.sep).join("/");
    const contents = await fs.readFile(fullPath, "utf8");
    findings.push(...createFindingsForFile(relativePath, contents));
  }

  if (findings.length === 0) {
    console.log("UI guardrails check passed.");
    return;
  }

  console.error(`UI guardrails check failed with ${findings.length} issue(s):`);
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.line} [${finding.ruleId}] ${finding.message}\n  ${finding.snippet}`,
    );
  }
  process.exitCode = 1;
}

run().catch((error) => {
  console.error("Failed to run UI guardrails check.");
  console.error(error);
  process.exitCode = 1;
});
