import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CustomersQueryDto } from './customers-query.dto';
import { CustomersService } from './customers.service';

@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}
  @Get() list(
    @Query() query: CustomersQueryDto,
  ): Promise<Record<string, unknown>> {
    return this.customers.list(query);
  }
  @Get(':customerId') get(
    @Param('customerId') id: string,
  ): Promise<Record<string, unknown>> {
    return this.customers.get(id);
  }
}
