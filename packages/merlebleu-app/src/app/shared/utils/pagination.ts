export const getPageFromFirstRows = (first: number, rows: number): number => {
  if (rows <= 0) {
    return 1;
  }

  return Math.floor(first / rows) + 1;
};
