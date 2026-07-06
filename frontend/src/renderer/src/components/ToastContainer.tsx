import React from 'react'
import { useUIStore } from '../stores/useUIStore'
import { AnimatePresence, motion } from 'framer-motion'

export const ToastContainer: React.FC = () => {
  const toasts = useUIStore((state) => state.toasts)

  return (
    <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border text-xs min-w-[280px] max-w-sm glass-panel-heavy flex items-center gap-3 ${
              toast.type === 'success' ? 'border-green-500/25 text-green-300' :
              toast.type === 'error' ? 'border-red-500/25 text-red-300' :
              toast.type === 'warning' ? 'border-yellow-500/25 text-yellow-300' :
              'border-purple-500/25 text-purple-300'
            }`}
          >
            <div className="flex-shrink-0">
              {toast.type === 'success' && <span className="text-sm">✅</span>}
              {toast.type === 'error' && <span className="text-sm">❌</span>}
              {toast.type === 'warning' && <span className="text-sm">⚠️</span>}
              {toast.type === 'info' && <span className="text-sm">💡</span>}
            </div>
            <div className="flex-1 font-medium">{toast.message}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
