import { ReceiptPeriod } from '@merlebleu/shared';

export interface DayRange {
  /** Inclusive, YYYY-MM-DD */
  from: string;
  /** Inclusive, YYYY-MM-DD */
  to: string;
}

const pad = (value: number): string => String(value).padStart(2, '0');

/** Month is 1-12. */
export const daysInMonth = (year: number, month: number): number =>
  new Date(year, month, 0).getDate();

/** Inclusive range of the day, month or year that contains `date` (YYYY-MM-DD). */
export function getReceiptRange(period: ReceiptPeriod, date: string): DayRange {
  const year = Number(date.slice(0, 4));
  const month = Number(date.slice(5, 7));

  switch (period) {
    case ReceiptPeriod.DAY:
      return { from: date, to: date };
    case ReceiptPeriod.MONTH:
      return {
        from: `${year}-${pad(month)}-01`,
        to: `${year}-${pad(month)}-${pad(daysInMonth(year, month))}`,
      };
    case ReceiptPeriod.YEAR:
      return { from: `${year}-01-01`, to: `${year}-12-31` };
  }
}
