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

export interface DashboardTodayDelivery {
  id: string;
  /** Formatted HH:mm. */
  startTime: string;
  /** Formatted HH:mm. */
  endTime: string;
  customerName: string;
  shopAddress: string;
  isPickup: boolean;
  itemsLabel: string;
  status: string;
  balanceAmount: number;
}

export interface DashboardProductionLine {
  shape: string;
  size: number;
  count: number;
}

export interface DashboardCollectionByMethod {
  name: string;
  color: string;
  amount: number;
}

export interface DashboardTodayExpense {
  id: string;
  label: string;
  /** Where the expense comes from: a category, an ingredient or a fixed charge. */
  origin: "CATEGORY" | "INGREDIENT" | "FIXED";
  amount: number;
  paid: boolean;
}

export interface DashboardTodayDetails {
  lateCount: number;
  lateBalanceAmount: number;
  balanceToCollectToday: number;
  deliveries: DashboardTodayDelivery[];
  production: DashboardProductionLine[];
  customizedOrdersCount: number;
  collectionsByMethod: DashboardCollectionByMethod[];
  expenses: DashboardTodayExpense[];
  unpaidFixedExpensesCount: number;
  tomorrowDeliveriesCount: number;
}

export interface DashboardOrderListSummary {
  balanceToCollect: number;
  collectedToday: number;
  toDeliverToday: number;
  toDeliverThisWeek: number;
}
