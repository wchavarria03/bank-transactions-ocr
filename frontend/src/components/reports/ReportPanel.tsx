import { useEffect, useState } from 'react'
import { getReportSummary } from '../../lib/api'
import { ReportSummary } from '../../types'
import { PeriodSelector, currentMonth, monthBounds } from './MonthSelector'
import { SummaryCards } from './SummaryCards'
import { BalanceChart } from './BalanceChart'
import { DailyChangesChart } from './DailyChangesChart'
import { CategoryChart } from './CategoryChart'
import { TransfersSummary } from './TransfersSummary'

interface Props {
  accountId?: string
  currency: string
  hideBalanceChart?: boolean
}

function isRangePeriod(from: string, to: string) {
  const diff = new Date(to).getTime() - new Date(from).getTime()
  return diff > 35 * 86400 * 1000
}

export function ReportPanel({ accountId, currency, hideBalanceChart }: Props) {
  const [period, setPeriod] = useState<{ from: string; to: string }>(() => monthBounds(currentMonth()))
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getReportSummary(
      accountId
        ? { from: period.from, to: period.to, account_id: accountId }
        : { from: period.from, to: period.to, currency }
    )
      .then(setSummary)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [period.from, period.to, accountId, currency])

  const isRange = isRangePeriod(period.from, period.to)
  const showBalanceChart = !hideBalanceChart
  const showDailyChart = !isRange
  const hasSideCharts = showBalanceChart || showDailyChart

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <PeriodSelector onChange={(from, to) => setPeriod({ from, to })} />
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

          {hasSideCharts && (
            <div className={`grid gap-4 ${showBalanceChart && showDailyChart ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {showBalanceChart && (
                <BalanceChart data={summary.balance_history} currency={currency} />
              )}
              {showDailyChart && (
                <DailyChangesChart data={summary.daily_changes} currency={currency} />
              )}
            </div>
          )}

          <CategoryChart data={summary.by_category} currency={currency} />

          <TransfersSummary transfers={summary.transfers} currency={currency} />
        </>
      )}
    </div>
  )
}
