import { createSharedComposable } from '@vueuse/core'
import type { Account, Transaction, Debt, Subscription, FinancialSnapshot } from '~/types'
import { mockAccounts, mockTransactions, mockDebts, mockSubscriptions, calculateFinancialSnapshot, getSpendingByCategory, getMonthlySubscriptionTotal } from '~/data/mockData'

const _useFinance = () => {
  const accounts = ref<Account[]>(mockAccounts)
  const transactions = ref<Transaction[]>(mockTransactions)
  const debts = ref<Debt[]>(mockDebts)
  const subscriptions = ref<Subscription[]>(mockSubscriptions)

  const snapshot = computed(() => calculateFinancialSnapshot(accounts.value, debts.value))

  const spendingByCategory = computed(() => getSpendingByCategory(transactions.value))

  const monthlySubscriptionTotal = computed(() => getMonthlySubscriptionTotal(subscriptions.value))

  const totalMonthlyDebts = computed(() => {
    return debts.value.reduce((sum, debt) => sum + (debt.minimumPayment || 0), 0)
  })

  // Account operations
  const addAccount = (account: Account) => {
    accounts.value.push(account)
  }

  const updateAccount = (id: string, updates: Partial<Account>) => {
    const index = accounts.value.findIndex(acc => acc.id === id)
    if (index !== -1) {
      accounts.value[index] = { ...accounts.value[index], ...updates }
    }
  }

  const deleteAccount = (id: string) => {
    accounts.value = accounts.value.filter(acc => acc.id !== id)
  }

  // Transaction operations
  const addTransaction = (transaction: Transaction) => {
    transactions.value.push(transaction)
    // Update account balance
    const account = accounts.value.find(acc => acc.id === transaction.accountId)
    if (account) {
      account.balance += transaction.isIncome ? transaction.amount : -transaction.amount
      account.lastUpdated = new Date()
    }
  }

  const deleteTransaction = (id: string) => {
    const transaction = transactions.value.find(tx => tx.id === id)
    if (transaction) {
      // Reverse the transaction
      const account = accounts.value.find(acc => acc.id === transaction.accountId)
      if (account) {
        account.balance += transaction.isIncome ? -transaction.amount : transaction.amount
        account.lastUpdated = new Date()
      }
    }
    transactions.value = transactions.value.filter(tx => tx.id !== id)
  }

  // Debt operations
  const addDebt = (debt: Debt) => {
    debts.value.push(debt)
  }

  const updateDebt = (id: string, updates: Partial<Debt>) => {
    const index = debts.value.findIndex(d => d.id === id)
    if (index !== -1) {
      debts.value[index] = { ...debts.value[index], ...updates }
    }
  }

  const deleteDebt = (id: string) => {
    debts.value = debts.value.filter(d => d.id !== id)
  }

  // Subscription operations
  const addSubscription = (subscription: Subscription) => {
    subscriptions.value.push(subscription)
  }

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    const index = subscriptions.value.findIndex(s => s.id === id)
    if (index !== -1) {
      subscriptions.value[index] = { ...subscriptions.value[index], ...updates }
    }
  }

  const deleteSubscription = (id: string) => {
    subscriptions.value = subscriptions.value.filter(s => s.id !== id)
  }

  // Bulk import from CSV
  const importTransactionsFromCSV = (csvData: Transaction[]) => {
    transactions.value.push(...csvData)
    // Update account balances
    csvData.forEach(tx => {
      const account = accounts.value.find(acc => acc.id === tx.accountId)
      if (account) {
        account.balance += tx.isIncome ? tx.amount : -tx.amount
        account.lastUpdated = new Date()
      }
    })
  }

  return {
    // State
    accounts: readonly(accounts),
    transactions: readonly(transactions),
    debts: readonly(debts),
    subscriptions: readonly(subscriptions),
    snapshot,
    spendingByCategory,
    monthlySubscriptionTotal,
    totalMonthlyDebts,
    // Methods
    addAccount,
    updateAccount,
    deleteAccount,
    addTransaction,
    deleteTransaction,
    addDebt,
    updateDebt,
    deleteDebt,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    importTransactionsFromCSV
  }
}

export const useFinance = createSharedComposable(_useFinance)
