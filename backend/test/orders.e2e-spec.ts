import type { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import type { Model } from 'mongoose';
import type { Server } from 'node:http';
import request from 'supertest';
import type { Product } from '../src/database/schemas/product.schema';
import type { Order } from '../src/database/schemas/order.schema';
import { ExpiredOrderCleanupService } from '../src/orders/expired-order-cleanup.service';
import { clearE2eDatabase, createE2eApp } from './e2e-app';

describe('Checkout inventory concurrency (e2e)', () => {
  let app: INestApplication;
  let products: Model<Product>;
  let orders: Model<Order>;
  let server: Server;

  beforeAll(async () => {
    app = await createE2eApp();
    server = app.getHttpServer() as Server;
    products = app.get<Model<Product>>(getModelToken('Product'));
    orders = app.get<Model<Order>>(getModelToken('Order'));
  });

  beforeEach(async () => clearE2eDatabase(app));

  afterAll(async () => {
    if (app) await app.close();
  });

  it('allows only one concurrent order to reserve a one-of-one product', async () => {
    const productId = new Types.ObjectId();
    await products.create({
      _id: productId,
      slug: 'e2e-one-of-one-boot',
      name: 'E2E One of One Boot',
      brand: 'Nike',
      model: 'Mercurial',
      pricing: {
        priceMinor: 14500,
        retailPriceMinor: 30000,
        currency: 'AUD',
      },
      size: '9',
      conditionScore: 9,
      surface: 'FG',
      studType: 'Firm Ground',
      colorway: 'Volt',
      color: 'Yellow',
      imageUrls: ['https://example.test/boot.jpg'],
      availability: 'available',
      description: 'Integration test product',
      listedAt: new Date(),
      viewsTotal: 0,
      categoryIds: [],
      archivedAt: null,
    });

    const body = {
      items: [{ productId: productId.toString(), quantity: 1 }],
      customer: {
        name: 'Concurrent Customer',
        email: 'concurrent@example.com',
        phone: '+61400111222',
        preferredChannel: 'email',
      },
      shippingAddress: {
        line1: '10 Test Street',
        suburb: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        countryCode: 'AU',
      },
    };
    const [first, second] = await Promise.all([
      request(server)
        .post('/api/v1/orders')
        .set('Idempotency-Key', '4992384a-d622-4b4b-9487-83b7619ca6dd')
        .send(body),
      request(server)
        .post('/api/v1/orders')
        .set('Idempotency-Key', 'b70ec198-c7b1-484f-9ad0-52fda108762b')
        .send(body),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await orders.countDocuments()).toBe(1);
    const product = await products.findById(productId).lean().exec();
    expect(product?.availability).toBe('reserved');
  });

  it('ignores malformed bearer tokens on the public checkout route', async () => {
    await request(server)
      .post('/api/v1/orders')
      .set('Authorization', 'Bearer invalid-or-expired-token')
      .set('Idempotency-Key', '31e6836e-c863-4df6-aabe-59d064867b12')
      .send({})
      .expect(400);
  });

  it('cancels stale pending orders and releases reserved products', async () => {
    const productId = new Types.ObjectId();
    await products.create({
      _id: productId,
      slug: 'e2e-expired-boot',
      name: 'E2E Expired Boot',
      brand: 'Nike',
      model: 'Phantom',
      pricing: {
        priceMinor: 12500,
        retailPriceMinor: 28000,
        currency: 'AUD',
      },
      size: '8',
      conditionScore: 8,
      surface: 'FG',
      studType: 'Firm Ground',
      colorway: 'Black',
      color: 'Black',
      imageUrls: ['https://example.test/expired-boot.jpg'],
      availability: 'reserved',
      description: 'Expired reservation test product',
      listedAt: new Date(),
      viewsTotal: 0,
      categoryIds: [],
      archivedAt: null,
    });
    const order = await orders.create({
      orderNo: 'BY-E2E-EXPIRED',
      customer: {
        name: 'Expired Customer',
        email: 'expired@example.com',
        emailNormalized: 'expired@example.com',
        phone: '+61400000003',
        preferredChannel: 'email',
      },
      shippingAddress: { line1: '20 Test Street', countryCode: 'AU' },
      items: [
        {
          productId,
          productSnapshot: {
            name: 'E2E Expired Boot',
            slug: 'e2e-expired-boot',
            brand: 'Nike',
            model: 'Phantom',
            size: '8',
            imageUrl: 'https://example.test/expired-boot.jpg',
          },
          quantity: 1,
          unitPriceMinor: 12500,
          lineTotalMinor: 12500,
        },
      ],
      totals: {
        currency: 'AUD',
        subtotalMinor: 12500,
        shippingMinor: 1500,
        totalMinor: 14000,
      },
      status: 'pending',
      statusHistory: [{ status: 'pending', changedAt: new Date() }],
    });
    await orders.collection.updateOne(
      { _id: order._id },
      { $set: { createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000) } },
    );

    const cleanup = app.get(ExpiredOrderCleanupService);
    expect(await cleanup.cancelExpiredReservations()).toBe(1);
    expect((await orders.findById(order._id).lean().exec())?.status).toBe(
      'cancelled',
    );
    expect(
      (await products.findById(productId).lean().exec())?.availability,
    ).toBe('available');
  });
});
