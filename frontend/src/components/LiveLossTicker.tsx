"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LiveLossTickerProps {
  targetValue: number
  country: string
}

export function LiveLossTicker({ targetValue, country }: LiveLossTickerProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isPulsing, setIsPulsing] = useState(false)
  const [isLive, setIsLive] = useState(false) // Whether real data is being shown
  const intervalRef = useRef<any>(null)
  const animationRef = useRef<number | null>(null)
  const lastTargetRef = useRef(0)

  // Start global ticker on mount
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      // If we're not showing live data yet, keep ticking
      if (!isLive) {
        setDisplayValue(prev => {
          const increment = Math.random() * (2.0 - 0.5) + 0.5
          triggerPulse()
          return prev + increment
        })
      }
    }, 100)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [isLive])

  // Handle transition to real result
  useEffect(() => {
    if (targetValue > 10 && targetValue !== lastTargetRef.current) {
      if (!isLive) setIsLive(true)
      
      const startValue = displayValue
      const endValue = targetValue
      const duration = 1500 // 1.5 seconds
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function: easeOutExpo
        const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
        const currentCount = startValue + (endValue - startValue) * ease
        
        setDisplayValue(currentCount)

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate)
        } else {
          lastTargetRef.current = endValue
        }
      }

      if (animationRef.current) cancelAnimationFrame(animationRef.current)
      animationRef.current = requestAnimationFrame(animate)
    }
  }, [targetValue])

  const triggerPulse = () => {
    setIsPulsing(true)
    setTimeout(() => setIsPulsing(false), 80)
  }

  const formatValue = (val: number) => {
    const symbol = country === 'Bangladesh' ? '৳' : (country === 'India' ? '₹' : '$')
    
    if (val >= 1000000) {
      return `${symbol}${(val / 1000000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}M`
    }
    
    return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-charcoal-800/50 border border-rose/20 rounded-lg p-8 mb-16 text-center card-hover relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <AnimatePresence>
        {isPulsing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-rose/5 z-0"
          />
        )}
      </AnimatePresence>

      <div className="relative z-10">
        <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-3">
          {isLive ? "Your Calculated Cost of Inaction" : "Est. Cost of Inaction per second globally"}
        </div>
        
        <motion.div 
          className="text-5xl md:text-7xl font-display font-bold mb-2 gradient-text selection:bg-rose/30"
          animate={isPulsing ? { color: "#ff4d4d", scale: 1.01 } : { color: "#fff", scale: 1 }}
          transition={{ duration: 0.08 }}
        >
          {formatValue(displayValue)}
        </motion.div>
        
        <div className="text-xs font-mono text-cream/30">
          {isLive ? "Analysis based on your inputs" : "Real-time global leak ticker"}
        </div>
      </div>
      
      {/* Box Shadow Pulse */}
      <motion.div
        animate={isPulsing ? { boxShadow: "0 0 20px rgba(255, 77, 77, 0.2)" } : { boxShadow: "0 0 0px rgba(255, 77, 77, 0)" }}
        className="absolute inset-0 rounded-lg pointer-events-none"
      />
    </motion.div>
  )
}
