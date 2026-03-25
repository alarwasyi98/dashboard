<script setup lang="ts">
import { useFinance } from '~/composables/useFinance'

const { accounts } = useFinance()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

const getAccountIcon = (account: any) => {
  const iconMap: Record<string, string> = {
    checking: 'i-lucide-wallet',
    savings: 'i-lucide-piggy-bank',
    investment: 'i-lucide-trending-up',
    credit_card: 'i-lucide-credit-card'
  }
  return iconMap[account.type] || 'i-lucide-wallet'
}

const getAccountColor = (account: any) => {
  const colorMap: Record<string, string> = {
    checking: 'blue',
    savings: 'green',
    investment: 'purple',
    credit_card: 'orange'
  }
  return colorMap[account.type] || 'blue'
}
</script>

<template>
  <div class="grid grid-cols-1 gap-6 md:gap-8">
    <div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-sm font-bold uppercase tracking-wider text-muted">
          Accounts
        </h3>
        <UButton to="/accounts" variant="ghost" size="xs" icon="i-lucide-arrow-right">
          View All
        </UButton>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        <UCard
          v-for="account in accounts"
          :key="account.id"
          :ui="{ root: 'hover:shadow-lg transition-shadow' }"
        >
          <div class="flex items-start justify-between mb-4">
            <div>
              <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                {{ account.name }}
              </p>
              <p class="text-sm text-muted capitalize mt-1">
                {{ account.type.replace('_', ' ') }}
              </p>
            </div>
            <UIcon
              :name="getAccountIcon(account)"
              :class="`w-5 h-5 text-${getAccountColor(account)}`"
            />
          </div>
          <p class="text-2xl font-bold">
            {{ formatCurrency(account.balance) }}
          </p>
        </UCard>
      </div>
    </div>
  </div>
</template>
