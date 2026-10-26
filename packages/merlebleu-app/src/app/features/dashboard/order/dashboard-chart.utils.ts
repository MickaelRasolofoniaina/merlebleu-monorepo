import { DashboardDistributionPoint } from '@merlebleu/shared';

export const OTHERS_LABEL = 'Autres';

// Keeps the biggest slices and sums the rest in an "Autres" slice so that a pie stays readable
export function groupSmallSlices(
  points: DashboardDistributionPoint[],
  maxSlices = 7,
): DashboardDistributionPoint[] {
  const sorted = [...points].sort((a, b) => b.count - a.count);

  if (sorted.length <= maxSlices) {
    return sorted;
  }

  const kept = sorted.slice(0, maxSlices - 1);
  const othersCount = sorted.slice(maxSlices - 1).reduce((sum, point) => sum + point.count, 0);

  return [...kept, { label: OTHERS_LABEL, count: othersCount }];
}
