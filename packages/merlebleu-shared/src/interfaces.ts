// Define your shared interfaces here
export interface IEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUser extends IEntity {
  email: string;
  name: string;
}
