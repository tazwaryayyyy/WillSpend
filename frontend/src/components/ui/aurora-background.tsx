"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface AuroraBackgroundProps {
  children?: React.ReactNode
  showRadialGradient?: boolean
  className?: string
}

export function AuroraBackground({ 
  children, 
  showRadialGradient = false,
  className 
}: AuroraBackgroundProps) {
  return (
    <div className={cn("relative inset-0 overflow-hidden", className)}>
      {/* Animated aurora effect */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-pink-900/20" />
        <motion.div
          className="absolute inset-0 opacity-30"
          animate={{
            background: [
              "radial-gradient(ellipse at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%)",
              "radial-gradient(ellipse at 80% 50%, rgba(255, 119, 198, 0.3), transparent 50%)",
              "radial-gradient(ellipse at 40% 80%, rgba(120, 219, 255, 0.2), transparent 50%)",
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {showRadialGradient && (
          <motion.div
            className="absolute inset-0 opacity-20"
            animate={{
              background: [
                "radial-gradient(circle at 30% 40%, rgba(41, 121, 255, 0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 70% 60%, rgba(255, 119, 198, 0.15) 0%, transparent 50%)",
                "radial-gradient(circle at 50% 50%, rgba(120, 219, 255, 0.1) 0%, transparent 50%)",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
      </div>
      
      {/* Noise overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.05] mix-blend-overlay">
        <filter>
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="1"
            result="turbulence"
          />
          <feColorMatrix
            in="turbulence"
            type="saturate"
            values="0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#noise)" />
      </svg>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
