import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, QueryFailedError, Repository } from 'typeorm';
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
      color: paymentMethod.color,
    });
    return this.paymentMethodRepository.save(paymentMethodEntity);
  }

  async getAllPaymentMethods(): Promise<PaymentMethodEntity[]> {
    // archived wallets stay out of the pickers, their history remains in the treasury
    return this.paymentMethodRepository.find({
      where: { archived: false },
      order: { name: 'ASC' },
    });
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
    let deleteResult: DeleteResult;
    try {
      deleteResult = await this.paymentMethodRepository.delete(id);
    } catch (error) {
      // 23503 = foreign key violation: the wallet is used by orders, expenses or transfers
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string })?.code === '23503'
      ) {
        throw new ConflictException(
          'Ce portefeuille a des mouvements : archivez-le au lieu de le supprimer.',
        );
      }
      throw error;
    }

    if (!deleteResult.affected) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }
  }

  async getPaymentMethod(id: string): Promise<PaymentMethodEntity> {
    const paymentMethod = await this.paymentMethodRepository.findOneBy({ id });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with id ${id} not found`);
    }

    return paymentMethod;
  }
}
