<script setup lang="ts">
import { useColorMode } from '@vueuse/core'

const { isNotificationsSlideoverOpen } = useDashboard()
const colorMode = useColorMode()
const toast = useToast()

const settings = ref({
  currency: 'USD',
  theme: colorMode.preference as 'light' | 'dark' | 'system',
  notifications: true,
  notificationFrequency: 'weekly',
  emailDigest: true,
  budgetAlerts: true,
  billingReminders: true
})

const currencyOptions = [
  { label: 'USD - US Dollar', value: 'USD' },
  { label: 'EUR - Euro', value: 'EUR' },
  { label: 'GBP - British Pound', value: 'GBP' },
  { label: 'JPY - Japanese Yen', value: 'JPY' },
  { label: 'CAD - Canadian Dollar', value: 'CAD' }
]

const themeOptions = [
  { label: 'Light', value: 'light' },
  { label: 'Dark', value: 'dark' },
  { label: 'System', value: 'system' }
]

const frequencyOptions = [
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' }
]

const saveSettings = () => {
  colorMode.preference = settings.value.theme as any
  toast.add({ title: 'Settings saved successfully', color: 'green' })
}

const resetSettings = () => {
  settings.value = {
    currency: 'USD',
    theme: 'system',
    notifications: true,
    notificationFrequency: 'weekly',
    emailDigest: true,
    budgetAlerts: true,
    billingReminders: true
  }
}
</script>

<template>
  <UDashboardPanel id="settings">
    <template #header>
      <UDashboardNavbar title="Settings" :ui="{ right: 'gap-3' }">
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
      <div class="space-y-8 pb-8 max-w-3xl">
        <!-- General Settings -->
        <div>
          <h3 class="text-lg font-bold mb-6">General Settings</h3>

          <div class="space-y-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-globe" class="w-5 h-5" />
                  <span class="font-semibold">Currency</span>
                </div>
              </template>
              <UFormGroup label="Default Currency" :ui="{ container: 'mb-0' }">
                <USelect v-model="settings.currency" :options="currencyOptions" />
              </UFormGroup>
              <template #footer>
                <p class="text-xs text-muted">Used for displaying amounts throughout the app</p>
              </template>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-palette" class="w-5 h-5" />
                  <span class="font-semibold">Appearance</span>
                </div>
              </template>
              <UFormGroup label="Theme" :ui="{ container: 'mb-0' }">
                <USelect v-model="settings.theme" :options="themeOptions" />
              </UFormGroup>
              <template #footer>
                <p class="text-xs text-muted">Choose your preferred color scheme</p>
              </template>
            </UCard>
          </div>
        </div>

        <!-- Notification Settings -->
        <div>
          <h3 class="text-lg font-bold mb-6">Notifications</h3>

          <div class="space-y-6">
            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-bell" class="w-5 h-5" />
                  <span class="font-semibold">Push Notifications</span>
                </div>
              </template>
              <div class="flex items-center justify-between">
                <p class="text-sm">Enable notifications</p>
                <UToggle v-model="settings.notifications" />
              </div>
              <template #footer>
                <p class="text-xs text-muted">Receive alerts about transactions, subscriptions, and account activities</p>
              </template>
            </UCard>

            <UCard v-if="settings.notifications">
              <template #header>
                <span class="font-semibold">Notification Frequency</span>
              </template>
              <UFormGroup label="How often to receive updates" :ui="{ container: 'mb-0' }">
                <USelect v-model="settings.notificationFrequency" :options="frequencyOptions" />
              </UFormGroup>
              <template #footer>
                <p class="text-xs text-muted">Choose how frequently you want to receive notifications</p>
              </template>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-mail" class="w-5 h-5" />
                  <span class="font-semibold">Email Digest</span>
                </div>
              </template>
              <div class="flex items-center justify-between">
                <p class="text-sm">Send weekly email digest</p>
                <UToggle v-model="settings.emailDigest" />
              </div>
              <template #footer>
                <p class="text-xs text-muted">Get a summary of your financial activity each week</p>
              </template>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-alert-circle" class="w-5 h-5" />
                  <span class="font-semibold">Budget Alerts</span>
                </div>
              </template>
              <div class="flex items-center justify-between">
                <p class="text-sm">Notify when approaching budget limits</p>
                <UToggle v-model="settings.budgetAlerts" />
              </div>
              <template #footer>
                <p class="text-xs text-muted">Get alerts when spending reaches 80% of your budget</p>
              </template>
            </UCard>

            <UCard>
              <template #header>
                <div class="flex items-center gap-2">
                  <UIcon name="i-lucide-calendar" class="w-5 h-5" />
                  <span class="font-semibold">Billing Reminders</span>
                </div>
              </template>
              <div class="flex items-center justify-between">
                <p class="text-sm">Remind about upcoming payments</p>
                <UToggle v-model="settings.billingReminders" />
              </div>
              <template #footer>
                <p class="text-xs text-muted">Get notified 3 days before subscription renewals and debt payments</p>
              </template>
            </UCard>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 pt-4 border-t">
          <UButton @click="saveSettings" color="primary" icon="i-lucide-save">
            Save Settings
          </UButton>
          <UButton @click="resetSettings" variant="outline" icon="i-lucide-rotate-ccw">
            Reset to Default
          </UButton>
        </div>

        <!-- Info Section -->
        <UCard class="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <template #header>
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-info" class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span class="font-semibold text-blue-600 dark:text-blue-400">About This Dashboard</span>
            </div>
          </template>
          <p class="text-sm text-blue-700 dark:text-blue-300">
            This is a frontend-only personal finance dashboard. All data is stored locally in your browser during this session. 
            In a future update, you'll be able to connect to your bank accounts and sync data to the cloud for persistent storage.
          </p>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
