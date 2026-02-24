
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { ItemEntity } from './item.entity';
import { CreateItemDto, UpdateItemDto } from '@merlebleu/shared/src/domain/inventory/item/item.dto';
import { getPaginationParams } from '@shared/pagination/pagination.utils';
import { ResultPaged } from '@merlebleu/shared';

@Injectable()
export class ItemService {
	constructor(
		@InjectRepository(ItemEntity)
		private readonly itemRepository: Repository<ItemEntity>,
	) {}

	async addItem(dto: CreateItemDto): Promise<ItemEntity> {
		const item = this.itemRepository.create(dto);
		return this.itemRepository.save(item);
	}

	async updateItem(id: string, dto: UpdateItemDto): Promise<ItemEntity | null> {
		await this.itemRepository.update(id, dto);
		return this.itemRepository.findOneBy({ id });
	}

	async deleteItem(id: string): Promise<void> {
		const result = await this.itemRepository.delete(id);
		if(!result.affected) {
      throw new NotFoundException(`Item with id ${id} not found`);
    }
	}

	async findItems(
		page = 1,
		limit = 20,
    filters?: {
		  labelContains?: string,
    }
	): Promise<ResultPaged<ItemEntity>> {
    const pagination = getPaginationParams({ page, limit });
    
		const where = filters?.labelContains
			? { label: ILike(`%${filters.labelContains}%`) }
			: {};
		const [items, total] = await this.itemRepository.findAndCount({
			where,
			skip: pagination.skip,
			take: pagination.limit,
			order: { label: 'ASC' },
		});
		return {
			data: items,
			total,
			page,
			limit,
		};
	}
}
