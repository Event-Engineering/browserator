const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')

let controlWindow = null
const browserWindows = new Map() // id -> { win, url, displayId }
let nextId = 1

// ── Control window ────────────────────────────────────────────

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 960,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    title: 'Browserator',
    backgroundColor: '#0d1117'
  })

  if (process.platform === 'darwin') {
    controlWindow.setAlwaysOnTop(true, 'screen-saver')
  } else {
    controlWindow.setAlwaysOnTop(true)
  }

  // dev: loads from Vite dev server; prod: loads built dist
  const isDev = process.env.npm_lifecycle_event === 'dev'
  const url = isDev
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../dist/index.html')}`

  controlWindow.loadURL(url)

  if (isDev) {
    controlWindow.webContents.openDevTools({ mode: 'detach' })
  }

  controlWindow.on('closed', () => {
    controlWindow = null
    app.quit()
  })
}

// ── Helpers ───────────────────────────────────────────────────

function notifyControlWindow() {
  if (!controlWindow || controlWindow.isDestroyed()) return
  controlWindow.webContents.send('windows:updated', buildWindowList())
}

function buildWindowList() {
  return Array.from(browserWindows.entries()).map(([id, data]) => ({
    id,
    url: data.url,
    displayId: data.displayId
  }))
}

function exitFullscreen(win) {
  return new Promise(resolve => {
    if (process.platform === 'darwin') {
      win.setSimpleFullScreen(false)
      setTimeout(resolve, 400)
    } else if (win.isFullScreen()) {
      win.once('leave-full-screen', resolve)
      win.setFullScreen(false)
    } else {
      resolve()
    }
  })
}

function enterFullscreen(win) {
  return new Promise(resolve => {
    if (process.platform === 'darwin') {
      win.setSimpleFullScreen(true)
      setTimeout(resolve, 200)
    } else {
      win.once('enter-full-screen', resolve)
      win.setFullScreen(true)
    }
  })
}

// ── IPC: displays ─────────────────────────────────────────────

ipcMain.handle('display:list', () => {
  const primaryId = screen.getPrimaryDisplay().id
  return screen.getAllDisplays().map((d, i) => ({
    id: d.id,
    bounds: d.bounds,
    scaleFactor: d.scaleFactor,
    label: d.label || `Display ${i + 1}`,
    isPrimary: d.id === primaryId
  }))
})

// ── IPC: windows ──────────────────────────────────────────────

ipcMain.handle('window:list', () => buildWindowList())

ipcMain.handle('window:open', (_, { url, displayId }) => {
  const displays = screen.getAllDisplays()
  const display = displays.find(d => d.id === displayId) || screen.getPrimaryDisplay()

  const win = new BrowserWindow({
    x: display.bounds.x,
    y: display.bounds.y,
    width: display.bounds.width,
    height: display.bounds.height,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.loadURL(url)

  if (process.platform === 'darwin') {
    win.setSimpleFullScreen(true)
  } else {
    win.setFullScreen(true)
  }

  const id = nextId++
  browserWindows.set(id, { win, url, displayId: display.id })

  win.on('closed', () => {
    browserWindows.delete(id)
    notifyControlWindow()
  })

  notifyControlWindow()
  return id
})

ipcMain.handle('window:close', (_, { id }) => {
  const data = browserWindows.get(id)
  if (data && !data.win.isDestroyed()) data.win.close()
})

ipcMain.handle('window:refresh', (_, { id }) => {
  const data = browserWindows.get(id)
  if (data && !data.win.isDestroyed()) data.win.webContents.reload()
})

ipcMain.handle('window:move', async (_, { id, displayId }) => {
  const data = browserWindows.get(id)
  if (!data || data.win.isDestroyed()) return

  const display = screen.getAllDisplays().find(d => d.id === displayId)
  if (!display) return

  await exitFullscreen(data.win)
  data.win.setBounds(display.bounds)
  await enterFullscreen(data.win)

  data.displayId = displayId
  notifyControlWindow()
})

ipcMain.handle('window:thumbnail', async (_, { id }) => {
  const data = browserWindows.get(id)
  if (!data || data.win.isDestroyed()) return null
  try {
    const img = await data.win.webContents.capturePage()
    return img.toDataURL()
  } catch {
    return null
  }
})

// ── App lifecycle ─────────────────────────────────────────────

app.whenReady().then(createControlWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!controlWindow) createControlWindow()
})
