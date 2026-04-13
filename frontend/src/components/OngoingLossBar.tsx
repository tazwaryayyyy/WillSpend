import { useState, useEffect } from 'react'

interface OngoingLossBarProps {
  dailyLossRate: number
  currency: string
  isVisible: boolean
}

export function OngoingLossBar({ dailyLossRate, currency, isVisible }: OngoingLossBarProps) {
  const [minutesElapsed, setMinutesElapsed] = useState(1)

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setMinutesElapsed((prev) => prev + 1)
    }, 60000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  const amountLost = (dailyLossRate / 1440) * minutesElapsed

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F172A] border-t border-red-500 h-[44px] flex items-center justify-center gap-2 px-4 shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
      {/* Pulsing Red Dot */}
      <div className="relative flex items-center justify-center">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <div className="absolute w-2 h-2 bg-red-500/50 rounded-full animate-ping" />
      </div>

      <div className="text-white text-sm sm:text-base font-medium flex items-center gap-1.5 mobile:text-xs">
        <span>+</span>
        <span className="text-red-500 font-bold tabular-nums">
          {currency}{amountLost.toFixed(2)}
        </span>
        <span className="opacity-80">lost in the last</span>
        <span className="font-mono">{minutesElapsed}</span>
        <span className="opacity-80">{minutesElapsed === 1 ? 'minute' : 'minutes'}</span>
      </div>
      
      <style jsx>{`
        @media (max-width: 640px) {
          .text-sm {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  )
}
