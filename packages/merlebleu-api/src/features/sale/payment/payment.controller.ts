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
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post()
  addPaymentMethod(@Body() body: CreatePaymentMethodDto) {
    return this.paymentService.addPaymentMethod(body);
  }

  @Get()
  getAllPaymentMethods() {
    return this.paymentService.getAllPaymentMethods();
  }

  @Put(':id')
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() body: UpdatePaymentMethodDto,
  ) {
    return this.paymentService.updatePaymentMethod(id, body);
  }

  @Delete(':id')
  deletePaymentMethod(@Param('id') id: string) {
    return this.paymentService.deletePaymentMethod(id);
  }
}
