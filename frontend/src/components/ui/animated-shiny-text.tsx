"use client"

import { motion } from 'framer-motion'

interface AnimatedShinyTextProps {
    children: React.ReactNode
    className?: string
}

export function AnimatedShinyText({ children, className = "" }: AnimatedShinyTextProps) {
    return (
        <motion.span
            className={`relative inline-block ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <span className="relative z-10 bg-gradient-to-r from-cream via-lime to-cream bg-clip-text text-transparent animate-shimmer">
                {children}
            </span>
            <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-lime/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut'
                }}
            />
        </motion.span>
    )
}