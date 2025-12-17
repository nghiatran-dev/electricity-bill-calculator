import { defineStore } from 'pinia';
import { StorageSerializers } from '@vueuse/core';

type Tier = { from: number; to: number | null; rate: number }
type Tariff = {
  currency: string
  unit: string
  effectiveDate: string
  tiers: Tier[]
}
type SourceTag = 'store' | 'config' | null

export const useTariffsStore = defineStore('tariffs', () => {
  // Persisted states (VueUse)
  const currency = useLocalStorage('tariffs:currency', 'VND')
  const unit = useLocalStorage('tariffs:unit', 'kWh')
  const effectiveDate = useLocalStorage('tariffs:effectiveDate', '')
  const tiers = useLocalStorage<Tier[]>('tariffs:tiers', [], {
    serializer: StorageSerializers.object, // JSON.stringify/parse
  })

  // runtime only
  const source = ref<SourceTag>('config')
  const loading = ref(false)
  const error = ref<string | null>(null)

  function isReady() {
    return !!(tiers.value?.length)
  }

  async function ensureLoaded() {
    if (isReady()) { 
      source.value = 'store'
      return
    }

    loading.value = true
    error.value = null
    try {
      const data = await $fetch<Tariff>('/config/tariffs.json')
      currency.value = data.currency
      unit.value = data.unit
      effectiveDate.value = data.effectiveDate
      tiers.value = structuredClone(data.tiers)
      source.value = 'config'
    } catch (e: any) {
      error.value = e?.message ?? 'Failed to load tariffs config'
    } finally {
      loading.value = false
    }
  }

  function reset() {
    currency.value = null
    unit.value = null
    effectiveDate.value = null
    tiers.value = null
    source.value = null
  }

  return {
    currency, unit, effectiveDate, tiers,
    source, loading, error,
    isReady, ensureLoaded, reset
  }
})