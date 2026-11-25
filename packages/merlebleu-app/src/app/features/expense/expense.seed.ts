import { ExpenseSection } from './expense.model';

type DayAmounts = Record<number, number>;

export interface SeedCategory {
  label: string;
  section: ExpenseSection;
  /** Amount per day of October 2026, taken from the Excel sheet DEPENSES. */
  days: DayAmounts;
}

const everyDay = (from: number, to: number, amount: number): DayAmounts => {
  const result: DayAmounts = {};
  for (let day = from; day <= to; day++) {
    result[day] = amount;
  }
  return result;
};

const fuelDays: DayAmounts = {
  ...everyDay(1, 29, 20000),
  3: 40000,
  10: 40000,
  18: 40000,
  20: 40000,
  24: 60000,
  25: 40000,
};

export const SEED_CATEGORIES: SeedCategory[] = [
  // Current expenses
  { label: 'Sakafo', section: 'CURRENT', days: everyDay(1, 29, 75000) },
  { label: 'Carburant', section: 'CURRENT', days: fuelDays },
  {
    label: 'Œufs',
    section: 'CURRENT',
    days: { 1: 171800, 5: 240000, 7: 172400, 12: 200000, 15: 160000, 19: 170900, 22: 160000, 28: 171200 },
  },
  { label: 'Fromage', section: 'CURRENT', days: { 1: 8000, 8: 8000, 16: 8000, 17: 4000, 20: 8000, 28: 8000 } },
  {
    label: 'Sardine',
    section: 'CURRENT',
    days: { 1: 5000, 5: 5000, 6: 10000, 7: 5000, 8: 5000, 12: 5000, 16: 5000, 19: 15000, 21: 10000, 22: 5000, 26: 5000 },
  },
  { label: 'Emballage', section: 'CURRENT', days: { 1: 5000, 12: 5000, 27: 5000 } },
  {
    label: 'Mananasy',
    section: 'CURRENT',
    days: { 2: 30000, 5: 15000, 7: 15000, 12: 15000, 14: 30000, 16: 15000, 19: 15000, 22: 15000, 26: 15000, 29: 15000 },
  },
  {
    label: 'Fruits',
    section: 'CURRENT',
    days: { 2: 8000, 4: 7000, 10: 8000, 14: 2000, 17: 2000, 20: 2000, 24: 2000, 25: 5000, 29: 2000 },
  },
  { label: 'Levure chimique', section: 'CURRENT', days: { 5: 5800, 12: 5800, 22: 5800 } },
  { label: 'Blanc de poulet', section: 'CURRENT', days: { 5: 5000, 10: 5000, 12: 5000, 19: 10000, 27: 5000 } },
  { label: 'Ketchup', section: 'CURRENT', days: { 7: 4200, 17: 4200, 22: 4000, 26: 3000 } },
  { label: 'Tomate', section: 'CURRENT', days: { 8: 1800, 16: 1800, 19: 1500, 21: 1800, 24: 1500, 27: 1700 } },
  { label: 'Totokena', section: 'CURRENT', days: { 13: 11000, 17: 5500, 21: 11000, 24: 1800 } },
  { label: 'Beurre', section: 'CURRENT', days: { 13: 7800, 19: 7800, 21: 7800, 28: 7800 } },
  { label: 'Oignon', section: 'CURRENT', days: { 16: 1500, 19: 1500, 21: 1500 } },
  { label: 'Huile (courante)', section: 'CURRENT', days: { 21: 40000 } },
  { label: 'Voanjo', section: 'CURRENT', days: { 22: 1000 } },

  // Stocks and ingredient purchases
  { label: 'Crème', section: 'INGREDIENT', days: { 1: 1080000, 23: 648000 } },
  { label: 'Farine', section: 'INGREDIENT', days: { 1: 153000, 5: 153000 } },
  { label: 'Sucre', section: 'INGREDIENT', days: { 5: 404000 } },
  { label: 'Huile', section: 'INGREDIENT', days: { 5: 116000, 23: 120000 } },
  { label: 'Chocolat', section: 'INGREDIENT', days: { 5: 118000, 23: 120000 } },
  { label: 'Carton', section: 'INGREDIENT', days: { 8: 135000 } },
  { label: 'Fond 22', section: 'INGREDIENT', days: { 8: 45000 } },
  { label: 'Fond 28', section: 'INGREDIENT', days: { 8: 35000 } },
  { label: 'Pêche 2', section: 'INGREDIENT', days: { 8: 30000 } },
  { label: 'Parfum vanille', section: 'INGREDIENT', days: { 8: 12500 } },
  { label: 'Parfum or', section: 'INGREDIENT', days: { 8: 12500 } },
  { label: 'Colorant', section: 'INGREDIENT', days: { 8: 10000 } },
  { label: 'Cacao 2', section: 'INGREDIENT', days: { 8: 145000 } },
  { label: 'Raisins secs', section: 'INGREDIENT', days: { 8: 1000 } },
  { label: 'Lait en poudre', section: 'INGREDIENT', days: { 8: 79200 } },
  { label: 'Margarine 10', section: 'INGREDIENT', days: { 8: 165000 } },
  { label: 'Bougie', section: 'INGREDIENT', days: { 10: 600000 } },
  { label: 'Sirop', section: 'INGREDIENT', days: { 3: 31400 } },
  { label: 'Lait Candia', section: 'INGREDIENT', days: { 2: 68400 } },

  // Other expenses
  { label: 'Transport ingrédients', section: 'OTHER', days: { 5: 4000 } },
  {
    label: 'Cours Tsiory',
    section: 'OTHER',
    days: { 6: 20000, 8: 10000, 10: 25000, 13: 42000, 15: 10000, 16: 22000, 20: 42000, 23: 22000, 27: 44000, 29: 12000 },
  },
  { label: 'Vidange Polo', section: 'OTHER', days: { 6: 400000 } },
  { label: 'Décor Nepa', section: 'OTHER', days: { 7: 465000 } },
  { label: 'Sonde à four', section: 'OTHER', days: { 13: 4000 } },
  { label: 'Zina', section: 'OTHER', days: { 21: 50000 } },
];

