<script setup lang="ts">
import { useFinance } from '~/composables/useFinance'

const { isNotificationsSlideoverOpen } = useDashboard()
const { accounts, transactions, deleteTransaction } = useFinance()

const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedAccountFilter = ref<string | null>(null)

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

const categories = [
  'all',
  'groceries',
  'dining',
  'transportation',
  'utilities',
  'entertainment',
  'shopping',
  'healthcare',
  'other'
]

const filteredTransactions = computed(() => {
  return transactions
    .filter(tx => {
      if (selectedCategory.value && selectedCategory.value !== 'all' && tx.category !== selectedCategory.value) {
        return false
      }
      if (selectedAccountFilter.value && tx.accountId !== selectedAccountFilter.value) {
        return false
      }
      if (searchQuery.value && !tx.description.toLowerCase().includes(searchQuery.value.toLowerCase())) {
        return false
      }
      return true
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const totalSpending = computed(() => {
  return filteredTransactions.value
    .filter(tx => !tx.isIncome)
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const totalIncome = computed(() => {
  return filteredTransactions.value
    .filter(tx => tx.isIncome)
    .reduce((sum, tx) => sum + tx.amount, 0)
})

const getAccountName = (accountId: string) => {
  return accounts.find(acc => acc.id === accountId)?.name || 'Unknown'
}
</script>

<template>
  <UDashboardPanel id="transactions">
    <template #header>
      <UDashboardNavbar title="Transactions" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UTooltip text="Notifications" :shortcuts="['N']">
            <UButton
              color="neutral"
              variant="ghost"
              square
              @click="isNotificationsSlideoverOpen = true"
            >
              <UChip color="error" inset>
                <UIcon name="i-lucide-bell" class="size-5 shrink-0" />
              </UChip>
            </UButton>
          </UTooltip>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Search transactions..."
            class="w-full md:w-64"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="space-y-8 pb-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                  Total Income
                </p>
                <UIcon name="i-lucide-trending-up" class="w-5 h-5 text-success" />
              </div>
            </template>
            <p class="text-3xl font-bold text-success">
              {{ formatCurrency(totalIncome) }}
            </p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                  Total Spending
                </p>
                <UIcon name="i-lucide-trending-down" class="w-5 h-5 text-error" />
              </div>
            </template>
            <p class="text-3xl font-bold text-error">
              {{ formatCurrency(totalSpending) }}
            </p>
          </UCard>
        </div>

        <!-- Filters -->
        <div class="space-y-4">
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted">
            Filters
          </h3>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="category in categories"
              :key="category"
              :color="selectedCategory === category ? 'primary' : 'neutral'"
              :variant="selectedCategory === category ? 'soft' : 'ghost'"
              size="sm"
              @click="selectedCategory = selectedCategory === category ? null : category"
            >
              {{ category }}
            </UButton>
          </div>

          <div>
            <p class="text-xs text-muted uppercase font-semibold tracking-wider mb-2">
              Account
            </p>
            <USelect
              v-model="selectedAccountFilter"
              :options="[{ label: 'All Accounts', value: null }, ...accounts.map(acc => ({ label: acc.name, value: acc.id }))]"
              option-attribute="label"
              value-attribute="value"
            />
          </div>
        </div>

        <!-- Transactions List -->
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted mb-4">
            {{ filteredTransactions.length }} Transactions
          </h3>

          <div v-if="filteredTransactions.length === 0" class="text-center py-12">
            <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto text-muted mb-3" />
            <p class="text-muted">No transactions found</p>
          </div>

          <div v-else class="space-y-2">
            <UCard
              v-for="transaction in filteredTransactions"
              :key="transaction.id"
              :ui="{ body: { padding: 'px-6 py-4' } }"
              class="hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between gap-4">
                <div class="flex-1">
                  <p class="font-medium">{{ transaction.description }}</p>
                  <p class="text-xs text-muted mt-1">
                    {{ getAccountName(transaction.accountId) }} • {{ new Date(transaction.date).toLocaleDateString() }}
                  </p>
                  <p class="text-xs text-muted capitalize mt-1">
                    {{ transaction.category }}
                  </p>
                </div>
                <div class="text-right">
                  <p :class="transaction.isIncome ? 'text-success' : 'text-highlighted'" class="font-bold text-lg">
                    {{ transaction.isIncome ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
                  </p>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
