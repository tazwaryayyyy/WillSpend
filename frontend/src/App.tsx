"use client"

import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion"
import { lazy, Suspense, useEffect, useState } from 'react'
import { HeroSection } from '@/components/HeroSection'
import { FormSection } from '@/components/FormSection'
import { RecoveryTracker } from '@/components/RecoveryTracker'
import { Navigation } from '@/components/Navigation'
import { FullScreenIntro } from '@/components/FullScreenIntro'
import { OngoingLossBar } from '@/components/OngoingLossBar'

const ResultsSection = lazy(() => import('@/components/ResultsSection').then((m) => ({ default: m.ResultsSection })))

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
  const [showIntro, setShowIntro] = useState(true)
  const [tickerValue, setTickerValue] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [recoveryActions, setRecoveryActions] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recoveryActions')
    if (stored) {
      setRecoveryActions(JSON.parse(stored))
    }
  }, [])

  const dailyLossRate = analysisData?.simulation?.total_inaction_cost
    ? analysisData.simulation.total_inaction_cost / ((analysisData.profile?.years_at_same_salary || 1) * 365)
    : 0

  const currency = analysisData?.profile?.country === 'Bangladesh' ? '৳' : (analysisData?.profile?.country === 'India' ? '₹' : '$')

  return (
    <div className="min-h-screen bg-charcoal-950 text-cream font-display">
      <AnimatePresence>
        {showIntro && (
          <FullScreenIntro
            onFinish={(val) => {
              setTickerValue(val)
              setShowIntro(false)
            }}
            currencySymbol="$"
          />
        )}
      </AnimatePresence>

      {/* Noise overlay */}
      <div className="noise-overlay" />

      <CustomCursor />
      <Navigation showResults={showResults} />

      <main className="relative z-10">
        {showResults && analysisData ? (
          <Suspense fallback={<div className="px-6 py-16 text-center text-cream/60">Loading your recovery dashboard...</div>}>
            <ResultsSection
              data={analysisData}
              onRecoveryComplete={(action: any) => {
                const updated = [...recoveryActions, action]
                setRecoveryActions(updated)
                localStorage.setItem('recoveryActions', JSON.stringify(updated))
              }}
              onBack={() => setShowResults(false)}
            />
          </Suspense>
        ) : (
          <>
            <HeroSection />
            <FormSection
              onSubmit={(data: any) => {
                setAnalysisData(data)
                setShowResults(true)
              }}
              startingTickerValue={tickerValue}
            />
            <RecoveryTracker
              actions={recoveryActions}
              country={analysisData?.profile?.country}
            />
          </>
        )}
      </main>

      <OngoingLossBar
        isVisible={showResults && analysisData !== null}
        dailyLossRate={dailyLossRate}
        currency={currency}
      />
    </div>
  )
}

export default App
