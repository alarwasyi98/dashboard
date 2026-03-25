<script setup lang="ts">
import { useFinance } from '~/composables/useFinance'

const { isNotificationsSlideoverOpen } = useDashboard()
const { transactions, spendingByCategory, monthlySubscriptionTotal, subscriptions } = useFinance()

const dateRangeStart = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const dateRangeEnd = ref(new Date())

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value)
}

const colors = ['#22C55E', '#F97316', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#6366F1']

const spendingData = computed(() => {
  const categorySpending = spendingByCategory
  return Object.entries(categorySpending).map(([category, amount], index) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    amount,
    color: colors[index % colors.length]
  }))
})

const totalSpending = computed(() => {
  return spendingData.value.reduce((sum, item) => sum + item.amount, 0)
})

const subscriptionsByCategory = computed(() => {
  const grouped = subscriptions
    .filter(s => s.status === 'active')
    .reduce((acc, sub) => {
      const monthlyAmount = sub.frequency === 'monthly' ? sub.amount : sub.amount / 12
      acc[sub.category] = (acc[sub.category] || 0) + monthlyAmount
      return acc
    }, {} as Record<string, number>)

  return Object.entries(grouped).map(([category, amount], index) => ({
    category: category.charAt(0).toUpperCase() + category.slice(1),
    amount,
    color: colors[index % colors.length]
  }))
})

