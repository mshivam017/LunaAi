export interface ILunaIPC {
  minimizeWindow: () => void
  maximizeWindow: () => void
  closeWindow: () => void
  toggleFloat: (enable: boolean) => void
  onShortcutTriggered: (callback: () => void) => () => void
}

declare global {
  interface Window {
    lunaIPC?: ILunaIPC
  }
}
