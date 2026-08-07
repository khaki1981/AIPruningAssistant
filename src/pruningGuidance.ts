import type { Plant, PlantPruningMethod } from "./types/plant";

export type PruningGuidanceStatus = "suitable" | "avoid" | "caution" | "unknown";
export type FlowerBudGuidanceStatus = "caution" | "not-overlapping" | "unknown";

export interface CurrentPruningGuidance {
  month: number;
  monthLabel: string;
  status: PruningGuidanceStatus;
  statusLabel: string;
  reason: string;
  avoidanceMessage: string;
  explicitAvoidanceNotes: string[];
  pruningPeriodLabel: string;
  timingNotes: string[];
  flowerBudStatus: FlowerBudGuidanceStatus;
  flowerBudMessage: string;
  flowerBudPeriodLabel?: string;
  pruningSummary?: string;
  methods: PlantPruningMethod[];
  warnings: string[];
}

function assertMonth(month: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new RangeError(`month must be an integer from 1 to 12: ${month}`);
  }
}

function formatRange(months: number[]) {
  const first = months[0];
  const last = months[months.length - 1];
  return months.length === 1 ? `${first}月` : `${first}月〜${last}月`;
}

function createMonthRange(start: number, end: number) {
  assertMonth(start);
  assertMonth(end);
  const months: number[] = [];
  let current = start;
  while (!months.includes(current)) {
    months.push(current);
    if (current === end) break;
    current = current === 12 ? 1 : current + 1;
  }
  return months;
}

function getExplicitAvoidanceMonths(note: string) {
  const normalizedNote = note.normalize("NFKC");
  if (!/剪定.*避け|避け.*剪定/.test(normalizedNote)) return [];

  const months = new Set<number>();
  for (const match of normalizedNote.matchAll(/(\d{1,2})月以降/g)) {
    const start = Number(match[1]);
    if (start >= 1 && start <= 12) {
      createMonthRange(start, 12).forEach((month) => months.add(month));
    }
  }
  for (const match of normalizedNote.matchAll(/(\d{1,2})月?\s*[〜~-]\s*(\d{1,2})月/g)) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (start >= 1 && start <= 12 && end >= 1 && end <= 12) {
      createMonthRange(start, end).forEach((month) => months.add(month));
    }
  }
  for (const match of normalizedNote.matchAll(/(\d{1,2})月/g)) {
    const month = Number(match[1]);
    if (month >= 1 && month <= 12) months.add(month);
  }
  return [...months];
}

export function formatMonthPeriods(months: number[]) {
  const sortedMonths = [...new Set(months)].sort((left, right) => left - right);
  if (sortedMonths.length === 0) return "登録なし";
  sortedMonths.forEach(assertMonth);
  if (sortedMonths.length === 12) return "1月〜12月";

  const groups: number[][] = [];
  sortedMonths.forEach((month) => {
    const currentGroup = groups[groups.length - 1];
    if (currentGroup && month === currentGroup[currentGroup.length - 1] + 1) {
      currentGroup.push(month);
    } else {
      groups.push([month]);
    }
  });

  if (
    groups.length > 1 &&
    groups[0][0] === 1 &&
    groups[groups.length - 1][groups[groups.length - 1].length - 1] === 12
  ) {
    const firstGroup = groups.shift()!;
    const lastGroup = groups.pop()!;
    groups.unshift([...lastGroup, ...firstGroup]);
  }

  return groups.map(formatRange).join("、");
}

export function createCurrentPruningGuidance(
  plant: Plant,
  month: number,
): CurrentPruningGuidance {
  assertMonth(month);

  const isPruningMonth = plant.calendar.pruningMonths.includes(month);
  const hasFlowerBudData = plant.calendar.flowerBudFormationMonths.length > 0;
  const isFlowerBudMonth = plant.calendar.flowerBudFormationMonths.includes(month);
  const explicitAvoidanceNotes = [...plant.pruning.timing, ...plant.pruning.warnings]
    .filter((note) => getExplicitAvoidanceMonths(note).includes(month))
    .filter((note, index, notes) => notes.indexOf(note) === index);
  const pruningPeriodLabel = formatMonthPeriods(plant.calendar.pruningMonths);
  const flowerBudPeriodLabel = hasFlowerBudData
    ? formatMonthPeriods(plant.calendar.flowerBudFormationMonths)
    : undefined;

  let status: PruningGuidanceStatus;
  let statusLabel: string;
  let reason: string;

  if (explicitAvoidanceNotes.length > 0) {
    status = "avoid";
    statusLabel = "剪定を避けるよう登録されている時期です";
    reason = `${month}月に当てはまる剪定回避の記載が植物データにあります。`;
  } else if (isPruningMonth && isFlowerBudMonth) {
    status = "caution";
    statusLabel = "剪定適期ですが、花芽への注意が必要です";
    reason = `${month}月は登録された剪定適期と花芽形成時期の両方に含まれています。`;
  } else if (isPruningMonth) {
    status = "suitable";
    statusLabel = "登録されている剪定適期です";
    reason = `${month}月は植物データの剪定適期に含まれています。`;
  } else if (isFlowerBudMonth) {
    status = "caution";
    statusLabel = "花芽への注意が必要な時期です";
    reason = `${month}月は登録された剪定適期ではなく、花芽形成時期に含まれています。`;
  } else {
    status = "unknown";
    statusLabel = "現在のデータだけでは判断できません";
    reason = `${month}月は登録された剪定適期に含まれていません。`;
  }

  const avoidanceMessage = explicitAvoidanceNotes.length > 0
    ? "現在月に当てはまる『剪定を避ける』という記載があります。"
    : isPruningMonth
      ? "現在月は登録された剪定適期に含まれています。避ける時期を示す月別データは登録されていません。"
      : "現在月は登録された剪定適期に含まれていません。ただし、適期外であることだけを理由に、剪定を避けるべき時期とは断定しません。";

  let flowerBudStatus: FlowerBudGuidanceStatus;
  let flowerBudMessage: string;

  if (!hasFlowerBudData) {
    flowerBudStatus = "unknown";
    flowerBudMessage = "花芽を切る危険性について、現在表示できる情報がありません。";
  } else if (isFlowerBudMonth) {
    flowerBudStatus = "caution";
    flowerBudMessage =
      "現在月は登録された花芽形成時期と重なります。剪定すると花芽を切る可能性があるため、登録されている剪定方法と注意事項を確認してください。";
  } else {
    flowerBudStatus = "not-overlapping";
    flowerBudMessage =
      "現在月は登録された花芽形成時期には含まれていません。ただし、花芽を切る危険性がないとは断定できません。";
  }

  return {
    month,
    monthLabel: `${month}月`,
    status,
    statusLabel,
    reason,
    avoidanceMessage,
    explicitAvoidanceNotes,
    pruningPeriodLabel,
    timingNotes: plant.pruning.timing.filter((item) => item.trim().length > 0),
    flowerBudStatus,
    flowerBudMessage,
    flowerBudPeriodLabel,
    pruningSummary: plant.pruning.summary?.trim() || undefined,
    methods: plant.pruning.methods.filter(
      (method) =>
        method.name.trim().length > 0 ||
        Boolean(method.description?.trim()) ||
        Boolean(method.conditions?.trim()),
    ),
    warnings: plant.pruning.warnings.filter((item) => item.trim().length > 0),
  };
}
