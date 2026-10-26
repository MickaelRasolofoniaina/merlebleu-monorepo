import { DashboardCountPoint, DashboardView } from '@merlebleu/shared';

export interface DateRange {
  from: string;
  to: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

// `to` is exclusive and the dates are plain YYYY-MM-DD strings (no timezone)
export function getPeriodRange(
  view: DashboardView,
  year: number,
  month?: number,
): DateRange {
  if (view === DashboardView.YEAR || month === undefined) {
    return { from: `${year}-01-01`, to: `${year + 1}-01-01` };
  }

  const nextMonthYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  return {
    from: `${year}-${pad(month)}-01`,
    to: `${nextMonthYear}-${pad(nextMonth)}-01`,
  };
}

export function fillMonthPoints(
  rows: DashboardCountPoint[],
): DashboardCountPoint[] {
  const countByMonth = new Map(rows.map((row) => [row.period, row.count]));

  return Array.from({ length: 12 }, (_, index) => ({
    period: index + 1,
    count: countByMonth.get(index + 1) ?? 0,
  }));
}

export function fillYearPoints(
  rows: DashboardCountPoint[],
  currentYear: number,
): DashboardCountPoint[] {
  const countByYear = new Map(rows.map((row) => [row.period, row.count]));
  const years = rows.map((row) => row.period);
  const firstYear = years.length ? Math.min(...years) : currentYear;
  const lastYear = Math.max(currentYear, ...years);

  return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => ({
    period: firstYear + index,
    count: countByYear.get(firstYear + index) ?? 0,
  }));
}
