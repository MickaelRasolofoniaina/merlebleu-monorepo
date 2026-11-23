export enum DashboardView {
  MONTH = "MONTH",
  YEAR = "YEAR",
}

export interface DashboardCountPoint {
  period: number;
  count: number;
}

export interface DashboardDistributionPoint {
  label: string;
  count: number;
}

export interface DashboardAmount {
  total: number;
  ordersCount: number;
}

export interface DashboardTodaySummary {
  createdCount: number;
  toPrepareCount: number;
  toDeliverCount: number;
  deliveredCount: number;
  collectedAmount: number;
}
