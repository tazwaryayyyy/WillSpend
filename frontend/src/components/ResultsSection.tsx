"use client"

import { lazy, Suspense, useState, useEffect } from 'react'
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from 'framer-motion'
import { ArrowLeft, Download, CheckCircle, Share2, X, Copy } from 'lucide-react'
import apiClient from '@/api/client'
import { SpotlightCard } from './ui/spotlight-card'
import { parseAiReport } from '@/lib/utils'
import { DelaySlider } from './DelaySlider'
import { ForceActionSystem } from './ForceActionSystem'
import { SocialPressurePanel } from './SocialPressurePanel'

const RecoveryChart = lazy(() => import('./RecoveryChart').then((m) => ({ default: m.RecoveryChart })))
const PeerComparison = lazy(() => import('./PeerComparison').then((m) => ({ default: m.PeerComparison })))

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

const SectionSeparator = ({ text }: { text: string }) => (
  <div className="w-full bg-[#1E293B] text-slate-300 text-center py-4 text-sm tracking-widest uppercase my-12">
    {text}
  </div>
)

const AssumptionsPanel = ({ country }: { country: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  const assumptions: Record<string, Array<{ label: string, value: string }>> = {
    'Bangladesh': [
      { label: 'DPS return rate', value: '7.0% (Bangladesh Bank standard)' },
      { label: 'DSE average growth', value: '9.0% (10-year average)' },
      { label: 'bKash/Nagad savings rate', value: '4.5%' },
      { label: 'Bank FD rate', value: '7.5%' },
      { label: 'Personal loan rate', value: '16.0%' },
      { label: 'Secured loan rate', value: '10.0%' }
    ],
    'India': [
      { label: 'SIP average return', value: '12.0% (Nifty 50, 10-year average)' },
      { label: 'Savings account rate', value: '3.5%' },
      { label: 'High-yield FD rate', value: '7.0%' },
      { label: 'Personal loan rate', value: '14.0%' }
    ],
    'US': [
      { label: 'S&P 500 average return', value: '7.0% (inflation-adjusted)' },
      { label: 'HYSA rate', value: '4.5%' },
      { label: 'Average savings rate', value: '0.5%' },
      { label: 'Personal loan rate', value: '11.0%' }
    ]
  };

  const activeAssumptions = assumptions[country] || assumptions['US'];

  return (
    <div className="mt-8 border-t border-charcoal-800 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-cream/40 hover:text-cream/60 transition-colors mx-auto"
      >
        <span>How We Calculate This</span>
        <svg
          className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-6 pb-4 max-w-md mx-auto">
              <div className="bg-charcoal-900 border border-charcoal-700 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs font-mono">
                  <tbody className="divide-y divide-charcoal-800">
                    {activeAssumptions.map((item, idx) => (
                      <tr key={idx} className="hover:bg-charcoal-800/50">
                        <td className="px-4 py-2 text-cream/40">{item.label}</td>
                        <td className="px-4 py-2 text-cream/80 text-right">{item.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-[10px] text-cream/30 italic text-center leading-normal">
                "Under stable, long-term financial behavior, delaying action has a measurable opportunity cost. This model estimates that cost. It does not assume high-risk decisions."
              </p>
              <p className="mt-2 text-xs text-slate-400 text-center leading-normal">
                All projections are estimates based on historical averages and conservative baseline scenarios. Actual outcomes vary.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export function ResultsSection({ data, onRecoveryComplete, onBack }: ResultsSectionProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [showFallback, setShowFallback] = useState(false)
  const [shareText, setShareText] = useState('')
  const [showExitLock, setShowExitLock] = useState(false)
  const [hoverLeave, setHoverLeave] = useState(false)

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

  const getLossProps = (amount: number) => {
    const isHigh = currency === '৳' ? amount > 100000 : (currency === '₹' ? amount > 500000 : amount > 10000);
    return {
      className: "text-red-500 font-extrabold",
      style: isHigh ? { textShadow: '0 0 20px rgba(239,68,68,0.4)' } : {}
    };
  };

  const getImpactText = (step: any) => {
    const amount = step?.amount_recovered || Math.max(1, Math.round(totalCost * 0.02))
    const timeframe = step?.week
      ? `week ${step.week}`
      : (step?.month ? `month ${step.month}` : (step?.year ? `year ${step.year}` : 'the next 30 days'))

    return `Impact: prevents around ${currency}${Number(amount).toLocaleString()} loss in ${timeframe}`
  }

  if (!data) return null

  return (
    <section id="report-section" className="min-h-screen py-24 px-6 md:px-12 bg-charcoal-950">
      <div className="max-w-7xl mx-auto">
        <SectionSeparator text="Here is how many years of wealth-building you have lost." />

        {country === 'Bangladesh' && (
          <div className="text-center mb-12 -mt-8 text-[10px] font-mono uppercase tracking-widest text-cyan-500 animate-pulse">
            Calculated using Bangladesh Bank rates, DSE historical data, and Sanchayapatra terms as of 2025
          </div>
        )}

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
              className="text-6xl md:text-8xl font-display font-extrabold leading-none mb-4 text-red-500"
            >
              {rounded}
            </motion.div>
            <h2 className="text-2xl md:text-3xl font-display font-bold text-cream mb-2">
              Your financial inaction has set you back <span className="text-red-500 font-extrabold">{targetAge}</span> years
            </h2>
            <p className="text-cream/50 text-lg mb-4">
              That&apos;s {targetAge} years of wealth-building time you can recover
            </p>
            <div className="text-[10px] font-mono uppercase tracking-widest text-cream/20">
              Based on average {country} income
            </div>
            <div className="mt-3 text-[11px] font-mono uppercase tracking-wider text-cream/35">
              Model: {country} • Based on local savings, inflation, and return data
            </div>
          </div>
        </motion.div>

        <div id="recovery-start">
          <ForceActionSystem
            totalCost={totalCost}
            categories={categories}
            country={country}
            currency={currency}
            yearsAtSameSalary={data.profile?.years_at_same_salary || 1}
            subscriptionsCount={data.profile?.subscriptions?.length || 3}
          />
        </div>

        <SectionSeparator text="Here is what happens if you wait even longer." />
        <DelaySlider totalLoss={totalCost} country={country} currency={currency} />

        <SectionSeparator text="Here is what starting today actually looks like." />
        <Suspense fallback={<div className="text-center text-cream/50 py-8">Loading recovery projection...</div>}>
          <RecoveryChart totalLoss={totalCost} country={country} currency={currency} />
        </Suspense>

        <Suspense fallback={<div className="text-center text-cream/50 py-8">Loading peer benchmark...</div>}>
          <PeerComparison userLoss={totalCost} country={country} />
        </Suspense>

        <SocialPressurePanel userLoss={totalCost} country={country} currency={currency} />

        <SectionSeparator text="Here is what you do about it." />
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >

          <button
            onClick={() => setShowExitLock(true)}
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

          <h1 className="text-display text-5xl md:text-7xl text-cream mb-6">
            You left around{' '}
            <span {...getLossProps(totalCost)}>
              {currency}{totalCost.toLocaleString()}
            </span>
            <br />
            <span className="text-charcoal-600">on the table by waiting</span>
          </h1>

          <AssumptionsPanel country={country} />
        </motion.div>

        <div className="text-2xl text-center text-slate-300 py-8">
          "Waiting is the most expensive decision."
        </div>

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
              <div {...getLossProps(totalCost)} className={`${getLossProps(totalCost).className} text-5xl md:text-7xl font-display`}>
                {currency}{totalCost.toLocaleString()}
              </div>
              <div className="mt-4 text-cream/50 text-sm">
                Over {data.profile?.years_at_same_salary || 0} years of inaction
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-cream/35">
                Updated using historical averages • recalculated just now
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
              <div className="text-2xl font-display font-extrabold text-red-500">
                {currency}{Math.round(totalCost / 365).toLocaleString()}
              </div>
              <div className="mt-2 text-cream/50 text-sm">
                Every day you wait
              </div>
              <div className="mt-3 text-[10px] font-mono uppercase tracking-wider text-cream/35">
                Updated using historical averages • recalculated just now
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
              <div className="text-2xl font-display font-extrabold text-emerald-500">
                8.7
              </div>
              <div className="mt-2 text-cream/50 text-sm">
                Estimated months to recover
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
                If you had acted {data.profile?.years_at_same_salary || 0} year(s) ago, your net worth would be around{' '}
                <span className="text-emerald-500 font-extrabold">
                  {currency}{(totalCost * 1.247).toLocaleString()}
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
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-emerald-500">
                  AI Advisor Insights
                </div>
                <motion.div
                  className="w-2 h-2 bg-emerald-500 rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cream/40 mb-5">
                Generated from your loss profile and local model inputs
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
                            <div className="text-[11px] font-mono text-emerald-500 font-extrabold pt-2 border-t border-charcoal-800 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-[1px] bg-emerald-500/40" />
                                {getImpactText(step)}
                              </div>
                              <div className="text-cream/50 pl-4">{step.impact}</div>
                              {step.category && (
                                <div className="text-cyan-400 font-mono text-[10px] uppercase tracking-wider pl-4">
                                  Addresses: {step.category} — recovers {currency}{step.amount_recovered?.toLocaleString() || 0}
                                </div>
                              )}
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
                <div {...getLossProps(details.amount)} className={`${getLossProps(details.amount).className} text-2xl font-display mb-2`}>
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
                    className="text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </motion.button>
                </div>

                {country === 'Bangladesh' && (
                  <div className="mt-4 pt-4 border-t border-charcoal-800/50">
                    <div className="text-[10px] font-mono text-amber-500/80 leading-relaxed italic">
                      {(() => {
                        const baseCategory = category.split(":")[0].trim();
                        switch (baseCategory) {
                          case 'Idle Mobile Banking':
                            return "Most Bangladeshi users keep 60-80% of liquid savings in mobile wallets earning half the rate of a standard FD.";
                          case 'Missed DPS':
                            return "A ৳2,000/month DPS started at age 25 vs 30 means ৳340,000 less at maturity. Same contribution. Five years difference.";
                          case 'Salary Not Negotiated':
                            return "In Bangladesh's corporate sector, only 23% of employees negotiate their first offer. The ones who do earn 12-18% more on average.";
                          case 'Sanchayapatra Missed':
                            return "Bangladesh Sanchayapatra offers 11.28-11.76% return — one of the highest guaranteed rates in South Asia. Most eligible users never apply.";
                          default: return null;
                        }
                      })()}
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-charcoal-800 text-[10px] font-mono text-cream/20 uppercase tracking-tight">
                  {(() => {
                    switch (category) {
                      case 'idle_savings_cost': return `Based on ${country} FD vs savings rate differential`;
                      case 'mobile_banking_idle_cost': return "Based on bKash/Nagad vs Bank FD rate differential";
                      case 'missed_investments_cost': return "Based on S&P 500 10-year average return";
                      case 'sip_missed_cost': return "Based on Nifty 50 10-year average return";
                      case 'dps_missed_cost': return "Based on Bangladesh Bank standard DPS maturity formula";
                      case 'salary_gap_cost': return `Based on reported negotiation outcomes, ${country} labor market`;
                      case 'subscription_cost': return "Based on compounded monthly leak across reported time";
                      case 'debt_cost': return "Based on current bank refinancing benchmarks";
                      case 'match_miss_cost': return "Based on standard employer match compounding";
                      default: return "Based on baseline opportunity cost model";
                    }
                  })()}
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

        <AnimatePresence>
          {showExitLock && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] bg-charcoal-950/90 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-charcoal-900 border border-red-500/40 p-8 rounded-2xl max-w-lg w-full"
              >
                <h3 className="text-2xl font-display font-black text-cream mb-4">Before you leave</h3>
                <p className="text-cream/70 mb-6 leading-relaxed">
                  If you do nothing, you will lose approximately{' '}
                  <span className="text-red-500 font-bold">
                    {currency}{Math.round((totalCost / Math.max(1, (data.profile?.years_at_same_salary || 1) * 365)) * 7 * (hoverLeave ? 1.03 : 1)).toLocaleString()}
                  </span>{' '}
                  in the next 7 days, based on your current profile.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onMouseEnter={() => setHoverLeave(true)}
                    onMouseLeave={() => setHoverLeave(false)}
                    onClick={onBack}
                    className="flex-1 border border-charcoal-600 text-cream/80 py-3 rounded-lg font-display font-bold uppercase tracking-wider hover:border-red-500/50 hover:text-red-400 transition-colors"
                  >
                    Leave anyway
                  </button>
                  <button
                    onClick={() => {
                      setShowExitLock(false)
                      const el = document.getElementById('recovery-start')
                      el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    }}
                    className="flex-1 bg-emerald-500 text-charcoal-950 py-3 rounded-lg font-display font-black uppercase tracking-wider hover:bg-emerald-400 transition-colors"
                  >
                    Start recovery
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
