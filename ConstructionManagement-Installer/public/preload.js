const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('cms', {
  storageGetSync: (key) => ipcRenderer.sendSync('cms:storage-get-sync', key),
  storageSet: (key, value) => ipcRenderer.send('cms:storage-set', key, value),
  getBaseDir: () => ipcRenderer.invoke('cms:get-base-dir'),
  chooseBaseDir: () => ipcRenderer.invoke('cms:choose-base-dir')
});

