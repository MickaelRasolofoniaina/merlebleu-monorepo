import { MovementType } from '@merlebleu/shared';
import {
  MOVEMENT_TYPE_OPTIONS,
  formatDay,
  formatSigned,
  getMovementTypeLabel,
  getMovementTypeSeverity,
  isClosingDue,
  lastDayOfPreviousMonth,
  parseDay,
  previousMonthLabel,
} from './treasury.model';

describe('treasury model', () => {
  it('formats an ISO day as dd/mm/yyyy', () => {
    expect(formatDay('2026-11-26')).toBe('26/11/2026');
  });

  it('signs an amount with a plus or a real minus sign', () => {
    const format = (value: number) => String(value);

    expect(formatSigned(500, format)).toBe('+ 500');
    expect(formatSigned(-500, format)).toBe('− 500');
  });

  it('labels both transfer directions the same way', () => {
    expect(getMovementTypeLabel(MovementType.TRANSFER_IN)).toBe('Virement');
    expect(getMovementTypeLabel(MovementType.TRANSFER_OUT)).toBe('Virement');
  });

  it('colors incomes in green and outflows in red', () => {
    expect(getMovementTypeSeverity(MovementType.DEPOSIT)).toBe('success');
    expect(getMovementTypeSeverity(MovementType.BALANCE)).toBe('success');
    expect(getMovementTypeSeverity(MovementType.EXPENSE)).toBe('danger');
    expect(getMovementTypeSeverity(MovementType.REFUND)).toBe('warn');
  });

  it('offers every movement type in the filter, plus "all types"', () => {
    const values = MOVEMENT_TYPE_OPTIONS.map((option) => option.value);

    expect(values[0]).toBeNull();
    for (const type of Object.values(MovementType)) {
      expect(values).toContain(type);
    }
  });

  describe('cash closing', () => {
    const now = new Date(2026, 10, 26); // 26 November 2026

    it('finds the last day of the previous month, also across a year', () => {
      expect(lastDayOfPreviousMonth(now)).toBe('2026-10-31');
      expect(lastDayOfPreviousMonth(new Date(2027, 0, 5))).toBe('2026-12-31');
      expect(lastDayOfPreviousMonth(new Date(2028, 2, 10))).toBe('2028-02-29');
    });

    it('names the previous month in French', () => {
      expect(previousMonthLabel(now)).toBe('octobre 2026');
    });

    it('asks for a closing when the previous month is not closed', () => {
      expect(isClosingDue(null, now)).toBeTrue();
      expect(isClosingDue('2026-09-30', now)).toBeTrue();
      expect(isClosingDue('2026-10-30', now)).toBeTrue();
    });

    it('does not ask once the previous month is closed', () => {
      expect(isClosingDue('2026-10-31', now)).toBeFalse();
      expect(isClosingDue('2026-11-15', now)).toBeFalse();
    });

    it('reads a day as a local date', () => {
      const day = parseDay('2026-09-30');

      expect([day.getFullYear(), day.getMonth(), day.getDate()]).toEqual([2026, 8, 30]);
    });

    it('labels the counting adjustment', () => {
      expect(getMovementTypeLabel(MovementType.ADJUSTMENT)).toBe('Ajustement');
    });
  });
});
