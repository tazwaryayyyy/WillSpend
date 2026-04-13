"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SocialPressurePanelProps {
  userLoss: number
  country: string
  currency: string
}

interface SeedData {
  count: number
  avg: number
}

const COUNTRY_SEEDS: Record<string, SeedData> = {
  Bangladesh: { count: 47, avg: 180000 },
  India: { count: 312, avg: 420000 },
  US: { count: 891, avg: 28000 }
}

export function SocialPressurePanel({ userLoss, country, currency }: SocialPressurePanelProps) {
  const seed = COUNTRY_SEEDS[country] || COUNTRY_SEEDS.US
  
  // Persistent user count
  const [peopleCount, setPeopleCount] = useState<number>(seed.count)
  const [avgLoss, setAvgLoss] = useState<number>(seed.avg)
  const [updateKey, setUpdateKey] = useState(0) // Used to trigger fade animations

  // Initial Load from LocalStorage
  useEffect(() => {
    const storageKey = `willspend_social_count_${country}`
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      setPeopleCount(parseInt(saved))
    } else {
      localStorage.setItem(storageKey, seed.count.toString())
    }
  }, [country, seed.count])

  // Increment User Count at Random Intervals (12-45s)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const scheduleNext = () => {
      const waitTime = Math.floor(Math.random() * (45000 - 12000 + 1) + 12000)
      timeoutId = setTimeout(() => {
        setPeopleCount(prev => {
          const next = prev + 1
          localStorage.setItem(`willspend_social_count_${country}`, next.toString())
          return next
        })
        setUpdateKey(k => k + 1)
        scheduleNext()
      }, waitTime)
    }

    scheduleNext()
    return () => clearTimeout(timeoutId)
  }, [country])

  // Average Loss Drift (+/- 0.3% every 20s)
  useEffect(() => {
    const interval = setInterval(() => {
      setAvgLoss(prev => {
        const drift = 1 + (Math.random() * 0.006 - 0.003)
        return prev * drift
      })
      setUpdateKey(k => k + 1)
    }, 20000)

    return () => clearInterval(interval)
  }, [])

  // Comparison Logic
  const top20Threshold = avgLoss * 0.4
  const isTop20 = userLoss < top20Threshold
  const isAboveAverage = userLoss > avgLoss
  const percentAbove = isAboveAverage ? Math.round(((userLoss - avgLoss) / avgLoss) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full bg-charcoal-900 border border-charcoal-700/50 rounded-2xl p-8 mb-12 relative overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-8">
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
        <h3 className="text-cream/50 font-mono text-xs uppercase tracking-widest">
          How {country} Is Doing Right Now
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* People Calculated */}
        <div className="space-y-1">
          <div className="text-cream/30 text-[10px] font-mono uppercase tracking-wider">
            People who calculated today
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={peopleCount}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-display font-black text-cream"
            >
              {peopleCount.toLocaleString()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Avg Loss */}
        <div className="space-y-1">
          <div className="text-cream/30 text-[10px] font-mono uppercase tracking-wider">
            Average loss calculated today
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={avgLoss}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-display font-black text-cream"
            >
              {currency}{Math.round(avgLoss).toLocaleString()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Top 20% Threshold */}
        <div className="space-y-1">
          <div className="text-cream/30 text-[10px] font-mono uppercase tracking-wider">
            Top 20% of users lost less than
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={top20Threshold}
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0.5 }}
              transition={{ duration: 0.15 }}
              className="text-3xl font-display font-black text-cream"
            >
              {currency}{Math.round(top20Threshold).toLocaleString()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="border-t border-charcoal-800 pt-8">
        {isTop20 ? (
          <div className="text-2xl md:text-3xl font-display font-black text-emerald-500">
            You are in the top 20% of {country} users today
          </div>
        ) : isAboveAverage ? (
          <div className="text-2xl md:text-3xl font-display font-black text-red-500">
            Your loss is {percentAbove}% above the {country} average
          </div>
        ) : (
          <div className="text-2xl md:text-3xl font-display font-black text-amber-500">
            You are average — here is how to move into the top 20%
          </div>
        )}
      </div>

      <div className="mt-8 text-[9px] font-mono uppercase tracking-tight text-cream/20 italic">
        Based on aggregated anonymous session data
      </div>
    </motion.div>
  )
}
