import { create } from 'zustand'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'warning' | 'error' | 'info'
  duration?: number
}

interface UIState {
  currentView: 'onboarding' | 'dashboard'
  activeTab: 'chat' | 'notes' | 'memory' | 'settings' | 'privacy'
  isFloating: boolean
  toasts: Toast[]
  showCommandPalette: boolean
  
  setViewState: (view: 'onboarding' | 'dashboard') => void
  setActiveTab: (tab: 'chat' | 'notes' | 'memory' | 'settings' | 'privacy') => void
  toggleFloating: () => void
  addToast: (message: string, type: Toast['type'], duration?: number) => void
  removeToast: (id: string) => void
  setShowCommandPalette: (show: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  currentView: localStorage.getItem('luna_onboarded') === 'true' ? 'dashboard' : 'onboarding',
  activeTab: 'chat',
  isFloating: false,
  toasts: [],
  showCommandPalette: false,

  setViewState: (view) => {
    if (view === 'dashboard') {
      localStorage.setItem('luna_onboarded', 'true')
    }
    set({ currentView: view })
  },
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  toggleFloating: () => {
    const nextFloating = !get().isFloating
    set({ isFloating: nextFloating })
    // Trigger IPC window resizing and locking in Electron Main
    if (window.lunaIPC) {
      window.lunaIPC.toggleFloat(nextFloating)
    }
  },
  
  addToast: (message, type, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9)
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }))
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },
  
  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter((t) => t.id !== id)
  })),

  setShowCommandPalette: (show) => set({ showCommandPalette: show })
}))
