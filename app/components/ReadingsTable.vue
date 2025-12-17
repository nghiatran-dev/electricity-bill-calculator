<script setup lang="ts">
type ReadingsForm = {
  oldMain: number; newMain: number;
  oldF1: number;   newF1: number;  // Nghĩa
  oldF2: number;   newF2: number;  // Sa
  dangKwh: number;                 // Đăng
}
const model = defineModel<ReadingsForm>({ required: true })

const props = defineProps<{
  totals?: { nghia?: number; sa?: number; dang?: number } // nhận từ trang sau Calculate
}>()

const kwh = computed(() => {
  const main  = (model.value.newMain - model.value.oldMain) || 0
  const nghia = (model.value.newF1   - model.value.oldF1)   || 0
  const sa    = (model.value.newF2   - model.value.oldF2)   || 0
  const dang  = (model.value.dangKwh || 0)
  const graw  = main - (nghia + sa + dang)
  return { main, nghia, sa, dang, graw }
})

function money(n?: number) {
  if (n == null) return '—'
  return new Intl.NumberFormat('vi-VN').format(Math.round(n))
}
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border shadow-sm">
    <table class="w-full table-fixed">
      <thead class="bg-gray-200/80">
        <tr class="text-left">
          <th class="py-2 pl-3 pr-4">Hạng mục</th>
          <th class="py-2 pr-4">Số cũ</th>
          <th class="py-2 pr-4">Số mới</th>
          <th class="py-2 pr-4">Số kWh sd</th>
        </tr>
      </thead>

      <tbody>
        <!-- Điện tổng -->
        <tr class="border-b">
          <td class="py-2 pl-3 pr-4 font-semibold text-red-600">Điện tổng</td>
          <td class="py-2 pr-4">
            <input v-model.number="model.oldMain" type="number" min="0"
                   class="w-32 rounded-lg border px-3 py-1.5 tabular-nums text-red-600" />
          </td>
          <td class="py-2 pr-4">
            <input v-model.number="model.newMain" type="number" min="0"
                   class="w-32 rounded-lg border px-3 py-1.5 tabular-nums text-red-600" />
          </td>
          <td class="py-2 pr-4 tabular-nums font-semibold text-red-600">{{ kwh.main }}</td>
        </tr>

        <!-- Phòng Nghĩa -->
        <tr class="border-b">
          <td class="py-2 pl-3 pr-4">Phòng Nghĩa</td>
          <td class="py-2 pr-4">
            <input v-model.number="model.oldF1" type="number" min="0" class="w-32 rounded-lg border px-3 py-1.5 tabular-nums" />
          </td>
          <td class="py-2 pr-4">
            <input v-model.number="model.newF1" type="number" min="0" class="w-32 rounded-lg border px-3 py-1.5 tabular-nums" />
          </td>
          <td class="py-2 pr-4 tabular-nums font-medium">{{ kwh.nghia }}</td>
        </tr>

        <!-- Phòng Sa -->
        <tr class="border-b">
          <td class="py-2 pl-3 pr-4">Phòng Sa</td>
          <td class="py-2 pr-4">
            <input v-model.number="model.oldF2" type="number" min="0" class="w-32 rounded-lg border px-3 py-1.5 tabular-nums" />
          </td>
          <td class="py-2 pr-4">
            <input v-model.number="model.newF2" type="number" min="0" class="w-32 rounded-lg border px-3 py-1.5 tabular-nums" />
          </td>
          <td class="py-2 pr-4 tabular-nums font-medium">{{ kwh.sa }}</td>
        </tr>

        <!-- Phòng Đăng -->
        <tr class="border-b">
          <td class="py-2 pl-3 pr-4">Phòng Đăng</td>
          <td class="py-2 pr-4 text-gray-400 select-none">—</td>
          <td class="py-2 pr-4 text-gray-400 select-none">—</td>
          <td class="py-2 pr-4">
            <input v-model.number="model.dangKwh" type="number" min="0" step="1"
                   class="w-32 rounded-lg border px-3 py-1.5 tabular-nums" placeholder="kWh ước lượng" />
          </td>
        </tr>

        <!-- Điện chung -->
        <tr>
          <td class="py-2 pl-3 pr-4 font-semibold text-blue-600">Điện chung</td>
          <td class="py-2 pr-4 text-gray-400 select-none">—</td>
          <td class="py-2 pr-4 text-gray-400 select-none">—</td>
          <td class="py-2 pr-4 tabular-nums font-semibold" :class="kwh.graw < 0 ? 'text-red-600' : ''">
            {{ kwh.graw }}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ NOTE dưới bảng -->
    <div class="px-4 py-3 text-lg text-gray-600 bg-gray-50 border-t">
      <p class="font-semibold text-gray-700">NOTE:</p>
      <ul class="list-disc pl-5 mt-1 space-y-1">
        <li>
          <b>Điện P. Đăng</b>: chỉ sử dụng quạt và bóng đèn
          <span class="italic">(ước lượng ~35 kWh/tháng)</span>
        </li>
        <li>
          <b>Điện chung</b> = Điện tổng − P.Nghĩa − P. Sa − P. Đăng
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>