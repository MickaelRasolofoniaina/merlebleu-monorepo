import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity, UserSchema } from './user.entity';
import { ShopEntity } from '../../shop/shop.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from '@merlebleu/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserSchema)
    private userRepository: Repository<UserEntity>,
  ) {}

  findUserByEmail(email: string) {
    return this.userRepository.findOne({ where: { email }, relations: { shop: true } });
  }

  async findUserById(id: string): Promise<UserDto> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { shop: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      shop: user.shop ?? undefined,
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      });

      if (createUserDto.shopId) {
        user.shop = { id: createUserDto.shopId } as ShopEntity;
      }

      const userCreated = await this.userRepository.save(user);

      return this.findUserById(userCreated.id);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(
          'Un utilisateur avec cet e-mail existe déjà.',
        );
      }

      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { shop: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    const { shopId, ...userUpdates } = updates;

    if (userUpdates.password) {
      userUpdates.password = await this.hashPassword(userUpdates.password);
    }

    Object.assign(user, userUpdates);

    if (shopId !== undefined) {
      // null clears the FK in DB; cast needed because interface type disallows null
      user.shop = shopId ? ({ id: shopId } as ShopEntity) : (null as unknown as undefined);
    }

    await this.userRepository.save(user);

    return this.userRepository.findOne({ where: { id }, relations: { shop: true } });
  }

  deleteUser(id: string) {
    return this.userRepository.delete({ id });
  }

  public async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
  }

  async getAllUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.find({
      order: { name: 'ASC' },
      relations: { shop: true },
    });
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      shop: user.shop ?? undefined,
    }));
  }
}
