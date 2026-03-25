<script setup lang="ts">
import type { Account } from '~/types'
import { useFinance } from '~/composables/useFinance'

const { isNotificationsSlideoverOpen } = useDashboard()
const { accounts, transactions, addAccount, addTransaction } = useFinance()

const showNewAccountModal = ref(false)
const showImportModal = ref(false)
const selectedAccountId = ref<string | null>(null)

const newAccount = ref<Partial<Account>>({
  name: '',
  type: 'checking',
  balance: 0,
  currency: 'USD'
})

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2
  }).format(value)
}

const accountOptions = [
  { label: 'Checking', value: 'checking' },
  { label: 'Savings', value: 'savings' },
  { label: 'Investment', value: 'investment' },
  { label: 'Credit Card', value: 'credit_card' }
]

const selectedAccount = computed(() => {
  return selectedAccountId.value ? accounts.find(acc => acc.id === selectedAccountId.value) : accounts[0]
})

const accountTransactions = computed(() => {
  if (!selectedAccount.value) return []
  return transactions.filter(tx => tx.accountId === selectedAccount.value!.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
})

const createAccount = () => {
  if (!newAccount.value.name) {
    const toast = useToast()
    toast.add({ title: 'Account name is required', color: 'red' })
    return
  }

  addAccount({
    id: `acc-${Date.now()}`,
    name: newAccount.value.name!,
    type: (newAccount.value.type as any) || 'checking',
    balance: newAccount.value.balance || 0,
    currency: newAccount.value.currency || 'USD',
    lastUpdated: new Date()
  })

  newAccount.value = { name: '', type: 'checking', balance: 0, currency: 'USD' }
  showNewAccountModal.value = false

  const toast = useToast()
  toast.add({ title: 'Account created successfully', color: 'green' })
}

const handleCSVImport = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const csv = e.target?.result as string
    const lines = csv.split('\n')
    const transactions_data = []

    // Simple CSV parser: date, description, amount, category
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue
      const [date, description, amountStr, category] = lines[i].split(',').map(s => s.trim())
      const amount = parseFloat(amountStr)

      if (date && description && !isNaN(amount)) {
        transactions_data.push({
          id: `tx-${Date.now()}-${i}`,
          accountId: selectedAccount.value!.id,
          description,
          amount: Math.abs(amount),
          category: (category || 'other') as any,
          date: new Date(date),
          isIncome: amount > 0
        })
      }
    }

    if (transactions_data.length > 0) {
      transactions_data.forEach(tx => addTransaction(tx))
      const toast = useToast()
      toast.add({ title: `Imported ${transactions_data.length} transactions`, color: 'green' })
      showImportModal.value = false
    }
  }
  reader.readAsText(file)
}
</script>

<template>
  <UDashboardPanel id="accounts">
    <template #header>
      <UDashboardNavbar title="Accounts" :ui="{ right: 'gap-3' }">
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
                label: 'New Account',
                icon: 'i-lucide-plus-circle',
                click: () => showNewAccountModal = true
              }, {
                label: 'Import Transactions',
                icon: 'i-lucide-upload',
                click: () => showImportModal = true
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
        <!-- Accounts Grid -->
        <div>
          <h3 class="text-sm font-bold uppercase tracking-wider text-muted mb-4">
            All Accounts
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <UCard
              v-for="account in accounts"
              :key="account.id"
              :class="{ 'ring-2 ring-primary': selectedAccountId === account.id }"
              class="cursor-pointer transition-all hover:shadow-lg"
              @click="selectedAccountId = account.id"
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
                <UIcon name="i-lucide-wallet" class="w-5 h-5 text-primary" />
              </div>
              <p class="text-2xl font-bold">
                {{ formatCurrency(account.balance) }}
              </p>
            </UCard>
          </div>
        </div>

        <!-- Transactions for Selected Account -->
        <div v-if="selectedAccount">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-bold uppercase tracking-wider text-muted">
              Transactions - {{ selectedAccount.name }}
            </h3>
          </div>

          <UCard v-if="accountTransactions.length === 0">
            <div class="text-center py-8">
              <UIcon name="i-lucide-inbox" class="w-12 h-12 mx-auto text-muted mb-2" />
              <p class="text-muted">No transactions yet</p>
            </div>
          </UCard>

          <div v-else class="space-y-2">
            <UCard
              v-for="transaction in accountTransactions"
              :key="transaction.id"
              :ui="{ body: { padding: 'px-6 py-4' } }"
              class="hover:shadow-md transition-shadow"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="font-medium">{{ transaction.description }}</p>
                  <p class="text-xs text-muted capitalize mt-1">
                    {{ transaction.category }}
                  </p>
                  <p class="text-xs text-muted mt-1">
                    {{ new Date(transaction.date).toLocaleDateString() }}
                  </p>
                </div>
                <div class="text-right">
                  <p :class="transaction.isIncome ? 'text-success' : 'text-highlighted'" class="font-semibold">
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

  <!-- New Account Modal -->
  <UModal v-model="showNewAccountModal" title="Create New Account">
    <div class="space-y-4">
      <UFormGroup label="Account Name">
        <UInput v-model="newAccount.name" placeholder="e.g., My Checking Account" />
      </UFormGroup>

      <UFormGroup label="Account Type">
        <USelect v-model="newAccount.type" :options="accountOptions" />
      </UFormGroup>

      <UFormGroup label="Starting Balance">
        <UInput v-model.number="newAccount.balance" type="number" placeholder="0.00" />
      </UFormGroup>

      <div class="flex gap-3">
        <UButton @click="createAccount" color="primary" block>
          Create Account
        </UButton>
        <UButton @click="showNewAccountModal = false" variant="outline" block>
          Cancel
        </UButton>
      </div>
    </div>
  </UModal>

  <!-- Import Modal -->
  <UModal v-model="showImportModal" title="Import Transactions">
    <div class="space-y-4">
      <div v-if="!selectedAccount" class="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
        Please select an account first
      </div>

      <template v-else>
        <p class="text-sm text-muted">
          Upload a CSV file with columns: date, description, amount, category
        </p>

        <UCard class="border-2 border-dashed p-8 text-center cursor-pointer hover:bg-primary/5 transition-colors">
          <input
            type="file"
            accept=".csv"
            @change="handleCSVImport"
            class="opacity-0 absolute w-0 h-0"
            id="csv-input"
          />
          <label for="csv-input" class="block cursor-pointer">
            <UIcon name="i-lucide-upload-cloud" class="w-8 h-8 mx-auto text-primary mb-2" />
            <p class="font-medium">Click to upload CSV</p>
            <p class="text-xs text-muted mt-1">or drag and drop</p>
          </label>
        </UCard>

        <UButton @click="showImportModal = false" variant="outline" block>
          Done
        </UButton>
      </template>
    </div>
  </UModal>
</template>
