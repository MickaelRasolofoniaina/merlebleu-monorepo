import { OTHERS_LABEL, groupSmallSlices } from './dashboard-chart.utils';

describe('groupSmallSlices', () => {
  it('sorts the slices by descending count when there is no need to group', () => {
    const result = groupSmallSlices([
      { label: 'Rond', count: 2 },
      { label: 'Coeur', count: 5 },
    ]);

    expect(result.map((slice) => slice.label)).toEqual(['Coeur', 'Rond']);
  });

  it('sums the smallest slices in an "Autres" slice above the limit', () => {
    const points = Array.from({ length: 10 }, (_, index) => ({
      label: `Type ${index}`,
      count: 10 - index,
    }));

    const result = groupSmallSlices(points, 4);

    expect(result.length).toBe(4);
    expect(result[3]).toEqual({ label: OTHERS_LABEL, count: 7 + 6 + 5 + 4 + 3 + 2 + 1 });
  });

  it('does not change the total count', () => {
    const points = [
      { label: 'A', count: 4 },
      { label: 'B', count: 3 },
      { label: 'C', count: 2 },
      { label: 'D', count: 1 },
    ];

    const total = groupSmallSlices(points, 2).reduce((sum, slice) => sum + slice.count, 0);

    expect(total).toBe(10);
  });
});
