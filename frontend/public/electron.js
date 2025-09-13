const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { bootstrapDataDir } = require('../src/utils/bootstrapDataDir');

// 전역 데이터 경로 변수
let globalDataPath = null;

function createWindow() {
  // 메인 윈도우 생성
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
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

// IPC 핸들러 설정
function setupIpcHandlers() {
  // 데이터 경로 가져오기
  ipcMain.handle('get-data-path', () => {
    return globalDataPath;
  });
  
  // 시스템 정보 가져오기
  ipcMain.handle('get-system-info', () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: process.version,
      appVersion: app.getVersion()
    };
  });
}

// 앱 초기화 함수
async function initializeApp() {
  try {
    console.log('📁 데이터 폴더 초기화 중...');
    
    // 데이터 디렉토리 부트스트랩
    const { dataPath, firstRun } = await bootstrapDataDir({ 
      version: app.getVersion() || '1.0.0' 
    });
    
    globalDataPath = dataPath;
    
    console.log(`✅ 데이터 폴더 준비 완료: ${dataPath}`);
    if (firstRun) {
      console.log('🎉 첫 실행: 초기 설정이 완료되었습니다.');
    }
    
    // IPC 핸들러 설정
    setupIpcHandlers();
    
    // 윈도우 생성
    createWindow();
    
  } catch (error) {
    console.error('❌ 앱 초기화 실패:', error);
    
    // 오류 다이얼로그 표시
    const { dialog } = require('electron');
    await dialog.showErrorBox(
      'CMS 초기화 실패', 
      `데이터 폴더 생성에 실패했습니다:\n\n${error.message}\n\n앱을 종료합니다.`
    );
    
    app.quit();
  }
}

// 앱이 준비되면 초기화 시작
app.whenReady().then(initializeApp);

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