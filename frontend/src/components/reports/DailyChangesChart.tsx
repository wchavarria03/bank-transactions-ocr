import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { DailyChange } from '../../types'

interface Props {
  data: DailyChange[]
  currency: string
}

function shortDate(date: string) {
  const d = new Date(date + 'T00:00:00')
  return d.getDate().toString()
}

function fmtAmount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return n.toFixed(0)
}

export function DailyChangesChart({ data, currency }: Props) {
  const hasData = data.some(d => d.income > 0 || d.expenses > 0)

  if (!hasData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-sm text-gray-400 font-medium mb-3">Daily changes</p>
        <p className="text-sm text-gray-500 text-center py-8">No transactions this period</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 font-medium mb-3">Daily changes</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barSize={4} barGap={1}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={shortDate}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            interval={4}
          />
          <YAxis
            tickFormatter={fmtAmount}
            tick={{ fontSize: 10, fill: '#9ca3af' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            formatter={(v) =>
              new Intl.NumberFormat('es-CR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(v ?? 0))
            }
            labelFormatter={l => new Date(l + 'T00:00:00').toLocaleDateString('es-CR')}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
            itemStyle={{ color: '#e5e7eb' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Bar dataKey="income" name="Income" fill="#22c55e" radius={[2, 2, 0, 0]} />
          <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
