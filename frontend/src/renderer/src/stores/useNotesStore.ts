import { create } from 'zustand'

export interface Note {
  id: string
  title: string
  content: string
  folder: string
  created_at: string
  updated_at: string
}

interface NotesState {
  notes: Note[]
  activeNoteId: string | null
  searchQuery: string
  activeFolder: string
  isLoading: boolean

  fetchNotes: () => Promise<void>
  selectNote: (id: string | null) => void
  createNote: (title: string, folder?: string) => Promise<string>
  updateNote: (id: string, updates: Partial<Pick<Note, 'title' | 'content' | 'folder'>>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  setSearchQuery: (query: string) => void
  setActiveFolder: (folder: string) => void
}

const API_BASE = 'http://localhost:8000/api'

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNoteId: null,
  searchQuery: '',
  activeFolder: 'General',
  isLoading: false,

  fetchNotes: async () => {
    set({ isLoading: true })
    try {
      const res = await fetch(`${API_BASE}/notes`)
      if (res.ok) {
        const data = await res.json()
        set({ notes: data })
      }
    } catch (err) {
      console.error(err)
    } finally {
      set({ isLoading: false })
    }
  },

  selectNote: (id) => set({ activeNoteId: id }),

  createNote: async (title, folder = 'General') => {
    const id = Math.random().toString(36).substring(2, 15)
    try {
      const res = await fetch(`${API_BASE}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, title, content: '', folder })
      })
      if (res.ok) {
        await get().fetchNotes()
        set({ activeNoteId: id })
        return id
      }
    } catch (err) {
      console.error(err)
    }
    return ''
  },

  updateNote: async (id, updates) => {
    // Optimistic update
    set(state => ({
      notes: state.notes.map(note => note.id === id ? { ...note, ...updates, updated_at: new Date().toISOString() } : note)
    }))

    try {
      await fetch(`${API_BASE}/notes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
    } catch (err) {
      console.error('Notes sync failed:', err)
    }
  },

  deleteNote: async (id) => {
    try {
      const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const updated = get().notes.filter(n => n.id !== id)
        set({ notes: updated })
        if (get().activeNoteId === id) {
          set({ activeNoteId: updated.length > 0 ? updated[0].id : null })
        }
      }
    } catch (err) {
      console.error(err)
    }
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setActiveFolder: (folder) => set({ activeFolder: folder })
}))
