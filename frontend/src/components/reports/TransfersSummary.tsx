import { TransferSummary } from '../../types'

interface Props {
  transfers: TransferSummary
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

export function TransfersSummary({ transfers, currency }: Props) {
  const hasTransfers = transfers.incoming_count > 0 || transfers.outgoing_count > 0

  if (!hasTransfers) return null

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <p className="text-sm text-gray-400 font-medium mb-3">Period transfers</p>
      <div className="space-y-2">
        {transfers.incoming_count > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-green-400">↓</span>
              <span className="text-sm text-gray-300">
                Incoming transfers · {transfers.incoming_count} transaction{transfers.incoming_count !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-sm font-medium text-green-400">
              +{fmt(transfers.incoming_total, currency)}
            </span>
          </div>
        )}
        {transfers.outgoing_count > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-400">↑</span>
              <span className="text-sm text-gray-300">
                Outgoing transfers · {transfers.outgoing_count} transaction{transfers.outgoing_count !== 1 ? 's' : ''}
              </span>
            </div>
            <span className="text-sm font-medium text-red-400">
              -{fmt(transfers.outgoing_total, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