const chartData = computed(() => {
  return {
    labels: spendingData.value.map(d => d.category),
    datasets: [{
      label: 'Spending by Category',
      data: spendingData.value.map(d => d.amount),
      backgroundColor: spendingData.value.map(d => d.color),
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

const subscriptionChartData = computed(() => {
  return {
    labels: subscriptionsByCategory.value.map(d => d.category),
    datasets: [{
      label: 'Subscription Spending',
      data: subscriptionsByCategory.value.map(d => d.amount),
      backgroundColor: subscriptionsByCategory.value.map(d => d.color),
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

const spendingTrends = computed(() => {
  // Group by week
  const weeklySpending: Record<string, number> = {}

  transactions
    .filter(tx => !tx.isIncome)
    .forEach(tx => {
      const date = new Date(tx.date)
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekKey = weekStart.toISOString().split('T')[0]

      weeklySpending[weekKey] = (weeklySpending[weekKey] || 0) + tx.amount
    })

  return Object.entries(weeklySpending)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, amount]) => ({
      week: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      amount
    }))
})

const topCategories = computed(() => {
  return spendingData.value
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)
})

const categoryPercentages = computed(() => {
  return spendingData.value.map(item => ({
    ...item,
    percentage: ((item.amount / totalSpending.value) * 100).toFixed(1)
  }))
})
</script>

<template>
  <UDashboardPanel id="analytics">
    <template #header>
      <UDashboardNavbar title="Analytics" :ui="{ right: 'gap-3' }">
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
    </template>

    <template #body>
      <div class="space-y-8 pb-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <p class="text-xs text-muted mt-2">
              This month
            </p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                  Avg per Category
                </p>
                <UIcon name="i-lucide-bar-chart-3" class="w-5 h-5 text-primary" />
              </div>
            </template>
            <p class="text-3xl font-bold text-primary">
              {{ formatCurrency(totalSpending / (spendingData.length || 1)) }}
            </p>
            <p class="text-xs text-muted mt-2">
              {{ spendingData.length }} categories
            </p>
          </UCard>

          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                  Subscriptions
                </p>
                <UIcon name="i-lucide-refresh-cw" class="w-5 h-5 text-warning" />
              </div>
            </template>
            <p class="text-3xl font-bold text-warning">
              {{ formatCurrency(monthlySubscriptionTotal) }}
            </p>
            <p class="text-xs text-muted mt-2">
              Monthly recurring
            </p>
          </UCard>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Spending by Category -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-bold">Spending by Category</h3>
            </template>
            <div v-if="spendingData.length === 0" class="text-center py-8">
              <p class="text-muted">No spending data available</p>
            </div>
            <div v-else class="space-y-4">
              <div class="flex items-end justify-between" style="height: 300px" class="mb-4">
                <div class="flex gap-2 items-end justify-center flex-1">
                  <div
                    v-for="(item, index) in spendingData"
                    :key="index"
                    class="flex flex-col items-center flex-1"
                  >
                    <div
                      class="w-full rounded-t transition-all hover:opacity-80"
                      :style="{
                        backgroundColor: item.color,
                        height: `${(item.amount / Math.max(...spendingData.map(d => d.amount))) * 250}px`
                      }"
                      :title="`${item.category}: ${formatCurrency(item.amount)}`"
                    />
                    <p class="text-xs mt-2 text-center text-muted truncate max-w-[50px]">
                      {{ item.category.substring(0, 3) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </UCard>

          <!-- Subscription Breakdown -->
          <UCard>
            <template #header>
              <h3 class="text-sm font-bold">Subscription Spending</h3>
            </template>
            <div v-if="subscriptionsByCategory.length === 0" class="text-center py-8">
              <p class="text-muted">No active subscriptions</p>
            </div>
            <div v-else class="space-y-4">
              <div class="space-y-3">
                <div
                  v-for="(item, index) in subscriptionsByCategory"
                  :key="index"
                  class="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-elevated transition-colors"
                >
                  <div class="flex items-center gap-3 flex-1">
                    <div
                      class="w-3 h-3 rounded-full"
                      :style="{ backgroundColor: item.color }"
                    />
                    <span class="text-sm font-medium">{{ item.category }}</span>
                  </div>
                  <span class="text-sm font-bold">{{ formatCurrency(item.amount) }}</span>
                </div>
              </div>
              <div class="border-t pt-3 mt-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-semibold">Total</span>
                  <span class="text-lg font-bold text-warning">
                    {{ formatCurrency(subscriptionsByCategory.reduce((sum, item) => sum + item.amount, 0)) }}
                  </span>
                </div>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Category Breakdown -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-bold">Category Breakdown</h3>
          </template>
          <div v-if="categoryPercentages.length === 0" class="text-center py-8">
            <p class="text-muted">No category data available</p>
          </div>
          <div v-else class="space-y-4">
            <div
              v-for="(item, index) in categoryPercentages"
              :key="index"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="w-3 h-3 rounded-full"
                    :style="{ backgroundColor: item.color }"
                  />
                  <span class="text-sm font-medium">{{ item.category }}</span>
                </div>
                <div class="text-right">
                  <p class="text-sm font-bold">{{ formatCurrency(item.amount) }}</p>
                  <p class="text-xs text-muted">{{ item.percentage }}%</p>
                </div>
              </div>
              <div class="w-full h-2 rounded-full bg-surface overflow-hidden">
                <div
                  class="h-full transition-all"
                  :style="{
                    width: `${item.percentage}%`,
                    backgroundColor: item.color
                  }"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Weekly Trends -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-bold">Weekly Spending Trend</h3>
          </template>
          <div v-if="spendingTrends.length === 0" class="text-center py-8">
            <p class="text-muted">No spending trend data available</p>
          </div>
          <div v-else class="space-y-4">
            <div class="flex items-end justify-between gap-1" style="height: 200px">
              <div
                v-for="(item, index) in spendingTrends"
                :key="index"
                class="flex flex-col items-center flex-1"
              >
                <div
                  class="w-full bg-primary rounded-t transition-all hover:opacity-80"
                  :style="{
                    height: `${(item.amount / Math.max(...spendingTrends.map(t => t.amount))) * 180}px`
                  }"
                  :title="formatCurrency(item.amount)"
                />
                <p class="text-xs mt-2 text-center text-muted text-nowrap">
                  {{ item.week }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
