import { Injectable, NotFoundException } from '@nestjs/common';
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
    const paymentMethodEntity = this.paymentMethodRepository.create({
      name: paymentMethod.name,
    });
    return this.paymentMethodRepository.save(paymentMethodEntity);
  }

  async getAllPaymentMethods(): Promise<PaymentMethod[]> {
    return this.paymentMethodRepository.find();
  }

  async updatePaymentMethod(
    id: string,
    paymentMethod: PaymentMethod,
  ): Promise<PaymentMethod> {
    const existingPaymentMethod = await this.paymentMethodRepository.findOneBy({
      id,
    });

    if (!existingPaymentMethod) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }

    existingPaymentMethod.name = paymentMethod.name;

    return this.paymentMethodRepository.save(existingPaymentMethod);
  }

  async deletePaymentMethod(id: string): Promise<void> {
    const deleteResult = await this.paymentMethodRepository.delete(id);

    if (!deleteResult.affected) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }
  }
}
