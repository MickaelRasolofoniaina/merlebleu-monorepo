export const formatUnitPrice = (price: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  })
    .format(price)
    .replace(/[\u202f\u00a0]/g, ' ');
};

/** Formats a stock quantity the French way (non-breaking spaces turned into plain ones), up to 2 decimals. */
export const formatQuantity = (quantity: number): string => {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 })
    .format(quantity)
    .replace(/[  ]/g, ' ');
};
