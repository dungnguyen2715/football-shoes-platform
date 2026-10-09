import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { Order } from '../src/database/schemas/order.schema';
import type { User } from '../src/database/schemas/user.schema';
import { CustomersService } from '../src/customers/customers.service';
import { clearE2eDatabase, createE2eApp } from './e2e-app';

describe('Customer aggregation pagination (e2e)', () => {
  let app: INestApplication;
  let users: Model<User>;
  let orders: Model<Order>;
  let customers: CustomersService;

  beforeAll(async () => {
    app = await createE2eApp();
    users = app.get<Model<User>>(getModelToken('User'));
    orders = app.get<Model<Order>>(getModelToken('Order'));
    customers = app.get(CustomersService);
  });

  beforeEach(async () => clearE2eDatabase(app));

  afterAll(async () => {
    if (app) await app.close();
  });

  it('pages registered and guest customers in MongoDB and loads guest details', async () => {
    const registered = await users.create({
      email: 'member@example.com',
      role: 'customer',
      status: 'active',
      profile: { name: 'Registered Member', phone: '+61400000001' },
    });
    await orders.create(
      orderRecord('BY-E2E-REG', 'member@example.com', registered._id),
    );
    await orders.create(orderRecord('BY-E2E-GUEST', 'guest@example.com'));

    const firstPage = await customers.list({ limit: 1 });
    const firstItems = firstPage.items as Array<Record<string, unknown>>;
    const pageInfo = firstPage.pageInfo as {
      total: number;
      hasNext: boolean;
      nextCursor: string | null;
    };
    expect(pageInfo.total).toBe(2);
    expect(firstItems).toHaveLength(1);
    expect(pageInfo.hasNext).toBe(true);
    expect(pageInfo.nextCursor).toEqual(expect.any(String));

    const secondPage = await customers.list({
      limit: 1,
      cursor: pageInfo.nextCursor ?? undefined,
    });
    const secondItems = secondPage.items as Array<Record<string, unknown>>;
    expect(secondItems).toHaveLength(1);
    expect((secondPage.pageInfo as { hasNext: boolean }).hasNext).toBe(false);

    const guest = [firstItems[0], secondItems[0]].find(
      (item) => item.recordStatus === 'guest',
    );
    expect(guest).toBeDefined();
    expect(String(guest?.id)).toMatch(/^guest-[a-f\d]{24}$/i);

    const detail = await customers.get(String(guest?.id));
    expect(detail.customer).toMatchObject({
      email: 'guest@example.com',
      recordStatus: 'guest',
    });
    expect(detail.recentOrders).toHaveLength(1);
  });
});

function orderRecord(
  orderNo: string,
  email: string,
  customerId?: Types.ObjectId,
): Partial<Order> {
  const productId = new Types.ObjectId();
  return {
    orderNo,
    ...(customerId ? { customerId } : {}),
    customer: {
      name: 'Test Customer',
      email,
      emailNormalized: email.toLowerCase(),
      phone: '+61400000002',
      preferredChannel: 'email',
    },
    shippingAddress: { line1: '10 Test Street', countryCode: 'AU' },
    items: [
      {
        productId,
        productSnapshot: {
          name: 'Test Boot',
          slug: 'test-boot',
          brand: 'Nike',
          model: 'Mercurial',
          size: '9',
          imageUrl: 'https://example.test/boot.jpg',
        },
        quantity: 1,
        unitPriceMinor: 12000,
        lineTotalMinor: 12000,
      },
    ],
    totals: {
      currency: 'AUD',
      subtotalMinor: 12000,
      shippingMinor: 1500,
      totalMinor: 13500,
    },
    status: 'completed',
    payment: { method: 'manual', status: 'paid' },
    statusHistory: [{ status: 'completed', changedAt: new Date() }],
  };
}
