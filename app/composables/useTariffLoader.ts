// composables/useTariffLoader.ts
import { useTariffsStore } from '~/stores/tariffs'

export function useTariffLoader() {
  const tariffs = useTariffsStore()

  // SPA mode: chỉ cần gọi 1 lần khi vào trang
  async function load() {
    if (!Array.isArray(tariffs.tiers) || !tariffs.tiers.length) {
      await tariffs.ensureLoaded()
    }
  }

  return { tariffs, load }
}