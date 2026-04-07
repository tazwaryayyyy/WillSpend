"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'

interface FormData {
  age: number
  monthly_income: number
  current_salary: number
  market_rate_salary: number
  years_at_same_salary: number
  savings_balance: number
  current_savings_rate: number
  high_yield_savings_rate: number
  years_savings_idle: number
  monthly_investment_missed: number
  years_not_investing: number
  country: string
  city: string
  employer_match_pct?: number
  user_contribution_pct?: number
  years_not_matching_401k?: number
  monthly_sip_missed?: number
  years_sip_delayed?: number
  subscriptions: Array<{ name: string; monthly_cost: number; months_active: number }>
  debts: Array<{ name: string; balance: number; current_rate: number; refinance_rate: number; years: number }>
}

interface FormSectionProps {
  onSubmit: (data: any) => void
}

export function FormSection({ onSubmit }: FormSectionProps) {
  const [formData, setFormData] = useState<FormData>({
    age: 28,
    monthly_income: 3500,
    current_salary: 3000,
    market_rate_salary: 3800,
    years_at_same_salary: 2,
    savings_balance: 10000,
    current_savings_rate: 0.5,
    high_yield_savings_rate: 4.5,
    years_savings_idle: 3,
    monthly_investment_missed: 200,
    years_not_investing: 4,
    country: 'US',
    city: '',
    employer_match_pct: 6,
    user_contribution_pct: 3,
    years_not_matching_401k: 2,
    monthly_sip_missed: 0,
    years_sip_delayed: 0,
    subscriptions: [{ name: 'Netflix', monthly_cost: 15.99, months_active: 12 }],
    debts: [{ name: 'Credit Card', balance: 5000, current_rate: 18.9, refinance_rate: 12.9, years: 3 }],
  })

  const [isLoading, setIsLoading] = useState(false)
  const [liveLoss, setLiveLoss] = useState(0)

  // Calculate live loss as user types
  useEffect(() => {
    const calculateLoss = () => {
      let totalLoss = 0

      const salaryGap = (formData.market_rate_salary - formData.current_salary) * 12 * formData.years_at_same_salary
      totalLoss += salaryGap

      if (formData.savings_balance > 0) {
        const rateDiff = formData.high_yield_savings_rate - formData.current_savings_rate
        const savingsLoss = formData.savings_balance * (Math.pow(1 + rateDiff / 100, formData.years_savings_idle) - 1)
        totalLoss += savingsLoss
      }

      const investmentLoss = formData.monthly_investment_missed * 12 * formData.years_not_investing * 2.5
      totalLoss += investmentLoss

      if (formData.country === 'US' && formData.employer_match_pct && formData.years_not_matching_401k && formData.user_contribution_pct !== undefined) {
        const matchLeak = Math.max(0, formData.employer_match_pct - formData.user_contribution_pct) / 100 * formData.current_salary * 12 * formData.years_not_matching_401k * 1.1
        totalLoss += matchLeak
      }

      if (formData.country === 'India' && formData.monthly_sip_missed && formData.years_sip_delayed) {
        const sipLoss = formData.monthly_sip_missed * 12 * formData.years_sip_delayed * 1.5
        totalLoss += sipLoss
      }

      formData.subscriptions.forEach(sub => {
        totalLoss += sub.monthly_cost * sub.months_active
      })

      setLiveLoss(Math.round(totalLoss))
    }

    const timeoutId = setTimeout(calculateLoss, 300)
    return () => clearTimeout(timeoutId)
  }, [formData])

  const addSubscription = () => {
    setFormData(prev => ({
      ...prev,
      subscriptions: [...prev.subscriptions, { name: '', monthly_cost: 0, months_active: 12 }]
    }))
  }

  const removeSubscription = (index: number) => {
    setFormData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.filter((_, i) => i !== index)
    }))
  }

  const updateSubscription = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      subscriptions: prev.subscriptions.map((sub, i) =>
        i === index ? { ...sub, [field]: value } : sub
      )
    }))
  }

  const addDebt = () => {
    setFormData(prev => ({
      ...prev,
      debts: [...prev.debts, { name: '', balance: 0, current_rate: 0, refinance_rate: 0, years: 0 }]
    }))
  }

  const removeDebt = (index: number) => {
    setFormData(prev => ({
      ...prev,
      debts: prev.debts.filter((_, i) => i !== index)
    }))
  }

  const updateDebt = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      debts: prev.debts.map((debt, i) =>
        i === index ? { ...debt, [field]: value } : debt
      )
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await axios.post('/api/analyze', formData)
      onSubmit(response.data)
    } catch (error) {
      console.error('Analysis failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section id="analysis-form" className="py-24 md:py-32 px-6 md:px-12 bg-charcoal-900">
      <motion.div
        initial={{ opacity: 0, filter: 'blur(12px)', y: 20 }}
        whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        viewport={{ once: true }}
        transition={{
          duration: 1.5,
          bounce: 0.3,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="max-w-4xl mx-auto"
      >
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-3 mb-6"
          >
            <span className="w-8 h-[1px] bg-orange" />
            <span className="text-xs font-mono uppercase tracking-[0.25em] text-orange">
              Your Profile
            </span>
            <span className="w-8 h-[1px] bg-orange" />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold mb-4 text-cream"
          >
            What&apos;s your financial profile?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-cream/50 text-lg max-w-xl mx-auto"
          >
            Be honest — the more accurate your inputs, the harder the truth hits.
          </motion.p>
        </div>

        {/* Live Loss Ticker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="bg-charcoal-800/50 border border-rose/20 rounded-lg p-8 mb-16 text-center card-hover"
        >
          <div className="text-xs font-mono uppercase tracking-[0.2em] text-cream/40 mb-3">
            Estimated Total Loss
          </div>
          <div className="text-5xl md:text-6xl font-display font-bold gradient-text mb-2">
            ${liveLoss.toLocaleString()}
          </div>
          <div className="text-xs font-mono text-cream/30">Updates as you type</div>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Personal Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-display font-semibold mb-6 text-lime flex items-center gap-2">
                <span className="w-6 h-[1px] bg-lime" />
                Personal
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Country</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  >
                    <option value="US">United States</option>
                    <option value="India">India</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="e.g. Austin or Mumbai"
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData(prev => ({ ...prev, age: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Monthly Income ($)</label>
                  <input
                    type="number"
                    value={formData.monthly_income}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_income: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Financial Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-display font-semibold mb-6 text-orange flex items-center gap-2">
                <span className="w-6 h-[1px] bg-orange" />
                Financial Details
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Current Monthly Salary ($)</label>
                  <input
                    type="number"
                    value={formData.current_salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_salary: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Market Rate Salary ($)</label>
                  <input
                    type="number"
                    value={formData.market_rate_salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, market_rate_salary: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Years at Same Salary</label>
                  <input
                    type="number"
                    value={formData.years_at_same_salary}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_at_same_salary: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Savings Balance ($)</label>
                  <input
                    type="number"
                    value={formData.savings_balance}
                    onChange={(e) => setFormData(prev => ({ ...prev, savings_balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Country-specific fields */}
          {formData.country === 'US' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-charcoal-800/50 p-6 rounded-lg border border-charcoal-700"
            >
              <h3 className="text-lg font-display font-semibold mb-6 text-lime flex items-center gap-2">
                <span className="w-6 h-[1px] bg-lime" />
                401k Match (US Only)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Employer Match (%)</label>
                  <input
                    type="number"
                    value={formData.employer_match_pct || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, employer_match_pct: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Your Contribution (%)</label>
                  <input
                    type="number"
                    value={formData.user_contribution_pct || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, user_contribution_pct: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Years Not Matching</label>
                  <input
                    type="number"
                    value={formData.years_not_matching_401k || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_not_matching_401k: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {formData.country === 'India' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-charcoal-800/50 p-6 rounded-lg border border-charcoal-700"
            >
              <h3 className="text-lg font-display font-semibold mb-6 text-orange flex items-center gap-2">
                <span className="w-6 h-[1px] bg-orange" />
                SIP Delay (India Only)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Monthly SIP Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.monthly_sip_missed || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_sip_missed: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-cream/50 mb-2">Years Delayed</label>
                  <input
                    type="number"
                    value={formData.years_sip_delayed || 0}
                    onChange={(e) => setFormData(prev => ({ ...prev, years_sip_delayed: parseInt(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Subscriptions */}
          <div className="bg-charcoal-800/50 p-6 rounded-lg border border-charcoal-700">
            <h3 className="text-lg font-display font-semibold mb-6 text-rose flex items-center gap-2">
              <span className="w-6 h-[1px] bg-rose" />
              Ghost Subscriptions
            </h3>
            <div className="space-y-3">
              {formData.subscriptions.map((sub, index) => (
                <div key={index} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => updateSubscription(index, 'name', e.target.value)}
                    placeholder="Netflix, Gym, etc."
                    className="flex-1 px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <input
                    type="number"
                    value={sub.monthly_cost}
                    onChange={(e) => updateSubscription(index, 'monthly_cost', parseFloat(e.target.value) || 0)}
                    placeholder="$/mo"
                    className="w-28 px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <input
                    type="number"
                    value={sub.months_active}
                    onChange={(e) => updateSubscription(index, 'months_active', parseInt(e.target.value) || 0)}
                    placeholder="months"
                    className="w-28 px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => removeSubscription(index)}
                    className="text-rose/60 hover:text-rose px-3 py-3 transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSubscription}
              className="mt-4 border border-dashed border-charcoal-600 text-cream/60 px-4 py-2 rounded text-sm font-mono uppercase tracking-wider hover:border-lime hover:text-lime transition-colors"
            >
              + Add Subscription
            </button>
          </div>

          {/* Debts */}
          <div className="bg-charcoal-800/50 p-6 rounded-lg border border-charcoal-700">
            <h3 className="text-lg font-display font-semibold mb-6 text-orange flex items-center gap-2">
              <span className="w-6 h-[1px] bg-orange" />
              Unrefinanced Debts
            </h3>
            <div className="space-y-3">
              {formData.debts.map((debt, index) => (
                <div key={index} className="grid grid-cols-5 gap-3 items-center">
                  <input
                    type="text"
                    value={debt.name}
                    onChange={(e) => updateDebt(index, 'name', e.target.value)}
                    placeholder="Credit card..."
                    className="col-span-2 px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <input
                    type="number"
                    value={debt.balance}
                    onChange={(e) => updateDebt(index, 'balance', parseFloat(e.target.value) || 0)}
                    placeholder="Balance"
                    className="px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <input
                    type="number"
                    value={debt.current_rate}
                    onChange={(e) => updateDebt(index, 'current_rate', parseFloat(e.target.value) || 0)}
                    placeholder="Rate %"
                    className="px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={debt.years}
                      onChange={(e) => updateDebt(index, 'years', parseInt(e.target.value) || 0)}
                      placeholder="Years"
                      className="w-20 px-4 py-3 bg-charcoal-950 border border-charcoal-700 rounded text-cream focus:border-lime focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => removeDebt(index)}
                      className="text-rose/60 hover:text-rose px-2 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addDebt}
              className="mt-4 border border-dashed border-charcoal-600 text-cream/60 px-4 py-2 rounded text-sm font-mono uppercase tracking-wider hover:border-lime hover:text-lime transition-colors"
            >
              + Add Debt
            </button>
          </div>

          {/* Submit Button */}
          <div className="text-center pt-12">
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="clip-button bg-lime text-charcoal-950 px-12 py-4 font-display font-semibold text-sm uppercase tracking-wider hover:shadow-[0_8px_30px_rgba(184,255,87,0.3)] transition-shadow duration-300 flex items-center gap-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  Run Full Analysis
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </section>
  )
}
