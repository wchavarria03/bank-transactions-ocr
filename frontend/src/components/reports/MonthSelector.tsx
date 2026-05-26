interface Props {
  value: string // "YYYY-MM"
  onChange: (month: string) => void
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

function formatLabel(m: string) {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

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

export function MonthSelector({ value, onChange }: Props) {
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
      <span className="text-sm text-gray-400 ml-1">{formatLabel(value)}</span>
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
