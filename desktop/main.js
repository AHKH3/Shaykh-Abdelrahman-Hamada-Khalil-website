const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const http = require('http');
const net = require('net');

// ─── Constants ────────────────────────────────────────────────────────────────
const MUSHARF_ROUTE = '/mushaf?standalone=1';
const IS_PACKAGED = app.isPackaged;
let mainWindow = null;

// ─── Find a free port ──────────────────────────────────────────────────────────
function findFreePort(start) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(start, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(findFreePort(start + 1)));
  });
}

// ─── MIME types ────────────────────────────────────────────────────────────────
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/truetype',
  '.map': 'application/json',
};

// ─── Resolve resource directories (packaged vs dev) ────────────────────────────
function getResourceDirs() {
  if (IS_PACKAGED) {
    // C:\Program Files\المصحف\resources\next-build\
    // C:\Program Files\المصحف\resources\public\
    return {
      nextBuild: path.join(process.resourcesPath, 'next-build'),
      public: path.join(process.resourcesPath, 'public'),
    };
  }
  // Development: project root
  const ROOT = path.resolve(__dirname, '..');
  return {
    nextBuild: path.join(ROOT, '.next'),
    public: path.join(ROOT, 'public'),
  };
}

// ─── Production HTTP server (no Next.js needed) ────────────────────────────────
function startProductionServer(port) {
  const dirs = getResourceDirs();
  const { nextBuild, public: publicDir } = dirs;

  console.log(`[server] Production mode`);
  console.log(`[server] .next = ${nextBuild}`);
  console.log(`[server] public = ${publicDir}`);

  // Check directories exist
  if (!fs.existsSync(nextBuild)) {
    console.error(`[server] ERROR: .next directory not found at ${nextBuild}`);
    return Promise.reject(new Error(`Build directory not found. Run 'npm run build' first.`));
  }

  // Determine static directory (Next.js v15+ stores static in .next/static)
  const staticDir = path.join(nextBuild, 'static');
  const serverDir = path.join(nextBuild, 'server');

  function sendFile(res, filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': contentType,
        'Content-Length': content.length,
        'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
      });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  }

  function sendHtml(res, htmlContent) {
    // Inject <base> tag to fix asset paths
    htmlContent = htmlContent.replace(
      '<head>',
      '<head><base href="/">'
    );

    // Inject a script that detects Electron
    htmlContent = htmlContent.replace(
      '</head>',
      `<script>
        if (window.electronAPI) {
          document.documentElement.classList.add('is-electron');
        }
      </script></head>`
    );

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(htmlContent),
      'Cache-Control': 'no-cache',
    });
    res.end(htmlContent);
    return true;
  }

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let url = req.url.split('?')[0];
      let query = req.url.includes('?') ? req.url.split('?')[1] : '';

      // ── /api/health ──
      if (url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
        return;
      }

      // ── /_next/image?url=...&w=...&q=...  → serve from public/ ──
      if (url === '/_next/image' && query) {
        const params = new URLSearchParams(query);
        const imgUrl = params.get('url');
        if (imgUrl) {
          // Remove leading slash, serve from public
          const imgPath = path.join(publicDir, imgUrl.replace(/^\//, ''));
          if (fs.existsSync(imgPath) && !fs.statSync(imgPath).isDirectory()) {
            sendFile(res, imgPath);
            return;
          }
        }
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      // ── _next/static/* → .next/static/* ──
      if (url.startsWith('/_next/static/')) {
        const relPath = url.replace('/_next/', '');
        sendFile(res, path.join(nextBuild, relPath));
        return;
      }

      // ── Serve static pages from .next/server/app/ ──
      // Map: /mushaf → mushaf.html
      //       /some-path → some-path.html (if exists)
      let pageName = url.replace(/^\/+/, '') || 'mushaf';
      // Remove trailing slash
      pageName = pageName.replace(/\/+$/, '') || 'mushaf';
      const htmlPath = path.join(serverDir, 'app', pageName + '.html');

      if (fs.existsSync(htmlPath) && !fs.statSync(htmlPath).isDirectory()) {
        try {
          const content = fs.readFileSync(htmlPath, 'utf-8');
          if (sendHtml(res, content)) return;
        } catch { /* fall through */ }
      }

      // ── Serve from public/ ──
      const pubFile = path.join(publicDir, url);
      if (fs.existsSync(pubFile) && !fs.statSync(pubFile).isDirectory()) {
        sendFile(res, pubFile);
        return;
      }

      // ── Fallback: mushaf page for unknown routes ──
      const fallbackHtml = path.join(serverDir, 'app', 'mushaf.html');
      if (fs.existsSync(fallbackHtml)) {
        try {
          const content = fs.readFileSync(fallbackHtml, 'utf-8');
          if (sendHtml(res, content)) return;
        } catch { /* fall through */ }
      }

      // ── 404 ──
      res.writeHead(404);
      res.end('Not found');
    });

    server.listen(port, '127.0.0.1', () => {
      console.log(`[server] Production server listening on http://127.0.0.1:${port}`);
      resolve(port);
    });
    server.on('error', reject);
  });
}

