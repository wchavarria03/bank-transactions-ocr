import { useEffect, useState } from 'react'
import { getReportSummary } from '../../lib/api'
import { ReportSummary } from '../../types'
import { MonthSelector, currentMonth, monthBounds } from './MonthSelector'
import { SummaryCards } from './SummaryCards'
import { BalanceChart } from './BalanceChart'
import { DailyChangesChart } from './DailyChangesChart'
import { CategoryChart } from './CategoryChart'
import { TransfersSummary } from './TransfersSummary'

interface Props {
  /** If provided, shows per-account data. Otherwise uses currency filter for overview. */
  accountId?: string
  currency: string
  /** Hide the balance line chart (e.g. overview mode with multiple accounts) */
  hideBalanceChart?: boolean
}

export function ReportPanel({ accountId, currency, hideBalanceChart }: Props) {
  const [month, setMonth] = useState(currentMonth)
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const { from, to } = monthBounds(month)
    getReportSummary(accountId ? { from, to, account_id: accountId } : { from, to, currency })
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [month, accountId, currency])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <MonthSelector value={month} onChange={setMonth} />
      </div>

      {loading && (
        <div className="text-sm text-gray-500 py-4">Loading...</div>
      )}

      {error && (
        <div className="text-sm text-red-400 py-2">Failed to load report: {error}</div>
      )}

      {summary && !loading && (
        <>
          <SummaryCards summary={summary} currency={currency} />

          <div className={`grid gap-4 ${hideBalanceChart ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            {!hideBalanceChart && (
              <BalanceChart data={summary.balance_history} currency={currency} />
            )}
            <DailyChangesChart data={summary.daily_changes} currency={currency} />
          </div>

          <CategoryChart data={summary.by_category} currency={currency} />

          <TransfersSummary transfers={summary.transfers} currency={currency} />
        </>
      )}
    </div>
  )
}
