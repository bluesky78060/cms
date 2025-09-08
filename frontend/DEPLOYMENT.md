# 건설 청구서 관리 시스템 배포 가이드

## 개요
이 React 웹 애플리케이션을 Windows와 Mac에서 실행할 수 있는 여러 방법을 제시합니다.

## 방법 1: 웹 애플리케이션 배포 (추천)

### 1-A. 로컬 서버 실행

1. **개발 서버로 실행**
```bash
npm start
```
- 브라우저에서 `http://localhost:3000` 접속
- 코드 변경 시 자동 새로고침

2. **프로덕션 빌드로 실행**
```bash
npm run build
npm install -g serve
serve -s build
```
- 최적화된 버전으로 실행
- 브라우저에서 `http://localhost:3000` 접속

### 1-B. 무료 호스팅 서비스 배포

#### Netlify (추천)
1. [netlify.com](https://netlify.com) 가입
2. GitHub에 코드 업로드
3. Netlify에서 "New site from Git" 선택
4. 빌드 설정:
   - Build command: `npm run build`
   - Publish directory: `build`

#### Vercel
1. [vercel.com](https://vercel.com) 가입
2. GitHub 연결 후 자동 배포
3. 빌드 설정 자동 감지

#### GitHub Pages
```bash
npm install --save-dev gh-pages
```
package.json에 추가:
```json
{
  "homepage": "https://사용자명.github.io/저장소명",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```
배포: `npm run deploy`

## 방법 2: 데스크톱 애플리케이션 변환

### Electron 사용 (네이티브 앱)

1. **Electron 설치**
```bash
npm install --save-dev electron electron-builder
```

2. **main.js 파일 생성**
```javascript
// public/electron.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );
}

app.whenReady().then(createWindow);
```

3. **package.json 스크립트 추가**
```json
{
  "main": "public/electron.js",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:3000 && electron .\"",
    "build-electron": "npm run build && electron-builder",
    "dist": "npm run build && electron-builder --publish=never"
  },
  "build": {
    "appId": "com.construction.invoice",
    "productName": "건설 청구서 관리",
    "directories": {
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*",
      "public/electron.js"
    ]
  }
}
```

## 방법 3: PWA (Progressive Web App)

현재 프로젝트에 PWA 기능 추가:

1. **Manifest 파일 확인** (public/manifest.json)
2. **Service Worker 활성화**
```javascript
// src/index.js
import { register } from './serviceWorkerRegistration';
register();
```

3. **오프라인 사용 가능**
4. **모바일에서 "홈 화면에 추가" 가능**

## 권장 사항

### 개발/테스트용
- `npm start` 로 로컬 개발 서버 실행

### 내부 사용용
- Netlify 또는 Vercel로 무료 호스팅
- 팀 내부에서 URL로 접근

### 상용 서비스용
- AWS, Azure, Google Cloud 등 클라우드 서비스
- 도메인 연결 및 HTTPS 설정

### 오프라인 사용이 필요한 경우
- Electron으로 데스크톱 앱 생성
- Windows: .exe 파일
- Mac: .dmg 파일

## 실행 방법 요약

### Windows & Mac 공통
1. **Node.js 설치** (v14 이상)
2. **프로젝트 다운로드**
```bash
git clone [저장소 URL]
cd construction-management-system/frontend
npm install
npm start
```
3. **브라우저에서 http://localhost:3000 접속**

### 배포된 웹 서비스 접근
- 인터넷 연결만 있으면 어떤 OS에서든 브라우저로 접근 가능
- 모바일에서도 사용 가능

## 문제 해결

### Node.js 버전 문제
```bash
node --version  # v14 이상 확인
npm --version   # v6 이상 확인
```

### 포트 충돌
```bash
npm start -- --port 3001  # 다른 포트 사용
```

### 방화벽/보안 소프트웨어
- 3000번 포트 허용 설정
- 바이러스 백신 예외 설정