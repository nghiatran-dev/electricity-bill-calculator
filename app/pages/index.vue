<script setup lang="ts">
import ReadingsTable from '~/components/ReadingsTable.vue'
import CalculationResult from '~/components/CalculationResult.vue'
import { useTariffLoader } from '~/composables/useTariffLoader'
import { useElectricBill, type Readings } from '~/composables/useElectricBill'

definePageMeta({ layout: 'default' })

const { tariffs, load } = useTariffLoader()
await load()

const form = reactive<Omit<Readings, 'mainAmount'>>({
  oldMain: 0, newMain: 0,
  oldF1: 0,   newF1: 0,    // Phòng Nghĩa
  oldF2: 0,   newF2: 0,    // Phòng Sa
  dangKwh: 0,              // Phòng Đăng
})

// ✅ EVN bill nhập ngoài form
const evnAmount = ref<number | null>(null)

// ✅ số người chia điện chung (default 5)
const shareCount = ref<number>(5);

const { compute } = useElectricBill()
const result = ref<ReturnType<typeof compute> | null>(null)

function onCalculate() {
  if (!tariffs.tiers?.length) { alert('Tariffs not loaded yet.'); return }
  if (evnAmount.value == null || evnAmount.value < 0) {
    alert('Vui lòng nhập Bill EVN.')
    return
  }
  const n = Math.max(0.5, Number(shareCount.value || 1))
  const r = compute({ ...form, mainAmount: evnAmount.value }, tariffs.tiers, { shareDivisor: n })
  ;(r as any).__divisor = n
  result.value = r
}

function onFillExample() {
  form.oldMain = 2259; form.newMain = 3045; // 786
  form.oldF1   = 7437; form.newF1   = 7698; // Nghĩa: 261
  form.oldF2   = 3663; form.newF2   = 4013; // Sa: 350
  form.dangKwh = 35;                        // Đăng: ước lượng
  evnAmount.value = 2_592_900;              // EVN bill
  shareCount.value = 5;
  result.value = null
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-2xl font-bold text-[#df1f26]">Bill EVN:</label>
      <input v-model.number="evnAmount" type="number" min="0" step="1"
               class="w-48 rounded-lg border-2 border-[#df1f26] bg-[#fff5f5] px-3 py-2 text-lg font-bold text-[#df1f26] placeholder:text-gray-400 focus:ring-2 focus:ring-[#df1f26]/70 focus:outline-none tabular-nums" placeholder="vd. 2592900" />
      <span class="text-xl font-medium text-[#df1f26]">VND</span>
    </div>
    <div class="flex items-center gap-3">
      <label class="text-2xl font-semibold text-[#1f3b7a]">Số người sử dụng:</label>
      <input
        v-model.number="shareCount"
        type="number" min="0.5" step="0.5"
        class="w-20 rounded-lg border-2 border-[#1f3b7a] bg-[#f0f6ff] pl-2 pr-2 py-2 text-lg font-bold text-[#1f3b7a] focus:ring-2 focus:ring-[#1f3b7a]/60 focus:outline-none text-center"
    />
    </div>

    <!-- Truyền totals vào để hiển thị ở cột Thành tiền -->
    <h1 class="text-2xl font-bold">Nhập chỉ số điện:</h1>
    <ReadingsTable
      v-model="form"
      :totals="result ? { nghia: result.totals.nghia, sa: result.totals.sa, dang: result.totals.dang } : undefined"
    />

    <div class="flex items-center gap-3">
      <button class="rounded-xl bg-black px-4 py-2 text-white" @click="onCalculate">Tính tiền</button>
      <button class="rounded-xl border px-4 py-2" @click="onFillExample">Fill example</button>
    </div>

    <div v-if="result?.warnings?.length"
         class="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 text-sm">
      <ul class="list-disc pl-5">
        <li v-for="(w,i) in result.warnings" :key="i">{{ w }}</li>
      </ul>
    </div>
  </section>

  <section class="space-y-4 mt-4" v-if="result">
    <header class="flex items-center gap-3">
      <h1 class="text-2xl font-bold">Chi tiết bảng tính:</h1>
    </header>
    <CalculationResult v-if="result" :data="result" />
  </section>
</template>