import { app, BrowserWindow, globalShortcut, Menu, Tray } from 'electron'
import { join } from 'path'
import { startBackend, killBackend } from './process'
import { setupIpcListeners } from './ipc'

let mainWindow: BrowserWindow | null = null
let tray: Tray | null = null

const isDev = process.argv.includes('--dev')

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    frame: false, // frameless for custom modern header
    titleBarStyle: 'hidden',
    transparent: false,
    backgroundColor: '#05050A',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Setup custom IPC window management listeners
  setupIpcListeners(mainWindow)

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  } else {
    mainWindow.loadFile(join(__dirname, '../../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// System Tray Integration
function createTray() {
  // Use a fallback built-in indicator or small asset if icon doesn't exist
  // We can create a simple tray context menu
  const trayMenu = Menu.buildFromTemplate([
    {
      label: 'Show Luna',
      click: () => {
        mainWindow?.show()
        mainWindow?.focus()
      }
    },
    {
      label: 'Toggle Float Mode',
      click: () => {
        mainWindow?.webContents.send('shortcut-activated')
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
  ])

  // Create an empty tray placeholder to avoid crashing if no icon path exists
  // Typically, you'd load a .ico file. For now, we'll try/catch it gracefully
  try {
    // Just a placeholder, we can create a blank icon or load a default
    // We handle it gracefully so it doesn't crash on startup if missing
    tray = new Tray(join(__dirname, '../../assets/icon.png'))
    tray.setToolTip('Luna AI Assistant')
    tray.setContextMenu(trayMenu)
    tray.on('double-click', () => {
      mainWindow?.show()
      mainWindow?.focus()
    })
  } catch (err) {
    console.warn('System tray icon could not be loaded, skipping tray creation:', err)
  }
}

// Application Lifecycle management
app.whenReady().then(async () => {
  // Start FastAPI Python backend first
  try {
    await startBackend(isDev)
  } catch (err) {
    console.error('Failed to start FastAPI backend:', err)
  }

  // Create UI Window
  createWindow()
  createTray()

  // Register Global Hotkey Alt+Space to toggle assistant visibility
  globalShortcut.register('Alt+Space', () => {
    if (mainWindow) {
      if (mainWindow.isVisible() && mainWindow.isFocused()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })
})

app.on('window-all-closed', () => {
  // Respect macOS conventions but clean up backend on Windows/Linux
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  // Gracefully terminate Python process
  killBackend()
  globalShortcut.unregisterAll()
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