export interface SeedFixedExpense {
  type: 'SALARY' | 'CHARGE';
  label: string;
  detail: string;
  amount: number;
  paymentMethod: 'Espèces' | 'Mvola';
  paid: boolean;
}

export const SEED_FIXED_EXPENSES: SeedFixedExpense[] = [
  { type: 'SALARY', label: 'Nosy', detail: 'Commercial', amount: 600000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Rojo', detail: 'Aide', amount: 160000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Donga', detail: 'Transport', amount: 200000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Thierry', detail: 'Aide', amount: 280000, paymentMethod: 'Espèces', paid: false },
  { type: 'SALARY', label: 'Mamy', detail: 'Sandwich, carton', amount: 150000, paymentMethod: 'Espèces', paid: false },
  { type: 'SALARY', label: 'John', detail: 'Fond', amount: 40000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Zina', detail: 'Ménage', amount: 50000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Fitia', detail: 'Bénévole', amount: 30000, paymentMethod: 'Espèces', paid: true },
  { type: 'SALARY', label: 'Tsiory', detail: 'Bénévole', amount: 30000, paymentMethod: 'Espèces', paid: true },
  { type: 'CHARGE', label: 'Jirama', detail: 'Anosy', amount: 100000, paymentMethod: 'Espèces', paid: true },
  { type: 'CHARGE', label: 'Jirama', detail: 'Imer', amount: 232000, paymentMethod: 'Mvola', paid: true },
  { type: 'CHARGE', label: 'Loyer', detail: '', amount: 400000, paymentMethod: 'Espèces', paid: true },
];
