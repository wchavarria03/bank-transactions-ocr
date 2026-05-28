export interface Account {
  id: string
  name: string
  alias?: string
  bank_name: string
  currency: string
  account_number: string
  short_number: string
  user_id: string
}

export function displayName(account: Account): string {
  return account.alias?.trim() || account.name
}

export interface Category {
  id: string
  name: string
  parent_id?: string
  user_id?: string
  color?: string
  children?: Category[]
}

export interface CategoryRule {
  id: string
  user_id?: string
  account_id?: string
  pattern: string
  category_id: string
  priority: number
}

export interface ImportPreview {
  account_number: string
  bank: string
  currency: string
  transaction_count: number
  period_start: string
  period_end: string
  sample: Transaction[]
}

export interface ImportSummary {
  account_name: string
  account_number: string
  currency: string
  bank: string
  imported_count: number
}

export interface DailyBalance {
  date: string
  balance: number
}

export interface DailyChange {
  date: string
  income: number
  expenses: number
}

export interface CategorySpend {
  category_id: string
  category_name: string
  color: string
  total: number
}

export interface TransferSummary {
  incoming_count: number
  incoming_total: number
  outgoing_count: number
  outgoing_total: number
}

export interface ReportSummary {
  total_balance: number
  period_change: number
  total_income: number
  total_expenses: number
  balance_history: DailyBalance[]
  daily_changes: DailyChange[]
  by_category: CategorySpend[]
  transfers: TransferSummary
  period_start: string
  period_end: string
}

export interface Transaction {
  id: string
  date: string
  reference?: string
  code?: string
  type: string
  description: string
  amount: string
  balance: string
  currency: string
  categories?: Category[]
}
