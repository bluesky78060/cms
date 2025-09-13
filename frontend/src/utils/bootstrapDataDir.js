// bootstrapDataDir.js
// Electron 환경에서 로컬 폴더 기반 데이터 저장을 위한 부트스트랩 모듈

const fs = require('fs');
const fsp = fs.promises;
const path = require('path');
const os = require('os');

const APP_NAME = 'CMS';
const DEFAULT_DIRNAME = 'CMS-Data';
const REQUIRED_FOLDERS = ['users', 'projects', 'invoices', 'backups', 'security-keys'];
const INIT_MARKER = '.cms-init.json';

function pretty(p) { 
  return p.replace(os.homedir(), '~'); 
}

async function exists(p) {
  try { 
    await fsp.access(p, fs.constants.F_OK); 
    return true; 
  } catch { 
    return false; 
  }
}

async function ensureWritableDir(dir) {
  await fsp.mkdir(dir, { recursive: true });
  const testFile = path.join(dir, '.write-test-' + Date.now());
  try {
    await fsp.writeFile(testFile, 'ok', { flag: 'w' });
  } finally {
    try { 
      await fsp.rm(testFile, { force: true }); 
    } catch {}
  }
}

function getDocumentsDir() {
  // Electron에서 사용할 때: require('electron').app.getPath('documents')
  return path.join(os.homedir(), 'Documents');
}

function getDesktopDir() {
  // Electron에서 사용할 때: require('electron').app.getPath('desktop')
  return path.join(os.homedir(), 'Desktop');
}

function getPlatformUserDataDir() {
  // OS 표준 사용자 데이터 디렉토리
  const p = process.platform;
  if (p === 'win32') {
    const base = process.env.LOCALAPPDATA || process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Local');
    return path.join(base, APP_NAME, DEFAULT_DIRNAME);
  }
  if (p === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', APP_NAME, DEFAULT_DIRNAME);
  }
  // linux & others (XDG)
  const base = process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local', 'share');
  return path.join(base, APP_NAME, DEFAULT_DIRNAME);
}

async function tryCandidate(dir, problems) {
  try {
    await ensureWritableDir(dir);
    return dir;
  } catch (err) {
    problems.push({ dir, code: err.code || 'UNKNOWN', message: err.message });
    return null;
  }
}

async function resolveDataPath() {
  const problems = [];

  // 0) 사용자 지정 최우선
  const envDir = process.env.CMS_DATA_DIR;
  if (envDir) {
    const ok = await tryCandidate(envDir, problems);
    if (ok) return { dataPath: ok, problems };
  }

  // 1) Documents/CMS-Data
  const docsDir = getDocumentsDir();
  const docsTarget = path.join(docsDir, DEFAULT_DIRNAME);
  let ok = await tryCandidate(docsTarget, problems);
  if (ok) return { dataPath: ok, problems };

  // 2) OS 표준 userData
  ok = await tryCandidate(getPlatformUserDataDir(), problems);
  if (ok) return { dataPath: ok, problems };

  // 3) Desktop/CMS-Data (사용자 가시성 높음)
  ok = await tryCandidate(path.join(getDesktopDir(), DEFAULT_DIRNAME), problems);
  if (ok) return { dataPath: ok, problems };

  // 4) 최후의 보루: OS temp
  ok = await tryCandidate(path.join(os.tmpdir(), APP_NAME, DEFAULT_DIRNAME), problems);
  if (ok) return { dataPath: ok, problems };

  // 모두 실패
  const details = problems.map(p => `- ${pretty(p.dir)} [${p.code}] ${p.message}`).join('\n');
  throw new Error(`데이터 폴더 생성 실패:\n${details}`);
}

async function createInitialFolderStructure(root) {
  await Promise.all(REQUIRED_FOLDERS.map(async (name) => {
    await fsp.mkdir(path.join(root, name), { recursive: true });
  }));
}

async function writeInitMarker(root, extra = {}) {
  const markerPath = path.join(root, INIT_MARKER);
  const payload = {
    app: APP_NAME,
    createdAt: new Date().toISOString(),
    version: extra.version || '1.0.0',
    ...extra,
  };
  await fsp.writeFile(markerPath, JSON.stringify(payload, null, 2), 'utf-8');
}

async function isFirstRun(root) {
  return !(await exists(path.join(root, INIT_MARKER)));
}

function showWelcomeMessage(root) {
  console.log(`✅ 데이터 폴더가 준비되었습니다: ${pretty(root)}`);
  console.log(`   하위 폴더: ${REQUIRED_FOLDERS.join(', ')}`);
}

/**
 * 디스크 여유 공간 경고
 */
async function softSpaceCheck(root) {
  try {
    const big = Buffer.alloc(1024 * 1024); // 1MB
    const test = path.join(root, '.space-test');
    const fd = await fsp.open(test, 'w');
    try {
      for (let i = 0; i < 5; i++) { // 5MB만 써보며 에러 감지
        await fd.write(big);
      }
    } finally {
      await fd.close();
      await fsp.rm(test, { force: true });
    }
  } catch (err) {
    if (err && (err.code === 'ENOSPC' || err.message.includes('no space'))) {
      console.warn('⚠️ 디스크 여유 공간이 부족합니다. 일부 기능이 제한될 수 있습니다.');
    }
  }
}

/**
 * 앱 시작시 호출: 데이터 경로 해결 + 초기화
 */
async function bootstrapDataDir(options = {}) {
  const { dataPath, problems } = await resolveDataPath();

  const first = await isFirstRun(dataPath);
  if (first) {
    console.log('📁 CMS 데이터 폴더를 생성합니다...');
    await createInitialFolderStructure(dataPath);
    await writeInitMarker(dataPath, { version: options.version || '1.0.0' });
    showWelcomeMessage(dataPath);
  }

  await softSpaceCheck(dataPath);

  if (problems.length) {
    console.warn('다음 위치들은 사용 불가하여 폴백했습니다:');
    for (const p of problems) {
      console.warn(` - ${pretty(p.dir)} [${p.code}]`);
    }
  }

  return { dataPath, firstRun: first };
}

module.exports = {
  bootstrapDataDir,
  REQUIRED_FOLDERS,
};