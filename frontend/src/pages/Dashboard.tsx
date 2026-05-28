import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import { ReportPanel } from '../components/reports/ReportPanel'
import { getAccounts } from '../lib/api'

export function Dashboard() {
  const [currencies, setCurrencies] = useState<string[]>([])
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    getAccounts().then(accounts => {
      const unique = [...new Set(accounts.map(a => a.currency))]
      setCurrencies(unique)
      setLoaded(true)
    })
  }, [])

  const activeCurrency = selectedCurrency ?? currencies[0] ?? 'CRC'

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Overview</h2>
          {loaded && currencies.length > 1 && (
            <div className="flex items-center gap-2">
              {currencies.map(c => (
                <button
                  key={c}
                  onClick={() => setSelectedCurrency(c)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    activeCurrency === c
                      ? 'bg-gray-700 border-gray-500 text-white'
                      : 'border-gray-700 text-gray-400 hover:text-white'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </div>

        {loaded && <ReportPanel currency={activeCurrency} hideBalanceChart />}
      </main>
    </div>
  )
}
