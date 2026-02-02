import { BaseEntity } from "../shared/base";

export class PaymentMethod extends BaseEntity {
  name: string;

  constructor(id: string, name: string) {
    super(id);
    this.name = name;
  }
}
