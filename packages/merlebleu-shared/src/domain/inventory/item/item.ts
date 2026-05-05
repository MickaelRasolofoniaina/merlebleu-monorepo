export enum ItemType {
  PASTRY = "VIENNOISERIE",
  CAKE = "PATISSERIE",
  DRINK = "BOISSON",
}

export interface Item {
  id: string;
  label: string;
  unitPrice: number;
  type: ItemType;
  maxRetentionDays: number;
}
