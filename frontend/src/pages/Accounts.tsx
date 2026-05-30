import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Navbar } from '../components/Navbar'
import { getAccounts, createAccount, updateAccount, getCategoryRules, getRuleExceptions, disableRule, enableRule } from '../lib/api'
import type { Account, CategoryRule } from '../types'
import { displayName } from '../types'

const CURRENCIES = ['CRC', 'USD', 'EUR']

export function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [rulesAccount, setRulesAccount] = useState<Account | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => { loadAccounts() }, [])

  function loadAccounts() {
    setLoading(true)
    getAccounts()
      .then(setAccounts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="flex items-center justify-between">
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
              <AccountCard key={account.id} account={account} onEdit={() => setEditingAccount(account)} onRules={() => setRulesAccount(account)} />
            ))}
            {accounts.length === 0 && (
              <p className="text-gray-500 text-sm col-span-2 py-8 text-center">
                No accounts yet. Add one or import a bank statement.
              </p>
            )}
          </div>
        )}
      </main>

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSaved={() => { setEditingAccount(null); loadAccounts() }}
        />
      )}
      {rulesAccount && (
        <AccountRulesModal
          account={rulesAccount}
          onClose={() => setRulesAccount(null)}
        />
      )}
      {showCreate && (
        <CreateAccountModal
          onClose={() => setShowCreate(false)}
          onSaved={() => { setShowCreate(false); loadAccounts() }}
        />
      )}
    </div>
  )
}

function AccountCard({ account, onEdit, onRules }: { account: Account; onEdit: () => void; onRules: () => void }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors group relative">
      <Link to={`/accounts/${account.id}`} className="block">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium group-hover:text-white transition-colors">{displayName(account)}</p>
            <p className="text-sm text-gray-400 mt-1 uppercase">{account.bank_name}</p>
          </div>
          <span className="text-xs font-mono bg-gray-800 text-gray-300 px-2 py-1 rounded">{account.currency}</span>
        </div>
      </Link>
      <button
        onClick={onRules}
        className="absolute top-4 right-24 text-gray-500 hover:text-gray-200 transition-colors p-1 text-xs"
        title="Manage category rules for this account"
      >
        Rules
      </button>
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

function AccountRulesModal({ account, onClose }: { account: Account; onClose: () => void }) {
  const [globalRules, setGlobalRules] = useState<CategoryRule[]>([])
  const [disabledIDs, setDisabledIDs] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getCategoryRules(), getRuleExceptions(account.id)])
      .then(([rules, exceptions]) => {
        setGlobalRules(rules.filter(r => !r.account_id))
        setDisabledIDs(new Set(exceptions))
      })
      .finally(() => setLoading(false))
  }, [account.id])

  async function toggleRule(ruleId: string) {
    setSaving(ruleId)
    try {
      if (disabledIDs.has(ruleId)) {
        await enableRule(account.id, ruleId)
        setDisabledIDs(prev => { const next = new Set(prev); next.delete(ruleId); return next })
      } else {
        await disableRule(account.id, ruleId)
        setDisabledIDs(prev => new Set([...prev, ruleId]))
      }
    } finally {
      setSaving(null)
    }
  }

  return (
    <Modal title={`Category rules — ${displayName(account)}`} onClose={onClose}>
      <p className="text-xs text-gray-400 -mt-2 mb-4">
        Global rules apply to all accounts. Disable any rule that doesn't apply to this account. Account-specific rules always apply.
      </p>
      {loading && <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-6 w-6 border-t-2 border-blue-500" /></div>}
      {!loading && globalRules.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">No global rules yet. Add them in Categories → Rules.</p>
      )}
      {!loading && globalRules.length > 0 && (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {globalRules.map(rule => {
            const isDisabled = disabledIDs.has(rule.id)
            const isSaving = saving === rule.id
            return (
              <div key={rule.id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-800 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-mono truncate ${isDisabled ? 'text-gray-600' : 'text-gray-200'}`}>{rule.pattern}</p>
                  <p className={`text-xs mt-0.5 ${isDisabled ? 'text-gray-700' : 'text-gray-500'}`}>priority {rule.priority}</p>
                </div>
                <button
                  onClick={() => toggleRule(rule.id)}
                  disabled={isSaving}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                    isDisabled ? 'bg-gray-700' : 'bg-blue-600'
                  }`}
                  title={isDisabled ? 'Enable for this account' : 'Disable for this account'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 mt-0.5 ${
                    isDisabled ? 'translate-x-0.5' : 'translate-x-4'
                  }`} />
                </button>
              </div>
            )
          })}
        </div>
      )}
      <div className="flex justify-end pt-2">
        <button onClick={onClose} className="btn-secondary">Close</button>
      </div>
    </Modal>
  )
}

function EditAccountModal({ account, onClose, onSaved }: { account: Account; onClose: () => void; onSaved: () => void }) {
  const [alias, setAlias] = useState(account.alias ?? '')
  const [currency, setCurrency] = useState(account.currency)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true); setError(null)
    try { await updateAccount(account.id, { alias, currency }); onSaved() }
    catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Edit Account" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Original name"><input className="input" value={account.name} disabled /></Field>
        <Field label="Alias (display name)">
          <input className="input" value={alias} onChange={e => setAlias(e.target.value)} placeholder="Leave blank to use original name" />
        </Field>
        <Field label="Currency">
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Account number"><input className="input" value={account.account_number} disabled /></Field>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Saving…' : 'Save'}</button>
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
    setSaving(true); setError(null)
    try { await createAccount({ name, bank_name: bankName, currency, account_number: accountNumber }); onSaved() }
    catch (err) { setError((err as Error).message) }
    finally { setSaving(false) }
  }

  return (
    <Modal title="Add Account" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Display name *"><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. BAC Savings" /></Field>
        <Field label="Bank *"><input className="input" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g. bac" /></Field>
        <Field label="Currency *">
          <select className="input" value={currency} onChange={e => setCurrency(e.target.value)}>
            {CURRENCIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Account number"><input className="input" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder="Optional" /></Field>
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
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <path d="M11.8536 1.14645C11.6583 0.951184 11.3417 0.951184 11.1464 1.14645L3.71434 8.57853C3.62459 8.66828 3.55263 8.77618 3.50251 8.89494L2.04044 12.303C1.9599 12.491 2.00189 12.709 2.14646 12.8536C2.29103 12.9981 2.50905 13.0401 2.69697 12.9596L6.10506 11.4975C6.22382 11.4474 6.33172 11.3754 6.42147 11.2857L13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645L11.8536 1.14645ZM4.42147 9.28547L11.5 2.20711L12.7929 3.5L5.71453 10.5785L4.21895 11.2215L3.77854 10.781L4.42147 9.28547Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
    </svg>
  )
}

function Spinner() {
  return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" /></div>
}

function ErrorMessage({ message }: { message: string }) {
  return <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{message}</div>
}
