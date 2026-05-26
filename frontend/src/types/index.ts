export interface Account {
  id: string
  name: string
  bank_name: string
  currency: string
  account_number: string
  short_number: string
  user_id: string
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
}
