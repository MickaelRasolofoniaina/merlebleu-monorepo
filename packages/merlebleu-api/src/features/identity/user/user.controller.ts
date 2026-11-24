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
import {
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
  UpdateUserPreferencesDto,
} from './user.dto';
import { CurrentUser } from '@shared/auth/current-user.decorator';
import type { CurrentUserPayload } from '@shared/auth/current-user.decorator';
import { Roles } from '@shared/auth/roles';
import { UserRole } from '@merlebleu/shared';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post()
  @Roles(UserRole.ADMIN)
  createUser(
    @Body()
    body: CreateUserDto,
  ) {
    return this.userService.createUser(body);
  }

  @Get('me')
  getMe(@CurrentUser() currentUser: CurrentUserPayload) {
    return this.userService.findUserById(currentUser.sub);
  }

  @Patch('me')
  updateMe(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() body: UpdateUserPreferencesDto,
  ) {
    return this.userService.updateUserPreferences(currentUser.sub, body);
  }

  @Patch('me/profile')
  updateMyProfile(
    @CurrentUser() currentUser: CurrentUserPayload,
    @Body() body: UpdateProfileDto,
  ) {
    return this.userService.updateProfile(currentUser.sub, body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  updateUser(
    @Param('id') id: string,
    @Body()
    body: UpdateUserDto,
  ) {
    return this.userService.updateUser(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  deleteUser(@Param('id') id: string) {
    return this.userService.deleteUser(id);
  }

  @Get()
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
