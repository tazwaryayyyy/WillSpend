"use client"

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef } from 'react'

interface MagneticButtonProps {
    children: React.ReactNode
    className?: string
    onClick?: () => void
}

export function MagneticButton({ children, className = "", onClick }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null)
    const x = useMotionValue(0)
    const y = useMotionValue(0)

    const springX = useSpring(x, { stiffness: 300, damping: 30 })
    const springY = useSpring(y, { stiffness: 300, damping: 30 })

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!ref.current) return

            const rect = ref.current.getBoundingClientRect()
            const centerX = rect.left + rect.width / 2
            const centerY = rect.top + rect.height / 2

            const distance = Math.sqrt(
                Math.pow(e.clientX - centerX, 2) + Math.pow(e.clientY - centerY, 2)
            )

            if (distance < 100) {
                x.set((e.clientX - centerX) * 0.3)
                y.set((e.clientY - centerY) * 0.3)
            } else {
                x.set(0)
                y.set(0)
            }
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [x, y])

    return (
        <motion.button
            ref={ref}
            style={{
                x: springX,
                y: springY,
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative overflow-hidden ${className}`}
        >
            {children}
        </motion.button>
    )
}