<script setup lang="ts">
import ReadingsTable from '~/components/ReadingsTable.vue'
import CalculationResult from '~/components/CalculationResult.vue'
import { useTariffLoader } from '~/composables/useTariffLoader'
import { useElectricBill, type Readings } from '~/composables/useElectricBill'
import type { CalcResult } from '~/composables/useElectricBill'
import { onMounted, watch } from 'vue'

definePageMeta({ layout: 'default' })

const { tariffs, load } = useTariffLoader()
await load()

const form = reactive<Omit<Readings, 'mainAmount'>>({
  oldMain: 0, newMain: 0,
  oldF1: 0,   newF1: 0,    // Phòng Nghĩa
  oldF2: 0,   newF2: 0,    // Phòng Sa
  dangKwh: 0,              // Phòng Đăng
  peopleNghia: 0,
  peopleSa: 0,
  peopleDang: 0,
})

// ✅ EVN bill nhập ngoài form
const evnAmount = ref<number | null>(null)

const { compute } = useElectricBill()
const result = ref<ReturnType<typeof compute> | null>(null)

type PersistedBillV1 = {
  v: 1;
  saved_at: string;
  month_year: string; // YYYY-MM
  evn_amount: number | null;
  form: Omit<Readings, 'mainAmount'>;
  result?: CalcResult | null;
}

const monthYear = ref<string>((() => {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = String(d.getFullYear())
  return `${yyyy}-${mm}`
})())

function storageKeyForMonthYear(ym: string) {
  const [yyyy, mm] = String(ym || '').split('-')
  if (!yyyy || !mm) return null
  return `tien_dien_thang_${mm}_${yyyy}`
}

function safeNumber(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function snapshotForm(): Omit<Readings, 'mainAmount'> {
  return {
    oldMain: safeNumber(form.oldMain),
    newMain: safeNumber(form.newMain),
    oldF1: safeNumber(form.oldF1),
    newF1: safeNumber(form.newF1),
    oldF2: safeNumber(form.oldF2),
    newF2: safeNumber(form.newF2),
    dangKwh: safeNumber(form.dangKwh),
    peopleNghia: safeNumber(form.peopleNghia),
    peopleSa: safeNumber(form.peopleSa),
    peopleDang: safeNumber(form.peopleDang),
  }
}

function applySnapshotToForm(s: Partial<Omit<Readings, 'mainAmount'>>) {
  // chỉ assign các field đã biết để tránh phá reactive shape
  if (s.oldMain != null) form.oldMain = safeNumber(s.oldMain)
  if (s.newMain != null) form.newMain = safeNumber(s.newMain)
  if (s.oldF1 != null) form.oldF1 = safeNumber(s.oldF1)
  if (s.newF1 != null) form.newF1 = safeNumber(s.newF1)
  if (s.oldF2 != null) form.oldF2 = safeNumber(s.oldF2)
  if (s.newF2 != null) form.newF2 = safeNumber(s.newF2)
  if (s.dangKwh != null) form.dangKwh = safeNumber(s.dangKwh)
  if (s.peopleNghia != null) form.peopleNghia = safeNumber(s.peopleNghia)
  if (s.peopleSa != null) form.peopleSa = safeNumber(s.peopleSa)
  if (s.peopleDang != null) form.peopleDang = safeNumber(s.peopleDang)
}

function loadFromLocalStorage(): boolean {
  if (!import.meta.client) return
  const key = storageKeyForMonthYear(monthYear.value)
  if (!key) return false
  const raw = localStorage.getItem(key)
  if (!raw) return false
  try {
    const parsed = JSON.parse(raw) as Partial<PersistedBillV1>
    if (parsed?.v !== 1) return false
    if (parsed.form && typeof parsed.form === 'object') applySnapshotToForm(parsed.form)
    if (parsed.evn_amount !== undefined) evnAmount.value = (parsed.evn_amount == null ? null : safeNumber(parsed.evn_amount, 0))
    if (parsed.result !== undefined) result.value = (parsed.result as any) ?? null
    return true
  } catch {
    // ignore malformed storage
    return false
  }
}

function saveToLocalStorage(nextResult: CalcResult) {
  if (!import.meta.client) return
  const key = storageKeyForMonthYear(monthYear.value)
  if (!key) return
  const payload: PersistedBillV1 = {
    v: 1,
    saved_at: new Date().toISOString(),
    month_year: monthYear.value,
    evn_amount: evnAmount.value == null ? null : safeNumber(evnAmount.value, 0),
    form: snapshotForm(),
    result: nextResult,
  }
  try {
    localStorage.setItem(key, JSON.stringify(payload))
  } catch {
    // ignore quota errors
  }
}

onMounted(() => {
  loadFromLocalStorage()
})

watch(monthYear, () => {
  // đổi tháng/năm -> ưu tiên load lại dữ liệu tháng đó
  const ok = loadFromLocalStorage()
  if (!ok) {
    evnAmount.value = null
    result.value = null
  }
})

function onCalculate() {
  if (!tariffs.tiers?.length) { alert('Tariffs not loaded yet.'); return }
  if (evnAmount.value == null || evnAmount.value < 0) {
    alert('Vui lòng nhập Bill EVN.')
    return
  }
  const r = compute({ ...form, mainAmount: evnAmount.value }, tariffs.tiers)
  result.value = r
  saveToLocalStorage(r)
}

function onFillExample() {
  form.oldMain = 2259; form.newMain = 3045; // 786
  form.oldF1   = 7437; form.newF1   = 7698; // Nghĩa: 261
  form.oldF2   = 3663; form.newF2   = 4013; // Sa: 350
  form.dangKwh = 35;                        // Đăng: ước lượng
  form.peopleNghia = 2
  form.peopleSa = 2
  form.peopleDang = 1
  evnAmount.value = 2_592_900;              // EVN bill
  result.value = null
}
</script>

<template>
  <section class="space-y-4">
    <div class="flex items-center gap-3">
      <label class="text-2xl font-semibold text-[#1f3b7a]">Tháng/Năm:</label>
      <input
        v-model="monthYear"
        type="month"
        class="w-60 rounded-lg border-2 border-[#1f3b7a] bg-[#f0f6ff] px-3 py-2 text-lg font-bold text-[#1f3b7a] focus:ring-2 focus:ring-[#1f3b7a]/60 focus:outline-none text-center tabular-nums"
      />
    </div>
    <div class="flex items-center gap-3">
      <label class="text-2xl font-bold text-[#df1f26]">Bill EVN:</label>
      <input v-model.number="evnAmount" type="number" min="0" step="1"
               class="w-48 rounded-lg border-2 border-[#df1f26] bg-[#fff5f5] px-3 py-2 text-lg font-bold text-[#df1f26] placeholder:text-gray-400 focus:ring-2 focus:ring-[#df1f26]/70 focus:outline-none tabular-nums" placeholder="vd. 2592900" />
      <span class="text-xl font-medium text-[#df1f26]">VND</span>
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