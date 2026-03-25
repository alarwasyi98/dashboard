<script setup lang="ts">
import { useFinance } from '~/composables/useFinance'

const { snapshot } = useFinance()

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

const netWorthTrend = computed(() => {
  // Mock trend: 2% increase
  return 2.5
})
</script>

<template>
  <UCard class="lg:col-span-2">
    <template #header>
      <div class="flex items-start justify-between">
        <div>
          <p class="text-xs text-muted uppercase font-semibold tracking-wider mb-2">
            Net Worth
          </p>
          <p class="text-4xl font-bold text-highlighted">
            {{ formatCurrency(snapshot.netWorth) }}
          </p>
        </div>
        <UBadge
          :color="netWorthTrend > 0 ? 'success' : 'error'"
          variant="subtle"
          size="lg"
          class="text-sm font-semibold"
        >
          <UIcon
            :name="netWorthTrend > 0 ? 'i-lucide-trending-up' : 'i-lucide-trending-down'"
            class="w-4 h-4 mr-1"
          />
          {{ netWorthTrend > 0 ? '+' : '' }}{{ netWorthTrend.toFixed(1) }}%
        </UBadge>
      </div>
    </template>

    <div class="grid grid-cols-2 gap-8 pt-4">
      <div>
        <p class="text-xs text-muted uppercase font-semibold tracking-wider mb-2">
          Total Assets
        </p>
        <p class="text-2xl font-bold text-success">
          {{ formatCurrency(snapshot.totalAssets) }}
        </p>
      </div>
      <div>
        <p class="text-xs text-muted uppercase font-semibold tracking-wider mb-2">
          Total Liabilities
        </p>
        <p class="text-2xl font-bold text-error">
          {{ formatCurrency(snapshot.totalLiabilities) }}
        </p>
      </div>
    </div>
  </UCard>
</template>
