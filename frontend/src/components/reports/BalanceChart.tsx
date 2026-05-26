import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { DailyBalance } from '../../types'

interface Props {
  data: DailyBalance[]
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

export function BalanceChart({ data, currency }: Props) {
  const hasData = data.some(d => d.balance > 0)

  if (!hasData) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <p className="text-sm text-gray-400 font-medium mb-3">Account balance</p>
        <p className="text-sm text-gray-500 text-center py-8">No balance data this period</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 font-medium mb-3">Account balance</p>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
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
            width={45}
          />
          <Tooltip
            formatter={(v) =>
              new Intl.NumberFormat('es-CR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(Number(v ?? 0))
            }
            labelFormatter={l => new Date(l + 'T00:00:00').toLocaleDateString('es-CR')}
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: 6 }}
            itemStyle={{ color: '#22c55e' }}
            labelStyle={{ color: '#9ca3af' }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            name="Balance"
            stroke="#22c55e"
            strokeWidth={2}
            fill="url(#balanceGradient)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
