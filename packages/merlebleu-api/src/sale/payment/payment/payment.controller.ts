import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentMethod } from '@merlebleu/shared';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  addPaymentMethod(@Body() body: PaymentMethod) {
    return this.paymentService.addPaymentMethod(body);
  }

  @Get()
  getAllPaymentMethods() {
    return this.paymentService.getAllPaymentMethods();
  }
}
