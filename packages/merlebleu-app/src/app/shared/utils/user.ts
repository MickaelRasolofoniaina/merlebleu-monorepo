import { Shop } from '@merlebleu/shared';

export function getUserShopId(): string {
  try {
    const raw = localStorage.getItem('user_shop');
    if (!raw) return '';
    const shop: Shop = JSON.parse(raw);
    return shop?.id ?? '';
  } catch {
    return '';
  }
}
