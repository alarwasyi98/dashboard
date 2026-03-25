import type { Account, Transaction, Debt, Subscription, FinancialSnapshot } from '~/types'

export const mockAccounts: Account[] = [
  {
    id: 'acc-001',
    name: 'Checking Account',
    type: 'checking',
    balance: 5_250.43,
    currency: 'USD',
    lastUpdated: new Date(),
    icon: 'i-lucide-wallet'
  },
  {
    id: 'acc-002',
    name: 'Savings Account',
    type: 'savings',
    balance: 18_500.00,
    currency: 'USD',
    lastUpdated: new Date(),
    icon: 'i-lucide-piggy-bank'
  },
  {
    id: 'acc-003',
    name: 'Investment Portfolio',
    type: 'investment',
    balance: 42_750.65,
    currency: 'USD',
    lastUpdated: new Date(),
    icon: 'i-lucide-trending-up'
  }
]

export const mockTransactions: Transaction[] = [
  {
    id: 'tx-001',
    accountId: 'acc-001',
    description: 'Whole Foods Market',
    amount: 87.54,
    category: 'groceries',
    date: new Date(2024, 2, 24),
    isIncome: false
  },
  {
    id: 'tx-002',
    accountId: 'acc-001',
    description: 'Shell Gas Station',
    amount: 52.00,
    category: 'transportation',
    date: new Date(2024, 2, 23),
    isIncome: false
  },
  {
    id: 'tx-003',
    accountId: 'acc-001',
    description: 'Netflix Subscription',
    amount: 15.99,
    category: 'entertainment',
    date: new Date(2024, 2, 23),
    isIncome: false
  },
  {
    id: 'tx-004',
    accountId: 'acc-001',
    description: 'Salary Deposit',
    amount: 3_500.00,
    category: 'other',
    date: new Date(2024, 2, 21),
    isIncome: true
  },
  {
    id: 'tx-005',
    accountId: 'acc-001',
    description: 'Amazon Purchase',
    amount: 156.23,
    category: 'shopping',
    date: new Date(2024, 2, 20),
    isIncome: false
  },
  {
    id: 'tx-006',
    accountId: 'acc-001',
    description: 'Dr. Smith - Medical Visit',
    amount: 125.00,
    category: 'healthcare',
    date: new Date(2024, 2, 19),
    isIncome: false
  },
  {
    id: 'tx-007',
    accountId: 'acc-001',
    description: 'Restaurant - Dinner',
    amount: 68.42,
    category: 'dining',
    date: new Date(2024, 2, 18),
    isIncome: false
  },
  {
    id: 'tx-008',
    accountId: 'acc-001',
    description: 'Electric Bill',
    amount: 89.50,
    category: 'utilities',
    date: new Date(2024, 2, 15),
    isIncome: false
  },
  {
    id: 'tx-009',
    accountId: 'acc-002',
    description: 'Interest Earned',
    amount: 12.35,
    category: 'other',
    date: new Date(2024, 2, 10),
    isIncome: true
  },
  {
    id: 'tx-010',
    accountId: 'acc-001',
    description: 'Starbucks Coffee',
    amount: 6.50,
    category: 'dining',
    date: new Date(2024, 2, 17),
    isIncome: false
  }
]

export const mockDebts: Debt[] = [
  {
    id: 'debt-001',
    name: 'Primary Credit Card',
    type: 'credit_card',
    balance: 3_450.00,
    interestRate: 18.99,
    minimumPayment: 125.00,
    icon: 'i-lucide-credit-card'
  },
  {
    id: 'debt-002',
    name: 'Car Loan',
    type: 'loan',
    balance: 15_200.00,
    interestRate: 4.5,
    minimumPayment: 325.00,
    dueDate: new Date(2027, 11, 30),
    icon: 'i-lucide-car'
  },
  {
    id: 'debt-003',
    name: 'Student Loans',
    type: 'student_loan',
    balance: 28_500.00,
    interestRate: 5.1,
    minimumPayment: 280.00,
    icon: 'i-lucide-graduation-cap'
  }
]

export const mockSubscriptions: Subscription[] = [
  {
    id: 'sub-001',
    name: 'Netflix',
    amount: 15.99,
    renewalDate: new Date(2024, 3, 23),
    status: 'active',
    category: 'entertainment',
    frequency: 'monthly'
  },
  {
    id: 'sub-002',
    name: 'Spotify',
    amount: 9.99,
    renewalDate: new Date(2024, 3, 15),
    status: 'active',
    category: 'entertainment',
    frequency: 'monthly'
  },
  {
    id: 'sub-003',
    name: 'Adobe Creative Cloud',
    amount: 54.99,
    renewalDate: new Date(2024, 3, 1),
    status: 'active',
    category: 'shopping',
    frequency: 'monthly'
  },
  {
    id: 'sub-004',
    name: 'Gym Membership',
    amount: 49.99,
    renewalDate: new Date(2024, 3, 10),
    status: 'active',
    category: 'healthcare',
    frequency: 'monthly'
  },
  {
    id: 'sub-005',
    name: 'Apple One Bundle',
    amount: 19.95,
    renewalDate: new Date(2024, 3, 21),
    status: 'active',
    category: 'entertainment',
    frequency: 'monthly'
  }
]

export function calculateFinancialSnapshot(accounts: Account[], debts: Debt[]): FinancialSnapshot {
  const totalAssets = accounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalLiabilities = debts.reduce((sum, debt) => sum + debt.balance, 0)
  const netWorth = totalAssets - totalLiabilities

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    lastUpdated: new Date()
  }
}

export function getSpendingByCategory(transactions: Transaction[]): Record<string, number> {
  return transactions.reduce((acc, tx) => {
    if (!tx.isIncome) {
      acc[tx.category] = (acc[tx.category] || 0) + tx.amount
    }
    return acc
  }, {} as Record<string, number>)
}

export function getMonthlySubscriptionTotal(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => {
      return sub.frequency === 'monthly' ? sum + sub.amount : sum + (sub.amount / 12)
    }, 0)
}
