import { useEffect, useState } from 'react'
import { Navbar } from '../components/Navbar'
import {
  getCategories, createCategory, updateCategory, deleteCategory,
  getCategoryRules, createCategoryRule, deleteCategoryRule,
  getAccounts,
} from '../lib/api'
import type { Account, Category, CategoryRule } from '../types'

export function Settings() {
  const [categories, setCategories] = useState<Category[]>([])
  const [rules, setRules] = useState<CategoryRule[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<'categories' | 'rules'>('categories')

  useEffect(() => {
    Promise.all([getCategories(), getCategoryRules(), getAccounts()])
      .then(([cats, rls, accs]) => { setCategories(cats); setRules(rls); setAccounts(accs) })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <h2 className="text-2xl font-semibold">Settings</h2>

        <div className="flex gap-2 border-b border-gray-800 pb-0">
          {(['categories', 'rules'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm capitalize transition-colors border-b-2 -mb-px ${tab === t ? 'border-blue-500 text-white' : 'border-transparent text-gray-400 hover:text-white'}`}
            >
              {t === 'rules' ? 'Auto-Rules' : 'Categories'}
            </button>
          ))}
        </div>

        {loading && <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500" /></div>}
        {error && <div className="bg-red-900/20 border border-red-800 rounded-xl p-4 text-red-400 text-sm">{error}</div>}

        {!loading && !error && tab === 'categories' && (
          <CategoriesTab
            categories={categories}
            onReload={() => getCategories().then(setCategories)}
          />
        )}
        {!loading && !error && tab === 'rules' && (
          <RulesTab
            rules={rules}
            categories={categories}
            accounts={accounts}
            onReload={() => getCategoryRules().then(setRules)}
          />
        )}
      </main>
    </div>
  )
}

// ── Categories tab ────────────────────────────────────────────────────────────

function CategoriesTab({ categories, onReload }: { categories: Category[]; onReload: () => void }) {
  const [selectedParent, setSelectedParent] = useState<Category | null>(null)
  const [showAdd, setShowAdd] = useState<'parent' | 'child' | null>(null)

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Parent categories */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Categories</h3>
          <button onClick={() => setShowAdd('parent')} className="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
        </div>
        {showAdd === 'parent' && (
          <AddCategoryForm
            onSave={async ({ name, color }) => {
              await createCategory({ name, color })
              setShowAdd(null)
              onReload()
            }}
            onCancel={() => setShowAdd(null)}
          />
        )}
        {categories.map(cat => (
          <CategoryRow
            key={cat.id}
            category={cat}
            selected={selectedParent?.id === cat.id}
            onClick={() => setSelectedParent(cat)}
            onReload={onReload}
          />
        ))}
      </div>

      {/* Children */}
      <div className="space-y-2">
        {selectedParent ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Sub-categories of {selectedParent.name}
              </h3>
              <button onClick={() => setShowAdd('child')} className="text-xs text-blue-400 hover:text-blue-300">+ Add</button>
            </div>
            {showAdd === 'child' && (
              <AddCategoryForm
                onSave={async ({ name, color }) => {
                  await createCategory({ name, parent_id: selectedParent.id, color })
                  setShowAdd(null)
                  onReload()
                }}
                onCancel={() => setShowAdd(null)}
              />
            )}
            {(selectedParent.children ?? []).map(child => (
              <CategoryRow key={child.id} category={child} onReload={onReload} />
            ))}
            {(selectedParent.children ?? []).length === 0 && showAdd !== 'child' && (
              <p className="text-sm text-gray-500">No sub-categories yet.</p>
            )}
          </>
        ) : (
          <p className="text-sm text-gray-500 pt-8 text-center">Select a category to manage sub-categories.</p>
        )}
      </div>
    </div>
  )
}

function CategoryRow({ category, selected, onClick, onReload }: {
  category: Category
  selected?: boolean
  onClick?: () => void
  onReload: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(category.name)
  const [color, setColor] = useState(category.color ?? '#6b7280')
  const isGlobal = !category.user_id

  async function handleSave() {
    await updateCategory(category.id, { name, color })
    setEditing(false)
    onReload()
  }

  async function handleDelete() {
    if (!confirm(`Delete "${category.name}"? This cannot be undone.`)) return
    await deleteCategory(category.id)
    onReload()
  }

  if (editing) {
    return (
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
        <div className="flex gap-2">
          <input className="input flex-1 text-sm" value={name} onChange={e => setName(e.target.value)} />
          <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border border-gray-700" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={() => setEditing(false)} className="btn-secondary text-xs px-3 py-1">Cancel</button>
          <button onClick={handleSave} className="btn-primary text-xs px-3 py-1">Save</button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${selected ? 'border-blue-600 bg-blue-950/30' : 'border-gray-800 hover:border-gray-600'} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: category.color ?? '#6b7280' }} />
        <span className="text-sm">{category.name}</span>
        {isGlobal && <span className="text-xs text-gray-600 ml-1">global</span>}
      </div>
      {!isGlobal && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
          <button onClick={() => setEditing(true)} className="text-gray-500 hover:text-gray-200 p-1 text-xs">Edit</button>
          <button onClick={handleDelete} className="text-gray-500 hover:text-red-400 p-1 text-xs">Del</button>
        </div>
      )}
    </div>
  )
}

function AddCategoryForm({ onSave, onCancel }: {
  onSave: (v: { name: string; color: string }) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#6366f1')
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setSaving(true)
    try { await onSave({ name: name.trim(), color }) } finally { setSaving(false) }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-lg p-3 space-y-2">
      <div className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder="Category name" value={name} onChange={e => setName(e.target.value)} />
        <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent border border-gray-700" />
      </div>
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="btn-secondary text-xs px-3 py-1">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !name.trim()} className="btn-primary text-xs px-3 py-1 disabled:opacity-50">
          {saving ? 'Saving…' : 'Add'}
        </button>
      </div>
    </div>
  )
}

// ── Rules tab ─────────────────────────────────────────────────────────────────

function RulesTab({ rules, categories, accounts, onReload }: {
  rules: CategoryRule[]
  categories: Category[]
  accounts: Account[]
  onReload: () => void
}) {
  const [showAdd, setShowAdd] = useState(false)
  const flatCats = flattenCategories(categories)

  async function handleDelete(id: string) {
    await deleteCategoryRule(id)
    onReload()
  }

  async function handleCreate(payload: { pattern: string; category_id: string; account_id?: string; priority: number }) {
    await createCategoryRule(payload)
    setShowAdd(false)
    onReload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">Rules match transaction descriptions (case-insensitive) and auto-assign a category.</p>
        <button onClick={() => setShowAdd(true)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors">
          + Add Rule
        </button>
      </div>

      {showAdd && (
        <AddRuleForm
          categories={flatCats}
          accounts={accounts}
          onSave={handleCreate}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {rules.length === 0 && !showAdd && (
        <p className="text-center text-gray-500 py-8">No rules yet. Add one to start auto-categorizing transactions.</p>
      )}

      {rules.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase">
                <th className="text-left px-4 py-3">Pattern</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Account</th>
                <th className="text-right px-4 py-3">Priority</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rules.map(rule => {
                const cat = flatCats.find(c => c.id === rule.category_id)
                const acc = accounts.find(a => a.id === rule.account_id)
                return (
                  <tr key={rule.id} className="border-b border-gray-800/50">
                    <td className="px-4 py-3 font-mono text-xs">{rule.pattern}</td>
                    <td className="px-4 py-3">
                      {cat ? <CategoryBadge category={cat} /> : <span className="text-gray-500">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{acc ? acc.name : 'All accounts'}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{rule.priority}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(rule.id)} className="text-gray-500 hover:text-red-400 text-xs transition-colors">
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AddRuleForm({ categories, accounts, onSave, onCancel }: {
  categories: Category[]
  accounts: Account[]
  onSave: (v: { pattern: string; category_id: string; account_id?: string; priority: number }) => Promise<void>
  onCancel: () => void
}) {
  const [pattern, setPattern] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [accountId, setAccountId] = useState('')
  const [priority, setPriority] = useState(0)
  const [saving, setSaving] = useState(false)

  async function handleSubmit() {
    if (!pattern.trim() || !categoryId) return
    setSaving(true)
    try {
      await onSave({ pattern: pattern.trim(), category_id: categoryId, account_id: accountId || undefined, priority })
    } finally { setSaving(false) }
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Pattern *</label>
          <input className="input text-sm" placeholder="e.g. supermercado" value={pattern} onChange={e => setPattern(e.target.value)} />
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Category *</label>
          <select className="input text-sm" value={categoryId} onChange={e => setCategoryId(e.target.value)}>
            <option value="">Select…</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Account (optional)</label>
          <select className="input text-sm" value={accountId} onChange={e => setAccountId(e.target.value)}>
            <option value="">All accounts</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Priority</label>
          <input type="number" className="input text-sm" value={priority} onChange={e => setPriority(Number(e.target.value))} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button onClick={onCancel} className="btn-secondary text-sm">Cancel</button>
        <button onClick={handleSubmit} disabled={saving || !pattern.trim() || !categoryId} className="btn-primary text-sm disabled:opacity-50">
          {saving ? 'Saving…' : 'Add Rule'}
        </button>
      </div>
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
