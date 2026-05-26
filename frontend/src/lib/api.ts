import { Account, Transaction } from '../types'
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
