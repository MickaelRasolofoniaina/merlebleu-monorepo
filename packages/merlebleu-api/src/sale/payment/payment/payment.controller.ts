import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
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

  @Put(':id')
  updatePaymentMethod(@Param('id') id: string, @Body() body: PaymentMethod) {
    return this.paymentService.updatePaymentMethod(id, body);
  }

  @Delete(':id')
  deletePaymentMethod(@Param('id') id: string) {
    return this.paymentService.deletePaymentMethod(id);
  }
}
