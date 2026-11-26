import { MovementType } from '@merlebleu/shared';
import { formatDate } from '@shared/utils/date';

export type TagSeverity = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

const MOVEMENT_TYPES: Record<MovementType, { label: string; severity: TagSeverity }> = {
  [MovementType.OPENING]: { label: 'Solde initial', severity: 'secondary' },
  [MovementType.DEPOSIT]: { label: 'Acompte', severity: 'success' },
  [MovementType.BALANCE]: { label: 'Solde commande', severity: 'success' },
  [MovementType.EXPENSE]: { label: 'Dépense', severity: 'danger' },
  [MovementType.FIXED_EXPENSE]: { label: 'Dépense fixe', severity: 'danger' },
  [MovementType.REFUND]: { label: 'Remboursement', severity: 'warn' },
  [MovementType.TRANSFER_IN]: { label: 'Virement', severity: 'info' },
  [MovementType.TRANSFER_OUT]: { label: 'Virement', severity: 'info' },
  [MovementType.ADJUSTMENT]: { label: 'Ajustement', severity: 'secondary' },
};

export const getMovementTypeLabel = (type: MovementType): string => MOVEMENT_TYPES[type].label;

export const getMovementTypeSeverity = (type: MovementType): TagSeverity =>
  MOVEMENT_TYPES[type].severity;

/** Types offered in the movement filter: both transfer directions share one entry. */
export const MOVEMENT_TYPE_OPTIONS: { label: string; value: MovementType | null }[] = [
  { label: 'Tous les types', value: null },
  { label: 'Acompte', value: MovementType.DEPOSIT },
  { label: 'Solde commande', value: MovementType.BALANCE },
  { label: 'Dépense', value: MovementType.EXPENSE },
  { label: 'Dépense fixe', value: MovementType.FIXED_EXPENSE },
  { label: 'Remboursement', value: MovementType.REFUND },
  { label: 'Virement reçu', value: MovementType.TRANSFER_IN },
  { label: 'Virement émis', value: MovementType.TRANSFER_OUT },
  { label: 'Solde initial', value: MovementType.OPENING },
  { label: 'Ajustement', value: MovementType.ADJUSTMENT },
];

/** 2026-11-26 -> 26/11/2026 */
export const formatDay = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/** 2026-11-26 -> a local Date (a plain `new Date('2026-11-26')` would be read as UTC). */
export const parseDay = (isoDate: string): Date => {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/** Last day of the month before the one containing `now`, as YYYY-MM-DD. */
export const lastDayOfPreviousMonth = (now: Date): string =>
  formatDate(new Date(now.getFullYear(), now.getMonth(), 0));

/** "octobre 2026" for the month before the one containing `now`. */
export const previousMonthLabel = (now: Date): string =>
  new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

/** The previous month is not closed yet: nothing was closed, or the latest closing is older than its last day. */
export const isClosingDue = (lastClosingDate: string | null, now: Date): boolean =>
  lastClosingDate === null || lastClosingDate < lastDayOfPreviousMonth(now);

export const formatSigned = (amount: number, format: (value: number) => string): string =>
  `${amount < 0 ? '−' : '+'} ${format(Math.abs(amount))}`;

/** Palette used by the receipts chart: positive in blue, negative (refund) in red. */
export const RECEIPT_COLORS = { positive: '#3b82f6', negative: '#ef4444' } as const;
