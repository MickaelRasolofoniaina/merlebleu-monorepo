import { Injectable } from '@nestjs/common';
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
    const hashedPassword = await this.hashPassword(createUserDto.password);
    const user = this.userRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async updateUser(id: string, updates: UpdateUserDto) {
    const nextUpdates = { ...updates };

    if (updates.password) {
      nextUpdates.password = await this.hashPassword(updates.password);
    }

    await this.userRepository.update({ id }, nextUpdates);
    return this.userRepository.findOne({ where: { id } });
  }

  deleteUser(id: string) {
    return this.userRepository.delete({ id });
  }

  private async hashPassword(password: string): Promise<string> {
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
