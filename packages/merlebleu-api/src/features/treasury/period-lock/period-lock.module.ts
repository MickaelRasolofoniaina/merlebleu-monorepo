import { Module } from '@nestjs/common';
import { PeriodLockService } from './period-lock.service';

@Module({
  providers: [PeriodLockService],
  exports: [PeriodLockService],
})
export class PeriodLockModule {}
