import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Not, Repository } from 'typeorm';
import { UserEntity, UserSchema } from './user.entity';
import { ShopEntity } from '../../shop/shop.entity';
import { InjectRepository } from '@nestjs/typeorm';
import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
  UserDto,
  UserRole,
} from '@merlebleu/shared';

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
      role: user.role,
      shop: user.shop ?? undefined,
      defaultOrderDisplayMode: user.defaultOrderDisplayMode ?? undefined,
    };
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
        role: createUserDto.role,
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

  async updateUser(id: string, updates: UpdateUserDto, actingUserId?: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: { shop: true },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (
      user.role === UserRole.ADMIN &&
      updates.role !== undefined &&
      updates.role !== UserRole.ADMIN
    ) {
      if (id === actingUserId) {
        throw new BadRequestException(
          'Vous ne pouvez pas retirer votre propre rôle administrateur.',
        );
      }
      await this.assertAnotherAdminExists(id);
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

  async deleteUser(id: string, actingUserId?: string) {
    if (id === actingUserId) {
      throw new BadRequestException(
        'Vous ne pouvez pas supprimer votre propre compte.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (user?.role === UserRole.ADMIN) {
      await this.assertAnotherAdminExists(id);
    }

    return this.userRepository.delete({ id });
  }

  private async assertAnotherAdminExists(excludedId: string): Promise<void> {
    const otherAdmins = await this.userRepository.count({
      where: { role: UserRole.ADMIN, id: Not(excludedId) },
    });
    if (otherAdmins === 0) {
      throw new BadRequestException(
        'Il doit rester au moins un administrateur.',
      );
    }
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
      role: user.role,
      shop: user.shop ?? undefined,
      defaultOrderDisplayMode: user.defaultOrderDisplayMode ?? undefined,
    }));
  }

  async updateUserPreferences(
    id: string,
    updates: UpdateUserPreferencesDto,
  ): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    Object.assign(user, updates);

    await this.userRepository.save(user);

    return this.findUserById(id);
  }

  async updateProfile(id: string, updates: UpdateProfileDto): Promise<UserDto> {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    if (updates.newPassword) {
      const bcrypt = await import('bcrypt');
      const isCurrentPasswordValid = await bcrypt.compare(
        updates.currentPassword ?? '',
        user.password,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Le mot de passe actuel est incorrect.');
      }

      user.password = await this.hashPassword(updates.newPassword);
    }

    user.name = updates.name;

    await this.userRepository.save(user);

    return this.findUserById(id);
  }
}
