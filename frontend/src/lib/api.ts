import { Account, Category, CategoryRule, ReportSummary, Transaction } from '../types'
import { supabase } from './supabase'

const BASE_URL = import.meta.env.VITE_API_URL as string

async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  })
}

export async function getAccounts(): Promise<Account[]> {
  const res = await authFetch('/v1/accounts')
  if (!res.ok) throw new Error(`Failed to fetch accounts: ${res.status}`)
  return res.json()
}

export async function getAccount(id: string): Promise<Account> {
  const res = await authFetch(`/v1/accounts/${id}`)
  if (!res.ok) throw new Error(`Failed to fetch account: ${res.status}`)
  return res.json()
}

export async function createAccount(payload: { name: string; bank_name: string; currency: string; account_number?: string }): Promise<Account> {
  const res = await authFetch('/v1/accounts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create account: ${res.status}`)
  return res.json()
}

export async function updateAccount(id: string, fields: { alias?: string; currency?: string }): Promise<Account> {
  const res = await authFetch(`/v1/accounts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error(`Failed to update account: ${res.status}`)
  return res.json()
}

export async function getTransactions(accountId: string): Promise<Transaction[]> {
  const res = await authFetch(`/v1/accounts/${accountId}/transactions`)
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`)
  return res.json()
}

export async function getCategories(): Promise<Category[]> {
  const res = await authFetch('/v1/categories')
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
  return res.json()
}

export async function createCategory(payload: { name: string; parent_id?: string; color?: string }): Promise<Category> {
  const res = await authFetch('/v1/categories', { method: 'POST', body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Failed to create category: ${res.status}`)
  return res.json()
}

export async function updateCategory(id: string, fields: { name?: string; color?: string }): Promise<Category> {
  const res = await authFetch(`/v1/categories/${id}`, { method: 'PATCH', body: JSON.stringify(fields) })
  if (!res.ok) throw new Error(`Failed to update category: ${res.status}`)
  return res.json()
}

export async function deleteCategory(id: string): Promise<void> {
  const res = await authFetch(`/v1/categories/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete category: ${res.status}`)
}

export async function getCategoryRules(): Promise<CategoryRule[]> {
  const res = await authFetch('/v1/category-rules')
  if (!res.ok) throw new Error(`Failed to fetch rules: ${res.status}`)
  return res.json()
}

export async function createCategoryRule(payload: { pattern: string; category_id: string; account_id?: string; priority?: number }): Promise<CategoryRule> {
  const res = await authFetch('/v1/category-rules', { method: 'POST', body: JSON.stringify(payload) })
  if (!res.ok) throw new Error(`Failed to create rule: ${res.status}`)
  return res.json()
}

export async function deleteCategoryRule(id: string): Promise<void> {
  const res = await authFetch(`/v1/category-rules/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`Failed to delete rule: ${res.status}`)
}

export async function getReportSummary(params: {
  from: string
  to: string
  account_id?: string
  currency?: string
}): Promise<ReportSummary> {
  const query = new URLSearchParams({ from: params.from, to: params.to })
  if (params.account_id) query.set('account_id', params.account_id)
  if (params.currency) query.set('currency', params.currency)
  const res = await authFetch(`/v1/reports/summary?${query}`)
  if (!res.ok) throw new Error(`Failed to fetch report: ${res.status}`)
  return res.json()
}

export async function setTransactionCategories(transactionId: string, categoryIds: string[]): Promise<void> {
  const res = await authFetch(`/v1/transactions/${transactionId}/categories`, {
    method: 'PATCH',
    body: JSON.stringify({ category_ids: categoryIds }),
  })
  if (!res.ok) throw new Error(`Failed to update categories: ${res.status}`)
}
