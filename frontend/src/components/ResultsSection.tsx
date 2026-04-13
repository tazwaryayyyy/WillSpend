"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle, Share2, X, Copy } from 'lucide-react'
import apiClient from '@/api/client'
import { SpotlightCard } from './ui/spotlight-card'
import { parseAiReport } from '@/lib/utils'
import { PeerComparison } from './PeerComparison'
import { DelaySlider } from './DelaySlider'
import { RecoveryChart } from './RecoveryChart'

interface ResultsSectionProps {
  data: any
  onRecoveryComplete: (action: any) => void
  onBack: () => void
}

// Framer Motion variants moved outside to prevent re-renders
const containerVariants = {
  visible: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
}

export function ResultsSection({ data, onRecoveryComplete, onBack }: ResultsSectionProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [shareText, setShareText] = useState('')

  const totalCost = data.simulation?.total_inaction_cost || 0
  const categories = data.simulation?.categories || {}
  const currency = data.profile?.country === 'Bangladesh' ? '৳' : (data.profile?.country === 'India' ? '₹' : '$')
  const { summary, roadmap } = parseAiReport(data.ai_report)

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      const response = await apiClient.post('/api/generate_report', {
        simulation: data.simulation,
        user_profile: data.profile,
        ai_advice: data.ai_report
      }, { responseType: 'blob' })

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
      alert("Failed to generate PDF. The backend might be cold-starting or unavailable. Please try again in a few seconds.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleShare = async () => {
    let biggestLeak = 'Misc'
    let maxAmount = 0
    Object.entries(categories).forEach(([cat, d]: [string, any]) => {
      if (d.amount > maxAmount) {
        maxAmount = d.amount
        biggestLeak = cat
      }
    })

    const firstAction = roadmap && roadmap[0] ? roadmap[0].action : 'Take financial action'
    const text = `I just calculated my financial inaction cost with WillSpend.
Total estimated loss: ${currency}${totalCost.toLocaleString()}
Biggest leak: ${biggestLeak}
Recovery starts: Week 1 — ${firstAction}
Calculate yours: ${window.location.origin}`

    setShareText(text)
    try {
      await navigator.clipboard.writeText(text)
      setShowToast(true)
      setTimeout(() => setShowToast(false), 2500)
    } catch (err) {
      setShowFallback(true)
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

  // Inaction Age Logic
  const avgIncomes: Record<string, number> = {
    'US': 65000,
    'India': 600000,
    'Bangladesh': 360000
  }
  const country = data.profile?.country || 'US'
  const income = avgIncomes[country] || 65000
  const targetAge = Number((totalCost / income).toFixed(1))
  
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => latest.toFixed(1))

  useEffect(() => {
    const controls = animate(count, targetAge, {
      duration: 2,
      ease: "easeOut",
    })
    return controls.stop
  }, [targetAge])

  const ageColor = targetAge < 2 ? 'text-amber-500' : (targetAge <= 5 ? 'text-orange-500' : 'text-rose-500')

  if (!data) return null

  return (
    <section id="report-section" className="min-h-screen py-24 px-6 md:px-12 bg-charcoal-950">
      <div className="max-w-7xl mx-auto">
        {/* Inaction Age Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-20 text-center"
        >
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-cream/30 mb-6">
            Financial Impact Score
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <motion.div 
              className={`text-8xl md:text-9xl font-display font-black leading-none mb-4 ${ageColor}`}
            >
              {rounded}
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cream mb-2">
              Your financial inaction has set you back <span className={ageColor}>{targetAge}</span> years
            </h2>
            <p className="text-cream/50 text-lg mb-4">
              That&apos;s {targetAge} years of wealth-building time you can recover
            </p>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cream/20">
              Based on average {country} income
            </div>
          </div>
        </motion.div>
        
        <DelaySlider totalLoss={totalCost} country={country} currency={currency} />
        
        <RecoveryChart totalLoss={totalCost} country={country} currency={currency} />

        <PeerComparison userLoss={totalCost} country={country} />
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
              {currency}{totalCost.toLocaleString()}
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
                {currency}{totalCost.toLocaleString()}
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
                {currency}{Math.round(totalCost / 365).toLocaleString()}
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
                  {currency}{(totalCost * 1.25).toLocaleString()}
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
              <div className="flex items-center gap-3 mb-6">
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-lime">
                  AI Advisor Insights
                </div>
                <motion.div
                  className="w-2 h-2 bg-lime rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>

              {(() => {
                return (
                  <div className="space-y-8">
                    <div
                      className="text-cream/70 leading-relaxed prose prose-invert prose-sm max-w-none mb-8"
                      dangerouslySetInnerHTML={{ __html: summary || 'Calculating your recovery roadmap...' }}
                    />

                    {roadmap && Array.isArray(roadmap) && (
                      <motion.div 
                        initial="hidden"
                        animate="visible"
                        variants={containerVariants}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        {roadmap.map((step: any, idx: number) => (
                          <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="bg-charcoal-900/50 border border-charcoal-700 p-5 rounded-lg relative overflow-hidden group hover:border-lime/30 transition-colors"
                          >
                            <div className="absolute top-0 left-0 bg-lime/10 text-lime px-3 py-1 text-[10px] font-mono uppercase tracking-tighter border-br border-charcoal-700">
                              {step.week ? `Week ${step.week}` : (step.month ? `Month ${step.month}` : `Year ${step.year}`)}
                            </div>
                            
                            <h4 className="text-cream font-display font-bold mb-2 mt-4">
                              {step.title}
                            </h4>
                            <p className="text-sm text-cream/50 mb-3 leading-snug">
                              {step.action}
                            </p>
                            <div className="text-[11px] font-mono text-lime/80 pt-2 border-t border-charcoal-800 flex items-center gap-2">
                              <span className="w-2 h-[1px] bg-lime/40" />
                              IMPACT: {step.impact}
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </div>
                )
              })()}
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
                  {currency}{details.amount?.toLocaleString() || '0'}
                </div>
                <p className="text-sm text-cream/50 mb-4">
                  {details.action_hint}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-charcoal-700">
                  <span className="text-xs font-mono text-cream/40">
                    +{currency}{details.estimated_recovery_1year?.toLocaleString() || '0'}/year recoverable
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

        {/* Share Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex justify-center mt-4"
        >
          <motion.button
            onClick={handleShare}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="w-full max-w-[260px] border border-indigo-500 text-indigo-400 px-8 py-4 font-display font-semibold text-sm uppercase tracking-wider hover:bg-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-3"
          >
            <Share2 className="w-5 h-5" />
            Share Results
          </motion.button>
        </motion.div>

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100] bg-lime text-charcoal-950 px-6 py-3 rounded-full font-display font-bold text-sm shadow-2xl flex items-center gap-3"
            >
              <CheckCircle className="w-4 h-4" />
              Copied to clipboard — share anywhere
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fallback Modal */}
        <AnimatePresence>
          {showFallback && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-charcoal-950/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-charcoal-900 border border-indigo-500/30 p-8 rounded-2xl max-w-lg w-full relative"
              >
                <button 
                  onClick={() => setShowFallback(false)}
                  className="absolute top-4 right-4 text-cream/40 hover:text-cream"
                >
                  <X className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-display font-bold text-cream mb-4">Share Your Results</h3>
                <p className="text-cream/50 text-sm mb-6">Clipboard access denied. Copy the text below manually:</p>
                <textarea 
                  readOnly 
                  value={shareText}
                  className="w-full h-40 bg-charcoal-950 border border-charcoal-700 rounded-lg p-4 text-cream/80 text-sm font-mono mb-6 focus:outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  onClick={() => {
                    const el = document.querySelector('textarea');
                    el?.select();
                    document.execCommand('copy');
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 2000);
                  }}
                  className="w-full bg-indigo-600 text-white py-4 rounded-lg font-display font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  <Copy className="w-5 h-5" />
                  Select & Copy All
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
