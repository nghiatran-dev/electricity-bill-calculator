<template>
  <section>
    <h1 class="text-2xl font-bold mb-4">Giá điện EVN theo thời điểm hiện tại</h1>

    <div v-if="tariffs.error" class="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      {{ tariffs.error }}
    </div>

    <div v-if="tariffs.loading" class="rounded-xl border p-5">
      <div class="h-5 w-44 bg-gray-200 rounded animate-pulse mb-3" />
      <div class="h-10 w-full bg-gray-100 rounded animate-pulse" />
    </div>

    <div v-else-if="!tariffs.tiers?.length" class="rounded-xl border p-5 text-sm text-gray-600">
      No tariff tiers available.
    </div>

    <div v-else class="rounded-2xl border p-5 shadow-sm">
      <div class="mb-3 text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
        <span>Effective date: <b>{{ tariffs.effectiveDate }}</b></span>
        <span>Currency: <b>{{ tariffs.currency }}</b> · Unit: <b>{{ tariffs.unit }}</b></span>
        <span v-if="tariffs.source" class="inline-flex items-center rounded border px-2 py-0.5 text-xs"
          :class="tariffs.source==='store' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-sky-300 text-sky-700 bg-sky-50'">
          {{ tariffs.source === 'store' ? 'From store' : 'From config' }}
        </span>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[600px] w-full">
          <thead>
            <tr class="text-left border-b">
              <th class="py-2 pr-4">From (kWh)</th>
              <th class="py-2 pr-4">To (kWh)</th>
              <th class="py-2">Rate (VND/kWh)</th>
            </tr>
          </thead>
          <tbody class="[&>tr:nth-child(even)]:bg-gray-50">
            <tr v-for="(t, i) in tariffs.tiers" :key="i">
              <td class="py-2 pr-4 tabular-nums">{{ t.from }}</td>
              <td class="py-2 pr-4 tabular-nums">{{ t.to ?? '∞' }}</td>
              <td class="py-2 tabular-nums font-medium">{{ formatVND(t.rate) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p class="mt-3 text-xs text-gray-500">These rates are provided for reference.</p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { useTariffsStore } from '~/stores/tariffs'

definePageMeta({ layout: 'default' })

const tariffs = useTariffsStore()

onMounted(() => {
  tariffs.ensureLoaded();
});

function formatVND(n: number) {
  return new Intl.NumberFormat('vi-VN').format(n)
}
</script>