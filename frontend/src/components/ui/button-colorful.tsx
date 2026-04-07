"use client"

import { motion } from 'framer-motion'

interface ButtonColorfulProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export function ButtonColorful({ children, className = "", onClick }: ButtonColorfulProps) {
    return (
        <motion.button
            onClick={onClick}
            className={`relative px-8 py-4 bg-gradient-to-r from-lime via-orange to-rose bg-[length:200%_200%] bg-left text-charcoal-950 font-display font-semibold text-sm uppercase tracking-wider rounded-full overflow-hidden group ${className}`}
            whileHover={{
                scale: 1.02,
                backgroundPosition: 'right'
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.3 }}
        >
            <span className="relative z-10 flex items-center gap-3">
                {children}
            </span>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-rose via-orange to-lime opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                initial={false}
            />
        </motion.button>
    )
}