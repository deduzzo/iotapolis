const { app, BrowserWindow, shell, dialog, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const { spawn } = require('child_process');
const net = require('net');

// ── Config ──────────────────────────────────────────────────────────
const PORT = 1337;
const isDev = process.argv.includes('--dev');
let sailsProcess = null;
let mainWindow = null;

// User data directory: ~/AppData/iota-free-forum (Win), ~/Library/Application Support/iota-free-forum (Mac), ~/.config/iota-free-forum (Linux)
const USER_DATA_DIR = path.join(app.getPath('userData'), 'forum-data');
const fs = require('fs');
if (!fs.existsSync(USER_DATA_DIR)) {
  fs.mkdirSync(USER_DATA_DIR, { recursive: true });
}

// ── Auto-updater ────────────────────────────────────────────────────
autoUpdater.autoDownload = false; // Don't download until user clicks
autoUpdater.autoInstallOnAppQuit = true;

function logToRenderer(msg) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.executeJavaScript(`console.log('[electron] ${msg.replace(/'/g, "\\'").replace(/\n/g, ' ')}')`).catch(() => {});
  }
}

function sendUpdateEvent(event, data = {}) {
  logToRenderer(`update event: ${event}`);
  if (mainWindow && !mainWindow.isDestroyed()) {
    // Use base64 to avoid broken JS from HTML/quotes in releaseNotes
    const cleanData = { event, ...data };
    delete cleanData.releaseNotes; // Strip HTML release notes — not needed in UI
    const b64 = Buffer.from(JSON.stringify(cleanData)).toString('base64');
    mainWindow.webContents.executeJavaScript(`
      (function() {
        var d = JSON.parse(atob('${b64}'));
        window.__latestUpdateEvent = d;
        window.dispatchEvent(new CustomEvent('electron-update', { detail: d }));
      })();
    `).catch((err) => console.log('[updater] sendEvent error:', err.message));
  }
}

autoUpdater.on('checking-for-update', () => {
  console.log('[updater] Checking for updates...');
  sendUpdateEvent('checking');
});

autoUpdater.on('update-available', (info) => {
  console.log('[updater] Update available:', info.version);
  sendUpdateEvent('available', { version: info.version });
  // Native dialog — reliable fallback
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Aggiornamento disponibile',
    message: `Nuova versione ${info.version} disponibile. Scaricare ora?`,
    buttons: ['Scarica', 'Più tardi'],
    defaultId: 0,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', () => {
  console.log('[updater] No updates available');
  sendUpdateEvent('not-available');
});

autoUpdater.on('download-progress', (progress) => {
  const pct = Math.round(progress.percent);
  logToRenderer(`Download: ${pct}%`);
  // Update title bar with progress
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle(`IOTA Free Forum — Downloading update ${pct}%`);
  }
});

autoUpdater.on('update-downloaded', (info) => {
  console.log('[updater] Update downloaded:', info.version);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setTitle('IOTA Free Forum');
  }
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Aggiornamento pronto',
    message: `Versione ${info.version} scaricata. Riavviare ora per installare?`,
    buttons: ['Riavvia ora', 'Più tardi'],
    defaultId: 0,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.log('[updater] Error:', err.message);
  sendUpdateEvent('error', { message: err.message });
});

// Listen for renderer commands via custom protocol
function setupUpdateIPC() {
  if (!mainWindow) return;
  mainWindow.webContents.on('ipc-message', (event, channel) => {
    if (channel === 'update-download') autoUpdater.downloadUpdate();
    if (channel === 'update-install') autoUpdater.quitAndInstall();
  });
  // Also listen via executeJavaScript polling
  setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.executeJavaScript('window.__electronUpdateAction || null')
      .then((action) => {
        if (!action) return;
        mainWindow.webContents.executeJavaScript('window.__electronUpdateAction = null');
        if (action === 'download') autoUpdater.downloadUpdate();
        if (action === 'install') autoUpdater.quitAndInstall();
      })
      .catch(() => {});
  }, 1000);
}

