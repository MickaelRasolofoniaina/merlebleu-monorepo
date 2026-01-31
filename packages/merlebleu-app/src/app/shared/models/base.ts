export interface BaseModel {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string;
  updatedBy?: string;
}

export interface BelongsToShop extends BaseModel {
  shopId: string;
}
