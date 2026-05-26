import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { getAccounts } from '../lib/api'
import type { Account } from '../types'

export function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getAccounts()
      .then(setAccounts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const currencies = [...new Set(accounts.map(a => a.currency))]
  const banks = [...new Set(accounts.map(a => a.bank_name.toUpperCase()))]

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">

        {/* Overview */}
        {!loading && !error && accounts.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <OverviewCard label="Accounts" value={String(accounts.length)} />
            <OverviewCard label="Currencies" value={currencies.join(' · ')} />
            <OverviewCard label="Banks" value={banks.join(' · ')} />
          </div>
        )}

        {/* Accounts */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Accounts</h2>
          {loading && <Spinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map(account => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  )
}

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

function AccountCard({ account }: { account: Account }) {
  return (
    <Link
      to={`/accounts/${account.id}`}
      className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-medium group-hover:text-white transition-colors">{account.name}</p>
          <p className="text-sm text-gray-400 mt-1 uppercase">{account.bank_name}</p>
        </div>
        <span className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-1 rounded">
          {account.currency}
        </span>
      </div>
    </Link>
  )
}

function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" />
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
      {message}
    </div>
  )
}
