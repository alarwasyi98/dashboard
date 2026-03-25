<script setup lang="ts">
import { sub } from 'date-fns'
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Period, Range } from '~/types'

const { isNotificationsSlideoverOpen } = useDashboard()

const items = [[{
  label: 'Add Account',
  icon: 'i-lucide-plus-circle',
  to: '/accounts'
}, {
  label: 'View Transactions',
  icon: 'i-lucide-list',
  to: '/accounts'
}]] satisfies DropdownMenuItem[][]

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})
const period = ref<Period>('monthly')
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
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

          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Net Worth - Primary Focus -->
      <div class="space-y-8 pb-8">
        <!-- Main Net Worth Card -->
        <div class="grid grid-cols-1 gap-8">
          <NetWorthCard />
        </div>

        <!-- Accounts Overview -->
        <AccountsOverview />

        <!-- Spending Chart -->
        <HomeChart :period="period" :range="range" />
      </div>
    </template>
  </UDashboardPanel>
</template>
