export const capitalizeFirstLetter = (value: string): string => {
  if (!value) {
    return '';
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
};

/** Adds a plural "s" to an entry unit label ("sac" -> "sacs") when the quantity is greater than 1. */
export const pluralizeUnit = (label: string, quantity: number): string => {
  return quantity > 1 && !label.endsWith('s') ? `${label}s` : label;
};
