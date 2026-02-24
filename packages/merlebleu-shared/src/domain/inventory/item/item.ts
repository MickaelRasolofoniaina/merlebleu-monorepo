export enum ItemType {
  PASTRY = "pastry",
  CAKE = "cake",
  DRINK = "drink",
}

export interface Item {
  label: string;
  unitPrice: number;
  type: ItemType;
  maxRetentionDays: number;
}
