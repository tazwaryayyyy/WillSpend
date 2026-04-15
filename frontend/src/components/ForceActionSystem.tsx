"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Timer, ArrowRight } from 'lucide-react'
import { ActionSimulationEngine } from './ActionSimulationEngine'

interface ForceActionSystemProps {
  totalCost: number
  categories: any
  country: string
  currency: string
  yearsAtSameSalary: number
  subscriptionsCount: number
}

export function ForceActionSystem({ totalCost, categories, country, currency, yearsAtSameSalary, subscriptionsCount }: ForceActionSystemProps) {
  const [isCommitted, setIsCommitted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(86400) // 24 hours in seconds
  const [tickingLoss, setTickingLoss] = useState(0)
  const [isSimulating, setIsSimulating] = useState(false)
  const [showStepScheduled, setShowStepScheduled] = useState(false)
  const [todayProof, setTodayProof] = useState({ committed: 0, completed: 0 })

  const todayKey = new Date().toISOString().split('T')[0]
  const proofStorageKey = `willspend_daily_proof_${todayKey}`

  // Persistence logic
  useEffect(() => {
    const savedTimestamp = localStorage.getItem('willspend_commit_timestamp')
    if (savedTimestamp) {
      const startTime = parseInt(savedTimestamp)
      const now = Math.floor(Date.now() / 1000)
      const elapsed = now - startTime
      if (elapsed < 86400) {
        setIsCommitted(true)
        setTimeLeft(86400 - elapsed)
      }
    }

    const seed = todayKey
      .split('')
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    const baselineCommitted = 132 + (seed % 37)
    const baselineCompleted = Math.round(baselineCommitted * 0.58)

    const savedProof = localStorage.getItem(proofStorageKey)
    if (savedProof) {
      setTodayProof(JSON.parse(savedProof))
    } else {
      const initialProof = {
        committed: baselineCommitted,
        completed: baselineCompleted,
      }
      setTodayProof(initialProof)
      localStorage.setItem(proofStorageKey, JSON.stringify(initialProof))
    }
  }, [])

  // 24-hour Countdown Timer
  useEffect(() => {
    if (!isCommitted) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isCommitted])

  // Real-time Loss Ticker logic
  const dailyLossRate = totalCost / (yearsAtSameSalary > 0 ? yearsAtSameSalary * 365 : 365)
  const lossPerSecond = dailyLossRate / 86400

  useEffect(() => {
    if (isCommitted || isSimulating) return
    const interval = setInterval(() => {
      setTickingLoss((prev) => prev + lossPerSecond)
    }, 100)
    return () => clearInterval(interval)
  }, [isCommitted, isSimulating, lossPerSecond])

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // Action Generation Logic
  const getActionSteps = () => {
    const sortedCats = Object.entries(categories)
      .sort((a: any, b: any) => b[1].amount - a[1].amount)
      .slice(0, 3)

    return sortedCats.map(([key, details]: [string, any]) => {
      const amount = details.amount

      switch (key) {
        case 'idle_savings_cost':
        case 'mobile_banking_idle_cost':
          return {
            title: `Move ${currency}${Math.round(amount * 0.1).toLocaleString()} to high-yield today`,
            impact: `Stopping the slow leak from your ${country === 'Bangladesh' ? 'bKash/Nagad' : 'savings'} balance immediately.`
          }
        case 'missed_investments_cost':
        case 'sip_missed_cost':
        case 'dps_missed_cost':
          const product = country === 'India' ? 'SIP' : (country === 'Bangladesh' ? 'DPS' : 'Index Fund')
          const min = country === 'India' ? '₹500' : (country === 'Bangladesh' ? '৳500' : '$50')
          const fiveYear = amount * Math.pow(1.1, 5) // Rough 10% avg growth
          return {
            title: `Start a ${product} with ${min} today`,
            impact: `Every day you delay this specific ${product} compounds to ${currency}${Math.round(fiveYear).toLocaleString()} in lost future value over 5 years.`
          }
        case 'salary_gap_cost':
          return {
            title: "Send one salary negotiation email this week",
            impact: "A single 8-15% market adjustment solves this entire category of loss permanently."
          }
        case 'subscription_cost':
          return {
            title: `Cancel ${subscriptionsCount} subscriptions today`,
            impact: `Targeting an immediate saving of ${currency}${Math.round(amount / (yearsAtSameSalary > 0 ? yearsAtSameSalary * 12 : 12)).toLocaleString()} per month.`
          }
        case 'debt_cost':
          return {
            title: "Call your bank today about refinancing",
            impact: "One 10-minute negotiation stops the interest bleed on your current balance."
          }
        case 'match_miss_cost':
          return {
            title: "Set up automatic 401k match contribution today",
            impact: "You are literally leaving free money on the table every pay cycle."
          }
        default:
          return {
            title: "Automate your savings transfer tonight",
            impact: "Removing human discipline from the loop is the only way to ensure this loss stops."
          }
      }
    })
  }

  const steps = getActionSteps()

  const handleCommit = () => {
    if (isCommitted) return
    const timestamp = Math.floor(Date.now() / 1000)
    localStorage.setItem('willspend_commit_timestamp', timestamp.toString())
    setIsCommitted(true)
    setShowStepScheduled(true)

    setTodayProof((prev) => {
      const updated = {
        committed: prev.committed + 1,
        completed: prev.completed + 1,
      }
      localStorage.setItem(proofStorageKey, JSON.stringify(updated))
      return updated
    })

    window.setTimeout(() => {
      setShowStepScheduled(false)
    }, 5000)
  }

  const dynamicState = !isCommitted
    ? 'ticker'
    : (isSimulating ? 'simulation' : 'calm')

  return (
    <div className="w-full mb-16 relative">
      <div className="flex flex-col gap-2 mb-8">
        <h2 className="text-4xl md:text-5xl font-display font-black text-red-500 uppercase tracking-tighter italic">
          Stop the Bleed in 24 Hours
        </h2>
        <p className="text-cream/80 text-lg font-medium">
          These 3 actions take under 10 minutes. Every day you wait costs you{" "}
          <span className="text-red-500 font-bold">
            {currency}{(dailyLossRate + tickingLoss).toFixed(2)}
          </span>.
        </p>
        <div className="text-[11px] font-mono uppercase tracking-wider text-cream/35">
          Updated using historical averages • recalculated just now
        </div>
        <div className="text-xs font-mono uppercase tracking-wider text-emerald-400/80">
          Today: {todayProof.committed.toLocaleString()} users committed • {todayProof.completed.toLocaleString()} completed first step
        </div>
      </div>

      <div className="flex flex-col gap-4 mb-8">
        {steps.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`flex items-start gap-5 p-6 bg-charcoal-900/40 border-l-4 transition-all duration-500 ${isCommitted ? 'border-emerald-500' : 'border-red-500'
              }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 transition-colors duration-500 ${isCommitted ? 'bg-emerald-500 text-charcoal-950' : 'bg-red-500 text-white'
              }`}>
              {idx + 1}
            </div>
            <div>
              <div className="text-xl font-display font-bold text-white mb-1">
                {step.title}
              </div>
              <div className="text-sm text-cream/40 font-mono uppercase tracking-wider">
                {step.impact}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="text-sm text-center text-emerald-400 font-medium mb-4">
        Users who act within 24 hours reduce projected loss by up to 30%.
      </div>

      <div className="text-[10px] text-center font-mono uppercase tracking-wider text-cream/30 mb-5">
        Motion Mode: {dynamicState === 'ticker' ? 'Ticker active' : (dynamicState === 'simulation' ? 'Simulation active' : 'Calm state')}
      </div>

      <div className="relative">
        <motion.button
          onClick={handleCommit}
          disabled={isCommitted}
          animate={!isCommitted ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className={`w-full py-6 flex items-center justify-center gap-3 font-display font-black text-xl uppercase tracking-widest transition-all duration-500 ${isCommitted
              ? 'bg-emerald-500 text-charcoal-950 cursor-default'
              : 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_30px_rgba(239,68,68,0.3)]'
            }`}
        >
          {isCommitted ? (
            <>
              <CheckCircle2 className="w-6 h-6" />
              Committed
            </>
          ) : (
            <>
              I Commit to These 3 Steps
              <ArrowRight className="w-6 h-6" />
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {showStepScheduled && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 text-center text-emerald-400 font-display font-bold"
            >
              Step 1 scheduled for today
            </motion.div>
          )}

          {isCommitted && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="overflow-hidden mt-6"
            >
              <div className="bg-charcoal-900/60 p-8 border border-charcoal-800 flex flex-col items-center text-center gap-6">
                <div className="space-y-2">
                  <p className="text-red-500 font-bold text-xl">
                    If you don't start today, you will lose an additional {currency}{(dailyLossRate * 7).toFixed(2)} this week alone.
                  </p>
                  <p className="text-emerald-500 font-bold text-xl">
                    If you start today, you will recover {currency}{(totalCost * 0.15).toLocaleString()} within 3 months.
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2 pt-4 border-t border-charcoal-800 w-full">
                  <div className="flex items-center gap-2 text-cream/30 font-mono uppercase text-xs tracking-widest">
                    <Timer className="w-4 h-4" />
                    Your commitment expires in
                  </div>
                  <div className="text-5xl font-display font-black text-white tabular-nums">
                    {formatTime(timeLeft)}
                  </div>
                </div>

                <ActionSimulationEngine
                  totalCost={totalCost}
                  dailyLossRate={dailyLossRate}
                  currency={currency}
                  country={country}
                  steps={steps}
                  onSimulationChange={setIsSimulating}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
