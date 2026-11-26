import { Roles } from '@shared/auth/roles';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user.decorator';
import { UserRole } from '@merlebleu/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { TreasuryService } from './treasury.service';
import {
  ClosingPreviewQueryDto,
  CreateCashCountDto,
  CreateClosingDto,
  CreateRefundDto,
  CreateTransferDto,
  ExportMovementsQueryDto,
  ListMovementsQueryDto,
  ReceiptQueryDto,
  UpdateWalletDto,
} from './treasury.dto';

// Every authenticated role can read the treasury, only admins can change it.
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('wallets')
  getWallets() {
    return this.treasuryService.getWallets();
  }

  @Roles(UserRole.ADMIN)
  @Put('wallets/:id')
  @HttpCode(204)
  updateWallet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWalletDto,
  ) {
    return this.treasuryService.updateWallet(id, dto);
  }

  @Get('movements')
  listMovements(@Query() query: ListMovementsQueryDto) {
    return this.treasuryService.listMovements(query);
  }

  @Get('movements/export')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="mouvements.csv"')
  exportMovements(@Query() query: ExportMovementsQueryDto) {
    return this.treasuryService.exportMovementsCsv(query);
  }

  @Get('receipts')
  getReceipts(@Query() query: ReceiptQueryDto) {
    return this.treasuryService.getReceipts(query);
  }

  @Roles(UserRole.ADMIN)
  @Post('transfers')
  @HttpCode(204)
  createTransfer(@Body() dto: CreateTransferDto) {
    return this.treasuryService.createTransfer(dto);
  }

  @Roles(UserRole.ADMIN)
  @Post('refunds')
  @HttpCode(204)
  createRefund(@Body() dto: CreateRefundDto) {
    return this.treasuryService.createRefund(dto);
  }

  @Get('cash-counts')
  listCashCounts(@Query('walletId', ParseUUIDPipe) walletId: string) {
    return this.treasuryService.listCashCounts(walletId);
  }

  @Get('closings')
  listClosings() {
    return this.treasuryService.listClosings();
  }

  @Roles(UserRole.ADMIN)
  @Get('closings/preview')
  previewClosing(@Query() query: ClosingPreviewQueryDto) {
    return this.treasuryService.previewClosing(query.date);
  }

  @Roles(UserRole.ADMIN)
  @Post('closings')
  createClosing(
    @Body() dto: CreateClosingDto,
    @CurrentUser() currentUser: CurrentUserPayload,
  ) {
    return this.treasuryService.createClosing(dto, currentUser.name);
  }

  // only the latest closing can be reopened
  @Roles(UserRole.ADMIN)
  @Delete('closings/last')
  @HttpCode(204)
  reopenLastClosing() {
    return this.treasuryService.reopenLastClosing();
  }

  @Roles(UserRole.ADMIN)
  @Post('cash-counts')
  createCashCount(@Body() dto: CreateCashCountDto) {
    return this.treasuryService.createCashCount(dto);
  }
}
