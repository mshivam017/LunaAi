import React from 'react'
import { useChatStore } from '../stores/useChatStore'
import { AnimatePresence, motion } from 'framer-motion'

export const PermissionModal: React.FC = () => {
  const pendingAutomation = useChatStore((state) => state.pendingAutomation)
  const resolvePendingAutomation = useChatStore((state) => state.resolvePendingAutomation)

  return (
    <AnimatePresence>
      {pendingAutomation && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="glass-panel-heavy p-6 rounded-2xl w-full max-w-sm border border-white/10 glow-purple"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 bg-purple-500/10 border border-purple-500/30 rounded-xl flex items-center justify-center text-lg">
                🛡️
              </div>
              <div>
                <h3 className="text-md font-bold font-sans">Security Verification</h3>
                <p className="text-gray-400 text-[10px] tracking-wider uppercase">System Automation</p>
              </div>
            </div>
            
            <div className="text-xs text-gray-300 mb-6 leading-relaxed">
              Luna is requesting permission to execute:
              <div className="mt-2 p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[11px] text-purple-300">
                Open {pendingAutomation.app_name}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => resolvePendingAutomation(false)}
                className="px-4 py-2 text-xs rounded-lg hover:bg-white/5 border border-white/5 text-gray-300 font-medium transition-colors"
              >
                Deny
              </button>
              <button
                onClick={() => resolvePendingAutomation(true)}
                className="px-4 py-2 text-xs rounded-lg bg-gradient-purple-blue text-white font-semibold hover:shadow-lg transition-all"
              >
                Allow Action
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
