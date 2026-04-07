"use client"

import { useEffect, useRef } from 'react'

interface AnimatedGradientBackgroundProps {
  className?: string
}

export function AnimatedGradientBackground({ className }: AnimatedGradientBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const animate = () => {
      if (!ctx || !canvas) return

      time += 0.005

      // Create animated gradient
      const gradient1 = ctx.createLinearGradient(
        0,
        0,
        canvas.width,
        canvas.height
      )

      gradient1.addColorStop(0, `hsla(${82 + Math.sin(time) * 10}, 100%, 34%, 0.1)`) // lime
      gradient1.addColorStop(0.5, `hsla(${25 + Math.cos(time) * 5}, 100%, 50%, 0.1)`) // orange
      gradient1.addColorStop(1, `hsla(${344 + Math.sin(time * 0.5) * 10}, 100%, 40%, 0.1)`) // rose

      ctx.fillStyle = gradient1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Add floating orbs
      for (let i = 0; i < 3; i++) {
        const x = (canvas.width / 4) * (i + 1) + Math.sin(time + i) * 50
        const y = canvas.height / 2 + Math.cos(time + i) * 100
        const radius = 100 + Math.sin(time * 2 + i) * 20

        const gradient2 = ctx.createRadialGradient(x, y, 0, x, y, radius)
        gradient2.addColorStop(0, `hsla(${82 + i * 20}, 100%, 34%, 0.2)`) // lime variations
        gradient2.addColorStop(1, 'transparent')

        ctx.fillStyle = gradient2
        ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      }

      requestAnimationFrame(animate)
    }

    resize()
    window.addEventListener('resize', resize)
    animate()

    return () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 w-full h-full ${className || ''}`}
      style={{ zIndex: -1 }}
    />
  )
}
