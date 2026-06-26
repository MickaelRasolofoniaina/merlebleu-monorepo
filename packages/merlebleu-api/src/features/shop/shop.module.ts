import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopSchema } from './shop.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ShopSchema])],
  providers: [ShopService],
  controllers: [ShopController],
})
export class ShopModule {}
