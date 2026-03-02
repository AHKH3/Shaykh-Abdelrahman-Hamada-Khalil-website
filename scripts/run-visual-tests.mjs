#!/usr/bin/env node

import { spawn } from "node:child_process";
import { cleanupPlaywrightArtifacts } from "./cleanup-playwright-artifacts.mjs";

const keepArtifacts = process.env.PLAYWRIGHT_KEEP_ARTIFACTS === "1";
const extraArgs = process.argv.slice(2);

function runPlaywright() {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, FORCE_COLOR: "0" };
    delete env.NO_COLOR;

    const child = spawn(
      "npx",
      ["playwright", "test", "--config=playwright.visual.config.ts", ...extraArgs],
      {
        cwd: process.cwd(),
        env,
        stdio: "inherit",
        shell: process.platform === "win32",
      },
    );

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        resolve(1);
        return;
      }
      resolve(typeof code === "number" ? code : 1);
    });
  });
}

let exitCode = 1;

try {
  exitCode = await runPlaywright();
} catch (error) {
  console.error("Failed to start Playwright tests.");
  console.error(error);
}

if (!keepArtifacts) {
  try {
    await cleanupPlaywrightArtifacts();
  } catch (error) {
    console.error("Playwright finished, but artifact cleanup failed.");
    console.error(error);
    if (exitCode === 0) exitCode = 1;
  }
}

process.exitCode = exitCode;
