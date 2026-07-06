import React from 'react'

export const CustomTitlebar: React.FC = () => {
  const handleMinimize = () => {
    window.lunaIPC?.minimizeWindow()
  }

  const handleMaximize = () => {
    window.lunaIPC?.maximizeWindow()
  }

  const handleClose = () => {
    window.lunaIPC?.closeWindow()
  }

  return (
    <div 
      className="h-10 w-full flex items-center justify-between px-4 bg-[#07070F]/80 border-b border-white/5 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2">
        <span className="text-gradient-purple-blue font-extrabold text-sm tracking-wide font-sans">LUNA</span>
        <span className="text-[10px] bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/20 font-mono">v1.0</span>
      </div>
      
      {/* Titlebar Window Control Buttons */}
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button 
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button 
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <rect x="4" y="4" width="16" height="16" rx="2" />
          </svg>
        </button>
        <button 
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
