import { create } from 'zustand'

interface SettingItem {
  id: number
  key: string
  value: string
}

interface SettingsState {
  assistantName: string
  theme: 'dark' | 'light'
  language: string
  selectedModel: string
  responseStyle: string
  memoryEnabled: boolean
  isLoading: boolean

  fetchSettings: () => Promise<void>
  updateSetting: (key: string, value: string) => Promise<void>
  loadSettingsFromList: (list: SettingItem[]) => void
}

const API_BASE = 'http://localhost:8000/api'

export const useSettingsStore = create<SettingsState>((set, get) => ({
  assistantName: 'Luna',
  theme: 'dark',
  language: 'en',
  selectedModel: 'qwen2.5:0.5b',
  responseStyle: 'professional',
  memoryEnabled: true,
  isLoading: false,

  fetchSettings: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_BASE}/settings`)
      if (res.ok) {
        const data = await res.json()
        get().loadSettingsFromList(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isLoading: false })
    }
  },

  updateSetting: async (key, value) => {
    // Optimistic UI state updates
    if (key === 'assistantName') set({ assistantName: value })
    else if (key === 'theme') set({ theme: value as 'dark' | 'light' })
    else if (key === 'language') set({ language: value })
    else if (key === 'selectedModel') set({ selectedModel: value })
    else if (key === 'responseStyle') set({ responseStyle: value })
    else if (key === 'memoryEnabled') set({ memoryEnabled: value === 'true' })

    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
    } catch (err) {
      console.error(err)
    }
  },

  loadSettingsFromList: (list) => {
    const stateUpdate: Partial<SettingsState> = {}
    list.forEach(item => {
      if (item.key === 'assistantName') stateUpdate.assistantName = item.value
      else if (item.key === 'theme') stateUpdate.theme = item.value as 'dark' | 'light'
      else if (item.key === 'language') stateUpdate.language = item.value
      else if (item.key === 'selectedModel') stateUpdate.selectedModel = item.value
      else if (item.key === 'responseStyle') stateUpdate.responseStyle = item.value
      else if (item.key === 'memoryEnabled') stateUpdate.memoryEnabled = item.value === 'true'
    })
    set(stateUpdate)
  }
}))
