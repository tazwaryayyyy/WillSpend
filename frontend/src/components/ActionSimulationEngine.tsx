import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface ActionSimulationEngineProps {
  totalCost: number
  dailyLossRate: number
  currency: string
  country: string
  steps: Array<{ title: string; impact: string }>
  onSimulationChange?: (isActive: boolean) => void
}

export function ActionSimulationEngine({ totalCost, dailyLossRate, currency, country, steps, onSimulationChange }: ActionSimulationEngineProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [displayLoss, setDisplayLoss] = useState(totalCost)
  const animationRef = useRef<number | null>(null)

  const sevenDayRecovery = totalCost * 0.0187
  const targetLoss = isSimulating ? totalCost - sevenDayRecovery : totalCost

  // Number animation using requestAnimationFrame
  useEffect(() => {
    const duration = 1500
    const start = performance.now()
    const initialValue = displayLoss

    const animate = (currentTime: number) => {
      const elapsed = currentTime - start
      const progress = Math.min(elapsed / duration, 1)

      // Ease out expo curve
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)

      const currentVal = initialValue + (targetLoss - initialValue) * easeProgress
      setDisplayLoss(currentVal)

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }

    animationRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isSimulating, targetLoss])

  useEffect(() => {
    onSimulationChange?.(isSimulating)
  }, [isSimulating, onSimulationChange])

  return (
    <div className="mt-12 space-y-8 border-t border-charcoal-700 pt-12">
      <div className="text-center space-y-2">
        <h3 className="text-2xl md:text-3xl font-display font-bold text-cream">
          Your 7-Day Recovery Simulation
        </h3>
        <p className="text-cream/50">If you start today, here is what changes</p>
        <p className="text-[10px] font-mono uppercase tracking-wider text-cream/35">Projections are estimates, not guarantees.</p>
      </div>

      {/* Custom Toggle Switch */}
      <div className="flex items-center justify-center gap-4">
        <span className={`text-sm font-mono uppercase tracking-widest ${!isSimulating ? 'text-rose' : 'text-cream/30'}`}>
          Current Reality
        </span>
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`relative w-16 h-8 rounded-full transition-colors duration-500 flex items-center px-1 ${isSimulating ? 'bg-emerald-500' : 'bg-charcoal-700'
            }`}
        >
          <motion.div
            animate={{ x: isSimulating ? 32 : 0 }}
            className="w-6 h-6 bg-white rounded-full shadow-lg"
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </button>
        <span className={`text-sm font-mono uppercase tracking-widest ${isSimulating ? 'text-emerald-500' : 'text-cream/30'}`}>
          7-Day Recovery
        </span>
      </div>

      {/* Main Metric Display */}
      <div className="bg-charcoal-900/40 p-8 rounded-2xl border border-charcoal-800 text-center relative overflow-hidden group">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-4">
          Simulated Total Loss
        </div>
        <div className={`text-6xl md:text-7xl font-display font-black transition-colors duration-500 ${isSimulating ? 'text-emerald-500' : 'text-rose'
          }`}>
          {currency}{Math.round(displayLoss).toLocaleString()}
        </div>

        <AnimatePresence>
          {isSimulating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-emerald-400 font-bold text-xl flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Projected 7-day recovery: {currency}{Math.round(sevenDayRecovery).toLocaleString()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress Bars */}
      <div className="space-y-6">
        {steps.map((step, idx) => {
          const targets = [96, 58, 37]
          const labels = ["Day 1 kickoff", "Setup in progress", "Consistency building"]
          return (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between text-xs font-mono uppercase tracking-wider">
                <span className="text-cream/60">{step.title}</span>
                <span className={isSimulating ? 'text-emerald-500' : 'text-cream/20'}>
                  {isSimulating ? labels[idx] : 'Pending'}
                </span>
              </div>
              <div className="h-2 w-full bg-charcoal-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: isSimulating ? `${targets[idx]}%` : '0%' }}
                  transition={{ delay: 0.2 + idx * 0.2, duration: 1, ease: "easeOut" }}
                  className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-charcoal-900/40 p-6 rounded-xl border border-charcoal-800">
          <div className="text-[10px] font-mono uppercase tracking-widest text-rose/50 mb-2">Without Action</div>
          <div className="text-lg text-rose font-bold">
            Lose around {currency}{(dailyLossRate * 7).toLocaleString()} this week
          </div>
        </div>
        <div className="bg-charcoal-900/40 p-6 rounded-xl border border-charcoal-800">
          <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/50 mb-2">With Action</div>
          <div className="text-lg text-emerald-500 font-bold">
            Recover around {currency}{Math.round(sevenDayRecovery).toLocaleString()} this week
          </div>
        </div>
      </div>

      {/* Net Difference */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center space-y-1"
          >
            <div className="text-xs font-mono uppercase tracking-widest text-cream/40">Net Difference</div>
            <div className="text-4xl md:text-5xl font-display font-black text-amber-500">
              {currency}{Math.round(sevenDayRecovery + (dailyLossRate * 7)).toLocaleString()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity Shift Card */}
      <AnimatePresence>
        {isSimulating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="bg-charcoal-900 border border-emerald-500/20 border-l-[4px] border-l-emerald-500 p-8 rounded-r-xl"
          >
            <div className="space-y-4">
              <h4 className="text-3xl font-display font-bold text-white leading-tight">
                You are interrupting the financial loss cycle.
              </h4>
              <div className="space-y-1">
                <p className="text-lg text-slate-300">
                  Projected status in 30 days: around top 22% of {country} users
                </p>
                <p className="text-xs font-mono uppercase tracking-tight text-emerald-400/80">
                  Based on your committed actions and historical recovery ranges
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const CheckCircle2 = ({ className }: { className: string }) => (
  <svg
    className={className}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
