import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../stores/useUIStore'
import { useMemoryStore } from '../stores/useMemoryStore'

export const Onboarding: React.FC = () => {
  const setViewState = useUIStore((state) => state.setViewState)
  const addMemory = useMemoryStore((state) => state.addMemory)
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [prefApp, setPrefApp] = useState('VS Code')
  const [style, setStyle] = useState('Professional')
  const [isInitializing, setIsInitializing] = useState(false)

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    } else {
      triggerInitialization()
    }
  }

  const triggerInitialization = async () => {
    setIsInitializing(true)
    
    // Save selections to local memory via sqlite backend
    try {
      await addMemory('username', name || 'User')
      await addMemory('favorite_app', prefApp)
      await addMemory('writing_style', style)
    } catch (e) {
      console.error(e)
    }

    setTimeout(() => {
      setViewState('dashboard')
    }, 2500)
  }

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  }

  return (
    <div className="flex h-full w-full items-center justify-center p-6 bg-[#030308] overflow-hidden relative">
      {/* Decorative premium background glows */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-blue-600/10 blur-[100px] pointer-events-none"></div>

      <AnimatePresence mode="wait">
        {!isInitializing ? (
          <motion.div
            key={step}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass-panel p-8 rounded-2xl w-full max-w-md glow-purple-lg flex flex-col justify-between min-h-[380px] border border-white/5 relative z-10"
          >
            {/* Step 1: Welcome Screen */}
            {step === 1 && (
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 bg-gradient-purple-blue rounded-2xl flex items-center justify-center text-3xl font-black shadow-lg mb-6 tracking-wider">
                  🌙
                </div>
                <h1 className="text-3xl font-extrabold text-gradient-purple-blue tracking-tight mb-3">Welcome to Luna</h1>
                <p className="text-gray-400 text-xs leading-relaxed max-w-xs">
                  Your desktop companion for local AI reasoning and system automation. Let's configure your profile.
                </p>
              </div>
            )}

            {/* Step 2: Name Input */}
            {step === 2 && (
              <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-2 text-white">What should I call you?</h2>
                <p className="text-gray-400 text-[11px] mb-6">This will be remembered in my persistent local memory.</p>
                <input
                  type="text"
                  placeholder="Enter your name..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 focus:border-purple-500/50 rounded-xl px-4 py-3 text-sm focus:outline-none transition-all text-white placeholder-gray-500"
                  autoFocus
                />
              </div>
            )}

            {/* Step 3: Preferences Selection */}
            {step === 3 && (
              <div className="flex flex-col">
                <h2 className="text-xl font-bold mb-2 text-white">Customize AI Tone</h2>
                <p className="text-gray-400 text-[11px] mb-4">Choose how you want responses to be styled.</p>
                
                <div className="flex flex-col gap-2.5 mb-6">
                  {['Professional', 'Creative & Verbose', 'Direct & Code-only'].map((item) => (
                    <button
                      key={item}
                      onClick={() => setStyle(item)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-semibold transition-all ${
                        style === item
                          ? 'bg-purple-600/10 border-purple-500/50 text-purple-300'
                          : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom Nav Controls */}
            <div className="flex items-center justify-between mt-8 border-t border-white/5 pt-4">
              <div className="flex gap-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all ${
                      s === step ? 'w-6 bg-purple-500' : 'w-1.5 bg-white/10'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={handleNext}
                disabled={step === 2 && !name.trim()}
                className={`px-5 py-2 text-xs font-bold rounded-lg transition-all ${
                  step === 2 && !name.trim()
                    ? 'bg-white/5 text-gray-500 cursor-not-allowed border border-white/5'
                    : 'bg-gradient-purple-blue text-white hover:opacity-90 active:scale-95 shadow-md'
                }`}
              >
                {step === 3 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="init"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-8 rounded-2xl w-full max-w-sm glow-purple-lg flex flex-col items-center text-center border border-white/5"
          >
            <div className="h-14 w-14 rounded-full bg-gradient-purple-blue flex items-center justify-center text-2xl font-bold animate-spin shadow-lg mb-6">
              🌀
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Preparing Environment</h2>
            <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
              Configuring SQLite tables, scanning local model ports, and establishing IPC handshake tunnels.
            </p>
            <div className="w-full bg-white/5 rounded-full h-1 mt-6 overflow-hidden">
              <div className="bg-luna-purple h-full w-4/5 rounded-full shimmer"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
