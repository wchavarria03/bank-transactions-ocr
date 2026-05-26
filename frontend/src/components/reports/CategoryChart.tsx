import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { CategorySpend } from '../../types'

interface Props {
  data: CategorySpend[]
  currency: string
}

const FALLBACK_COLOR = '#6b7280'

function fmtAmount(n: number, currency: string) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

export function CategoryChart({ data, currency }: Props) {
  if (data.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-sm text-gray-400 font-medium mb-3">Spending by category</p>
        <p className="text-sm text-gray-500 text-center py-8">No categorised expenses this period</p>
      </div>
    )
  }

  const chartData = data.slice(0, 10).map(d => ({ ...d, name: d.category_name }))
  const barHeight = 28
  const chartHeight = Math.max(120, chartData.length * barHeight + 40)

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 font-medium mb-3">Spending by category</p>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" barSize={14}>
          <XAxis
            type="number"
            tickFormatter={n => {
              if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
              if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
              return n.toString()
            }}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={90}
            tick={{ fontSize: 11, fill: '#d1d5db' }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(v) => [fmtAmount(Number(v ?? 0), currency), 'Spent']}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
            itemStyle={{ color: '#e5e7eb' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Bar dataKey="total" radius={[0, 3, 3, 0]}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color || FALLBACK_COLOR} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
