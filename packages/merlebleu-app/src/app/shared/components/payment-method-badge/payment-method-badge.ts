import { Component, computed, input } from '@angular/core';
import { DEFAULT_PAYMENT_METHOD_COLOR } from '@merlebleu/shared';

// picks black or white text depending on the perceived brightness of the background
const getReadableTextColor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111827' : '#ffffff';
};

@Component({
  selector: 'payment-method-badge',
  templateUrl: './payment-method-badge.html',
  host: { class: 'inline-block' },
})
export class PaymentMethodBadge {
  name = input.required<string>();
  color = input<string | null | undefined>();

  protected readonly backgroundColor = computed(() => {
    const color = this.color();
    return color && /^#[0-9a-fA-F]{6}$/.test(color) ? color : DEFAULT_PAYMENT_METHOD_COLOR;
  });
  protected readonly textColor = computed(() => getReadableTextColor(this.backgroundColor()));
}
