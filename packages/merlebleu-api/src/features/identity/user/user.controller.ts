import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './user.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  createUser(
    @Body()
    body: CreateUserDto,
  ) {
    return this.userService.createUser(body);
  }

  @Patch(':id')
  updateUser(
    @Param('id') id: string,
    @Body()
    body: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
