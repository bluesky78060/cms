// Experimental browser folder storage using File System Access API (Edge/Chrome)

const DB_NAME = 'cms-fs';
const STORE = 'handles';
const DIR_KEY = 'dirHandle';

function isSupported() {
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const st = tx.objectStore(STORE);
    const req = st.get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const st = tx.objectStore(STORE);
    const req = st.put(value, key);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function getSavedDirectoryHandle() {
  if (!isSupported()) return null;
  try {
    const handle = await idbGet(DIR_KEY);
    return handle || null;
  } catch (e) {
    return null;
  }
}

async function saveDirectoryHandle(handle) {
  if (!isSupported()) return false;
  try {
    await idbSet(DIR_KEY, handle);
    return true;
  } catch (e) {
    return false;
  }
}

async function verifyPermission(handle, mode = 'readwrite') {
  if (!handle) return false;
  if (await handle.queryPermission({ mode }) === 'granted') return true;
  if (await handle.requestPermission({ mode }) === 'granted') return true;
  return false;
}

async function chooseDirectory() {
  if (!isSupported()) return null;
  try {
    const handle = await window.showDirectoryPicker({ id: 'cms-data' });
    if (!(await verifyPermission(handle, 'readwrite'))) return null;
    await saveDirectoryHandle(handle);
    return handle;
  } catch (e) {
    return null;
  }
}

async function getFileHandle(dirHandle, name) {
  return await dirHandle.getFileHandle(name, { create: true });
}

async function readKey(dirHandle, key) {
  try {
    if (!dirHandle) dirHandle = await getSavedDirectoryHandle();
    if (!dirHandle) return null;
    if (!(await verifyPermission(dirHandle, 'read'))) return null;
    const fileHandle = await getFileHandle(dirHandle, `${key}.json`);
    const file = await fileHandle.getFile();
    const text = await file.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (e) {
    return null;
  }
}

async function writeKey(dirHandle, key, obj) {
  try {
    if (!dirHandle) dirHandle = await getSavedDirectoryHandle();
    if (!dirHandle) return false;
    if (!(await verifyPermission(dirHandle, 'readwrite'))) return false;
    const fileHandle = await getFileHandle(dirHandle, `${key}.json`);
    const writable = await fileHandle.createWritable();
    await writable.write(new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' }));
    await writable.close();
    return true;
  } catch (e) {
    return false;
  }
}

async function writeKeyDirect(key, value) {
  const dir = await getSavedDirectoryHandle();
  if (!dir) return false;
  return await writeKey(dir, key, value);
}

export const browserFs = {
  isSupported,
  getSavedDirectoryHandle,
  saveDirectoryHandle,
  chooseDirectory,
  readKey,
  writeKey,
  writeKeyDirect,
};
