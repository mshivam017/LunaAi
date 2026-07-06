import React, { useEffect, useState } from 'react'
import { useUIStore } from '../stores/useUIStore'

interface PermissionRule {
  id: number
  action: string
  status: string
}

interface SystemLog {
  id: number
  level: string
  message: string
  timestamp: string
}

export const PrivacyView: React.FC = () => {
  const addToast = useUIStore(state => state.addToast)
  const setViewState = useUIStore(state => state.setViewState)

  const [permissions, setPermissions] = useState<PermissionRule[]>([])
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const API_BASE = 'http://localhost:8000/api'

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const permRes = await fetch(`${API_BASE}/permissions`)
      if (permRes.ok) {
        setPermissions(await permRes.json())
      }
      const logRes = await fetch(`${API_BASE}/logs`)
      if (logRes.ok) {
        setLogs(await logRes.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdatePermission = async (action: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/permissions/${action}?status=${status}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        addToast(`Updated permission for ${action} to "${status}"`, 'success')
        fetchData()
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handleWipeData = async () => {
    if (!window.confirm("WARNING: This will delete ALL chat histories, stored notes, local memory records, and settings from SQLite. Are you absolutely sure?")) {
      return
    }

    try {
      const res = await fetch(`${API_BASE}/privacy/clear-all`, { method: 'POST' })
      if (res.ok) {
        localStorage.clear()
        addToast("All database tables wiped! Factory reset complete.", "warning")
        setTimeout(() => {
          setViewState('onboarding')
        }, 1000)
      }
    } catch (err) {
      console.error(err)
      addToast("Failed to perform factory reset.", "error")
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-[#05050A]/20 p-6 overflow-y-auto">
      
      {/* View Header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-white mb-1">Privacy & Permissions Control</h2>
        <p className="text-gray-400 text-xs">
          Manage system automation rules, audit automation logs, or perform a total factory reset of SQLite.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Automation Permissions Rules */}
        <div className="space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-white/5">
            <h3 className="text-sm font-bold text-white mb-4">Automation Actions Permissions</h3>
            
            <div className="space-y-3.5 max-h-[300px] overflow-y-auto pr-1">
              {/* Default Windows App Automation Rule Rows */}
              {[
                { key: 'open_vscode', label: 'Launch Visual Studio Code' },
                { key: 'open_notepad', label: 'Launch Notepad' },
                { key: 'open_calculator', label: 'Launch Calculator' },
                { key: 'open_chrome', label: 'Launch Google Chrome' },
                { key: 'open_spotify', label: 'Launch Spotify' },
                { key: 'open_terminal', label: 'Launch Windows PowerShell' },
                { key: 'organize_downloads', label: 'Organize Downloads Directory' }
              ].map((rule) => {
                const dbRule = permissions.find(p => p.action === rule.key)
                const status = dbRule ? dbRule.status : 'ask'

                return (
                  <div key={rule.key} className="flex items-center justify-between text-xs py-1.5 border-b border-white/5 last:border-0">
                    <span className="font-medium text-gray-300">{rule.label}</span>
                    
                    <div className="flex gap-1.5">
                      {['ask', 'allow_always', 'deny_always'].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleUpdatePermission(rule.key, s)}
                          className={`px-2 py-1 rounded font-semibold text-[9px] border transition-all ${
                            status === s
                              ? 'bg-purple-600/10 border-purple-500/30 text-purple-300'
                              : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10'
                          }`}
                        >
                          {s === 'ask' ? 'ASK' : s === 'allow_always' ? 'ALLOW' : 'DENY'}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Wipe Database Card */}
          <div className="glass-panel p-5 rounded-2xl border border-red-500/10 bg-red-950/5 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-1.5">
                <span>⚠️</span> Factory Reset
              </h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Immediately clear the SQLite tables, flush user configurations, delete local chat records, notes, and local memories. This cannot be undone.
              </p>
            </div>

            <button
              onClick={handleWipeData}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-bold rounded-lg transition-colors"
            >
              Factory Reset & Clear Tables
            </button>
          </div>
        </div>

        {/* Right Column: System Logs Visualizer */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col min-h-[400px]">
          <h3 className="text-sm font-bold text-white mb-3">System Automation Logs</h3>
          
          <div className="flex-1 bg-black/40 rounded-xl border border-white/5 p-3 overflow-y-auto font-mono text-[10px] space-y-2 max-h-[360px]">
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-600">
                [No logs written to SQLite]
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-2">
                  <span className="text-gray-500 flex-shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={`flex-shrink-0 uppercase font-semibold ${
                    log.level === 'error' ? 'text-red-400' :
                    log.level === 'warning' ? 'text-yellow-400' :
                    'text-blue-400'
                  }`}>
                    [{log.level}]
                  </span>
                  <span className="text-gray-300 leading-relaxed break-all">
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
