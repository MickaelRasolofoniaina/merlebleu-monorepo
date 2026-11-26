import { MovementType } from '@merlebleu/shared';

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
];

/** 2026-11-26 -> 26/11/2026 */
export const formatDay = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const formatSigned = (amount: number, format: (value: number) => string): string =>
  `${amount < 0 ? '−' : '+'} ${format(Math.abs(amount))}`;

/** Palette used by the receipts chart: positive in blue, negative (refund) in red. */
export const RECEIPT_COLORS = { positive: '#3b82f6', negative: '#ef4444' } as const;
