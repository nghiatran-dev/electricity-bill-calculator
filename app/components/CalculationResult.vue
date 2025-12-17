<script setup lang="ts">
import type { CalcResult } from '~/composables/useElectricBill'
const props = defineProps<{ data: CalcResult }>()
function formatMoney(n: number) { return new Intl.NumberFormat('vi-VN').format(Math.round(n)) }
function rowLabel(l: string) {
  if (l === 'Main') return 'Điện tổng'
  if (l === 'Nghia') return 'P. Nghĩa'
  if (l === 'Sa') return 'P. Sa'
  if (l === 'Dang') return 'P. Đăng'
  if (l === 'Ground') return 'Điện chung'
  return l
}

const rowPalette = [
  'bg-blue-50', 'bg-emerald-50', 'bg-amber-50', 'bg-rose-50', 'bg-violet-50',
  'bg-cyan-50', 'bg-lime-50', 'bg-fuchsia-50'
]
function rowClass(i: number, label: string) {
  if (label === 'Ground') return 'bg-slate-50'
  return rowPalette[i % rowPalette.length]
}
</script>

<template>
  <div class="overflow-x-auto rounded-2xl border shadow-sm">
    <table class="w-full border-collapse">
      <thead class="bg-gray-200/80">
        <tr class="text-left border-b">
          <th class="py-2 pl-3 pr-4">Các phòng</th>
          <!-- <th class="py-2 pr-4">Số cũ</th>
          <th class="py-2 pr-4">Số mới</th> -->
          <th class="py-2 pr-4">Số kWh sd</th>
          <th class="py-2 pr-4">Tạm tính<br/><span class="text-xs text-gray-500">(Chưa x hệ số)</span></th>
          <th class="py-2 pr-4">Hệ số <br/> điều chỉnh </th>
          <th class="py-2 pr-4">Tạm tính<br/><span class="text-xs text-gray-500">(Đã x hệ số)</span></th>
          <th class="py-2">
            Total<br/>
            <span class="text-xs text-gray-500">(Tạm tính + điện chung)</span>
          </th>
        </tr>
      </thead>

      <tbody class="[&>tr:nth-child(even)]:bg-gray-50 divide-y divide-gray-200">
        <tr v-for="(r, i) in data.rows" :key="i" :class="rowClass(i, r.label)">
          <td class="py-2 pl-3 pr-4">{{ rowLabel(r.label) }}</td>
          <!-- <td class="py-2 pr-4 tabular-nums" :class="r.label==='Main' ? 'text-red-600 font-semibold' : ''">{{ r.old }}</td>
          <td class="py-2 pr-4 tabular-nums" :class="r.label==='Main' ? 'text-red-600 font-semibold' : ''">{{ r.new }}</td> -->
          <td class="py-2 pr-4 tabular-nums" :class="r.label==='Main' ? 'text-red-600 font-semibold' : ''">{{ r.kwh }}</td>
          <td class="py-2 pr-4 tabular-nums font-medium" :class="r.label==='Main' ? 'text-red-600 font-semibold' : ''">{{ formatMoney(r.provisional) }}</td>
          <td class="py-2 pr-4 tabular-nums align-middle text-center font-semibold text-blue-600" v-if="i===0" :rowspan="data.rows.length">
            {{ data.adjustment.toFixed(2) }}
          </td>
          <td class="py-2 pr-4 tabular-nums">{{ r.scaled != null ? formatMoney(r.scaled) : '' }}</td>
          <td class="py-2 tabular-nums font-semibold">
            <!-- Ground total luôn = 0. Vì đã chia đều cho các phòng -->
            <template v-if="r.label==='Ground'">0</template>
            <template v-else>{{ r.total != null ? formatMoney(r.total) : '' }}</template>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ✅ NOTE dưới bảng -->
    <div class="px-4 py-3 text-lg text-gray-600 bg-gray-50 border-t">
      <p class="font-semibold text-gray-700">NOTE:</p>
      <ul class="list-disc pl-5 mt-1 space-y-1">
        <li>
          <b>
            Điện chung share đều: 
            <span class="text-blue-600">{{ formatMoney(data.sharePerRoom) }}</span>
          </b>
          <span class="italic"> (tạm tính[Điện chung] / số người sử dụng) </span>
        </li>
        <li>
          <b>Total</b> = Tạm tính của từng phòng + điện chung đã share
        </li>
        <li>
          <b>Hệ số điều chỉnh</b> = Bill / Total(tiền điện các phòng)
          <span class="italic"> (do bill của EVN đã bao gồm VAT nên sẽ có sự chênh lệch) </span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.tabular-nums { font-variant-numeric: tabular-nums; }
</style>