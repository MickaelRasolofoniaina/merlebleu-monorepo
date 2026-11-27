import { describe, expect, it } from '@jest/globals';
import { MovementType, ReceiptPeriod } from '@merlebleu/shared';
import { buildReceiptSummary, ReceiptWallet } from './treasury.receipt';
import { getReceiptRange } from './treasury.period';

const wallets: ReceiptWallet[] = [
  { id: 'cash', name: 'Espèces', color: '#16a34a', archived: false },
  { id: 'mvola', name: 'MVola', color: '#f59e0b', archived: false },
  { id: 'old', name: 'Airtel', color: '#ef4444', archived: true },
];

describe('getReceiptRange', () => {
  it('returns the same day for a day', () => {
    expect(getReceiptRange(ReceiptPeriod.DAY, '2026-11-26')).toEqual({
      from: '2026-11-26',
      to: '2026-11-26',
    });
  });

  it('covers the whole month, including a leap February', () => {
    expect(getReceiptRange(ReceiptPeriod.MONTH, '2028-02-10')).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
  });

  it('covers the whole year', () => {
    expect(getReceiptRange(ReceiptPeriod.YEAR, '2026-11-26')).toEqual({
      from: '2026-01-01',
      to: '2026-12-31',
    });
  });
});

describe('buildReceiptSummary', () => {
  const range = getReceiptRange(ReceiptPeriod.MONTH, '2026-11-15');

  const rows = [
    {
      date: '2026-11-02',
      type: MovementType.DEPOSIT,
      label: 'Rakoto',
      walletId: 'mvola',
      amount: 60000,
    },
    {
      date: '2026-11-02',
      type: MovementType.BALANCE,
      label: 'Andry',
      walletId: 'cash',
      amount: 145000,
    },
    {
      date: '2026-11-03',
      type: MovementType.EXPENSE,
      label: 'Farine',
      walletId: 'cash',
      amount: -45000,
    },
    {
      date: '2026-11-03',
      type: MovementType.REFUND,
      label: 'Voahangy',
      walletId: 'mvola',
      amount: -30000,
    },
    {
      date: '2026-11-04',
      type: MovementType.EXPENSE,
      label: 'Gaz',
      walletId: null,
      amount: -12000,
    },
  ];

  it('separates income, refunds and outflows and computes the net', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.MONTH,
      range,
      rows,
      wallets,
    );

    expect(summary.income).toBe(205000);
    expect(summary.refunds).toBe(30000);
    expect(summary.outflow).toBe(57000);
    expect(summary.net).toBe(118000);
  });

  it('lists active wallets even without activity, and "Non défini" for orphan expenses', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.MONTH,
      range,
      rows,
      wallets,
    );

    expect(summary.wallets.map((wallet) => wallet.name)).toEqual([
      'Espèces',
      'MVola',
      'Non défini',
    ]);
    const mvola = summary.wallets.find((wallet) => wallet.walletId === 'mvola');
    expect(mvola).toMatchObject({ income: 60000, refunds: 30000, net: 30000 });
    const undefinedRow = summary.wallets.find((wallet) => !wallet.walletId);
    expect(undefinedRow).toMatchObject({ outflow: 12000, net: -12000 });
  });

  it('keeps an archived wallet only when it has activity', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.MONTH,
      range,
      [
        {
          date: '2026-11-05',
          type: MovementType.DEPOSIT,
          label: 'Naly',
          walletId: 'old',
          amount: 10000,
        },
      ],
      wallets,
    );

    expect(summary.wallets.map((wallet) => wallet.name)).toContain('Airtel');
  });

  it('ignores transfers when only receipts are wanted', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.MONTH,
      range,
      [
        {
          date: '2026-11-05',
          type: MovementType.TRANSFER_IN,
          label: 'Virement',
          walletId: 'cash',
          amount: 500000,
        },
      ],
      wallets,
    );

    expect(summary.income).toBe(0);
    expect(summary.net).toBe(0);
  });

  it('builds one point per day for a month, with refunds netted', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.MONTH,
      range,
      rows,
      wallets,
    );

    expect(summary.points).toHaveLength(30);
    expect(summary.points[1]).toEqual({
      label: '2',
      date: '2026-11-02',
      income: 205000,
      refunds: 0,
      outflow: 0,
      amount: 205000,
      net: 205000,
    });
    expect(summary.points[2]).toEqual({
      label: '3',
      date: '2026-11-03',
      income: 0,
      refunds: 30000,
      outflow: 45000,
      amount: -30000,
      net: -75000,
    });
    expect(summary.points[3]).toMatchObject({ outflow: 12000, net: -12000 });
    expect(summary.points[29].date).toBe('2026-11-30');
  });

  it('keeps the sum of the points equal to income minus refunds', () => {
    for (const period of [ReceiptPeriod.MONTH, ReceiptPeriod.YEAR]) {
      const summary = buildReceiptSummary(
        period,
        getReceiptRange(period, '2026-11-15'),
        rows,
        wallets,
      );
      const sum = (key: 'income' | 'refunds' | 'outflow' | 'amount' | 'net') =>
        summary.points.reduce((total, point) => total + point[key], 0);

      expect(sum('income')).toBe(summary.income);
      expect(sum('refunds')).toBe(summary.refunds);
      expect(sum('outflow')).toBe(summary.outflow);
      expect(sum('amount')).toBe(summary.income - summary.refunds);
      expect(sum('net')).toBe(summary.net);
    }
  });

  it('builds twelve points for a year', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.YEAR,
      getReceiptRange(ReceiptPeriod.YEAR, '2026-06-01'),
      rows,
      wallets,
    );

    expect(summary.points).toHaveLength(12);
    expect(summary.points[10]).toEqual({
      label: 'Nov',
      date: '2026-11-01',
      income: 205000,
      refunds: 30000,
      outflow: 57000,
      amount: 175000,
      net: 118000,
    });
  });

  it('builds one point per receipt for a day', () => {
    const summary = buildReceiptSummary(
      ReceiptPeriod.DAY,
      getReceiptRange(ReceiptPeriod.DAY, '2026-11-02'),
      rows.slice(0, 2),
      wallets,
    );

    expect(summary.points).toEqual([
      {
        label: 'Rakoto',
        date: '2026-11-02',
        income: 60000,
        refunds: 0,
        outflow: 0,
        amount: 60000,
        net: 60000,
      },
      {
        label: 'Andry',
        date: '2026-11-02',
        income: 145000,
        refunds: 0,
        outflow: 0,
        amount: 145000,
        net: 145000,
      },
    ]);
  });
});
