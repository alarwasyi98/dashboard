import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// Finance Types
export type AccountType = 'checking' | 'savings' | 'credit_card' | 'investment'
export type DebtType = 'credit_card' | 'loan' | 'mortgage' | 'student_loan'
export type TransactionCategory = 'groceries' | 'dining' | 'transportation' | 'utilities' | 'entertainment' | 'shopping' | 'healthcare' | 'other'
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled'

export interface Account {
  id: string
  name: string
  type: AccountType
  balance: number
  currency: string
  lastUpdated: Date
  icon?: string
}

export interface Transaction {
  id: string
  accountId: string
  description: string
  amount: number
  category: TransactionCategory
  date: Date
  isIncome: boolean
}

export interface Debt {
  id: string
  name: string
  type: DebtType
  balance: number
  interestRate: number
  dueDate?: Date
  minimumPayment?: number
  icon?: string
}

export interface Subscription {
  id: string
  name: string
  amount: number
  renewalDate: Date
  status: SubscriptionStatus
  category: TransactionCategory
  frequency: 'monthly' | 'yearly'
}

export interface FinancialSnapshot {
  totalAssets: number
  totalLiabilities: number
  netWorth: number
  lastUpdated: Date
}
