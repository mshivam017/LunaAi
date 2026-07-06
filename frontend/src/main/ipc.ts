import { ipcMain, BrowserWindow } from 'electron'

export function setupIpcListeners(mainWindow: BrowserWindow) {
  ipcMain.on('window-minimize', () => {
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    mainWindow.close()
  })

  ipcMain.on('window-toggle-float', (_, enable: boolean) => {
    mainWindow.setAlwaysOnTop(enable)
    if (enable) {
      mainWindow.setSize(380, 600)
      mainWindow.setResizable(false)
    } else {
      mainWindow.setSize(1200, 800)
      mainWindow.setResizable(true)
      mainWindow.center()
    }
  })
}
