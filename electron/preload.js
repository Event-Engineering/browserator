const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  listDisplays: () => ipcRenderer.invoke('display:list'),
  listWindows: () => ipcRenderer.invoke('window:list'),
  openWindow: (url, displayId) => ipcRenderer.invoke('window:open', { url, displayId }),
  closeWindow: (id) => ipcRenderer.invoke('window:close', { id }),
  refreshWindow: (id) => ipcRenderer.invoke('window:refresh', { id }),
  navigateWindow: (id, url) => ipcRenderer.invoke('window:navigate', { id, url }),
  blackoutWindow: (id, blackout) => ipcRenderer.invoke('window:blackout', { id, blackout }),
  setWindowVisibility: (id, hidden) => ipcRenderer.invoke('window:visibility', { id, hidden }),
  moveWindow: (id, displayId) => ipcRenderer.invoke('window:move', { id, displayId }),
  getThumbnail: (id) => ipcRenderer.invoke('window:thumbnail', { id }),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke('control:alwaysontop', { enabled }),
  onWindowsUpdated: (callback) => {
    const handler = (_, windows) => callback(windows)
    ipcRenderer.on('windows:updated', handler)
    return () => ipcRenderer.removeListener('windows:updated', handler)
  },
  onDisplaysUpdated: (callback) => {
    const handler = (_, displays) => callback(displays)
    ipcRenderer.on('displays:updated', handler)
    return () => ipcRenderer.removeListener('displays:updated', handler)
  }
})
