const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  listDisplays: () => ipcRenderer.invoke('display:list'),
  listWindows: () => ipcRenderer.invoke('window:list'),
  openWindow: (url, displayId) => ipcRenderer.invoke('window:open', { url, displayId }),
  closeWindow: (id) => ipcRenderer.invoke('window:close', { id }),
  refreshWindow: (id) => ipcRenderer.invoke('window:refresh', { id }),
  moveWindow: (id, displayId) => ipcRenderer.invoke('window:move', { id, displayId }),
  getThumbnail: (id) => ipcRenderer.invoke('window:thumbnail', { id }),
  onWindowsUpdated: (callback) => {
    const handler = (_, windows) => callback(windows)
    ipcRenderer.on('windows:updated', handler)
    return () => ipcRenderer.removeListener('windows:updated', handler)
  }
})
