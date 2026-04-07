"use client"

import { motion } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle } from 'lucide-react'
import axios from 'axios'
import { useState } from 'react'
import { SpotlightCard } from './ui/spotlight-card'

interface ResultsSectionProps {
  data: any
  onRecoveryComplete: (action: any) => void
  onBack: () => void
}

export function ResultsSection({ data, onRecoveryComplete, onBack }: ResultsSectionProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await axios.post('/api/generate_report', {
        simulation: data.simulation,
        user_profile: data.profile,
        ai_advice: data.ai_report
      }, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `WillSpend_Report_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF generation failed:', error)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleRecoveryAction = (category: string, amount: number, actionHint: string) => {
    const action = {
      id: Date.now().toString(),
      category,
      amount,
      action_hint: actionHint,
      timestamp: new Date().toISOString(),
      completed: true
    }
    onRecoveryComplete(action)
  }

  if (!data) return null

  const totalCost = data.simulation?.total_inaction_cost || 0
  const categories = data.simulation?.categories || {}

  return (
    <section id="report-section" className="min-h-screen py-24 px-6 md:px-12 bg-charcoal-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-cream/50 hover:text-lime transition-colors mb-8 text-sm font-mono uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className="w-12 h-[1px] bg-rose" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-rose">
              Analysis Complete
            </span>
          </div>

          <h1 className="text-display text-5xl md:text-7xl lg:text-8xl text-cream mb-6">
            You threw away{' '}
            <span className="gradient-text">
              ${totalCost.toLocaleString()}
            </span>
            <br />
            <span className="text-charcoal-600">by doing nothing</span>
          </h1>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Main Cost Card - spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.1,
              duration: 1.5,
              bounce: 0.3
            }}
            className="lg:col-span-2"
          >
            <SpotlightCard className="p-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-4">
                Total Inaction Cost
              </div>
              <div className="text-6xl md:text-7xl font-display font-bold gradient-text">
                ${totalCost.toLocaleString()}
              </div>
              <div className="mt-4 text-cream/50 text-sm">
                Over {data.profile?.years_at_same_salary || 0} years of inaction
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Daily Loss Card */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.2,
              duration: 1.5,
              bounce: 0.3
            }}
          >
            <SpotlightCard className="p-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-4">
                Daily Loss
              </div>
              <div className="text-4xl font-display font-bold text-rose">
                ${Math.round(totalCost / 365).toLocaleString()}
              </div>
              <div className="mt-2 text-cream/50 text-sm">
                Every day you wait
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Recovery Time Card */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.3,
              duration: 1.5,
              bounce: 0.3
            }}
          >
            <SpotlightCard className="p-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-4">
                Recovery Time
              </div>
              <div className="text-4xl font-display font-bold text-lime">
                8.3
              </div>
              <div className="mt-2 text-cream/50 text-sm">
                Months to recover
              </div>
            </SpotlightCard>
          </motion.div>

          {/* Counterfactual Card - spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.4,
              duration: 1.5,
              bounce: 0.3
            }}
            className="lg:col-span-2"
          >
            <SpotlightCard className="p-8">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-4">
                Counterfactual You
              </div>
              <p className="text-lg text-cream/80 leading-relaxed">
                If you had acted {data.profile?.years_at_same_salary || 0} year(s) ago, your net worth would be approximately{' '}
                <span className="text-lime font-semibold">
                  ${(totalCost * 1.25).toLocaleString()}
                </span>{' '}
                higher today.
              </p>
            </SpotlightCard>
          </motion.div>

          {/* AI Insights Card - spans 2 columns */}
          <motion.div
            initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
            whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.5,
              duration: 1.5,
              bounce: 0.3
            }}
            className="lg:col-span-2"
          >
            <SpotlightCard className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-lime">
                  AI Advisor Insights
                </div>
                <motion.div
                  className="w-2 h-2 bg-lime rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div
                className="text-cream/70 leading-relaxed prose prose-invert prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: data.ai_report || 'AI report loading...' }}
              />
            </SpotlightCard>
          </motion.div>
        </div>

        {/* Loss Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-display font-bold text-cream mb-6 flex items-center gap-3">
            <span className="w-8 h-[1px] bg-orange" />
            Loss Breakdown
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categories).map(([category, details]: [string, any], index) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className="bg-charcoal-800/50 border border-charcoal-700 p-6 rounded-lg card-hover"
              >
                <div className="text-xs font-mono uppercase tracking-wider text-cream/40 mb-2">
                  {category}
                </div>
                <div className="text-2xl font-display font-bold text-rose mb-2">
                  ${details.amount?.toLocaleString() || '0'}
                </div>
                <p className="text-sm text-cream/50 mb-4">
                  {details.action_hint}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-charcoal-700">
                  <span className="text-xs font-mono text-cream/40">
                    +${details.estimated_recovery_1year?.toLocaleString() || '0'}/year recoverable
                  </span>
                  <motion.button
                    onClick={() => handleRecoveryAction(category, details.amount, details.action_hint)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-lime hover:text-lime/80 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Download Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="flex justify-center"
        >
          <motion.button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="clip-button border border-lime text-lime px-8 py-4 font-display font-semibold text-sm uppercase tracking-wider hover:bg-lime hover:text-charcoal-950 transition-all duration-300 flex items-center gap-3 disabled:opacity-50"
          >
            {isGeneratingPDF ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-lime/30 border-t-lime rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Full Report
              </>
            )}
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
