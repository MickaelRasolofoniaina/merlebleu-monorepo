import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ShopEntity, ShopSchema } from './shop.entity';
import { CreateShopDto, UpdateShopDto } from './shop.dto';

@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(ShopSchema)
    private readonly shopRepository: Repository<ShopEntity>,
  ) {}

  async findAll(): Promise<ShopEntity[]> {
    return this.shopRepository.find({ order: { address: 'ASC' } });
  }

  async findOne(id: string): Promise<ShopEntity> {
    const shop = await this.shopRepository.findOneBy({ id });
    if (!shop) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }
    return shop;
  }

  async create(dto: CreateShopDto): Promise<ShopEntity> {
    const shop = this.shopRepository.create(dto);
    return this.shopRepository.save(shop);
  }

  async update(id: string, dto: UpdateShopDto): Promise<ShopEntity> {
    await this.findOne(id);
    await this.shopRepository.update(id, dto);
    return this.shopRepository.findOneBy({ id }) as Promise<ShopEntity>;
  }

  async delete(id: string): Promise<void> {
    const result = await this.shopRepository.delete(id);
    if (!result.affected) {
      throw new NotFoundException(`Shop with id ${id} not found`);
    }
  }
}
