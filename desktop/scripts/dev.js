/**
 * Dev mode helper: starts Next.js dev server, then launches Electron.
 * Run from project root: npm run desktop:dev
 * Or: node desktop/scripts/dev.js
 */
const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

const SCRIPT_DIR = __dirname;                       // desktop/scripts/
const DESKTOP_DIR = path.resolve(SCRIPT_DIR, '..'); // desktop/
const ROOT = path.resolve(DESKTOP_DIR, '..');       // project root

function findFreePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      findFreePort(start + 1).then(resolve, reject);
    });
  });
}

async function main() {
  const port = await findFreePort(3742);

  console.log(`[dev] Starting Next.js on port ${port}...`);

  // Start Next.js dev server from the project root
  const next = spawn('npx.cmd', ['next', 'dev', '--port', String(port)], {
    cwd: ROOT, // runs from project root
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, NODE_ENV: 'development' },
  });

  // Wait for Next.js to signal it's ready
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      console.log('[dev] Next.js startup timeout - launching anyway');
      resolve();
    }, 60000);

    next.stdout.on('data', (data) => {
      const text = data.toString();
      process.stdout.write(`[next] ${text}`);
      if (text.includes('Ready') || text.includes('localhost:' + port)) {
        clearTimeout(timeout);
        resolve();
      }
    });
    next.stderr.on('data', (data) => {
      const text = data.toString();
      process.stderr.write(`[next:err] ${text}`);
    });
    next.on('error', reject);
    next.on('exit', (code) => {
      clearTimeout(timeout);
      console.log(`[dev] Next.js exited with code ${code} before ready`);
      reject(new Error(`Next.js exited with code ${code}`));
    });
  });

  // Now launch Electron from the desktop/ directory
  const desktopDir = DESKTOP_DIR;
  console.log(`[dev] Starting Electron (port ${port})...`);

  const electron = spawn('npx.cmd', ['electron', desktopDir], {
    cwd: desktopDir,
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      ELECTRON_DEV_PORT: String(port),
      NODE_ENV: 'development',
    },
  });

  electron.on('close', (code) => {
    console.log(`[dev] Electron exited with code ${code}`);
    next.kill();
    process.exit(code ?? 0);
  });

  next.on('close', (code) => {
    console.log(`[dev] Next.js exited with code ${code}`);
    electron.kill();
    process.exit(code ?? 0);
  });
}

main().catch((err) => {
  console.error('[dev] Fatal error:', err);
  process.exit(1);
});
