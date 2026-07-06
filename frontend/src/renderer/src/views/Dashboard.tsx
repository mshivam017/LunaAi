import React from 'react'
import { useUIStore } from '../stores/useUIStore'
import { CustomTitlebar } from '../components/CustomTitlebar'
import { ChatView } from './ChatView'
import { NotesView } from './NotesView'
import { MemoryView } from './MemoryView'
import { SettingsView } from './SettingsView'
import { PrivacyView } from './PrivacyView'
import { ToastContainer } from '../components/ToastContainer'
import { PermissionModal } from '../components/PermissionModal'
import { useChatStore } from '../stores/useChatStore'
import { MessageSquare, FileText, Brain, Settings as SettingsIcon, Shield, Moon } from 'lucide-react'

export const Dashboard: React.FC = () => {
  const { activeTab, setActiveTab, isFloating, toggleFloating } = useUIStore()
  const runningMode = useChatStore(state => state.runningMode)

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#030308] select-none text-white border border-white/5 rounded-2xl relative">
      
      {/* Premium Frameless Custom Titlebar */}
      <CustomTitlebar />

      {/* Main Panel Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Navigation Sidebar */}
        <div className="w-48 bg-[#07070F]/90 border-r border-white/5 flex flex-col justify-between p-3.5 flex-shrink-0">
          
          <div className="space-y-6">
            {/* Logo area */}
            <div className="flex items-center gap-2.5 px-1">
              <Moon className="h-5 w-5 text-purple-400 animate-pulse" />
              <div>
                <h1 className="text-sm font-extrabold tracking-wide font-sans text-gradient-purple-blue">LUNA</h1>
                <p className="text-[9px] text-gray-500 tracking-wider font-mono">NEURAL ASSISTANT</p>
              </div>
            </div>

            {/* Sidebar Navigation Items */}
            <nav className="flex flex-col gap-1">
              {[
                { id: 'chat', label: 'AI Chat Panel', icon: <MessageSquare className="h-4 w-4" /> },
                { id: 'notes', label: 'Markdown Notes', icon: <FileText className="h-4 w-4" /> },
                { id: 'memory', label: 'SQLite Memory', icon: <Brain className="h-4 w-4" /> },
                { id: 'settings', label: 'Preferences', icon: <SettingsIcon className="h-4 w-4" /> },
                { id: 'privacy', label: 'Permissions & Logs', icon: <Shield className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                    activeTab === tab.id
                      ? 'bg-purple-600/10 border-purple-500/25 text-purple-300 shadow-md'
                      : 'border-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            {/* Float Mode Toggle button */}
            <button
              onClick={toggleFloating}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                isFloating
                  ? 'bg-purple-600/10 border-purple-500/30 text-purple-300'
                  : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <span>Floating Mode</span>
              <span className="animate-pulse">{isFloating ? 'ON ⚡' : 'OFF'}</span>
            </button>

            {/* Local Engine Status */}
            <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
                runningMode === 'demo' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              }`} />
              <div className="truncate">
                <p className="text-[9px] font-bold text-gray-300 tracking-wide leading-none uppercase">
                  {runningMode === 'demo' ? 'Demo Mode' : 'Local AI Active'}
                </p>
                <p className="text-[8px] text-gray-500 truncate mt-0.5 font-mono">
                  {runningMode === 'demo' ? 'Mock Streaming' : 'Qwen2.5:3B'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab View Display */}
        <div className="flex-1 flex overflow-hidden bg-[#07070F]/50">
          {activeTab === 'chat' && <ChatView />}
          {activeTab === 'notes' && <NotesView />}
          {activeTab === 'memory' && <MemoryView />}
          {activeTab === 'settings' && <SettingsView />}
          {activeTab === 'privacy' && <PrivacyView />}
        </div>
      </div>

      {/* Security Permission Alerts */}
      <PermissionModal />

      {/* Global Notifications Container */}
      <ToastContainer />
    </div>
  )
}
