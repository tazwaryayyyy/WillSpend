"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, useSpring, useTransform, animate } from 'framer-motion'

interface DelaySliderProps {
  totalLoss: number
  country: string
  currency: string
}

export function DelaySlider({ totalLoss, country, currency }: DelaySliderProps) {
  const [years, setYears] = useState(0)
  const [projectedValue, setProjectedValue] = useState(totalLoss)
  
  // Growth rates based on requirements
  const getGrowthRate = (c: string) => {
    switch (c) {
      case 'US': return 0.07
      case 'India': return 0.12
      case 'Bangladesh': return 0.09
      default: return 0.07
    }
  }

  const rate = getGrowthRate(country)

  // Live calculation on slider change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    setYears(val)
    const newProjected = totalLoss * Math.pow(1 + rate, val)
    setProjectedValue(newProjected)
  }

  // Count-up animation for the number
  const countRef = useRef<HTMLSpanElement>(null)
  
  useEffect(() => {
    const node = countRef.current
    if (node) {
      const controls = animate(parseFloat(node.innerText.replace(/[^0-9.-]+/g, "") || "0"), projectedValue, {
        duration: 0.3,
        onUpdate(value) {
          node.innerText = `${currency}${Math.round(value).toLocaleString()}`
        }
      })
      return () => controls.stop()
    }
  }, [projectedValue, currency])

  // Scaling shadow for pulsing red glow if above threshold
  const isHighLoss = currency === '৳' ? projectedValue > 100000 : (currency === '₹' ? projectedValue > 500000 : projectedValue > 10000);
  const glowIntensity = isHighLoss ? (years / 5) * 20 + 20 : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full bg-charcoal-800/30 border border-charcoal-700/50 rounded-2xl p-8 mb-12"
    >
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-end">
          <div>
            <h3 className="text-cream/50 font-mono text-xs uppercase tracking-widest mb-2">
              The Cost of Further Delay
            </h3>
            <div className="text-xl font-display font-medium text-cream">
              {years === 0 ? (
                "This is your loss right now"
              ) : (
                <>What if you wait <span className="text-red-500 font-extrabold">{years}</span> more years?</>
              )}
            </div>
          </div>
          <div className="text-right">
            <motion.div 
              className="text-4xl md:text-6xl font-display font-extrabold text-red-500"
              style={glowIntensity > 0 ? { textShadow: `0 0 ${glowIntensity}px rgba(239, 68, 68, 0.4)` } : {}}
            >
              <span ref={countRef}>{currency}{totalLoss.toLocaleString()}</span>
            </motion.div>
            {years > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-red-500 font-extrabold text-xs mt-1"
              >
                + {currency}{Math.round(projectedValue - totalLoss).toLocaleString()} more damage from waiting
              </motion.div>
            )}
          </div>
        </div>

        <div className="relative pt-4 pb-2">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={years}
            onChange={handleChange}
            className="delay-slider"
          />
          <div className="flex justify-between mt-4 text-[10px] font-mono uppercase tracking-tighter text-cream/30">
            <span>Today</span>
            <span>5 years from now</span>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .delay-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: #262626;
          border-radius: 5px;
          outline: none;
          cursor: pointer;
        }

        .delay-slider::-webkit-slider-runnable-track {
          background: linear-gradient(to right, #ef4444 ${ (years / 5) * 100 }%, #262626 ${ (years / 5) * 100 }%);
          height: 6px;
          border-radius: 5px;
        }

        .delay-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          margin-top: -9px;
          transition: transform 0.1s ease;
        }

        .delay-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .delay-slider::-moz-range-track {
          background: #262626;
          height: 6px;
          border-radius: 5px;
        }

        .delay-slider::-moz-range-progress {
          background: #ef4444;
          height: 6px;
          border-radius: 5px;
        }

        .delay-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: #ffffff;
          border-radius: 50%;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          cursor: pointer;
          border: none;
          transition: transform 0.1s ease;
        }
      `}} />
    </motion.div>
  )
}
