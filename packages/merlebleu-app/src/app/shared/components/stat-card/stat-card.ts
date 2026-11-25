import { Component, computed, input } from '@angular/core';

export type OrderCountCardColor = 'red' | 'green' | 'orange' | 'blue';

// Tailwind only generates classes it can read as whole strings, so each color is spelled out
const COLOR_CLASSES: Record<OrderCountCardColor, { container: string; text: string }> = {
  red: {
    container: 'bg-red-500/10 dark:bg-red-400/10 border-red-500/30 dark:border-red-400/30',
    text: 'text-red-600 dark:text-red-400',
  },
  green: {
    container: 'bg-green-500/10 dark:bg-green-400/10 border-green-500/30 dark:border-green-400/30',
    text: 'text-green-600 dark:text-green-400',
  },
  blue: {
    container: 'bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/30 dark:border-blue-400/30',
    text: 'text-blue-600 dark:text-blue-400',
  },
  orange: {
    container:
      'bg-orange-500/10 dark:bg-orange-400/10 border-orange-500/30 dark:border-orange-400/30',
    text: 'text-orange-600 dark:text-orange-400',
  },
};

@Component({
  selector: 'order-count-card',
  templateUrl: './order-count-card.html',
  host: { class: 'inline-block' },
})
export class OrderCountCard {
  color = input.required<OrderCountCardColor>();
  icon = input.required<string>();
  count = input<number>(0);
  label = input.required<string>();
  // replaces the count with a preformatted value (an amount for example); the label is then shown as is
  valueText = input<string>();

  protected readonly classes = computed(() => COLOR_CLASSES[this.color()]);
}
