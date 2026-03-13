#!/usr/bin/env node

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ARTIFACT_DIRS = ["playwright-report", "test-results"];
const LOOSE_SCREENSHOT_PATTERNS = [/^page-\d{10,}\.(png|jpe?g)$/i];
const SNAPSHOT_DIR_SUFFIX = ".spec.ts-snapshots";

async function removeArtifactDirectories(rootDir) {
  await Promise.all(
    ARTIFACT_DIRS.map((dirName) => fs.rm(path.join(rootDir, dirName), { recursive: true, force: true })),
  );
}

async function removeLooseScreenshots(rootDir) {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const screenshotFiles = entries
    .filter((entry) => entry.isFile() && LOOSE_SCREENSHOT_PATTERNS.some((pattern) => pattern.test(entry.name)))
    .map((entry) => fs.rm(path.join(rootDir, entry.name), { force: true }));

  await Promise.all(screenshotFiles);
}

async function removeSnapshotDirectories(currentDir) {
  const entries = await fs.readdir(currentDir, { withFileTypes: true });

  await Promise.all(
    entries.map(async (entry) => {
      if (!entry.isDirectory()) return;

      const fullPath = path.join(currentDir, entry.name);
      if (entry.name.endsWith(SNAPSHOT_DIR_SUFFIX)) {
        await fs.rm(fullPath, { recursive: true, force: true });
        return;
      }

      await removeSnapshotDirectories(fullPath);
    }),
  );
}

export async function cleanupPlaywrightArtifacts(rootDir = process.cwd()) {
  await removeArtifactDirectories(rootDir);
  await removeLooseScreenshots(rootDir);
  await removeSnapshotDirectories(rootDir);
}

const currentFile = fileURLToPath(import.meta.url);
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === currentFile;

if (isDirectRun) {
  cleanupPlaywrightArtifacts().catch((error) => {
    console.error("Failed to clean Playwright artifacts.");
    console.error(error);
    process.exitCode = 1;
  });
}
