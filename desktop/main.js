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
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on('update-available', (info) => {
  if (mainWindow) {
    mainWindow.webContents.executeJavaScript(
      `console.log('[updater] Update available: ${info.version}')`
    );
  }
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Aggiornamento disponibile',
    message: `Versione ${info.version} scaricata. L'app si riavvierà per installare l'aggiornamento.`,
    buttons: ['Riavvia ora', 'Più tardi'],
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (err) => {
  console.log('[updater] Error:', err.message);
});

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

    const nodeExe = process.execPath.includes('electron')
      ? 'node'  // In dev, use system node
      : process.execPath; // In packaged app, won't work — use bundled node

    // In production, we use the node binary from the system or bundled
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: String(PORT),
      // Tell Sails to use user's appdata for DB, config, logs
      FORUM_DATA_DIR: USER_DATA_DIR,
    };

    console.log(`[desktop] Starting Sails from: ${appRoot}`);

    sailsProcess = spawn('node', ['app.js'], {
      cwd: appRoot,
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    sailsProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log('[sails]', msg.trim());
      if (msg.includes('Server lifted') || msg.includes('Sails lifted')) {
        resolve();
      }
    });

    sailsProcess.stderr.on('data', (data) => {
      console.error('[sails:err]', data.toString().trim());
    });

    sailsProcess.on('error', (err) => {
      console.error('[sails] Failed to start:', err.message);
      reject(err);
    });

    sailsProcess.on('exit', (code) => {
      console.log('[sails] Exited with code:', code);
      sailsProcess = null;
    });

    // Fallback: resolve after port is available
    waitForPort(PORT, 30000).then(resolve).catch(reject);
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

  // Check for updates (non-blocking)
  if (!isDev) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch(() => {});
    }, 5000);
  }
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
