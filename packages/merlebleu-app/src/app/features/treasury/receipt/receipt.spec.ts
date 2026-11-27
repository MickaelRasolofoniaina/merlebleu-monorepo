import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ReceiptPeriod, ReceiptSummary } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';
import { TreasuryApiService } from '../treasury-api.service';
import { ReceiptComponent } from './receipt';

const todayIso = (): string => formatDate(new Date());

const buildSummary = (period: ReceiptPeriod, points: ReceiptSummary['points']): ReceiptSummary => ({
  period,
  from: '2026-11-01',
  to: '2026-11-30',
  income: 205000,
  refunds: 30000,
  outflow: 0,
  net: 175000,
  wallets: [],
  points,
});

describe('ReceiptComponent', () => {
  let fixture: ComponentFixture<ReceiptComponent>;
  let summary: ReceiptSummary;

  const setup = async (value: ReceiptSummary): Promise<void> => {
    summary = value;
    await TestBed.configureTestingModule({
      imports: [ReceiptComponent],
      providers: [
        {
          provide: TreasuryApiService,
          useValue: {
            getReceipts: () => of(summary),
            getWallets: () => of({ wallets: [], totalBalance: 0 }),
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ReceiptComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  const openTable = async (): Promise<void> => {
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('p-selectbutton .p-togglebutton')) as HTMLElement[];
    buttons.find((button) => button.textContent?.includes('Tableau'))?.click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  };

  // the first p-table is the daily/monthly one, the second lists the wallets
  const receiptTable = (): HTMLElement => fixture.nativeElement.querySelector('p-table');
  const bodyRows = (): HTMLElement[] => Array.from(receiptTable().querySelectorAll('tbody tr'));

  it('shows the chart by default and no table', async () => {
    await setup(
      buildSummary(ReceiptPeriod.MONTH, [{ label: '1', date: '2026-11-01', income: 0, refunds: 0, outflow: 0, amount: 0, net: 0 }]),
    );

    expect(fixture.nativeElement.querySelector('p-chart')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Recette = entrées');
  });

  it('lists one row per day with muted empty days, red negative net and the total', async () => {
    await setup(
      buildSummary(ReceiptPeriod.MONTH, [
        { label: '1', date: '2026-11-01', income: 0, refunds: 0, outflow: 0, amount: 0, net: 0 },
        { label: '2', date: '2026-11-02', income: 205000, refunds: 0, outflow: 0, amount: 205000, net: 205000 },
        { label: '3', date: '2026-11-03', income: 0, refunds: 30000, outflow: 45000, amount: -30000, net: -75000 },
      ]),
    );
    await openTable();

    const rows = bodyRows();
    expect(rows.length).toBe(3);
    expect(rows[0].textContent).toContain('Dim. 1 nov.');
    expect(rows[0].className).toContain('text-slate-400');
    expect(rows[0].querySelectorAll('td')[4].textContent).toContain('—');
    expect(rows[2].querySelectorAll('td')[3].textContent).toContain('45');
    expect(rows[2].querySelectorAll('td')[4].className).toContain('text-red-600');
    expect(receiptTable().querySelector('tfoot')?.textContent).toContain('Total');
  });

  it('highlights today in the month table', async () => {
    await setup(buildSummary(ReceiptPeriod.MONTH, [{ label: '1', date: todayIso(), income: 1000, refunds: 0, outflow: 0, amount: 1000, net: 1000 }]));
    await openTable();

    expect(bodyRows()[0].getAttribute('aria-current')).toBe('date');
    expect(bodyRows()[0].textContent).toContain("Aujourd'hui");
  });

  it('labels the first column "Mois" and keeps the month label for a year', async () => {
    await setup(
      buildSummary(ReceiptPeriod.YEAR, [{ label: 'Nov', date: '2026-11-01', income: 205000, refunds: 30000, outflow: 0, amount: 175000, net: 175000 }]),
    );
    const component = fixture.componentInstance as unknown as { period: { set(value: ReceiptPeriod): void } };
    component.period.set(ReceiptPeriod.YEAR);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await openTable();

    expect(receiptTable().querySelector('thead th')?.textContent).toContain('Mois');
    expect(bodyRows()[0].textContent).toContain('Nov');
  });

  it('hides the view switch for a day', async () => {
    await setup(buildSummary(ReceiptPeriod.MONTH, [{ label: 'Rakoto', date: '2026-11-02', income: 1, refunds: 0, outflow: 0, amount: 1, net: 1 }]));
    const component = fixture.componentInstance as unknown as { period: { set(value: ReceiptPeriod): void } };
    component.period.set(ReceiptPeriod.DAY);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('p-selectbutton[aria-label="Affichage"]')).toBeNull();
  });
});
