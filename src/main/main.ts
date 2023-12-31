/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
const {
  BrowserWindow,
  app,
  ipcMain,
  shell,
  dialog,
  powerMonitor,
} = require('electron');
const log = require('electron-log');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
const {
  closeSerialPort,
  getSerialPorts,
  setSerialPort,
  setBaudRate,
  recordStart,
  recordStop,
} = require('./electron-src/lib/serialManager');
const { resolveHtmlPath } = require('./util');

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
let subWindowRealtimeDataLogger: BrowserWindow | null = null;
let subWindowDataViewer: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    title: 'Serial Plot Tools',
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();

  ipcMain.handle('openRealtimeDataLogger', () => {
    const { screen } = require('electron');

    // Create a window that fills the screen's available work area.
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    subWindowRealtimeDataLogger = new BrowserWindow({
      title: 'Realtime Data Logger',
      width: width,
      height: height,
      icon: getAssetPath('icon.png'),
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
      },
    });
    subWindowRealtimeDataLogger.loadURL(
      resolveHtmlPath('index.html', '/DataLogger')
    );

    subWindowRealtimeDataLogger.on('close', () => {
      closeSerialPort();
    });

    powerMonitor.on('suspend', () => {
      console.log('System suspended');
      closeSerialPort();
      subWindowRealtimeDataLogger.send('close', true);
    });
  });

  ipcMain.handle('openDataViewer', () => {
    const { screen } = require('electron');

    // Create a window that fills the screen's available work area.
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    subWindowDataViewer = new BrowserWindow({
      title: 'Data Viewer',
      width: width,
      height: height,
      icon: getAssetPath('icon.png'),
      webPreferences: {
        preload: app.isPackaged
          ? path.join(__dirname, 'preload.js')
          : path.join(__dirname, '../../.erb/dll/preload.js'),
      },
    });
    subWindowDataViewer.loadURL(resolveHtmlPath('index.html', '/DataViewer'));
  });

  ipcMain.handle('getSerialPorts', async (_e, _arg) => {
    return await getSerialPorts();
  });

  ipcMain.handle('setSerialPort', async (_e, _arg) => {
    return await setSerialPort(_arg, subWindowRealtimeDataLogger.webContents);
  });

  ipcMain.handle('setBaudRate', async (_e, _arg) => {
    return await setBaudRate(_arg, subWindowRealtimeDataLogger.webContents);
  });

  ipcMain.handle('recordStart', async (_e, _arg) => {
    return await recordStart(_arg, subWindowRealtimeDataLogger.webContents);
  });

  ipcMain.handle('recordStop', async (_e, _arg) => {
    return await recordStop(_arg, subWindowRealtimeDataLogger.webContents);
  });

  ipcMain.handle('closeSerialPort', async (_e, _arg) => {
    return closeSerialPort();
  });

  ipcMain.handle('openSaveFolder', async (_e, _arg) => {
    const filePath = _arg;
    const folderPath = path.dirname(filePath);
    shell.openPath(folderPath);
    return '';
  });

  ipcMain.handle('openFileDialog', async () => {
    return dialog
      .showOpenDialog(subWindowDataViewer, {
        properties: ['openFile'],
        title: 'ファイルを選択する',
        filters: [
          {
            name: 'csvファイル',
            extensions: ['csv'],
          },
        ],
      })
      .then((result) => {
        if (result.canceled) return;
        return result.filePaths[0];
      })
      .catch((err) => console.log(`Error: ${err}`));
  });

  ipcMain.handle('loadData', async (_e, _arg) => {
    const rawData = fs.readFileSync(_arg);
    // 1行目はheader
    const header = parse(rawData, { to_line: 1 })[0];
    // 2行目以降を配列にする
    const data = transpose(parse(rawData, { from_line: 2 }));
    return [header, data];
  });

  const transpose = (a) => a[0].map((_, c) => a.map((r) => r[c]));
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
