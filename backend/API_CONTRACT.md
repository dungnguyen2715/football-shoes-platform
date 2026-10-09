# REST API Contract — Bootyard

**Version:** v1 · **Base URL:** /api/v1 · **Database:** MongoDB collections in [DATABASE_DESIGN.md](./DATABASE_DESIGN.md)

Tài liệu này là hợp đồng để thay mock services của frontend bằng backend thật. Các endpoint đánh dấu **Core** tương ứng luồng UI hiện có. **Planned** là phần chuẩn bị backend, chưa có màn hình gọi.

## 1. Quy ước request/response

### Headers

| Header | Quy tắc |
|---|---|
| Accept: application/json | Mọi request. |
| Content-Type: application/json | Request có JSON body. |
| Authorization: Bearer <accessToken> | Endpoint Customer/Admin. |
| Idempotency-Key: <uuid> | Bắt buộc khi POST /orders; retry phải giữ nguyên key và body. |
| Cookie: bootyard_cart=... | Cookie guest HttpOnly do API cấp, dùng cho cart/wishlist/guest checkout; browser gửi với credentials: include. |
| X-Guest-Order-Token: <opaque-token> | Chỉ guest dùng khi đọc receipt/order của mình. |
| X-Request-Id: <uuid> | Tùy chọn; server tạo nếu thiếu và trả trong response. |

ID trên API là chuỗi public: ObjectId dạng hex hoặc orderNo. Không trả raw Mongo document, password hash hoặc token hash.

### Success envelope

```json
{
  "data": {},
  "meta": { "requestId": "req_01J..." }
}
```

Danh sách dùng cursor pagination:

```json
{
  "data": {
    "items": [],
    "pageInfo": { "nextCursor": null, "hasNext": false }
  },
  "meta": { "requestId": "req_01J..." }
}
```

Query phân trang: limit mặc định 20, tối đa 100; cursor opaque do API trả. Frontend mock hiện chưa phân trang, nhưng catalog/admin list cần cursor khi dữ liệu tăng. Không kết hợp cursor với page.

### Error envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [{ "field": "customer.email", "issue": "must be a valid email" }]
  },
  "meta": { "requestId": "req_01J..." }
}
```

details là optional. Không trả stack trace, Mongo query hay bí mật trong production.

### Request types dùng chung

Đây là các kiểu wire-format TypeScript mô tả chính xác JSON. Tất cả ID là string; các field đánh dấu optional có thể bỏ hẳn. Number tiền tệ luôn là integer AUD cent (>=0), không phải số AUD dạng float.

```ts
type ObjectIdString = string;
type ISODateString = string;
type OrderStatus = "pending" | "contacted" | "confirmed" | "completed" | "cancelled";
type Availability = "available" | "reserved" | "sold";
type Surface = "FG" | "SG" | "AG" | "TF" | "IC";
type ContactChannel = "whatsapp" | "messenger" | "instagram" | "zalo" | "phone" | "email";

