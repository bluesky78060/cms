const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

// Base data directory (can be overridden later)
let baseDataDir = path.join(app.getPath('userData'), 'cms-data');

function ensureDir(dir) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {}
}

function getStorePath() {
  ensureDir(baseDataDir);
  return path.join(baseDataDir, 'store.json');
}

function readStore() {
  const p = getStorePath();
  try {
    if (!fs.existsSync(p)) return {};
    const text = fs.readFileSync(p, 'utf-8');
    return JSON.parse(text || '{}');
  } catch (e) {
    return {};
  }
}

function writeStore(obj) {
  const p = getStorePath();
  try {
    fs.writeFileSync(p, JSON.stringify(obj, null, 2), 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

function createWindow() {
  // 메인 윈도우 생성
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'favicon.ico'), // 아이콘 설정
    title: '건설 청구서 관리 시스템',
    show: false // 준비될 때까지 숨김
  });

  // 개발 모드에서는 localhost, 프로덕션에서는 빌드된 파일 로드
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // 윈도우가 준비되면 보여줌
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // 개발 모드에서는 개발자 도구 열기
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // 윈도우가 닫힐 때 앱 종료 (macOS 제외)
  mainWindow.on('closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 메뉴 설정
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: '파일',
      submenu: [
        {
          label: '새 청구서',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // 새 청구서 기능
          }
        },
        {
          label: '인쇄',
          accelerator: 'CmdOrCtrl+P',
          click: () => {
            BrowserWindow.getFocusedWindow()?.webContents.print();
          }
        },
        { type: 'separator' },
        {
          label: '종료',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: '보기',
      submenu: [
        { role: 'reload', label: '새로고침' },
        { role: 'forceReload', label: '강제 새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '확대/축소 초기화' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: '전체화면' }
      ]
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '정보',
          click: () => {
            // 앱 정보 표시
          }
        }
      ]
    }
  ];

  // macOS용 메뉴 조정
  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about', label: '정보' },
        { type: 'separator' },
        { role: 'services', label: '서비스' },
        { type: 'separator' },
        { role: 'hide', label: '숨기기' },
        { role: 'hideothers', label: '다른 항목 숨기기' },
        { role: 'unhide', label: '모두 보기' },
        { type: 'separator' },
        { role: 'quit', label: '종료' }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// 앱이 준비되면 윈도우 생성
app.whenReady().then(createWindow);

// 모든 윈도우가 닫혔을 때
app.on('window-all-closed', () => {
  // macOS에서는 Cmd+Q로 명시적으로 종료하기 전까지 앱을 활성 상태로 유지
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // macOS에서 dock 아이콘을 클릭했을 때 윈도우가 없으면 새로 생성
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// 보안: 새 윈도우 생성 방지
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (navigationEvent, navigationUrl) => {
    navigationEvent.preventDefault();
  });
});

// IPC handlers for storage
ipcMain.on('cms:storage-get-sync', (event, key) => {
  const store = readStore();
  event.returnValue = store[key] ?? null;
});

ipcMain.on('cms:storage-set', (event, key, value) => {
  const store = readStore();
  store[key] = value;
  writeStore(store);
});

ipcMain.handle('cms:get-base-dir', async () => baseDataDir);
ipcMain.handle('cms:choose-base-dir', async () => {
  const res = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] });
  if (res.canceled || !res.filePaths || res.filePaths.length === 0) return baseDataDir;
  baseDataDir = res.filePaths[0];
  return baseDataDir;
});
