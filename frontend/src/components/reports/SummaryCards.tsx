import { ReportSummary } from '../../types'

interface Props {
  summary: ReportSummary
  currency: string
}

function fmt(n: number, currency: string) {
  return new Intl.NumberFormat('es-CR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n)
}

interface CardProps {
  label: string
  value: string
  valueClass?: string
}

function Card({ label, value, valueClass = 'text-white' }: CardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-semibold ${valueClass}`}>{value}</p>
    </div>
  )
}

export function SummaryCards({ summary, currency }: Props) {
  const changeClass = summary.period_change >= 0 ? 'text-green-400' : 'text-red-400'

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Card label="Balance" value={fmt(summary.total_balance, currency)} />
      <Card
        label="Net change"
        value={(summary.period_change >= 0 ? '+' : '') + fmt(summary.period_change, currency)}
        valueClass={changeClass}
      />
      <Card label="Income" value={fmt(summary.total_income, currency)} valueClass="text-green-400" />
      <Card label="Expenses" value={fmt(summary.total_expenses, currency)} valueClass="text-red-400" />
    </div>
  )
}
