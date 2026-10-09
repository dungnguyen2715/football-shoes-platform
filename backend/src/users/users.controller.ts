import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import {
  AddressDto,
  UpdateAddressDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/update-profile.dto';
import { UsersService } from './users.service';

@Controller('users/me')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}
  @Get() async getSelf(
    @CurrentUser() actor: { id: string },
  ): Promise<{ user: Record<string, unknown> }> {
    return { user: await this.users.getSelf(actor.id) };
  }
  @Patch() async update(
    @CurrentUser() actor: { id: string },
    @Body() body: UpdateProfileDto,
  ): Promise<{ user: Record<string, unknown> }> {
    return { user: await this.users.updateProfile(actor.id, body) };
  }
  @Patch('preferences') async preferences(
    @CurrentUser() actor: { id: string },
    @Body() body: UpdatePreferencesDto,
  ): Promise<{ preferences: unknown }> {
    return { preferences: await this.users.updatePreferences(actor.id, body) };
  }
  @Get('addresses') async listAddresses(
    @CurrentUser() actor: { id: string },
  ): Promise<{ items: unknown[] }> {
    return { items: await this.users.addresses(actor.id) };
  }
  @Post('addresses') async addAddress(
    @CurrentUser() actor: { id: string },
    @Body() body: AddressDto,
  ): Promise<{ address: unknown }> {
    return { address: await this.users.addAddress(actor.id, body) };
  }
  @Patch('addresses/:addressId') async updateAddress(
    @CurrentUser() actor: { id: string },
    @Param('addressId') id: string,
    @Body() body: UpdateAddressDto,
  ): Promise<{ address: unknown }> {
    return { address: await this.users.updateAddress(actor.id, id, body) };
  }
  @Delete('addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(
    @CurrentUser() actor: { id: string },
    @Param('addressId') id: string,
  ): Promise<void> {
    await this.users.deleteAddress(actor.id, id);
  }
}
