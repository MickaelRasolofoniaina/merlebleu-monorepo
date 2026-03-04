export enum ItemType {
  PASTRY = "pastry",
  CAKE = "cake",
  DRINK = "drink",
}

export interface Item {
  id: string;
  label: string;
  unitPrice: number;
  type: ItemType;
  maxRetentionDays: number;
}
