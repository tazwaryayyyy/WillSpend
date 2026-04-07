"use client"

import { motion, useMotionValue, useSpring } from "framer-motion"
import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/HeroSection'
import { FormSection } from '@/components/FormSection'
import { ResultsSection } from '@/components/ResultsSection'
import { RecoveryTracker } from '@/components/RecoveryTracker'
import { Navigation } from '@/components/Navigation'

export function CustomCursor() {
  const mouseX = useMotionValue(-100)
  const mouseY = useMotionValue(-100)

  const springX = useSpring(mouseX, { damping: 25, stiffness: 700, mass: 0.1 })
  const springY = useSpring(mouseY, { damping: 25, stiffness: 700, mass: 0.1 })

  useEffect(() => {
    const move = (e: MouseEvent) => {
      mouseX.set(e.clientX - 6)
      mouseY.set(e.clientY - 6)
    }
    window.addEventListener("mousemove", move)
    return () => window.removeEventListener("mousemove", move)
  }, [])

  return (
    <motion.div
      style={{ x: springX, y: springY }}
      className="fixed top-0 left-0 z-[9999] pointer-events-none 
                 w-3 h-3 rounded-full bg-[#b8ff57] mix-blend-difference"
    />
  )
}

function App() {
  const [showResults, setShowResults] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [recoveryActions, setRecoveryActions] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recoveryActions')
    if (stored) {
      setRecoveryActions(JSON.parse(stored))
    }
  }, [])

  return (
    <div className="min-h-screen bg-charcoal-950 text-cream font-display">
      {/* Noise overlay */}
      <div className="noise-overlay" />

      <CustomCursor />
      <Navigation showResults={showResults} />

      <main className="relative z-10">
        {showResults && analysisData ? (
          <ResultsSection
            data={analysisData}
            onRecoveryComplete={(action: any) => {
              const updated = [...recoveryActions, action]
              setRecoveryActions(updated)
              localStorage.setItem('recoveryActions', JSON.stringify(updated))
            }}
            onBack={() => setShowResults(false)}
          />
        ) : (
          <>
            <HeroSection />
            <FormSection
              onSubmit={(data: any) => {
                setAnalysisData(data)
                setShowResults(true)
              }}
            />
            <RecoveryTracker actions={recoveryActions} />
          </>
        )}
      </main>
    </div>
  )
}

export default App
