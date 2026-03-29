export const formatUnitPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace(/[\u202f\u00a0]/g, ' ');
};
