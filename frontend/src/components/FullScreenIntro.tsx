"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FullScreenIntroProps {
  onFinish: (finalValue: number) => void
  currencySymbol: string
}

const GUT_PUNCH_LINES = [
  "The salary you never negotiated.",
  "The savings account you never switched.",
  "The investment you kept putting off."
]

export function FullScreenIntro({ onFinish, currencySymbol }: FullScreenIntroProps) {
  const [tickerValue, setTickerValue] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [showCTA, setShowCTA] = useState(false)
  const [isFadingOut, setIsFadingOut] = useState(false)
  
  const startTimeRef = useRef(Date.now())
  const lastUpdateRef = useRef(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const animate = () => {
      const now = Date.now()
      const elapsed = now - startTimeRef.current
      const sinceLastUpdate = now - lastUpdateRef.current

      // Ticker logic: update every 80ms by random 0.8-2.5 units
      if (sinceLastUpdate >= 80) {
        const increment = Math.random() * (2.5 - 0.8) + 0.8
        setTickerValue(prev => prev + increment)
        lastUpdateRef.current = now
      }

      // Line cycling logic: every 800ms
      const currentLine = Math.floor(elapsed / 800) % GUT_PUNCH_LINES.length
      setLineIndex(currentLine)

      // 3000ms: show CTA
      if (elapsed >= 3000 && !showCTA) {
        setShowCTA(true)
      }

      // 3500ms: trigger finish
      if (elapsed >= 3500) {
        setIsFadingOut(true)
        // Give it 500ms to fade out before unmounting
        setTimeout(() => {
          onFinish(tickerValue)
        }, 500)
        return // Stop the animation
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [onFinish, showCTA, tickerValue])

  return (
    <AnimatePresence>
      {!isFadingOut && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center text-center px-6"
        >
          <div className="space-y-8 max-w-2xl">
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl md:text-2xl font-display text-cream/30 uppercase tracking-[0.2em]"
            >
              While you were deciding...
            </motion.p>

            <div className="text-6xl md:text-8xl lg:text-9xl font-display font-black text-white tabular-nums tracking-tighter">
              {currencySymbol}{tickerValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-2xl md:text-3xl font-display font-bold text-red-500"
            >
              ...you lost this much to financial inaction
            </motion.p>

            <div className="h-8 overflow-hidden relative">
              <AnimatePresence mode="wait">
                <motion.p
                  key={lineIndex}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="text-cream/50 text-lg md:text-xl italic font-serif"
                >
                  {GUT_PUNCH_LINES[lineIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={showCTA ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            className="absolute bottom-12 text-amber-500 font-mono text-sm uppercase tracking-widest"
          >
            Find out your exact number →
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
