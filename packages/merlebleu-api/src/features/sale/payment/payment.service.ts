import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentMethodEntity } from './payment.entity';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
} from '@merlebleu/shared';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(PaymentMethodEntity)
    private paymentMethodRepository: Repository<PaymentMethodEntity>,
  ) {}

  async addPaymentMethod(
    paymentMethod: CreatePaymentMethodDto,
  ): Promise<PaymentMethodEntity> {
    const paymentMethodEntity = this.paymentMethodRepository.create({
      name: paymentMethod.name,
    });
    return this.paymentMethodRepository.save(paymentMethodEntity);
  }

  async getAllPaymentMethods(): Promise<PaymentMethodEntity[]> {
    return this.paymentMethodRepository.find({ order: { name: 'ASC' } });
  }

  async updatePaymentMethod(
    id: string,
    paymentMethod: UpdatePaymentMethodDto,
  ): Promise<PaymentMethodEntity> {
    const existingPaymentMethod = await this.paymentMethodRepository.findOneBy({
      id,
    });

    if (!existingPaymentMethod) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }

    Object.assign(existingPaymentMethod, paymentMethod);

    return this.paymentMethodRepository.save(existingPaymentMethod);
  }

  async deletePaymentMethod(id: string): Promise<void> {
    const deleteResult = await this.paymentMethodRepository.delete(id);

    if (!deleteResult.affected) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }
  }
}
