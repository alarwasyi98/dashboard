<script setup lang="ts">
import type { Debt, Subscription } from '~/types'
import { useFinance } from '~/composables/useFinance'

const { isNotificationsSlideoverOpen } = useDashboard()
const { debts, subscriptions, monthlySubscriptionTotal, totalMonthlyDebts, updateDebt, addDebt, addSubscription, deleteDebt, deleteSubscription } = useFinance()

const showNewDebtModal = ref(false)
const showNewSubModal = ref(false)
const activeTab = ref<'debts' | 'subscriptions'>('debts')

const newDebt = ref<Partial<Debt>>({
  name: '',
  type: 'credit_card',
  balance: 0,
  interestRate: 0,
  minimumPayment: 0
})

const newSubscription = ref<Partial<Subscription>>({
  name: '',
  amount: 0,
  status: 'active',
  category: 'entertainment',
  frequency: 'monthly'
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

const formatPercent = (value: number) => {
  return value.toFixed(2) + '%'
}

const debtTypeOptions = [
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Loan', value: 'loan' },
  { label: 'Mortgage', value: 'mortgage' },
  { label: 'Student Loan', value: 'student_loan' }
]

const categoryOptions = [
  { label: 'Groceries', value: 'groceries' },
  { label: 'Dining', value: 'dining' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Utilities', value: 'utilities' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Shopping', value: 'shopping' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Other', value: 'other' }
]

const frequencyOptions = [
  { label: 'Monthly', value: 'monthly' },
  { label: 'Yearly', value: 'yearly' }
]

const subscriptionStatusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Paused', value: 'paused' },
  { label: 'Cancelled', value: 'cancelled' }
]

const totalDebtBalance = computed(() => {
  return debts.reduce((sum, debt) => sum + debt.balance, 0)
})

const createDebt = () => {
  if (!newDebt.value.name) {
    const toast = useToast()
    toast.add({ title: 'Debt name is required', color: 'red' })
    return
  }

  addDebt({
    id: `debt-${Date.now()}`,
    name: newDebt.value.name!,
    type: (newDebt.value.type as any) || 'credit_card',
    balance: newDebt.value.balance || 0,
    interestRate: newDebt.value.interestRate || 0,
    minimumPayment: newDebt.value.minimumPayment,
    dueDate: newDebt.value.dueDate
  })

  newDebt.value = { name: '', type: 'credit_card', balance: 0, interestRate: 0, minimumPayment: 0 }
  showNewDebtModal.value = false

  const toast = useToast()
  toast.add({ title: 'Debt added successfully', color: 'green' })
}

const createSubscription = () => {
  if (!newSubscription.value.name) {
    const toast = useToast()
    toast.add({ title: 'Subscription name is required', color: 'red' })
    return
  }

  const now = new Date()
  const renewalDate = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())

  addSubscription({
    id: `sub-${Date.now()}`,
    name: newSubscription.value.name!,
    amount: newSubscription.value.amount || 0,
    renewalDate,
    status: (newSubscription.value.status as any) || 'active',
    category: (newSubscription.value.category as any) || 'entertainment',
    frequency: (newSubscription.value.frequency as any) || 'monthly'
  })

  newSubscription.value = { name: '', amount: 0, status: 'active', category: 'entertainment', frequency: 'monthly' }
  showNewSubModal.value = false

  const toast = useToast()
  toast.add({ title: 'Subscription added successfully', color: 'green' })
}
</script>

<template>
  <UDashboardPanel id="liabilities">
    <template #header>
      <UDashboardNavbar title="Liabilities" :ui="{ right: 'gap-3' }">
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

          <UDropdownMenu
            :items="[
              [{
                label: 'Add Debt',
                icon: 'i-lucide-plus-circle',
                click: () => { activeTab = 'debts'; showNewDebtModal = true }
              }, {
                label: 'Add Subscription',
                icon: 'i-lucide-plus-circle',
                click: () => { activeTab = 'subscriptions'; showNewSubModal = true }
              }]
            ]"
          >
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-8 pb-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <p class="text-xs text-muted uppercase font-semibold tracking-wider">
                  Total Debt
                </p>
                <UIcon name="i-lucide-credit-card" class="w-5 h-5 text-error" />
              </div>
            </template>
            <p class="text-3xl font-bold text-error">
              {{ formatCurrency(totalDebtBalance) }}
            </p>
            <p class="text-xs text-muted mt-2">
              Monthly payment: {{ formatCurrency(totalMonthlyDebts) }}
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
              {{ subscriptions.filter(s => s.status === 'active').length }} active subscriptions
            </p>
          </UCard>
        </div>

        <!-- Tabs -->
        <UTabs :items="[
          { slot: 'debts', label: 'Debts' },
          { slot: 'subscriptions', label: 'Subscriptions' }
        ]" :model-value="activeTab" @update:model-value="v => activeTab = v as any">
          <template #debts>
            <div class="space-y-4 pt-4">
              <div v-if="debts.length === 0" class="text-center py-12">
                <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto text-muted mb-3" />
                <p class="text-muted">No debts added yet</p>
              </div>

              <div v-else class="space-y-4">
                <UCard
                  v-for="debt in debts"
                  :key="debt.id"
                  :ui="{ body: { padding: 'px-6 py-6' } }"
                  class="hover:shadow-lg transition-shadow"
                >
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="font-bold text-lg">{{ debt.name }}</p>
                      <p class="text-xs text-muted capitalize mt-1">
                        {{ debt.type.replace('_', ' ') }}
                      </p>
                    </div>
                    <UButton
                      color="red"
                      variant="ghost"
                      size="sm"
                      icon="i-lucide-trash-2"
                      @click="deleteDebt(debt.id)"
                    />
                  </div>

                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Balance</p>
                      <p class="text-lg font-bold">{{ formatCurrency(debt.balance) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Interest Rate</p>
                      <p class="text-lg font-bold">{{ formatPercent(debt.interestRate) }}</p>
                    </div>
                    <div v-if="debt.minimumPayment">
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Min Payment</p>
                      <p class="text-lg font-bold">{{ formatCurrency(debt.minimumPayment) }}</p>
                    </div>
                    <div v-if="debt.dueDate">
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Due Date</p>
                      <p class="text-lg font-bold">{{ new Date(debt.dueDate).toLocaleDateString() }}</p>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </template>

          <template #subscriptions>
            <div class="space-y-4 pt-4">
              <div v-if="subscriptions.length === 0" class="text-center py-12">
                <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto text-muted mb-3" />
                <p class="text-muted">No subscriptions added yet</p>
              </div>

              <div v-else class="space-y-4">
                <UCard
                  v-for="subscription in subscriptions"
                  :key="subscription.id"
                  :ui="{ body: { padding: 'px-6 py-6' } }"
                  class="hover:shadow-lg transition-shadow"
                  :class="{ 'opacity-60': subscription.status !== 'active' }"
                >
                  <div class="flex items-start justify-between mb-4">
                    <div>
                      <p class="font-bold text-lg">{{ subscription.name }}</p>
                      <div class="flex items-center gap-2 mt-2">
                        <UBadge
                          :color="subscription.status === 'active' ? 'success' : 'neutral'"
                          variant="subtle"
                          size="sm"
                        >
                          {{ subscription.status }}
                        </UBadge>
                        <p class="text-xs text-muted capitalize">{{ subscription.frequency }}</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="text-lg font-bold">{{ formatCurrency(subscription.amount) }}</p>
                      <UButton
                        color="red"
                        variant="ghost"
                        size="xs"
                        icon="i-lucide-trash-2"
                        class="mt-2"
                        @click="deleteSubscription(subscription.id)"
                      />
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Category</p>
                      <p class="text-sm capitalize">{{ subscription.category }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-muted uppercase font-semibold mb-1">Renewal</p>
                      <p class="text-sm">{{ new Date(subscription.renewalDate).toLocaleDateString() }}</p>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>
          </template>
        </UTabs>
      </div>
    </template>
  </UDashboardPanel>

  <!-- New Debt Modal -->
  <UModal v-model="showNewDebtModal" title="Add New Debt">
    <div class="space-y-4">
      <UFormGroup label="Debt Name">
        <UInput v-model="newDebt.name" placeholder="e.g., Credit Card" />
      </UFormGroup>

      <UFormGroup label="Type">
        <USelect v-model="newDebt.type" :options="debtTypeOptions" />
      </UFormGroup>

      <UFormGroup label="Balance">
        <UInput v-model.number="newDebt.balance" type="number" placeholder="0.00" />
      </UFormGroup>

      <UFormGroup label="Interest Rate (%)">
        <UInput v-model.number="newDebt.interestRate" type="number" placeholder="0.00" />
      </UFormGroup>

      <UFormGroup label="Minimum Payment (Optional)">
        <UInput v-model.number="newDebt.minimumPayment" type="number" placeholder="0.00" />
      </UFormGroup>

      <div class="flex gap-3">
        <UButton @click="createDebt" color="primary" block>
          Add Debt
        </UButton>
        <UButton @click="showNewDebtModal = false" variant="outline" block>
          Cancel
        </UButton>
      </div>
    </div>
  </UModal>

  <!-- New Subscription Modal -->
  <UModal v-model="showNewSubModal" title="Add New Subscription">
    <div class="space-y-4">
      <UFormGroup label="Subscription Name">
        <UInput v-model="newSubscription.name" placeholder="e.g., Netflix" />
      </UFormGroup>

      <UFormGroup label="Amount">
        <UInput v-model.number="newSubscription.amount" type="number" placeholder="0.00" />
      </UFormGroup>

      <UFormGroup label="Category">
        <USelect v-model="newSubscription.category" :options="categoryOptions" />
      </UFormGroup>

      <UFormGroup label="Frequency">
        <USelect v-model="newSubscription.frequency" :options="frequencyOptions" />
      </UFormGroup>

      <UFormGroup label="Status">
        <USelect v-model="newSubscription.status" :options="subscriptionStatusOptions" />
      </UFormGroup>

      <div class="flex gap-3">
        <UButton @click="createSubscription" color="primary" block>
          Add Subscription
        </UButton>
        <UButton @click="showNewSubModal = false" variant="outline" block>
          Cancel
        </UButton>
      </div>
    </div>
  </UModal>
</template>
