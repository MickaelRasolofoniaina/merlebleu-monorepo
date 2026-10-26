import { DashboardView } from '@merlebleu/shared';
import {
  fillMonthPoints,
  fillYearPoints,
  getPeriodRange,
} from './dashboard.period';

describe('getPeriodRange', () => {
  it('returns the month range with an exclusive upper bound', () => {
    expect(getPeriodRange(DashboardView.MONTH, 2026, 10)).toEqual({
      from: '2026-10-01',
      to: '2026-11-01',
    });
  });

  it('rolls over to the next year for December', () => {
    expect(getPeriodRange(DashboardView.MONTH, 2026, 12)).toEqual({
      from: '2026-12-01',
      to: '2027-01-01',
    });
  });

  it('returns the whole year for the year view', () => {
    expect(getPeriodRange(DashboardView.YEAR, 2026, 10)).toEqual({
      from: '2026-01-01',
      to: '2027-01-01',
    });
  });
});

describe('fillMonthPoints', () => {
  it('returns the 12 months with zeros for the missing ones', () => {
    const points = fillMonthPoints([
      { period: 3, count: 5 },
      { period: 10, count: 2 },
    ]);

    expect(points.length).toBe(12);
    expect(points[2]).toEqual({ period: 3, count: 5 });
    expect(points[9]).toEqual({ period: 10, count: 2 });
    expect(points[0]).toEqual({ period: 1, count: 0 });
  });
});

describe('fillYearPoints', () => {
  it('fills the gaps between the first year and the current year', () => {
    expect(fillYearPoints([{ period: 2024, count: 4 }], 2026)).toEqual([
      { period: 2024, count: 4 },
      { period: 2025, count: 0 },
      { period: 2026, count: 0 },
    ]);
  });

  it('returns the current year alone when there are no orders', () => {
    expect(fillYearPoints([], 2026)).toEqual([{ period: 2026, count: 0 }]);
  });
});