interface AuthRegisterInput {
  name: string;
  email: string;
  password: string; // >= 8 chars
  phone?: string;
}
interface AuthLoginInput { email: string; password: string }
interface AddressInput {
  label?: string;
  recipientName?: string;
  phone?: string;
  line1: string;
  line2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  countryCode?: string; // ISO-3166 alpha-2, default AU
  isDefault?: boolean;
}
interface ProfilePatch {
  name?: string;
  phone?: string;
  instagram?: string;
  whatsapp?: string;
  zalo?: string;
  location?: string;
}
interface PreferencesPatch {
  dropAlerts?: boolean;
  priceDrops?: boolean;
  smsUpdates?: boolean;
}
interface ProductWrite {
  name: string;
  brand: string;
  model: string;
  pricing: { currency: "AUD"; priceMinor: number; retailPriceMinor: number };
  size: string;
  conditionScore: number; // integer 1..10
  surface: Surface;
  studType: string;
  colorway: string;
  color: string;
  imageUrls: string[]; // 1..12 URLs or object-storage keys
  availability: Availability;
  description: string;
  listedAt?: ISODateString;
  categoryIds?: ObjectIdString[];
}
interface OrderCreateInput {
  items: Array<{ productId: ObjectIdString; quantity: 1 }>; // 1..20
  customer: {
    name: string;
    email: string;
    phone: string;
    preferredChannel: ContactChannel;
    handle?: string;
  };
  shippingAddress: AddressInput;
  notes?: string; // max 2000 chars
}
interface StoreSettingsPatch {
  storeName?: string;
  contactEmail?: string;
  contactPhone?: string;
  instagram?: string;
  isOpen?: boolean;
  fulfillment?: {
    freeShippingThresholdMinor?: number;
    standardShippingFeeMinor?: number;
  };
  notifications?: {
    orderAlerts?: boolean;
    inventoryAlerts?: boolean;
    weeklySummary?: boolean;
  };
}
interface ProductsQuery {
  q?: string;
  brand?: string | string[];
  size?: string | string[];
  surface?: Surface | Surface[];
  color?: string | string[];
  availability?: Availability | Availability[];
  minPriceMinor?: number;
  maxPriceMinor?: number;
  minCondition?: number;
  categoryId?: ObjectIdString;
  sort?: "newest" | "price_asc" | "price_desc" | "condition" | "views";
  limit?: number;
  cursor?: string;
}
interface OrdersQuery {
  q?: string;
  status?: OrderStatus;
  channel?: ContactChannel;
  from?: ISODateString;
  to?: ISODateString;
  sort?: "createdAt_desc" | "createdAt_asc";
  limit?: number;
  cursor?: string;
}
interface AnalyticsQuery {
  from?: ISODateString;
  to?: ISODateString;
  groupBy?: "day" | "month";
  limit?: number;
}
interface PageInfo { nextCursor: string | null; hasNext: boolean }
interface Page<T> { items: T[]; pageInfo: PageInfo }
```

### DTO dùng chung

Product response:

```json
{
  "id": "66fa12ab12cd34ef56ab7890",
  "legacyId": "bp-1000",
  "slug": "adidas-copa-pure-ii-elite",
  "name": "Adidas Copa Pure II Elite",
  "brand": "Adidas",
  "model": "Copa Pure II Elite",
  "pricing": { "currency": "AUD", "priceMinor": 28900, "retailPriceMinor": 40000 },
  "size": "US 9",
  "conditionScore": 9,
  "conditionLabel": "Like new",
  "surface": "FG",
  "studType": "Conical / bladed mix",
  "colorway": "White / Gold Metallic",
  "color": "White",
  "imageUrls": ["https://cdn.example.com/boots/bp-1000-1.jpg"],
  "availability": "available",
  "description": "Inspected pre-owned pair...",
  "listedAt": "2026-07-21T00:00:00.000Z",
  "viewsTotal": 1840,
  "categoryIds": []
}
```

Frontend adapter maps id → Product.id, imageUrls → images, priceMinor/100 → price, retailPriceMinor/100 → retailPrice, conditionScore → condition, viewsTotal → views. conditionLabel uses the current UI thresholds.

Order response:

```json
{
  "orderNo": "BY-2042",
  "customer": {
    "name": "Alex Turner",
    "email": "alex.turner@email.com",
    "phone": "+61 412 000 111",
    "preferredChannel": "whatsapp",
    "handle": "@alexturner"
  },
  "items": [{
    "productId": "66fa12ab12cd34ef56ab7890",
    "productSnapshot": {
      "name": "Adidas Copa Pure II Elite",
      "size": "US 9",
      "imageUrl": "https://cdn.example.com/boots/pair.jpg"
    },
    "quantity": 1,
    "unitPriceMinor": 28900,
    "lineTotalMinor": 28900
  }],
  "totals": { "currency": "AUD", "subtotalMinor": 28900, "shippingMinor": 1500, "totalMinor": 30400 },
  "status": "pending",
  "payment": { "method": "manual", "status": "manual_pending" },
  "createdAt": "2026-10-03T08:00:00.000Z"
}
```

Frontend maps lower-case status to Pending/Contacted/Confirmed/Completed/Cancelled and money minor units to AUD dollars.

## 2. Authentication & Security Flow

1. Register/login verifies credentials, hashes passwords (Argon2id or bcrypt), creates an auth_sessions record containing only a refresh-token hash and returns a short-lived access JWT.
2. Access token is returned in JSON (recommended lifetime 15 minutes); refresh token is set only as an HttpOnly, Secure, SameSite=Lax cookie named bootyard_refresh. Keep access token in memory, not localStorage, and attach it with the Axios request interceptor.
3. When access JWT expires, call POST /auth/refresh with credentials: include. Refresh JWT also carries sid and jti; verify its signature, load auth_sessions by sid, then compare its hash with the current refreshTokenHash. Rotate on success. A valid signed stale token with the same sid indicates reuse and revokes that session family. Password reset token hashes live in password_reset_tokens and expire in 15–30 minutes.
4. POST /auth/logout revokes the current session and clears the cookie. Disabled users and revoked/expired sessions are rejected.
5. JWT claims: sub=user ObjectId, role=customer|admin, sid=session id, iss, aud, iat, exp, jti. Pin accepted signing algorithm; verify signature, issuer, audience, expiry, session and user status.

| Access class | Rules |
|---|---|
| Public | No token. Product/category/review reads, public store settings, health. |
| Guest | API-issued guest cart cookie for cart/wishlist/checkout. Never trust a client-supplied email or cart ID as ownership proof. |
| Customer | Valid JWT; self-service resources must be scoped by sub. Admin may use customer self-service routes. |
| Admin | Valid JWT plus role=admin for every /admin/* endpoint; React route guard is UX only, not a security boundary. |

Browser API: allow configured CORS origins and credentials. Validate Origin on cookie-authenticated writes/refresh; use SameSite and CSRF protection if frontend/API are cross-site. Rate limit login, reset, checkout and view tracking. Google/Apple/Facebook buttons in the current UI are placeholders; OAuth is not enabled in this contract.

## 3. Endpoint catalog

JSON is used unless the response is 204. Endpoint shorthand: Public, Guest cookie, Customer JWT, Admin JWT. Responses below are inside the standard data/meta envelope unless a status/body is explicitly specified.

### 3.1 Health

| Method & URL | Auth | Request | Success |
|---|---|---|---|
| GET /health/live | Public | None | 200 { data: { status: "ok" } }. Process liveness. |
| GET /health/ready | Public/internal | None | 200 { data: { status: "ready", database: "connected" } }; 503 if dependency is unavailable. |

### 3.2 Authentication — /auth

| Method & URL | Auth | Request body | Success / notable errors |
|---|---|---|---|
| POST /auth/register | Public | { "name": "Alex Turner", "email": "alex@example.com", "password": "minimum-8-chars", "phone": "+61..." }; phone optional. Server always sets role=customer. | 201 { data: { user: UserSelf, accessToken: "eyJ...", expiresIn: 900 } } + refresh cookie. 409 EMAIL_ALREADY_EXISTS. |
| POST /auth/login | Public | { "email": "alex@example.com", "password": "..." } | 200 same session shape as register. 401 INVALID_CREDENTIALS (do not reveal whether email exists). |
| POST /auth/refresh | Refresh cookie | No body; credentials: include. | 200 { data: { accessToken: "eyJ...", expiresIn: 900 } } + rotated cookie. 401 REFRESH_TOKEN_INVALID. |
| POST /auth/logout | Refresh cookie | No body. Revoke current session. | 204, clear cookie. Repeated logout remains 204. |
| GET /auth/me | Customer JWT | None | 200 { data: { user: UserSelf } }. |
| POST /auth/password/forgot | Public | { "email": "alex@example.com" } | 202 with generic message whether account exists. Rate limited. |
| POST /auth/password/reset | Public reset token | { "token": "one-time-token", "password": "new-minimum-8-chars" } | 204. Token one-use/short-lived; revoke existing refresh sessions. 400 RESET_TOKEN_INVALID. |

### 3.3 User account — /users

| Method & URL | Auth | Request/query | Success |
|---|---|---|---|
| GET /users/me | Customer JWT | None | 200 { data: { user: UserSelf } }. |
| PATCH /users/me | Customer JWT | Partial { profile: { name, phone, instagram, whatsapp, zalo, location } }. Only allowlisted fields; reject role/status/passwordHash. | 200 { data: { user: UserSelf } }. |
| PATCH /users/me/preferences | Customer JWT | Partial booleans { dropAlerts, priceDrops, smsUpdates }. | 200 { data: { preferences: { dropAlerts, priceDrops, smsUpdates } } }. |
| GET /users/me/addresses | Customer JWT | None | 200 { data: { items: [Address] } }. |
| POST /users/me/addresses | Customer JWT | { label, recipientName, phone, line1, line2?, suburb?, state?, postcode?, countryCode, isDefault }. Strings except Boolean isDefault. | 201 { data: { address: Address } }. Max 10 per user. |
| PATCH /users/me/addresses/:addressId | Customer JWT | Partial address. | 200 { data: { address: Address } }; only look up within caller's addresses. |
| DELETE /users/me/addresses/:addressId | Customer JWT | None | 204; 404 if missing/not owned. |
| GET /users/me/orders | Customer JWT | status?, from?, to?, limit?, cursor? | 200 page { items: [OrderSummary], pageInfo }; only orders matching sub. |

UserSelf contains id, email, role, profile, preferences, addresses, createdAt. Never includes password/session hashes.

### 3.4 Guest session, carts & wishlist

Guest identity is a server-issued HttpOnly cookie. On login, backend may merge guest cart/wishlist into user resources and clear guest cookie.

| Method & URL | Auth | Request | Success |
|---|---|---|---|
| POST /carts/guest-session | Public | None | 201 if created, 200 if reused: { data: { cart: { items: [], itemCount: 0 } } } + Set-Cookie bootyard_cart (HttpOnly, Secure, SameSite=Lax). |
| GET /carts/current | Customer JWT or Guest cookie | None | 200 { data: { cart: { items: [CartLine], itemCount: 1, subtotalMinor: 28900, currency: "AUD" } } }. If JWT is present, use the user's cart; otherwise resolve guest cookie. Resolve prices from current products. |
| POST /carts/current/items | Customer JWT or Guest cookie | { "productId": "66fa...", "quantity": 1 }; one-of-one listing only accepts quantity 1. | 201 new or 200 existing (idempotent): { data: { cart: Cart } }. 409 PRODUCT_UNAVAILABLE. |
| DELETE /carts/current/items/:productId | Customer JWT or Guest cookie | None | 200 { data: { cart: Cart } }; remove is idempotent. |
| DELETE /carts/current | Customer JWT or Guest cookie | None | 204; clear items but keep session. |
| POST /carts/merge | Customer JWT + guest cookie | Empty body. Merge guest cart into current user cart; one line per product. | 200 { data: { cart: Cart } }. Unavailable items listed in meta.warnings. Keep guest cookie until wishlist merge also completes. |
| GET /wishlist-items | Customer JWT or Guest cookie | limit?, cursor? | 200 page { items: [{ id, product: Product, createdAt }], pageInfo }. |
| POST /wishlist-items | Customer JWT or Guest cookie | { "productId": "66fa..." } | 201 new or 200 existing: { data: { item: WishlistItem } }. |
| DELETE /wishlist-items/:productId | Customer JWT or Guest cookie | None | 204; idempotent. |
| POST /wishlist-items/merge | Customer JWT + guest cookie | Empty body. Merge guest items into user wishlist, de-duplicate by productId. Call after /carts/merge. | 200 { data: { mergedCount: 2 } }; clear guest cookie after this succeeds. If either merge fails, retain cookie and retry both idempotently. |

### 3.5 Storefront products, search & categories

GET /products serves Shop filters, Home latest/featured subsets, brand/surface links, product detail recommendations, admin read view. Existing facets (brand, size, surface, color) remain product fields.

| Method & URL | Auth | Query/body | Success |
|---|---|---|---|
| GET /products | Public | q; brand (repeat or CSV); size; surface; color; availability; minPriceMinor; maxPriceMinor; minCondition; categoryId; sort=newest|price_asc|price_desc|condition|views; limit; cursor. Default excludes archived. | 200 page { items: [Product], pageInfo }. |
| GET /products/facets **Planned** | Public | Optional availability/categoryId. | 200 { data: { brands: ["Nike", "Adidas"], sizes: ["US 9"], surfaces: ["FG", "AG"], colors: ["Black", "White"] } }. Replaces static filter constants if they become backend-managed. |
| GET /products/:idOrSlug | Public | ObjectId or slug. | 200 { data: { product: Product, related: [Product] } }; 404 PRODUCT_NOT_FOUND. GET does not increment views. |
| POST /products/:productId/views | Public | Optional { "sessionId": "opaque-id" }; rate limit/deduplicate. | 202 { data: { accepted: true } }; atomically increments viewsTotal. |
| GET /categories **Planned** | Public | active=true default; parentId? | 200 { data: { items: [Category] } }, sorted by sortOrder. Brand/size/surface/color facets currently come from mock constants; category UI is not dynamic yet. |

### 3.6 Admin product/category management

All /admin routes require Admin JWT. Product DELETE archives via archivedAt; it does not hard-delete a product referenced by an order. ProductWrite fields: required name, brand, model, pricing { currency:"AUD", priceMinor, retailPriceMinor }, size, conditionScore, surface, studType, colorway, color, imageUrls, availability, description; optional listedAt/categoryIds. Price/score are integer values.

| Method & URL | Request | Success |
|---|---|---|
| GET /admin/products | Catalog query + includeArchived? | 200 page { items: [Product], pageInfo }. |
| POST /admin/products | ProductWrite | 201 { data: { product: Product } }; 409 SLUG_ALREADY_EXISTS. |
| GET /admin/products/:productId | None | 200 { data: { product: Product } }. |
| PUT /admin/products/:productId | Full ProductWrite replacement for editable fields. | 200 { data: { product: Product } }; 404 PRODUCT_NOT_FOUND. |
| PATCH /admin/products/:productId | Partial ProductWrite. | 200 { data: { product: Product } }; 409 on inventory/order conflict. |
| DELETE /admin/products/:productId | None | 200 { data: { product: Product, archived: true } }. |
| POST /admin/uploads/presign **Planned** | { fileName: string, contentType: image/jpeg|image/png|image/webp, sizeBytes: integer } | 200 { data: { uploadUrl, objectKey, imageUrl, expiresAt } }. Upload directly to object storage; persist returned imageUrl in ProductWrite.imageUrls. Enforce content type/size. |
| POST /admin/categories **Planned** | { name, slug, description?, imageUrl?, parentId?, sortOrder, isActive } | 201 { data: { category: Category } }. |
| PATCH /admin/categories/:categoryId **Planned** | Partial category fields. | 200 { data: { category: Category } }; 409 duplicate slug. |
| DELETE /admin/categories/:categoryId **Planned** | None | 204 if unused; otherwise 409 CATEGORY_IN_USE or deactivate. |

Category management is included because the database has categories; current Admin UI does not yet have a category screen.

### 3.7 Checkout, orders & manual fulfillment

There is no online payment in the current frontend. V1 has no charge/payment endpoint. Checkout creates a request with payment.method=manual and status=manual_pending.

| Method & URL | Auth | Request | Success |
|---|---|---|---|
| POST /orders | Guest cookie or Customer JWT; guest allowed | Idempotency-Key header. Body: { items: [{ productId: string, quantity: 1 }], customer: { name: string, email: string, phone: string, preferredChannel: whatsapp|messenger|instagram|zalo|phone|email, handle?: string }, shippingAddress: { line1: string, line2?: string, suburb?: string, state?: string, postcode?: string, countryCode?: string }, notes?: string }. Never accept client price/shipping/totals. | 201 { data: { order: Order, guestAccessToken?: "opaque secret", guestAccessExpiresAt?: "ISO Date" } } + Location /api/v1/orders/BY-2042. Guest token is random, order-scoped and delivered once; it expires in 30 days and only its hash is persisted. Keep it in sessionStorage for receipt. Idempotency-Key is scoped to guest/user owner and stored as a hash with canonical request hash: same key/body returns same order, same key/different body returns 409 IDEMPOTENCY_CONFLICT. 409 PRODUCT_UNAVAILABLE. |
| GET /orders/:orderNo | Owning Customer JWT or X-Guest-Order-Token | None | 200 { data: { order: Order } }. Order number alone is not authorization. 404 also hides orders not owned by caller. |
| GET /users/me/orders | Customer JWT | status?, from?, to?, limit?, cursor? | 200 page; described in Users. |
| GET /admin/orders | Admin JWT | q?, status?, channel?, from?, to?, sort=createdAt_desc|createdAt_asc, limit?, cursor?; q matches orderNo/customer name/email/phone. | 200 page { items: [OrderSummary], pageInfo, summary?: { total, pending } }. |
| GET /admin/orders/:orderNo | Admin JWT | None | 200 { data: { order: Order } } with address/items/history. |
| PATCH /admin/orders/:orderNo | Admin JWT | { "status": "contacted", "note": "Messaged via WhatsApp" }; lower-case enum. Only status/note are writable through this route. | 200 { data: { order: Order } }; append statusHistory. 409 INVALID_STATUS_TRANSITION. |
| PATCH /admin/orders/:orderNo/payment **Planned** | Admin JWT | { "status": "paid"|"refunded", "note"?: string }. Only record manually verified payment. | 200 { data: { order: Order } }; does not charge. Current Admin UI has no payment control. |
| PATCH /orders/:orderNo **Planned** | Owning Customer JWT | { "status": "cancelled", "reason"?: string }; only pending/contacted orders. | 200 { data: { order: Order } }; release reserved inventory when applicable. UI has no cancel button yet. |

Checkout transaction must re-read each product, recalculate prices/shipping, verify availability and reserve inventory atomically before order creation. Use MongoDB transaction on a replica set or conditional findOneAndUpdate on availability; roll back all items if any reservation fails. Never trust totals from client. On cancellation, release according to allowed transition policy.

Order status mapping/state transitions: API enums pending/contacted/confirmed/completed/cancelled map to current UI labels Pending/Contacted/Confirmed/Completed/Cancelled. Suggested transitions: pending → contacted|confirmed|cancelled; contacted → confirmed|cancelled; confirmed → completed|cancelled. completed/cancelled are terminal. The current dropdown visually offers all values, so UI integration should disable invalid choices or display the 409 message.

### 3.8 Admin customers

Customer directory aggregates users and guest contact snapshots from orders; order count, total spent and last order are computed, not copied into users.

| Method & URL | Auth | Query | Success |
|---|---|---|---|
| GET /admin/customers | Admin JWT | q? (name/email/phone/location), limit?, cursor?, sort=lastOrder_desc|spent_desc | 200 page { items: [CustomerSummary], pageInfo }. Summary fields: id, name, email, phone, instagram, whatsapp, zalo, location, orders, spentMinor, lastOrderAt, recordStatus. |
| GET /admin/customers/:customerId | Admin JWT | User ID or opaque aggregate ID returned for guest-only contact. | 200 { data: { customer: CustomerSummary, recentOrders: [OrderSummary], pageInfo } }. Never use name/email as route ID. |

Current UI reads the directory/detail only; a customer edits their own profile via /users/me.

### 3.9 Store settings

| Method & URL | Auth | Request | Success |
|---|---|---|---|
| GET /store/settings | Public | None | 200 safe fields only: { data: { storeName, contactEmail, contactPhone, instagram, isOpen, fulfillment: { freeShippingThresholdMinor: 30000, standardShippingFeeMinor: 1500, currency: "AUD", paymentMode: "manual" } } }. Excludes admin notifications/updatedBy. |
| GET /admin/settings | Admin JWT | None | 200 { data: { settings: StoreSettings } }, including notification preferences. |
| PATCH /admin/settings | Admin JWT | Partial storeName/contactEmail/contactPhone/instagram/isOpen; fulfillment { freeShippingThresholdMinor, standardShippingFeeMinor }; notifications { orderAlerts, inventoryAlerts, weeklySummary }. Integers for money. paymentMode cannot change in v1. | 200 { data: { settings: StoreSettings } }; update singleton _id="store", set updatedBy. |

Storefront currently grants free shipping when subtotal is greater than 300 AUD (not greater than or equal); standard fee is 15 AUD. Keep that comparison when wiring settings unless the shipping policy/UI is deliberately changed.

### 3.10 Home reviews

| Method & URL | Auth | Query | Success |
|---|---|---|---|
| GET /reviews | Public | kind=store default; kind=product requires productId; limit?, cursor? | 200 page { items: [{ id, kind, author: { name, location }, rating, text, createdAt }], pageInfo }; only published. |

Three Home testimonials are currently mock seed and read-only. There is no public review submission or admin moderation UI.

### 3.11 Admin overview & analytics

| Method & URL | Auth | Query | Success |
|---|---|---|---|
| GET /admin/dashboard/overview | Admin JWT | from?, to? ISO dates. | 200 { data: { metrics: { revenueMinor, orders, pendingOrders, availableProducts, reservedProducts, soldProducts }, recentOrders: [OrderSummary], topViewedProducts: [ProductSummary] } }. Aggregated from orders/products. |
| GET /admin/analytics | Admin JWT | from?, to? ISO dates; groupBy=day|month (default month); limit top products (default 5). | 200 { data: { period, metrics: { revenueMinor, completedOrders, averageOrderValueMinor, productViews }, series: [{ period, revenueMinor, orders }], topViewedProducts: [ProductSummary], inventoryBySurface: [{ surface, count }] } }. |

Revenue charts include completed orders only; Orders dashboard may show total value for all request statuses. Keep these definitions separate.

## 4. HTTP status & error catalog

| HTTP | Error codes | Use |
|---:|---|---|
| 400 | VALIDATION_ERROR, INVALID_QUERY, INVALID_IDEMPOTENCY_KEY | Invalid/missing body or query; details identify field. |
| 401 | UNAUTHENTICATED, INVALID_CREDENTIALS, ACCESS_TOKEN_EXPIRED, REFRESH_TOKEN_INVALID | Missing/invalid/expired credential. |
| 403 | FORBIDDEN, ACCOUNT_DISABLED | Authenticated without permission or disabled account. |
| 404 | RESOURCE_NOT_FOUND, PRODUCT_NOT_FOUND, ORDER_NOT_FOUND | Missing resource; also hide private resources not owned by caller. |
| 409 | EMAIL_ALREADY_EXISTS, SLUG_ALREADY_EXISTS, PRODUCT_UNAVAILABLE, CATEGORY_IN_USE, INVALID_STATUS_TRANSITION, IDEMPOTENCY_CONFLICT | Unique, stock, state or idempotency conflict. |
| 422 | BUSINESS_RULE_VIOLATION | Correctly typed payload violates a business rule. Use consistently (or map validation to 400, but do not mix for the same error). |
| 429 | RATE_LIMITED | Auth/reset/checkout/view request limit; may include Retry-After. |
| 500 | INTERNAL_SERVER_ERROR | Unexpected error; log with requestId only. |
| 503 | SERVICE_UNAVAILABLE | Database/dependency unavailable or maintenance. |

Validation error example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "items[0].quantity", "issue": "must equal 1 for one-of-one products" },
      { "field": "customer.email", "issue": "must be a valid email address" }
    ]
  },
  "meta": { "requestId": "req_01JABC..." }
}
```

## 5. Frontend integration notes

- Axios should set withCredentials=true for guest/refresh cookies; request interceptor attaches in-memory access JWT.
- Replace getProducts, getAdminOrders, getCustomers, getRevenueSeries with feature services backed by endpoints; normalize API DTO into current TypeScript types.
- Checkout must send items/contact/address/Idempotency-Key and clear cart only after POST /orders succeeds. Confirmation screen should read returned orderNo; current BY-2042 text is hard-coded.
- Current Add Product dialog collects only brand/model/price/size while ProductWrite requires the rest of the listing details and an image URL. Expand that form or provide explicit server defaults before wiring product creation.
- Home/Shop/product detail should fetch products/reviews when backend is wired. Product images need CDN/object-storage URLs; hero and other design assets can remain frontend assets.
- /admin route guard improves UX, but only backend role authorization protects data.
- OAuth, online payment, review submission/moderation, cancel order and category CRUD are not connected to current UI; endpoints labelled Planned must not be treated as enabled features.
