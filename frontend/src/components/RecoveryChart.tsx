"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
  ChartData
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { SpotlightCard } from './ui/spotlight-card'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface RecoveryChartProps {
  totalLoss: number
  country: string
  currency: string
}

export function RecoveryChart({ totalLoss, country, currency }: RecoveryChartProps) {
  const annualRate = country === 'India' ? 0.12 : (country === 'Bangladesh' ? 0.09 : 0.07)
  const labels = Array.from({ length: 12 }, (_, i) => `Month ${i + 1}`)

  // Formula 1: Do Nothing (Compound Growth)
  const doNothingData = labels.map((_, m) => {
    return totalLoss * Math.pow(1 + (annualRate / 12), m)
  })

  // Formula 2: Follow the Plan (8% monthly recovery decay)
  const followPlanData = labels.map((_, m) => {
    return totalLoss * Math.pow(0.92, m)
  })

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Do Nothing',
        data: doNothingData,
        borderColor: '#f43f5e', // rose-500
        backgroundColor: 'transparent',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: false,
      },
      {
        label: 'Follow the Plan',
        data: followPlanData,
        borderColor: '#22d3ee', // cyan-400
        backgroundColor: (context) => {
          const chart = context.chart
          const { ctx, chartArea } = chart
          if (!chartArea) return 'transparent'
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, 'rgba(34, 211, 238, 0.1)')
          gradient.addColorStop(1, 'rgba(34, 211, 238, 0)')
          return gradient
        },
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
        tension: 0.4,
        fill: 'origin', // Filling to bottom
      },
      {
        label: 'Your Recovery Zone',
        data: doNothingData, // Top line of the zone
        borderColor: 'transparent',
        backgroundColor: 'rgba(34, 197, 94, 0.05)', // green-500 0.05
        fill: 1, // Fill to the "Follow the Plan" dataset (index 1)
        pointRadius: 0,
        pointHoverRadius: 0,
        tension: 0.4,
      }
    ]
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart'
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        align: 'end' as const,
        labels: {
          color: '#f5f5f7',
          font: { family: 'ui-sans-serif', size: 10 },
          boxWidth: 8,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      title: {
        display: true,
        text: 'Your 12-Month Recovery Projection',
        color: '#f5f5f7',
        align: 'start',
        font: { size: 18, weight: 'bold' as any },
        padding: { top: 10, bottom: 5 }
      },
      tooltip: {
        padding: 12,
        backgroundColor: '#0a0a0a',
        titleFont: { size: 14, weight: 'bold' as any },
        bodyFont: { size: 13 },
        borderColor: '#262626',
        borderWidth: 1,
        callbacks: {
          label: (context) => {
            const val = context.parsed.y || 0
            return `${context.dataset.label}: ${currency}${Math.round(val).toLocaleString()}`
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: 'rgba(245, 245, 247, 0.3)',
          font: { size: 10 }
        }
      },
      y: {
        grid: {
          color: 'rgba(245, 245, 247, 0.05)',
        },
        ticks: {
          color: 'rgba(245, 245, 247, 0.3)',
          font: { size: 10 },
          callback: (value) => {
            if (Number(value) >= 1000000) return `${(Number(value) / 1000000).toFixed(1)}M`
            if (Number(value) >= 1000) return `${(Number(value) / 1000).toFixed(0)}K`
            return value
          }
        }
      }
    }
  }

  return (
    <div className="w-full mb-12">
      <SpotlightCard className="p-8">
        <div className="h-[350px] w-full">
          <Line data={data} options={options} />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-cream/30">
            If you start today vs. doing nothing
          </p>
        </div>
      </SpotlightCard>
    </div>
  )
}
