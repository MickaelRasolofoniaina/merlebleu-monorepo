import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethod } from '@merlebleu/shared';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentMethod)
    private paymentMethodRepository: Repository<PaymentMethod>,
  ) {}

  async addPaymentMethod(paymentMethod: PaymentMethod): Promise<PaymentMethod> {
    const paymentMethodEntity =
      this.paymentMethodRepository.create(paymentMethod);
    return this.paymentMethodRepository.save(paymentMethodEntity);
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find();
  }
}
