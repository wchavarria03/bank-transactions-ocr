import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { getAccounts, createAccount, updateAccount } from '../lib/api'
import type { Account } from '../types'
import { displayName } from '../types'

const CURRENCIES = ['CRC', 'USD', 'EUR']

export function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    loadAccounts()
  }, [])

  function loadAccounts() {
    setLoading(true)
    getAccounts()
      .then(setAccounts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Accounts</h2>
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors"
            >
              + Add Account
            </button>
          </div>
          {loading && <Spinner />}
          {error && <ErrorMessage message={error} />}
          {!loading && !error && (
            <div className="grid gap-4 sm:grid-cols-2">
              {accounts.map(account => (
                <AccountCard
                  key={account.id}
                  account={account}
                  onEdit={() => setEditingAccount(account)}
                />
              ))}
            </div>
          )}
        </div>

      </main>

      {/* Edit modal */}
      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={() => { setEditingAccount(null); loadAccounts() }}
        />
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); loadAccounts() }}
        />
      )}
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OverviewCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl px-6 py-4">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}

function AccountCard({ account, onEdit }: { account: Account; onEdit: () => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors group relative">
      <Link to={`/accounts/${account.id}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium group-hover:text-white transition-colors">{displayName(account)}</p>
            <p className="text-sm text-gray-400 mt-1 uppercase">{account.bank_name}</p>
          </div>
          <span className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-1 rounded">
            {account.currency}
          </span>
        </div>
      </Link>
      <button
        onClick={onEdit}
        className="absolute top-4 right-14 text-gray-500 hover:text-gray-200 transition-colors p-1"
        title="Edit account"
      >
        <PencilIcon />
      </button>
    </div>
  )
}

function EditAccountModal({ account, onClose, onSaved }: {
  account: Account
  onClose: () => void
  onSaved: () => void
}) {
  const [alias, setAlias] = useState(account.alias ?? '')
  const [currency, setCurrency] = useState(account.currency)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateAccount(account.id, { alias, currency })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Edit Account" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Original name">
          <input className="input" value={account.name} disabled />
        </Field>
        <Field label="Alias (display name)">
          <input
            className="input"
            value={alias}
            onChange={e => setAlias(e.target.value)}
            placeholder="e.g. BAC Savings — leave blank to use original"
          />
        </Field>
        <Field label="Currency">
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Bank">
          <input className="input" value={account.bank_name} disabled />
        </Field>
        <Field label="Account number">
          <input className="input" value={account.account_number} disabled />
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function CreateAccountModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState('')
  const [bankName, setBankName] = useState('')
  const [currency, setCurrency] = useState('CRC')
  const [accountNumber, setAccountNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setSaving(true)
    setError(null)
    try {
      await createAccount({ name, bank_name: bankName, currency, account_number: accountNumber })
      onSaved()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal title="Add Account" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Display name *">
          <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BAC Savings" />
        </Field>
        <Field label="Bank *">
          <input className="input" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. bac" />
        </Field>
        <Field label="Currency *">
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Account number">
          <input className="input" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Optional" />
        </Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleCreate} disabled={saving || !name || !bankName} className="btn-primary disabled:opacity-50">
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">{label}</label>
      {children}
    </div>
  )
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1464 1.14645L3.71434 8.57853C3.62459 8.66828 3.55263 8.77618 3.50251 8.89494L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10506 11.4975C6.22382 11.4474 6.33172 11.3754 6.42147 11.2857L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42147 9.28547L11.5 2.20711L12.7929 3.5L5.71453 10.5785L4.21895 11.2215L3.77854 10.781L4.42147 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"/>
    </svg>
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
