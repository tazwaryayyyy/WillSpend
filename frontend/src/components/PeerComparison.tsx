"use client"

import { useState } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { motion } from 'framer-motion'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
)

interface PeerComparisonProps {
  userLoss: number
  country: string
}

const MEDIAN_DATA: Record<string, Record<string, number>> = {
  US: { '18-25': 8000, '26-35': 24000, '36-45': 52000, '46+': 89000 },
  India: { '18-25': 45000, '26-35': 180000, '36-45': 420000, '46+': 750000 },
  Bangladesh: { '18-25': 18000, '26-35': 72000, '36-45': 180000, '46+': 320000 }
}

const AGE_BRACKETS = ['18-25', '26-35', '36-45', '46+']

export function PeerComparison({ userLoss, country }: PeerComparisonProps) {
  const [ageBracket, setAgeBracket] = useState('26-35')
  
  const currencySymbol = country === 'Bangladesh' ? '৳' : (country === 'India' ? '₹' : '$')
  const medianLoss = MEDIAN_DATA[country]?.[ageBracket] || 0
  const isBetterThanAverage = userLoss < medianLoss

  const chartData = {
    labels: [
      `Avg. person (${ageBracket})`,
      'Your calculated loss'
    ],
    datasets: [
      {
        data: [medianLoss, userLoss],
        backgroundColor: [
          'rgba(148, 163, 184, 0.8)', // slate-400
          isBetterThanAverage ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)' // emerald-500 or red-500
        ],
        borderColor: [
          'rgb(148, 163, 184)',
          isBetterThanAverage ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)'
        ],
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 40
      }
    ]
  }

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const val = context.parsed.x || 0
            return `${currencySymbol}${val.toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.05)'
        },
        ticks: {
          color: '#94a3b8',
          font: { weight: 'bold' as any },
          callback: (value) => {
            return new Intl.NumberFormat('en-US', {
              notation: 'compact',
              style: 'currency',
              currency: country === 'US' ? 'USD' : (country === 'India' ? 'INR' : 'BDT'),
              currencyDisplay: 'narrowSymbol'
            }).format(value as number).replace('BDT', '৳').replace('INR', '₹')
          }
        }
      },
      y: {
        grid: {
          display: false
        },
        ticks: {
          color: '#94a3b8',
          font: {
            family: 'Geist Mono',
            size: 11,
            weight: 'bold' as any
          }
        }
      }
    },
    animation: {
      duration: 2000,
      easing: 'easeOutQuart'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      className="bg-charcoal-800/30 border border-charcoal-700/50 rounded-2xl p-8 mb-12"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <h3 className="text-2xl font-display font-bold text-cream mb-2">
            How your inaction compares
          </h3>
          <p className={`text-sm font-extrabold ${isBetterThanAverage ? 'text-emerald-500' : 'text-red-500'}`}>
            {isBetterThanAverage 
              ? "You're doing better than average — here's how to widen the gap"
              : "You're above average — here's your recovery plan"}
          </p>
          <p className="text-xs text-cream/30 mt-1 uppercase tracking-wider font-mono">
            vs. median loss for your age group in {country}
          </p>
        </div>

        <div className="bg-charcoal-900/50 p-1 rounded-lg border border-charcoal-700 flex gap-1">
          {AGE_BRACKETS.map(bracket => (
            <button
              key={bracket}
              onClick={() => setAgeBracket(bracket)}
              className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider rounded transition-all ${
                ageBracket === bracket 
                  ? 'bg-charcoal-700 text-slate-300 font-semibold shadow-lg' 
                  : 'text-slate-400 font-semibold hover:text-slate-300'
              }`}
            >
              {bracket}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[200px] w-full">
        <Bar data={chartData} options={options} />
      </div>
    </motion.div>
  )
}
