import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { SettingsPatchDto } from './settings.dto';
import { SettingsService } from './settings.service';

@Controller('store/settings')
export class PublicSettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get() get(): Promise<Record<string, unknown>> {
    return this.settings.publicSettings();
  }
}

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminSettingsController {
  constructor(private readonly settings: SettingsService) {}
  @Get() async get(): Promise<{ settings: unknown }> {
    return { settings: await this.settings.adminSettings() };
  }
  @Patch() async update(
    @CurrentUser() actor: { id: string },
    @Body() body: SettingsPatchDto,
  ): Promise<{ settings: unknown }> {
    return { settings: await this.settings.update(actor.id, body) };
  }
}
