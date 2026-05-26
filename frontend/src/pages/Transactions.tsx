import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { getAccount, getCategories, getTransactions, setTransactionCategories } from '../lib/api'
import type { Account, Category, Transaction } from '../types'
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
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    Promise.all([getAccount(id), getTransactions(id), getCategories()])
      .then(([acc, txs, cats]) => {
        setAccount(acc)
        setTransactions(txs)
        setCategories(cats)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  function handleCategoriesChanged(txId: string, newCats: Category[]) {
    setTransactions(prev => prev.map(tx =>
      tx.id === txId ? { ...tx, categories: newCats } : tx
    ))
  }

  const currency = account?.currency ?? ''
  const symbol = CURRENCY_SYMBOL[currency] ?? currency

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">

        <div className="flex items-center gap-4">
          <Link to="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back
          </Link>
          <h2 className="text-2xl font-semibold">Transactions</h2>
        </div>

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
          <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{error}</div>
        )}
        {!loading && !error && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                  <th className="text-left px-4 py-3">Date</th>
                  <th className="text-left px-4 py-3">Description</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Category</th>
                  <th className="text-right px-4 py-3">Amount</th>
                  <th className="text-right px-4 py-3">Balance</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                      {new Date(tx.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{tx.description}</td>
                    <td className={`px-4 py-3 capitalize ${TYPE_STYLES[tx.type] ?? 'text-gray-300'}`}>
                      {tx.type.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryCell
                        transaction={tx}
                        allCategories={categories}
                        onChange={cats => handleCategoriesChanged(tx.id, cats)}
                      />
                    </td>
                    <td className={`px-4 py-3 text-right font-mono ${Number(tx.amount) < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatAmount(tx.amount, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-300">
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

// ── CategoryCell ──────────────────────────────────────────────────────────────

function CategoryCell({ transaction, allCategories, onChange }: {
  transaction: Transaction
  allCategories: Category[]
  onChange: (cats: Category[]) => void
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectedIDs = new Set((transaction.categories ?? []).map(c => c.id))

  async function toggleCategory(cat: Category) {
    const next = new Set(selectedIDs)
    if (next.has(cat.id)) next.delete(cat.id)
    else next.add(cat.id)

    setSaving(true)
    try {
      await setTransactionCategories(transaction.id, [...next])
      // Rebuild category objects from allCategories (flat)
      const flat = flattenCategories(allCategories)
      onChange(flat.filter(c => next.has(c.id)))
    } finally {
      setSaving(false)
      setOpen(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <div
        className="flex flex-wrap gap-1 cursor-pointer min-h-[24px]"
        onClick={() => setOpen(o => !o)}
      >
        {(transaction.categories ?? []).length === 0 ? (
          <span className="text-gray-600 text-xs hover:text-gray-400">+ add</span>
        ) : (
          (transaction.categories ?? []).map(cat => (
            <CategoryBadge key={cat.id} category={cat} />
          ))
        )}
      </div>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 bg-gray-900 border border-gray-700 rounded-xl shadow-xl w-56 py-1 max-h-72 overflow-y-auto">
          {saving && <p className="text-xs text-gray-400 px-3 py-2">Saving…</p>}
          {!saving && allCategories.map(parent => (
            <div key={parent.id}>
              <button
                onClick={() => toggleCategory(parent)}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-800 flex items-center gap-2 ${selectedIDs.has(parent.id) ? 'text-white' : 'text-gray-300'}`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: parent.color ?? '#6b7280' }} />
                {parent.name}
                {selectedIDs.has(parent.id) && <span className="ml-auto text-blue-400 text-xs">✓</span>}
              </button>
              {(parent.children ?? []).map(child => (
                <button
                  key={child.id}
                  onClick={() => toggleCategory(child)}
                  className={`w-full text-left pl-7 pr-3 py-1.5 text-xs hover:bg-gray-800 flex items-center gap-2 ${selectedIDs.has(child.id) ? 'text-white' : 'text-gray-400'}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: child.color ?? '#6b7280' }} />
                  {child.name}
                  {selectedIDs.has(child.id) && <span className="ml-auto text-blue-400 text-xs">✓</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CategoryBadge({ category }: { category: Category }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: (category.color ?? '#6b7280') + '33', color: category.color ?? '#9ca3af', border: `1px solid ${category.color ?? '#6b7280'}44` }}
    >
      {category.name}
    </span>
  )
}

function flattenCategories(tree: Category[]): Category[] {
  const result: Category[] = []
  for (const cat of tree) {
    result.push(cat)
    if (cat.children) result.push(...cat.children)
  }
  return result
}
