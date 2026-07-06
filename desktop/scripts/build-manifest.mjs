#!/usr/bin/env node

/**
 * build-manifest.mjs
 *
 * Generates public/mushaf-version.json after Next.js build.
 * Hashes the mushaf-related chunks so the Electron app can detect updates.
 *
 * Usage: node scripts/build-manifest.mjs
 * Called automatically after `next build` via a postbuild script.
 */

import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', '..');
const NEXT_DIR = path.join(ROOT, '.next');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_FILE = path.join(PUBLIC_DIR, 'mushaf-version.json');

/**
 * Walk a directory recursively and yield all file paths.
 */
function* walk(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(fullPath);
    } else {
      yield fullPath;
    }
  }
}

/**
 * Hash all mushaf-related build files.
 */
function hashMushafFiles() {
  const hash = createHash('sha256');
  let fileCount = 0;

  // Files that are mushaf-related in the Next.js build output
  const patterns = [
    // Chunks with "mushaf" in name
    (p) => p.includes('mushaf') || p.includes('Mushaf') || p.includes('MUSHAF'),
    // Page routes for /mushaf
    (p) => p.includes(`${path.sep}mushaf${path.sep}`) || p.includes('mushaf-page'),
    // All page chunks that might include mushaf components
    (p) => {
      const name = path.basename(p);
      return name.includes('page') && (
        p.includes('mushaf') || p.includes('MushafViewer') || p.includes('tafsir')
      );
    },
  ];

  for (const filePath of walk(NEXT_DIR)) {
    const relPath = path.relative(NEXT_DIR, filePath);
    const shouldHash = patterns.some((match) => match(relPath));
    if (!shouldHash) continue;

    // Ignore .map files
    if (relPath.endsWith('.map')) continue;

    const content = fs.readFileSync(filePath);
    hash.update(content);
    fileCount++;
  }

  // Also hash the actual source mushaf components
  const srcDirs = [
    path.join(ROOT, 'src', 'app', 'mushaf'),
    path.join(ROOT, 'src', 'components', 'mushaf'),
  ];

  for (const srcDir of srcDirs) {
    for (const filePath of walk(srcDir)) {
      const content = fs.readFileSync(filePath);
      hash.update(content);
      fileCount++;
    }
  }

  return {
    hash: hash.digest('hex').slice(0, 16),
    fileCount,
  };
}

function main() {
  console.log('[build-manifest] Generating mushaf-version.json...');

  if (!fs.existsSync(NEXT_DIR)) {
    console.warn('[build-manifest] .next directory not found. Creating minimal manifest.');
    const result = {
      hash: 'dev',
      buildTime: new Date().toISOString(),
      version: '1.0.0',
      note: 'Development build',
    };
    fs.mkdirSync(PUBLIC_DIR, { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`[build-manifest] Written to ${OUTPUT_FILE}`);
    return;
  }

  const { hash, fileCount } = hashMushafFiles();
  const buildTime = new Date().toISOString();
  const version = `1.0.0`;

  const manifest = {
    version,
    hash,
    buildTime,
    fileCount,
  };

  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));

  console.log(`[build-manifest] ✅ mushaf-version.json generated`);
  console.log(`[build-manifest]    Hash: ${hash}`);
  console.log(`[build-manifest]    Files hashed: ${fileCount}`);
  console.log(`[build-manifest]    Build time: ${buildTime}`);
  console.log(`[build-manifest]    Written to: ${OUTPUT_FILE}`);
}

main();
