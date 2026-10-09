# Bootyard API

NestJS + MongoDB API for the Bootyard football boots storefront and admin dashboard. It implements the versioned contract in `API_CONTRACT.md` and MongoDB models in `DATABASE_DESIGN.md`.

## Requirements

- Node.js 20 or newer and npm
- MongoDB Community Server running locally (MongoDB 6+ recommended)

## Start locally

```bash
cd backend
npm install
cp .env.example .env
```

Start MongoDB in another terminal. On macOS with Homebrew:

```bash
brew services start mongodb-community
```

Or start a local daemon using your MongoDB installation's config:

```bash
mongod --dbpath /path/to/mongodb-data
```

Edit `.env` if your MongoDB URI or frontend origin differs. For local development, the default URI is `mongodb://127.0.0.1:27017/bootyard`.

```bash
npm run start:dev
```

The API listens on `http://localhost:3000/api/v1`; health endpoints are `/api/v1/health/live` and `/api/v1/health/ready`.

## Create the first admin

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in `.env`, then run:

```bash
npm run seed:admin
```

The seed command creates the admin account or updates the account with that email. Clear both variables after bootstrapping if they are not needed again.

## API modules

`auth`, `users`, `products`, `categories`, `orders`, `carts`, `wishlist-items`, `customers`, `settings`, `reviews`, `analytics`, and `health`. Admin endpoints validate both the JWT session and the `admin` role. Every request body is validated and unknown fields are rejected. Responses use the contract's `{ data, meta }` and `{ error, meta }` envelopes.

## Environment notes

- Never use the example JWT secrets outside local development. Use independent random secrets of at least 32 characters.
- Configure `SMTP_*` in production for password-reset email. In local development, reset links are logged by the mail service.
- Set `COOKIE_SECURE=true` behind HTTPS and restrict `CORS_ORIGINS` to the actual frontend origins before deployment.
- MongoDB standalone mode is supported. Checkout reserves one-of-one inventory with conditional updates and compensates reservations if order creation fails; transactions are not required for local standalone MongoDB.
- Product images are stored as URLs/object-storage keys. No upload-storage provider is configured in this backend yet.

## Operational safeguards

- All API routes are limited to 60 requests per minute per client by default. Registration, login, password reset, checkout, and product view counting have stricter route limits. Configure the reverse proxy to forward the real client IP and trust only known proxy hops in production.
- Pending orders are cancelled every 10 minutes after `ORDER_RESERVATION_TTL_HOURS` (default 48 hours, allowed range 24–72); reserved products are returned to available inventory.
- `CustomersService.list()` performs the registered/guest merge, search, sorting, counting, and page slicing in MongoDB. The aggregation uses `$unionWith` and requires MongoDB 4.4 or newer.
- When `MONGOOSE_AUTO_INDEX=false`, deploy schema indexes explicitly with `npm run db:sync-indexes`. Review the result first: `syncIndexes()` can drop database indexes that are not declared by the current schemas. Run it in a controlled deployment window after backing up the database.

## Tests

Unit tests run without MongoDB:

```bash
npm test -- --runInBand
```

End-to-end tests exercise refresh-token reuse, optional JWT handling, route rate limits, real MongoDB customer aggregation/pagination, expired-order inventory release, and concurrent one-of-one checkout. They use a separate database; never point `TEST_MONGODB_URI` at a database with application data:

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017/bootyard_backend_e2e npm run test:e2e
```
