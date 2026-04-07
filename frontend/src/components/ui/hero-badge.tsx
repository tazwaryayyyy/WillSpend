"use client"

import { motion } from 'framer-motion'

interface HeroBadgeProps {
    children: React.ReactNode
    className?: string
}

export function HeroBadge({ children, className = "" }: HeroBadgeProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-lime/10 border border-lime/20 rounded-full text-lime text-sm font-mono uppercase tracking-wider ${className}`}
        >
            <div className="w-2 h-2 bg-lime rounded-full animate-pulse" />
            {children}
        </motion.div>
    )
}