// ─── Create the main window ──────────────────────────────────────────────────
function createWindow() {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: Math.min(1400, screenWidth),
    height: Math.min(900, screenHeight),
    minWidth: 800,
    minHeight: 600,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0b1120',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    show: false,
  });

  // Show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Maximize/unmaximize for titlebar
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximize-change', true);
  });
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximize-change', false);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });

  // DevTools in dev mode
  if (!IS_PACKAGED) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

// ─── IPC Handlers ────────────────────────────────────────────────────────────
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});
ipcMain.on('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});
ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});
ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false;
});
ipcMain.handle('get-app-info', () => {
  return {
    version: app.getVersion(),
    name: app.getName(),
    platform: process.platform,
    isPackaged: IS_PACKAGED,
  };
});
ipcMain.handle('check-update', async () => {
  try {
    const dirs = getResourceDirs();
    const manifestPath = path.join(dirs.public, 'mushaf-version.json');
    if (fs.existsSync(manifestPath)) {
      const data = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      return { hasUpdate: false, ...data };
    }
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  createWindow();

  try {
    let port;

    if (IS_PACKAGED) {
      // Production mode: use built-in HTTP server
      port = await findFreePort(4173);
      await startProductionServer(port);
    } else if (process.env.ELECTRON_DEV_PORT) {
      // Dev mode from dev.js: Next.js dev server is already running
      port = parseInt(process.env.ELECTRON_DEV_PORT, 10);
      console.log(`[main] Using existing dev server on port ${port}`);
    } else {
      // Standalone dev: start Next.js dev server automatically
      port = await findFreePort(3742);
      const { spawn } = require('child_process');
      const ROOT = path.resolve(__dirname, '..');
      const next = spawn('npx.cmd', ['next', 'dev', '--port', String(port)], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, NODE_ENV: 'development' },
      });

      next.stdout.on('data', (d) => process.stdout.write(`[next] ${d}`));
      next.stderr.on('data', (d) => process.stderr.write(`[next:e] ${d}`));

      // Wait for server to be ready
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), 60000);
        next.stdout.on('data', (data) => {
          if (data.toString().includes('Ready') || data.toString().includes('localhost:')) {
            clearTimeout(timeout);
            resolve();
          }
        });
        next.on('exit', (code) => {
          clearTimeout(timeout);
          if (code !== 0) reject(new Error(`Next.js exited with code ${code}`));
        });
      });

      // Cleanup on app quit
      app.on('will-quit', () => {
        if (next && !next.killed) next.kill();
      });
    }

    await loadApp(port);
  } catch (err) {
    console.error('[main] Failed to start:', err.message);
    showError(err.message);
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});

// ─── Load the app into the window & inject titlebar ─────────────────────────
async function loadApp(port) {
  const url = `http://127.0.0.1:${port}${MUSHARF_ROUTE}`;
  console.log(`[main] Loading: ${url}`);

  mainWindow.loadURL(url);

  // Inject the custom titlebar after the page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      injectTitlebar(mainWindow);
    }, 1500);
  });
}

// ─── Show error page ─────────────────────────────────────────────────────────
function showError(message) {
  mainWindow.loadURL(`data:text/html,
    <html dir="rtl">
      <head><meta charset="utf-8"><title>المصحف</title></head>
      <body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0b1120;color:#ece8e1;font-family:sans-serif;">
        <div style="text-align:center;max-width:400px;">
          <div style="font-size:3rem;margin-bottom:1rem;">&#65021;</div>
          <h1 style="color:#c9a84e;font-size:1.5rem;margin-bottom:1rem;">تعذر تشغيل المصحف</h1>
          <p style="color:#8891a4;margin-bottom:1rem;line-height:1.6;">${message}</p>
          <p style="color:#5c5a53;font-size:0.8rem;">يرجى التأكد من بناء المشروع أولاً:<br/><code style="background:#1e2a3e;padding:4px 8px;border-radius:4px;display:inline-block;margin-top:8px;">npm run build</code></p>
        </div>
      </body>
    </html>`);
}

