import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockEntrySchema } from './stock-entry.entity';
import { IngredientSchema } from '../ingredient.entity';
import { StockEntryService } from './stock-entry.service';
import { StockEntryController } from './stock-entry.controller';

@Module({
  imports: [TypeOrmModule.forFeature([StockEntrySchema, IngredientSchema])],
  providers: [StockEntryService],
  controllers: [StockEntryController],
})
export class StockEntryModule {}
