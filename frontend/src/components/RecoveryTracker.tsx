"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Calendar, TrendingUp } from 'lucide-react'

interface RecoveryTrackerProps {
  actions: Array<any>
}

export function RecoveryTracker({ actions }: RecoveryTrackerProps) {
  const [streak, setStreak] = useState(0)
  const [totalRecovered, setTotalRecovered] = useState(0)

  useEffect(() => {
    // Calculate 7-day streak
    const today = new Date()
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    let currentStreak = 0
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000)
      const hasActionOnDay = actions.some(action => {
        const actionDate = new Date(action.timestamp)
        return actionDate.toDateString() === checkDate.toDateString()
      })
      
      if (hasActionOnDay) {
        currentStreak++
      } else {
        break
      }
    }
    
    setStreak(currentStreak)
    
    // Calculate total recovered
    const total = actions.reduce((sum, action) => sum + (action.amount || 0), 0)
    setTotalRecovered(total)
  }, [actions])

  // Generate calendar days
  const generateCalendarDays = () => {
    const days = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000)
      const hasAction = actions.some(action => {
        const actionDate = new Date(action.timestamp)
        return actionDate.toDateString() === date.toDateString()
      })
      
      days.push({
        date,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        hasAction,
        isToday: i === 0
      })
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()

  if (actions.length === 0) return null

  return (
    <section className="py-24 px-6 md:px-12 bg-charcoal-900 border-t border-charcoal-700">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="w-8 h-[1px] bg-lime" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-lime">
              Progress
            </span>
            <span className="w-8 h-[1px] bg-lime" />
          </motion.div>
          
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-3xl md:text-4xl font-display font-bold mb-4 text-cream"
          >
            Your Recovery Journey
          </motion.h2>
          
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
          >
            {/* Streak Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center p-6 bg-charcoal-800/50 border border-charcoal-700 rounded-lg card-hover"
            >
              <Calendar className="w-8 h-8 mx-auto mb-3 text-lime" />
              <div className="text-3xl font-display font-bold text-lime mb-1">{streak}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-cream/40">Day Streak</div>
            </motion.div>

            {/* Actions Completed Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center p-6 bg-charcoal-800/50 border border-charcoal-700 rounded-lg card-hover"
            >
              <CheckCircle className="w-8 h-8 mx-auto mb-3 text-orange" />
              <div className="text-3xl font-display font-bold text-orange mb-1">{actions.length}</div>
              <div className="text-xs font-mono uppercase tracking-wider text-cream/40">Actions Completed</div>
            </motion.div>

            {/* Total Recovered Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center p-6 bg-charcoal-800/50 border border-charcoal-700 rounded-lg card-hover"
            >
              <TrendingUp className="w-8 h-8 mx-auto mb-3 text-rose" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-3xl font-display font-bold text-rose mb-1"
              >
                ${totalRecovered.toLocaleString()}
              </motion.div>
              <div className="text-xs font-mono uppercase tracking-wider text-cream/40">Total Recovered</div>
            </motion.div>
          </motion.div>
        </div>

        {/* 7-Day Calendar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h3 className="text-lg font-display font-semibold mb-6 text-center text-cream/80">7-Day Activity</h3>
          <div className="grid grid-cols-7 gap-2 max-w-2xl mx-auto">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
              <div key={dayName} className="text-center">
                <div className="text-xs font-mono text-cream/30 mb-2 uppercase tracking-wider">{dayName}</div>
                {calendarDays.filter(day => day.dayName === dayName).map((day, dayIndex) => (
                  <motion.div
                    key={`${dayName}-${dayIndex}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 + dayIndex * 0.05 }}
                    className={`aspect-square rounded border flex items-center justify-center relative overflow-hidden ${day.hasAction ? 'bg-lime/10 border-lime/50' : 'bg-charcoal-800/50 border-charcoal-700'} ${day.isToday ? 'ring-2 ring-lime' : ''}`}
                  >
                    <div className="text-lg font-display font-bold text-cream">
                      {day.dayNumber}
                    </div>
                    {day.hasAction && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + dayIndex * 0.05 }}
                        className="absolute top-1 right-1 w-2 h-2 bg-lime rounded-full"
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Actions */}
        {actions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-lg font-display font-semibold mb-6 text-cream/80 flex items-center gap-3">
              <span className="w-6 h-[1px] bg-orange" />
              Recent Recovery Actions
            </h3>
            <div className="space-y-3">
              {actions.slice(-5).reverse().map((action, index) => (
                <motion.div
                  key={action.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-charcoal-800/50 border border-charcoal-700 rounded-lg card-hover"
                >
                  <div>
                    <div className="font-display font-medium text-lime">{action.category}</div>
                    <div className="text-sm text-cream/50">{action.action_hint}</div>
                    <div className="text-xs font-mono text-cream/30">
                      {new Date(action.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-display font-bold text-lime">
                      +${action.amount?.toLocaleString() || '0'}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </section>
  )
}
