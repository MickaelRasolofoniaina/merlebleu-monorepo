import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Roles } from '@shared/auth/roles';
import { UserRole } from '@merlebleu/shared';
import { PaymentService } from './payment.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './payment.dto';

@Controller('payment')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Roles(UserRole.ADMIN)
  @Post()
  addPaymentMethod(@Body() body: CreatePaymentMethodDto) {
    return this.paymentService.addPaymentMethod(body);
  }

  @Get()
  getAllPaymentMethods() {
    return this.paymentService.getAllPaymentMethods();
  }

  @Roles(UserRole.ADMIN)
  @Put(':id')
  updatePaymentMethod(
    @Param('id') id: string,
    @Body() body: UpdatePaymentMethodDto,
  ) {
    return this.paymentService.updatePaymentMethod(id, body);
  }

  @Roles(UserRole.ADMIN)
  @Delete(':id')
  deletePaymentMethod(@Param('id') id: string) {
    return this.paymentService.deletePaymentMethod(id);
  }
}
