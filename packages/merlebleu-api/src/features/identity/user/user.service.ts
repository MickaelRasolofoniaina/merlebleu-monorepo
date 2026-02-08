import { BadRequestException, Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UserEntity, UserSchema } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto, UpdateUserDto, UserDto } from '@merlebleu/shared';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserSchema)
    private userRepository: Repository<UserEntity>,
  ) {}

  // find user by email
  findUserByEmail(email: string) {
    // implementation here
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(createUserDto: CreateUserDto) {
    try {
      const hashedPassword = await this.hashPassword(createUserDto.password);
      const user = this.userRepository.create({
        name: createUserDto.name,
        email: createUserDto.email,
        password: hashedPassword,
      });
      const userCreated = await this.userRepository.save(user);

      const userDto: UserDto = {
        id: userCreated.id,
        name: userCreated.name,
        email: userCreated.email,
      };

      return userDto;
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException('Email already exists');
      }

      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: UpdateUserDto) {
    const nextUpdates = { ...updates };

    if (updates.password) {
      nextUpdates.password = await this.hashPassword(updates.password);
    }

    // Not very optimized but this is not frequent operation
    await this.userRepository.update({ id }, nextUpdates);
    return this.userRepository.findOne({ where: { id } });
  }

  deleteUser(id: string) {
    return this.userRepository.delete({ id });
  }

  public async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 10);
  }

  async getAllUsers(): Promise<UserDto[]> {
    const users = await this.userRepository.find();
    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
    }));
  }
}
