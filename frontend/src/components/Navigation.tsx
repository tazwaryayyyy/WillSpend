"use client"

import { useState, useEffect } from 'react'

interface NavigationProps {
  showResults: boolean
}

export function Navigation({ showResults }: NavigationProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      const scrollingDown = currentScrollY > lastScrollY

      if (scrollingDown && currentScrollY > 100) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 bg-charcoal-950/90 backdrop-blur-md border-b border-charcoal-700 transition-transform duration-300 ${isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-1">
            <span className="text-xl font-display font-bold text-cream tracking-wide">WILL</span>
            <span className="text-xl font-display font-bold text-lime tracking-wide">SPEND</span>
          </div>

          <div className="hidden md:flex items-center space-x-8">
            {showResults && (
              <a href="#report-section" className="text-xs font-mono uppercase tracking-wider text-cream/60 hover:text-lime transition-colors">
                Report
              </a>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
