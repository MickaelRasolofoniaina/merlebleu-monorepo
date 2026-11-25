import { Roles } from '@shared/auth/roles';
import { UserRole } from '@merlebleu/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ExpenseService } from './expense.service';
import {
  CopyFixedExpensesDto,
  CreateFixedExpenseDto,
  ListExpensesQueryDto,
  SetExpenseCellDto,
  SetExpensePaidDto,
  UpdateFixedExpenseDto,
} from './expense.dto';

@Roles(UserRole.ADMIN, UserRole.PASTRY_CHEF)
@Controller('expense')
export class ExpenseController {
  constructor(private readonly expenseService: ExpenseService) {}

  @Get()
  findByMonth(@Query() query: ListExpensesQueryDto) {
    return this.expenseService.findByMonth(query);
  }

  @Put('cell')
  setCell(@Body() dto: SetExpenseCellDto) {
    return this.expenseService.setCell(dto);
  }

  @Post('fixed')
  addFixed(@Body() dto: CreateFixedExpenseDto) {
    return this.expenseService.addFixed(dto);
  }

  @Post('fixed/copy-previous-month')
  copyFixedFromPreviousMonth(@Body() dto: CopyFixedExpensesDto) {
    return this.expenseService.copyFixedFromPreviousMonth(dto);
  }

  @Put('fixed/:id')
  updateFixed(@Param('id') id: string, @Body() dto: UpdateFixedExpenseDto) {
    return this.expenseService.updateFixed(id, dto);
  }

  @Patch('fixed/:id/paid')
  setPaid(@Param('id') id: string, @Body() dto: SetExpensePaidDto) {
    return this.expenseService.setPaid(id, dto.paid);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.expenseService.delete(id);
  }
}
