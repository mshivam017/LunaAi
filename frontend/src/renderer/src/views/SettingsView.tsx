import React, { useEffect } from 'react'
import { useSettingsStore } from '../stores/useSettingsStore'
import { useUIStore } from '../stores/useUIStore'

export const SettingsView: React.FC = () => {
  const {
    assistantName,
    theme,
    language,
    selectedModel,
    responseStyle,
    memoryEnabled,
    fetchSettings,
    updateSetting
  } = useSettingsStore()

  const addToast = useUIStore(state => state.addToast)

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleUpdate = async (key: string, value: string) => {
    try {
      await updateSetting(key, value)
      addToast(`Updated config: ${key} to "${value}"`, 'success')
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#05050A]/20 p-6 overflow-y-auto max-w-2xl">
      {/* View Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Luna Preferences</h2>
        <p className="text-gray-400 text-xs">
          Configure local engine properties, window animations, and voice synthesizer parameters.
        </p>
      </div>

      <div className="space-y-5">
        
        {/* General Parameters */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">General Parameters</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">ASSISTANT NAME</label>
              <input
                type="text"
                value={assistantName}
                onChange={(e) => handleUpdate('assistantName', e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">INTERFACE LANGUAGE</label>
              <select
                value={language}
                onChange={(e) => handleUpdate('language', e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
              >
                <option value="en" className="bg-[#0b0a16]">English (US)</option>
                <option value="es" className="bg-[#0b0a16]">Español (ES)</option>
                <option value="fr" className="bg-[#0b0a16]">Français (FR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Local Model Configurations */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Neural Client Configurations</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">PREFERRED LOCAL MODEL</label>
              <select
                value={selectedModel}
                onChange={(e) => handleUpdate('selectedModel', e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
              >
                <option value="qwen2.5:0.5b" className="bg-[#0b0a16]">Qwen 2.5 (0.5B) [Ultra-Lightweight]</option>
                <option value="qwen2.5:1.5b" className="bg-[#0b0a16]">Qwen 2.5 (1.5B) [Standard]</option>
                <option value="qwen2.5:3b" className="bg-[#0b0a16]">Qwen 2.5 (3B) [High Load]</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">COMPLETION RESPONSE LENGTH</label>
              <select
                value={responseStyle}
                onChange={(e) => handleUpdate('responseStyle', e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
              >
                <option value="professional" className="bg-[#0b0a16]">Concise & Professional</option>
                <option value="creative" className="bg-[#0b0a16]">Verbose & Creative</option>
                <option value="code" className="bg-[#0b0a16]">Direct Code & Shells</option>
              </select>
            </div>
          </div>
        </div>

        {/* System Customization Card */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white mb-2">Preferences</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-gray-400 font-mono mb-1">INTERFACE THEME</label>
              <select
                value={theme}
                onChange={(e) => handleUpdate('theme', e.target.value)}
                className="w-full bg-white/5 border border-white/5 focus:border-purple-500/30 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none transition-all"
              >
                <option value="dark" className="bg-[#0b0a16]">Dark Mode [Recommended]</option>
                <option value="light" className="bg-[#0b0a16]">Light Mode</option>
              </select>
            </div>

            <div className="flex items-center justify-between border border-white/5 bg-white/5 rounded-xl px-4 py-2 mt-1">
              <div>
                <h4 className="text-[10px] font-bold text-gray-300 tracking-wide uppercase leading-none mb-1">LOCAL MEMORY</h4>
                <p className="text-[9px] text-gray-500">Inject SQLite user facts context.</p>
              </div>
              <button
                onClick={() => handleUpdate('memoryEnabled', memoryEnabled ? 'false' : 'true')}
                className={`w-11 h-6 rounded-full transition-all flex items-center p-0.5 ${
                  memoryEnabled ? 'bg-purple-600 justify-end' : 'bg-white/10 justify-start'
                }`}
              >
                <div className="h-5 w-5 bg-white rounded-full shadow-md" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
