import { useState } from 'react'

type Mode = 'month' | '3m' | '6m' | '12m'

// ── Utilities ────────────────────────────────────────────────────────────────

export function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export function monthBounds(m: string): { from: string; to: string } {
  const [y, mo] = m.split('-').map(Number)
  const last = new Date(y, mo, 0).getDate()
  return {
    from: `${m}-01`,
    to: `${m}-${String(last).padStart(2, '0')}`,
  }
}

function prevMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMonth(m: string) {
  const [y, mo] = m.split('-').map(Number)
  const d = new Date(y, mo, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function formatMonthLabel(m: string) {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const RANGE_MONTHS: Record<string, number> = { '3m': 3, '6m': 6, '12m': 12 }

function rangeBounds(months: number): { from: string; to: string } {
  const now = new Date()
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const from = `${fromDate.getFullYear()}-${String(fromDate.getMonth() + 1).padStart(2, '0')}-01`
  const { to } = monthBounds(currentMonth())
  return { from, to }
}

function formatRangeLabel(months: number): string {
  const now = new Date()
  const fromDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)
  const fmt = (d: Date) => d.toLocaleString('default', { month: 'short', year: 'numeric' })
  return `${fmt(fromDate)} – ${fmt(now)}`
}

// ── PeriodSelector ────────────────────────────────────────────────────────────

const MODE_TABS: { key: Mode; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: '3m', label: '3M' },
  { key: '6m', label: '6M' },
  { key: '12m', label: '12M' },
]

interface PeriodSelectorProps {
  onChange: (from: string, to: string) => void
}

export function PeriodSelector({ onChange }: PeriodSelectorProps) {
  const now = currentMonth()
  const [mode, setMode] = useState<Mode>('month')
  const [month, setMonth] = useState(now)

  function handleModeChange(next: Mode) {
    setMode(next)
    if (next === 'month') {
      const { from, to } = monthBounds(month)
      onChange(from, to)
    } else {
      const { from, to } = rangeBounds(RANGE_MONTHS[next])
      onChange(from, to)
    }
  }

  function handleMonthChange(next: string) {
    setMonth(next)
    const { from, to } = monthBounds(next)
    onChange(from, to)
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex rounded-lg border border-gray-700 overflow-hidden text-xs">
        {MODE_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handleModeChange(key)}
            className={`px-3 py-1.5 transition-colors ${
              mode === key
                ? 'bg-gray-700 text-white font-medium'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === 'month' ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleMonthChange(prevMonth(month))}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            ‹
          </button>
          <input
            type="month"
            value={month}
            max={now}
            onChange={e => handleMonthChange(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={() => handleMonthChange(nextMonth(month))}
            disabled={month >= now}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>
          <span className="text-sm text-gray-400">{formatMonthLabel(month)}</span>
          {month !== now && (
            <button
              onClick={() => handleMonthChange(now)}
              className="text-xs text-gray-500 hover:text-gray-300 underline ml-1"
            >
              This month
            </button>
          )}
        </div>
      ) : (
        <span className="text-sm text-gray-400">
          {formatRangeLabel(RANGE_MONTHS[mode])}
        </span>
      )}
    </div>
  )
}

// ── Legacy MonthSelector (kept for compatibility) ─────────────────────────────

interface MonthSelectorProps {
  value: string
  onChange: (month: string) => void
}

export function MonthSelector({ value, onChange }: MonthSelectorProps) {
  const now = currentMonth()
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(prevMonth(value))}
        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
      >
        ‹
      </button>
      <input
        type="month"
        value={value}
        max={now}
        onChange={e => onChange(e.target.value)}
        className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gray-500"
      />
      <button
        onClick={() => onChange(nextMonth(value))}
        disabled={value >= now}
        className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        ›
      </button>
      <span className="text-sm text-gray-400 ml-1">{formatMonthLabel(value)}</span>
      {value !== now && (
        <button
          onClick={() => onChange(now)}
          className="text-xs text-gray-500 hover:text-gray-300 underline ml-2"
        >
          This month
        </button>
      )}
    </div>
  )
}
