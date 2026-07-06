import React, { useEffect, useState } from 'react'
import { useNotesStore, Note } from '../stores/useNotesStore'

export const NotesView: React.FC = () => {
  const {
    notes,
    activeNoteId,
    searchQuery,
    activeFolder,
    fetchNotes,
    selectNote,
    createNote,
    updateNote,
    deleteNote,
    setSearchQuery,
    setActiveFolder
  } = useNotesStore()

  const [localTitle, setLocalTitle] = useState('')
  const [localContent, setLocalContent] = useState('')
  const [saveIndicator, setSaveIndicator] = useState<'saved' | 'saving'>('saved')

  useEffect(() => {
    fetchNotes()
  }, [])

  const activeNote = notes.find(n => n.id === activeNoteId)

  // Sync editor fields when switching active note
  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title)
      setLocalContent(activeNote.content)
      setSaveIndicator('saved')
    } else {
      setLocalTitle('')
      setLocalContent('')
    }
  }, [activeNoteId])

  // Simple debounced auto-save triggers on title or content change
  useEffect(() => {
    if (!activeNote) return

    if (localTitle === activeNote.title && localContent === activeNote.content) {
      return
    }

    setSaveIndicator('saving')
    const timer = setTimeout(async () => {
      await updateNote(activeNote.id, { title: localTitle, content: localContent })
      setSaveIndicator('saved')
    }, 800) // 800ms debounce

    return () => clearTimeout(timer)
  }, [localTitle, localContent])

  const folders = ['General', 'Projects', 'Ideas', 'Archive']

  const filteredNotes = notes.filter(note => {
    const matchesFolder = note.folder === activeFolder
    const matchesSearch = 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFolder && matchesSearch
  })

  return (
    <div className="flex h-full w-full">
      {/* Folders & Notes List (Left Panel) */}
      <div className="w-56 border-r border-white/5 bg-[#05050A]/40 flex flex-col flex-shrink-0">
        
        {/* Folders navigation */}
        <div className="p-3 border-b border-white/5">
          <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-mono">Folders</div>
          <div className="flex flex-wrap gap-1">
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setActiveFolder(f)}
                className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                  activeFolder === f
                    ? 'bg-purple-600/10 border-purple-500/35 text-purple-300'
                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Notes listings actions */}
        <div className="p-3 border-b border-white/5 flex flex-col gap-2">
          <button 
            onClick={() => createNote('Untitled Note', activeFolder)}
            className="w-full py-2 bg-gradient-purple-blue text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
          >
            <span>+</span> Create Note
          </button>
          
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none transition-all text-white placeholder-gray-500"
          />
        </div>

        {/* List of matching notes */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredNotes.map(n => (
            <div
              key={n.id}
              onClick={() => selectNote(n.id)}
              className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                activeNoteId === n.id
                  ? 'bg-purple-600/10 border border-purple-500/20 text-purple-200'
                  : 'text-gray-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              <div className="truncate flex-1 pr-2">{n.title || 'Untitled Note'}</div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  deleteNote(n.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-red-400 text-gray-500 transition-opacity p-0.5 text-[10px]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Screen (Right Panel) */}
      <div className="flex-1 flex flex-col bg-[#05050A]/20 p-6 relative">
        {activeNote ? (
          <div className="flex-1 flex flex-col gap-4">
            
            {/* Header info / Auto-save status */}
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-purple-500/10 border border-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono uppercase">
                  {activeNote.folder}
                </span>
                
                {/* Change Folder Dropdown */}
                <select 
                  value={activeNote.folder}
                  onChange={(e) => updateNote(activeNote.id, { folder: e.target.value })}
                  className="bg-white/5 border border-white/5 text-gray-400 text-[10px] rounded px-1.5 py-0.5 focus:outline-none"
                >
                  {folders.map(f => (
                    <option key={f} value={f} className="bg-[#0b0a16]">{f}</option>
                  ))}
                </select>
              </div>

              <div className="text-[10px] font-mono">
                {saveIndicator === 'saving' ? (
                  <span className="text-yellow-400 animate-pulse">● Saving changes...</span>
                ) : (
                  <span className="text-green-400">✓ Autosaved to database</span>
                )}
              </div>
            </div>

            {/* Note Title Input */}
            <input
              type="text"
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              placeholder="Note title..."
              className="bg-transparent text-xl font-extrabold text-white border-none outline-none focus:ring-0 placeholder-gray-600 font-sans"
            />

            {/* Note Markdown Textarea */}
            <textarea
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              placeholder="Write your thoughts in Markdown..."
              className="flex-1 bg-transparent text-xs text-gray-300 border-none outline-none resize-none focus:ring-0 leading-relaxed font-sans placeholder-gray-600"
            />
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-xs mx-auto">
            <span className="text-3xl mb-4 opacity-50">📝</span>
            <h2 className="text-sm font-bold mb-1">Luna Note Hub</h2>
            <p className="text-gray-500 text-[10px] leading-relaxed">
              Organize code snippets, document links, or checklists. Create a new note to start or select an existing note.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
