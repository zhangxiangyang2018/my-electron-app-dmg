const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  versions: {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
  },
  getStats: () => ipcRenderer.invoke('get-stats'),
  setTheme: (theme) => ipcRenderer.send('set-theme', theme)
})
