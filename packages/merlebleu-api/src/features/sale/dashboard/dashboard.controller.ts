import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dashboard.dto';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('orders-count')
  getOrdersCount(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOrdersCount(query);
  }

  @Get('orders-by-type')
  getOrdersByType(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOrdersByType(query);
  }

  @Get('orders-by-shape')
  getOrdersByShape(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOrdersByShape(query);
  }

  @Get('orders-amount')
  getOrdersAmount(@Query() query: DashboardQueryDto) {
    return this.dashboardService.getOrdersAmount(query);
  }
}
