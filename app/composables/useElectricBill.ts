// composables/useElectricBill.ts

export type Tier = { from: number; to: number | null; rate: number }

export interface Readings {
  oldMain: number; newMain: number;
  oldF1: number;   newF1: number;   // 1st floor
  oldF2: number;   newF2: number;   // 2nd floor
  dangKwh: number;                  // 3rd floor (input kWh)
  mainAmount: number | null;        // Bill EVN
}

export interface RowOut {
  label: 'Main' | 'Nghia' | 'Sa' | 'Dang' | 'Ground';
  old: number | null;
  new: number | null;
  kwh: number;
  provisional: number;   // unscaled; riêng Main = EVN bill (mainUsed)
  scaled?: number;       // đã nhân hệ số (không dùng cho Main)
  total?: number;        // total hiển thị (Ground = 0 theo yêu cầu)
}

export interface CalcResult {
  rows: RowOut[];
  kwh: { main: number; nghia: number; sa: number; dang: number; g: number };
  provisional: {
    mainCalc: number;
    mainUsed: number;
    nghia: number; sa: number; dang: number; g: number; sumFloors: number;
  };
  adjustment: number;
  sharePerRoom: number;  // tiền Điện chung sau nhân hệ số / 5
  totals: { nghia: number; sa: number; dang: number; ground: number; sum: number };
  numOfUsers: number;
  warnings: string[];
}

function round2(n: number) { return Math.round(n * 100) / 100 }
function clamp(n: number) { return Number.isFinite(n) ? n : 0 }

/** EVN tiers: [0..50], [51..100], ..., [401..∞) */
export function costTieredEVN(kwh: number, tiers: Tier[]): number {
  let remain = Math.max(0, kwh)
  if (!Array.isArray(tiers) || tiers.length === 0 || remain === 0) return 0
  const ordered = [...tiers].sort((a, b) => a.from - b.from)
  let cost = 0
  for (const t of ordered) {
    if (remain <= 0) break
    const bandSize = t.to == null ? Infinity : (t.to - t.from + 1)
    const take = Math.min(remain, bandSize === Infinity ? remain : bandSize)
    if (take > 0) {
      cost += take * t.rate
      remain -= take
    }
  }
  return cost
}

export interface CalcOptions {
  shareDivisor?: number; // số người chia tiền điện chung
}

export function useElectricBill() {
  function compute(read: Readings, tiers: Tier[], options: CalcOptions = {}): CalcResult {
    const warnings: string[] = []

    const kwhMain  = clamp(read.newMain - read.oldMain)
    const kwhNghia = clamp(read.newF1   - read.oldF1)
    const kwhSa    = clamp(read.newF2   - read.oldF2)
    const kwhDang  = Math.max(0, clamp(read.dangKwh))
    const kwhGraw  = kwhMain - (kwhNghia + kwhSa + kwhDang) // có thể âm để cảnh báo
    const kwhG     = Math.max(0, kwhGraw)

    if (kwhMain < 0 || kwhNghia < 0 || kwhSa < 0) {
      warnings.push('One or more kWh values are negative. Please check meter readings.')
    }
    if (kwhGraw < 0) {
      warnings.push('Ground kWh is negative: sub totals exceed main meter.')
    }

    // Unscaled (tham chiếu) theo bậc EVN
    const pMainCalc = costTieredEVN(kwhMain, tiers)
    const pNghia    = costTieredEVN(kwhNghia, tiers)
    const pSa       = costTieredEVN(kwhSa, tiers)
    const pDang     = costTieredEVN(kwhDang, tiers)
    const pG        = costTieredEVN(kwhG, tiers)

    const sumFloors = pNghia + pSa + pDang + pG

    // Tiền Main dùng để phân bổ: ưu tiên EVN bill
    const mainUsed = (read.mainAmount != null && read.mainAmount >= 0)
      ? read.mainAmount : pMainCalc

    if (sumFloors === 0) warnings.push('No floor consumption to allocate. Adjustment set to 1.')
    const adjustment = sumFloors > 0 ? (mainUsed / sumFloors) : 1

    // Sau nhân hệ số
    const nghiaScaled = pNghia * adjustment
    const saScaled    = pSa    * adjustment
    const dangScaled  = pDang  * adjustment
    const gScaled     = pG     * adjustment

    // ✅ Chia đều Điện chung cho 5 phòng theo yêu cầu
    const divisor = Math.max(0.5, options.shareDivisor ?? 5)
    const numOfUsers = kwhDang === 0 ? 4 : divisor;
    const sharePerRoom = gScaled / numOfUsers;

    // Total theo công thức mới
    const nghiaTotal = nghiaScaled + (sharePerRoom * 2) // Tầng 1: 2 người
    const saTotal    = saScaled    + (sharePerRoom * 2) // Tầng 2: 2 người
    const dangTotal  = kwhDang === 0 ? 0 : (dangScaled + sharePerRoom) // Tầng 3: 1 người
    const groundTotal = 0 // Điện chung = 0 vì đã chia đều cho phòng khác

    const sumTotal = nghiaTotal + saTotal + dangTotal + groundTotal

    const rows: RowOut[] = [
      // { label: 'Main',  old: read.oldMain, new: read.newMain, kwh: kwhMain,  provisional: round2(mainUsed) },
      { label: 'Nghia', old: read.oldF1,   new: read.newF1,   kwh: kwhNghia, provisional: round2(pNghia), scaled: round2(nghiaScaled), total: round2(nghiaTotal) },
      { label: 'Sa',    old: read.oldF2,   new: read.newF2,   kwh: kwhSa,    provisional: round2(pSa),    scaled: round2(saScaled),    total: round2(saTotal) },
      { label: 'Dang',  old: 0,            new: 0,            kwh: kwhDang,  provisional: round2(pDang),  scaled: round2(dangScaled),  total: round2(dangTotal) },
      { label: 'Ground',old: null,
                        new: null,
                        kwh: kwhGraw, provisional: round2(pG), scaled: round2(gScaled), total: 0 },
    ]

    return {
      rows,
      kwh: { main: kwhMain, nghia: kwhNghia, sa: kwhSa, dang: kwhDang, g: kwhGraw },
      provisional: { mainCalc: pMainCalc, mainUsed, nghia: pNghia, sa: pSa, dang: pDang, g: pG, sumFloors },
      adjustment,
      sharePerRoom,
      totals: { nghia: nghiaTotal, sa: saTotal, dang: dangTotal, ground: groundTotal, sum: sumTotal },
      numOfUsers,
      warnings
    }
  }

  return { compute }
}