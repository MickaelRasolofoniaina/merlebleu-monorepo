import { Module } from '@nestjs/common';
import { ItemService } from './item.service';
import { ItemController } from './item.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemSchema } from './item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ItemSchema])],
  providers: [ItemService],
  controllers: [ItemController],
})
export class ItemModule {}
