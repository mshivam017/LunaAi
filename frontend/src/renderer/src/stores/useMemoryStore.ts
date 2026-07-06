import { create } from 'zustand'

export interface MemoryItem {
  id: number
  key: string
  value: string
  created_at: string
  updated_at: string
}

interface MemoryState {
  memoryItems: MemoryItem[]
  isLoading: boolean
  
  fetchMemory: () => Promise<void>
  addMemory: (key: string, value: string) => Promise<void>
  deleteMemory: (key: string) => Promise<void>
}

const API_BASE = 'http://localhost:8000/api'

export const useMemoryStore = create<MemoryState>((set, get) => ({
  memoryItems: [],
  isLoading: false,

  fetchMemory: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_BASE}/memory`)
      if (res.ok) {
        const data = await res.json()
        set({ memoryItems: data })
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isLoading: false })
    }
  },

  addMemory: async (key, value) => {
    try {
      const res = await fetch(`${API_BASE}/memory`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value })
      })
      if (res.ok) {
        await get().fetchMemory()
      }
    } catch (err) {
      console.error(err)
    }
  },

  deleteMemory: async (key) => {
    try {
      const res = await fetch(`${API_BASE}/memory/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        set(state => ({
          memoryItems: state.memoryItems.filter(item => item.key !== key)
        }))
      }
    } catch (err) {
      console.error(err)
    }
  }
}))
