import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { getAccount, getTransactions } from '../lib/api'
import type { Account, Transaction } from '../types'
import { displayName } from '../types'

const CURRENCY_SYMBOL: Record<string, string> = {
  CRC: '₡',
  USD: '$',
  EUR: '€',
}

const TYPE_STYLES: Record<string, string> = {
  expense: 'text-red-400',
  income: 'text-green-400',
  transfer_out: 'text-orange-400',
  transfer_in: 'text-blue-400',
  fee: 'text-yellow-400',
  interest: 'text-purple-400',
}

function formatAmount(amount: string, currency: string): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency
  const num = Number(amount)
  const formatted = Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return num < 0 ? `-${symbol}${formatted}` : `${symbol}${formatted}`
}

export function Transactions() {
  const { id } = useParams<{ id: string }>()
  const [account, setAccount] = useState<Account | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getAccount(id), getTransactions(id)])
      .then(([acc, txs]) => {
        setAccount(acc)
        setTransactions(txs)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const currency = account?.currency ?? ''
  const symbol = CURRENCY_SYMBOL[currency] ?? currency

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        {/* Back + title */}
        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back
          </Link>
          <h2 className="text-2xl font-semibold">Transactions</h2>
        </div>

        {/* Account info header */}
        {account && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">{displayName(account)}</p>
              <p className="text-sm text-gray-400 uppercase mt-0.5">{account.bank_name}</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono bg-gray-800 text-gray-300 px-3 py-1.5 rounded">
                {symbol} {currency}
              </span>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
          </div>
        )}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        {!loading && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="text-left px-6 py-3">Date</th>
                  <th className="text-left px-6 py-3">Description</th>
                  <th className="text-left px-6 py-3">Type</th>
                  <th className="text-right px-6 py-3">Amount</th>
                  <th className="text-right px-6 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-6 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3">{tx.description}</td>
                    <td className={`px-6 py-3 capitalize ${TYPE_STYLES[tx.type] ?? 'text-gray-300'}`}>
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td className={`px-6 py-3 text-right font-mono ${Number(tx.amount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatAmount(tx.amount, currency)}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-gray-300">
                      {formatAmount(tx.balance, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {transactions.length === 0 && (
              <p className="text-center text-gray-400 py-12">No transactions found</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
