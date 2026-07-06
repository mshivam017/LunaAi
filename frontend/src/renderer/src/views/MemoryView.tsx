import React, { useEffect, useState } from 'react'
import { useMemoryStore } from '../stores/useMemoryStore'
import { useUIStore } from '../stores/useUIStore'

export const MemoryView: React.FC = () => {
  const { memoryItems, fetchMemory, addMemory, deleteMemory } = useMemoryStore()
  const addToast = useUIStore(state => state.addToast)

  const [newKey, setNewKey] = useState('')
  const [newValue, setNewValue] = useState('')

  useEffect(() => {
    fetchMemory()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKey.trim() || !newValue.trim()) return

    try {
      await addMemory(newKey.trim(), newValue.trim())
      setNewKey('')
      setNewValue('')
      addToast('Memory record successfully written to SQLite', 'success')
    } catch (err) {
      console.error(err)
      addToast('Failed to write memory.', 'error')
    }
  }

  const handleDelete = async (key: string) => {
    try {
      await deleteMemory(key)
      addToast(`Deleted facts related to: "${key}"`, 'warning')
    } catch (err) {
      console.error(err)
      addToast('Failed to delete memory.', 'error')
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#05050A]/20 p-6 overflow-y-auto">
      
      {/* View Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Persistent Local Memory</h2>
        <p className="text-gray-400 text-xs">
          Luna extracts facts and settings from conversations to customize its tone. Everything is stored locally on your device in SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Memory Form Panel (Left) */}
        <div className="md:col-span-1 glass-panel p-5 rounded-2xl border border-white/5 h-fit">
          <h3 className="text-sm font-bold text-white mb-3">Add Custom Memory Fact</h3>
          
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">FACT CATEGORY / KEY</label>
              <input
                type="text"
                placeholder="e.g. coding_preference"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all placeholder-gray-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">FACT DETAIL / VALUE</label>
              <textarea
                placeholder="e.g. Always write React code using TypeScript and tailwind styles"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all placeholder-gray-600 leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!newKey.trim() || !newValue.trim()}
              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                !newKey.trim() || !newValue.trim()
                  ? 'bg-white/5 text-gray-500 border border-white/5 cursor-not-allowed'
                  : 'bg-gradient-purple-blue text-white hover:opacity-90 active:scale-95 shadow-md'
              }`}
            >
              Commit Memory
            </button>
          </form>
        </div>

        {/* Database List Panel (Right) */}
        <div className="md:col-span-2 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-white/5 min-h-[250px]">
            <h3 className="text-sm font-bold text-white mb-4">SQLite Stored Profiles & Facts</h3>
            
            {memoryItems.length === 0 ? (
              <div className="h-44 flex flex-col items-center justify-center text-center">
                <span className="text-2xl mb-2">🧠</span>
                <p className="text-gray-500 text-xs">No memories stored in database yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 text-[10px] font-mono">
                      <th className="py-2.5 pr-4">Fact Reference</th>
                      <th className="py-2.5 pr-4">Context Details</th>
                      <th className="py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {memoryItems.map((item) => (
                      <tr key={item.id} className="text-gray-300 hover:bg-white/1">
                        <td className="py-3 pr-4 font-mono text-[10px] text-purple-300 font-medium truncate max-w-[120px]">
                          {item.key}
                        </td>
                        <td className="py-3 pr-4 text-xs font-medium text-gray-300 max-w-xs break-words leading-relaxed">
                          {item.value}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleDelete(item.key)}
                            className="text-[10px] hover:text-red-400 text-gray-500 transition-colors font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