// ─── Inject custom frameless titlebar ───────────────────────────────────────
function injectTitlebar(win) {
  const winCss = [
    'header { display: none !important; }',
    '.mushaf-top-bar { display: none !important; }',
    'main[class*="pt-"] { padding-top: 0 !important; }',
    '',
    '#mushaf-titlebar {',
    '  position: fixed; top: 0; left: 0; right: 0; height: 52px;',
    '  z-index: 99999;',
    '  display: flex; align-items: center; justify-content: space-between;',
    '  background: linear-gradient(180deg, #0f1825 0%, #0b1120 100%);',
    '  border-bottom: 1px solid rgba(201,168,78,0.15);',
    '  box-shadow: 0 2px 12px rgba(0,0,0,0.3);',
    '  -webkit-app-region: drag;',
    '  user-select: none;',
    '  direction: ltr;',
    '}',
    '.titlebar-left { display: flex; align-items: center; gap: 8px; padding-left: 16px; min-width: 140px; height: 100%; }',
    '.titlebar-icon { width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg,#c9a84e,#b8933f); display: flex; align-items: center; justify-content: center; font-size: 16px; color: #0b1120; }',
    '.titlebar-title { font-family: "Amiri","Traditional Arabic",serif; font-size: 18px; font-weight: 700; color: #ece8e1; }',
    '.titlebar-title-ar { color: #c9a84e; margin-left: 4px; }',
    '.titlebar-center { display: flex; align-items: center; gap: 2px; height: 100%; flex: 1; justify-content: center; -webkit-app-region: no-drag; }',
    '.tb-btn { width: 36px; height: 36px; border: none; background: transparent; border-radius: 10px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8891a4; transition: all 0.2s ease; position: relative; -webkit-app-region: no-drag; }',
    '.tb-btn:hover { background: rgba(201,168,78,0.1); color: #ece8e1; }',
    '.tb-btn:active { transform: scale(0.92); }',
    '.tb-btn.active { color: #c9a84e; background: rgba(201,168,78,0.12); box-shadow: inset 0 1px 2px rgba(201,168,78,0.15); }',
    '.tb-btn svg { width: 18px; height: 18px; }',
    '.tb-separator { width: 1px; height: 24px; background: rgba(201,168,78,0.1); margin: 0 4px; }',
    '.tb-btn::after { content: attr(data-tooltip); position: absolute; bottom: -28px; left: 50%; transform: translateX(-50%); background: #1e2a3e; color: #ece8e1; font-size: 11px; padding: 3px 8px; border-radius: 4px; white-space: nowrap; opacity: 0; pointer-events: none; transition: opacity 0.15s; font-family: sans-serif; z-index: 100000; }',
    '.tb-btn:hover::after { opacity: 1; }',
    '.titlebar-right { display: flex; align-items: center; height: 100%; -webkit-app-region: no-drag; }',
    '.win-btn { width: 46px; height: 100%; border: none; background: transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #8891a4; transition: background 0.15s; -webkit-app-region: no-drag; }',
    '.win-btn:hover { background: rgba(255,255,255,0.08); }',
    '.win-btn.close:hover { background: #bf000f; color: white; }',
    '.win-btn svg { width: 16px; height: 16px; }',
    'body { padding-top: 52px !important; }',
    '#mushaf-update-notif { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: #0f1825; border: 1px solid rgba(201,168,78,0.3); border-radius: 12px; padding: 12px 20px; display: none; align-items: center; gap: 12px; z-index: 100001; box-shadow: 0 8px 32px rgba(0,0,0,0.4); font-family: sans-serif; direction: rtl; }',
    '#mushaf-update-notif.show { display: flex; }',
    '#mushaf-update-notif .notif-text { color: #ece8e1; font-size: 13px; }',
    '#mushaf-update-notif .notif-btn { background: #c9a84e; color: #0b1120; border: none; border-radius: 8px; padding: 6px 16px; font-size: 12px; font-weight: 600; cursor: pointer; }',
    '#mushaf-update-notif .notif-btn:hover { background: #d4b650; }',
  ].join('\n');

  const winHtml = [
    '<div id="mushaf-titlebar">',
    '  <div class="titlebar-left">',
    '    <div class="titlebar-icon" style="font-family:\'Traditional Arabic\',serif">&#65021;</div>',
    '    <span class="titlebar-title"><span class="titlebar-title-ar">\u0627\u0644\u0645\u0635\u062D\u0641</span></span>',
    '  </div>',
    '  <div class="titlebar-center" id="tb-controls">',
    '    <button class="tb-btn" id="tb-index" data-tooltip="\u0641\u0647\u0631\u0633 \u0627\u0644\u0633\u0648\u0631"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5A2.5 2.5 0 0 1 4 19.5Z"/><path d="M8 2v20"/><path d="M8 13h7"/><path d="M8 9h5"/><path d="M8 17h9"/></svg></button>',
    '    <button class="tb-btn" id="tb-verse-range" data-tooltip="\u0646\u0637\u0627\u0642 \u0627\u0644\u0622\u064A\u0627\u062A"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z"/></svg></button>',
    '    <button class="tb-btn" id="tb-bookmarks" data-tooltip="\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062A \u0627\u0644\u0645\u0631\u062C\u0639\u064A\u0629"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg></button>',
    '    <button class="tb-btn" id="tb-tafsir" data-tooltip="\u0627\u0644\u062A\u0641\u0633\u064A\u0631"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20"/><path d="M8 2v20"/><path d="M12 6h4"/><path d="M12 10h7"/><path d="M12 14h5"/><path d="M12 18h3"/><path d="M8 14l4-4"/></svg></button>',
    '    <button class="tb-btn" id="tb-audio" data-tooltip="\u0645\u0634\u063A\u0644 \u0627\u0644\u0635\u0648\u062A"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5 6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg></button>',
    '    <button class="tb-btn" id="tb-autoscroll" data-tooltip="\u0627\u0644\u062A\u0645\u0631\u064A\u0631 \u0627\u0644\u062A\u0644\u0642\u0627\u0626\u064A"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="2" width="8" height="20" rx="4"/><path d="M12 6v.01"/><path d="M12 18h.01"/></svg></button>',
    '    <div class="tb-separator"></div>',
    '    <button class="tb-btn" id="tb-settings" data-tooltip="\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0639\u0631\u0636"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg></button>',
    '    <button class="tb-btn" id="tb-screen-mode" data-tooltip="\u0648\u0636\u0639 \u0627\u0644\u0634\u0627\u0634\u0629"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg></button>',
    '  </div>',
    '  <div class="titlebar-right">',
    '    <button class="win-btn" id="win-minimize" aria-label="\u062A\u0635\u063A\u064A\u0631"><svg viewBox="0 0 12 12"><rect y="5" width="12" height="1.5" fill="currentColor"/></svg></button>',
    '    <button class="win-btn" id="win-maximize" aria-label="\u062A\u0643\u0628\u064A\u0631"><svg viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg></button>',
    '    <button class="win-btn close" id="win-close" aria-label="\u0625\u063A\u0644\u0627\u0642"><svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" stroke-width="1.5" fill="none"/></svg></button>',
    '  </div>',
    '</div>',
    '<div id="mushaf-update-notif">',
    '  <span class="notif-text"><span style="color:#c9a84e;font-weight:bold;">&#10022;</span> \u064A\u062A\u0648\u0641\u0631 \u062A\u062D\u062F\u064A\u062B \u062C\u062F\u064A\u062F \u0644\u0644\u0645\u0635\u062D\u0641</span>',
    '  <button class="notif-btn" id="mushaf-update-btn">\u062A\u062D\u062F\u064A\u062B \u0627\u0644\u0622\u0646</button>',
    '  <button class="notif-btn" id="mushaf-update-dismiss" style="background:transparent;color:#8891a4;padding:6px 8px;">\u0644\u0627\u062D\u0642\u0627\u064B</button>',
    '</div>',
  ].join('\n');

  // ── Step 1: Inject CSS ──
  const cssJS = `
    (function(){
      var el = document.createElement('style');
      el.id = 'mushaf-desktop-styles';
      el.textContent = ${JSON.stringify(winCss)};
      document.head.appendChild(el);
    })();
  `;

  // ── Step 2: Inject HTML ──
  const htmlJS = `
    (function(){
      var temp = document.createElement('div');
      temp.innerHTML = ${JSON.stringify(winHtml)};
      while (temp.children.length > 0) {
        document.body.prepend(temp.children[0]);
      }
    })();
  `;

  // ── Step 3: Inject logic (wire buttons etc.) ──
  const logicJS = `
    (function(){
      var api = window.electronAPI;
      if (!api) return;

      // Window controls
      document.getElementById('win-minimize').addEventListener('click', function(){ api.minimize(); });
      document.getElementById('win-maximize').addEventListener('click', function(){ api.maximize(); });
      document.getElementById('win-close').addEventListener('click', function(){ api.close(); });

      api.onMaximizeChange(function(im) {
        var b = document.getElementById('win-maximize');
        if (!b) return;
        b.innerHTML = im
          ? '<svg viewBox="0 0 12 12"><rect x="2.5" y="2.5" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="1.5" y="1.5" width="7" height="7" rx="0.5" fill="none" stroke="currentColor" stroke-width="1.3" opacity="0.4"/></svg>'
          : '<svg viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';
      });

      // Mushaf buttons
      var btnMap = {
        'tb-index': '[data-testid="open-index-panel"]',
        'tb-verse-range': '[data-testid="open-verse-range-panel"]',
        'tb-bookmarks': '.mushaf-top-bar button[title*="Bookmark"],.mushaf-top-bar button[title*="\\\\u0627\\\\u0644\\\\u0625\\\\u0634\\\\u0627\\\\u0631\\\\u0627\\\\u062A"]',
        'tb-tafsir': '[data-testid="open-tafsir-panel"]',
        'tb-audio': '[data-testid="open-audio-panel"]',
        'tb-autoscroll': '.mushaf-top-bar button[title*="Auto"],.mushaf-top-bar button[title*="\\\\u0627\\\\u0644\\\\u062A\\\\u0645\\\\u0631\\\\u064A\\\\u0631"]',
        'tb-settings': '[data-testid="open-display-settings-panel"]',
        'tb-screen-mode': '.mushaf-top-bar button[title*="Screen"],.mushaf-top-bar button[title*="\\\\u0634\\\\u0627\\\\u0634\\\\u0629"]',
      };

      Object.keys(btnMap).forEach(function(id) {
        var btn = document.getElementById(id);
        if (!btn) return;
        btn.addEventListener('click', function(){
          var sel = btnMap[id];
          var target = document.querySelector(sel);
          if (target) target.click();
        });
      });

      // Active state mirror
      function mirrorActive(tbId, sel) {
        var tb = document.getElementById(tbId);
        if (!tb) return;
        function chk() {
          var el = document.querySelector(sel);
          if (!el) return;
          var act = el.classList.contains('active') || el.hasAttribute('data-active') || el.getAttribute('data-state') === 'open';
          tb.classList.toggle('active', act);
        }
        chk();
        setInterval(chk, 1200);
      }
      mirrorActive('tb-audio', '[data-testid="open-audio-panel"]');
      mirrorActive('tb-settings', '[data-testid="open-display-settings-panel"]');
      mirrorActive('tb-verse-range', '[data-testid="open-verse-range-panel"]');
      mirrorActive('tb-tafsir', '[data-testid="open-tafsir-panel"]');
      mirrorActive('tb-bookmarks', '.mushaf-top-bar button[title*="Bookmark"]');
      mirrorActive('tb-autoscroll', '.mushaf-top-bar button[title*="Auto"]');

      // Update notification
      api.checkUpdate().then(function(r) {
        if (!r || !r.hasUpdate) return;
        var n = document.getElementById('mushaf-update-notif');
        if (!n) return;
        n.classList.add('show');
      }).catch(function(){});
      document.getElementById('mushaf-update-dismiss').addEventListener('click', function(){
        document.getElementById('mushaf-update-notif').classList.remove('show');
      });
      document.getElementById('mushaf-update-btn').addEventListener('click', function(){
        location.reload();
      });
    })();
  `;

  // Execute in sequence
  Promise.resolve()
    .then(() => win.webContents.executeJavaScript(cssJS))
    .then(() => win.webContents.executeJavaScript(htmlJS))
    .then(() => win.webContents.executeJavaScript(logicJS))
    .then(() => console.log('[main] Titlebar injected successfully'))
    .catch((err) => console.error('[main] Titlebar injection failed:', err.message));
}
