import { UserRole } from '@merlebleu/shared';

export const USER_ROLES: { label: string; value: UserRole }[] = [
  { label: 'Administrateur', value: UserRole.ADMIN },
  { label: 'Caissier', value: UserRole.CASHIER },
  { label: 'Pâtissier', value: UserRole.PASTRY_CHEF },
];

export function getUserRoleLabel(role?: UserRole): string {
  return USER_ROLES.find((r) => r.value === role)?.label ?? '—';
}