// ── Port checker ────────────────────────────────────────────────────
function waitForPort(port, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function check() {
      const socket = new net.Socket();
      socket.setTimeout(500);
      socket.on('connect', () => {
        socket.destroy();
        resolve();
      });
      socket.on('error', () => {
        socket.destroy();
        if (Date.now() - start > timeout) {
          reject(new Error(`Timeout waiting for port ${port}`));
        } else {
          setTimeout(check, 300);
        }
      });
      socket.on('timeout', () => {
        socket.destroy();
        setTimeout(check, 300);
      });
      socket.connect(port, '127.0.0.1');
    }
    check();
  });
}

// ── Start Sails server ──────────────────────────────────────────────
function startSails() {
  return new Promise((resolve, reject) => {
    const appRoot = isDev
      ? path.resolve(__dirname, '..')
      : path.resolve(process.resourcesPath, 'app-server');

    console.log(`[desktop] Starting Sails from: ${appRoot}`);

    // Set environment
    process.env.NODE_ENV = 'production';
    process.env.PORT = String(PORT);
    process.env.FORUM_DATA_DIR = USER_DATA_DIR;

    // Change working directory to app root (Sails needs this)
    process.chdir(appRoot);

    // Load Sails directly in Electron's Node.js process (no spawn needed)
    try {
      const sails = require(path.join(appRoot, 'node_modules', 'sails'));
      sails.lift({
        port: PORT,
        environment: 'production',
        log: { level: 'info' },
        hooks: {
          grunt: false, // No grunt in production
        },
      }, (err) => {
        if (err) {
          console.error('[sails] Lift error:', err.message);
          reject(err);
        } else {
          console.log('[sails] Server lifted on port', PORT);
          resolve();
        }
      });
    } catch (err) {
      console.error('[sails] Failed to require sails:', err.message);
      // Fallback: try spawning node if available (dev mode)
      if (isDev) {
        const child = spawn('node', ['app.js'], {
          cwd: appRoot,
          env: process.env,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
        sailsProcess = child;
        child.stdout.on('data', (d) => console.log('[sails]', d.toString().trim()));
        child.stderr.on('data', (d) => console.error('[sails:err]', d.toString().trim()));
        child.on('error', reject);
        waitForPort(PORT, 30000).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    }
  });
}

// ── Create window ───────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'IOTA Free Forum',
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
  });

  mainWindow.loadURL(`http://127.0.0.1:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ── App menu ────────────────────────────────────────────────────────
function createMenu() {
  const template = [
    {
      label: 'IOTA Free Forum',
      submenu: [
        { label: 'Controlla aggiornamenti', click: () => autoUpdater.checkForUpdates() },
        { type: 'separator' },
        { role: 'quit', label: 'Esci' },
      ],
    },
    {
      label: 'Modifica',
      submenu: [
        { role: 'undo' }, { role: 'redo' }, { type: 'separator' },
        { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' },
      ],
    },
    {
      label: 'Vista',
      submenu: [
        { role: 'reload' }, { role: 'forceReload' },
        { role: 'toggleDevTools' }, { type: 'separator' },
        { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'resetZoom' },
        { type: 'separator' }, { role: 'togglefullscreen' },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ── App lifecycle ───────────────────────────────────────────────────
app.on('ready', async () => {
  createMenu();

  try {
    console.log('[desktop] Starting Sails server...');
    await startSails();
    console.log('[desktop] Sails ready, opening window...');
  } catch (err) {
    console.error('[desktop] Failed to start server:', err.message);
    dialog.showErrorBox('Errore avvio server', `Non è stato possibile avviare il server: ${err.message}`);
  }

  createWindow();
  setupUpdateIPC();

  // Check for updates at startup (non-blocking)
  setTimeout(() => {
    logToRenderer('Checking for updates...');
    autoUpdater.checkForUpdates().then((result) => {
      logToRenderer('Check result: ' + (result?.updateInfo?.version || 'no update info'));
    }).catch((err) => {
      logToRenderer('Check FAILED: ' + err.message);
    });
  }, 5000);
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (sailsProcess) {
    console.log('[desktop] Killing Sails process...');
    sailsProcess.kill('SIGTERM');
    sailsProcess = null;
  }
});
