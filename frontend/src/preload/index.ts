import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('lunaIPC', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleFloat: (enable: boolean) => ipcRenderer.send('window-toggle-float', enable),
  onShortcutTriggered: (callback: () => void) => {
    const subscription = () => callback()
    ipcRenderer.on('shortcut-activated', subscription)
    return () => {
      ipcRenderer.removeListener('shortcut-activated', subscription)
    }
  }
})
