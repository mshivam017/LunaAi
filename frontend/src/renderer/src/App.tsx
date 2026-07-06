import React from 'react'
import { useUIStore } from './stores/useUIStore'
import { Onboarding } from './views/Onboarding'
import { Dashboard } from './views/Dashboard'

export default function App() {
  const currentView = useUIStore((state) => state.currentView)

  return (
    <div className="h-screen w-screen overflow-hidden select-none bg-[#030308]">
      {currentView === 'onboarding' ? <Onboarding /> : <Dashboard />}
    </div>
  )
}
