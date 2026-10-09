# MongoDB Database Design — Bootyard

Tài liệu này mô tả schema MongoDB đề xuất cho storefront Bootyard và admin dashboard. Thiết kế được đối chiếu với mock data, checkout, account, cart/wishlist, product catalog và admin settings hiện có trong `frontend/`.

## 1. Phạm vi và quy ước

- MongoDB là nguồn dữ liệu chính; backend có thể dùng Mongoose. Collection luôn đặt tên chữ thường, số nhiều.
- `ObjectId` là `_id` nội bộ. API nên trả thêm `id` dạng string để frontend không phải phụ thuộc BSON. Các mock `bp-1000` có thể được lưu trong `legacyId` trong giai đoạn import.
- Các giá trị ngày giờ lưu BSON `Date` theo UTC. Chuyển các chuỗi ngày mock như `2026-07-21` thành thời điểm UTC nhất quán khi seed.
- Giá tiền lưu bằng **số nguyên AUD cent** (`289 AUD` → `28900`), không lưu floating point. API chuyển đổi sang đơn vị AUD mà UI hiện tại đang dùng.
- Ảnh sản phẩm lưu URL hoặc object-storage key trong `products`; không lưu binary ảnh trong BSON. Các asset import trực tiếp từ Vite cần được upload lên object storage/CDN khi chuyển backend.
- Trường hiển thị có thể được tính ở API: `name = brand + model`, nhãn condition từ điểm 1–10, tổng khách và doanh thu từ orders. Không lưu các bản sao đó nếu không có nhu cầu truy vấn cụ thể.
- Với sản phẩm “one of one”, backend phải kiểm tra availability và tạo/cập nhật order trong transaction hoặc bằng conditional update để tránh hai yêu cầu cùng giữ một đôi.

## 2. ERD tổng quan

```text
users (1) ──────── (N) orders                 orders.customerId có thể vắng với guest checkout
  ├── (1) ──────── (N) auth_sessions          refresh token/session đã hash
  └── (1) ──────── (N) password_reset_tokens  reset password one-time đã hash
  │                       │
  ├── (1) carts            └── items[].productId ──> products
  └── (N) wishlist_items ───── productId ─────────> products

products (N) ─── (N) categories                products.categoryIds[]
products (1) ─── (N) reviews                    reviews.productId tùy chọn
users (1) ────── (N) reviews                    reviews.userId tùy chọn; author snapshot được embed

store_settings: một document singleton, không cần quan hệ với user/order
```

### Collections

| Collection | Mục đích |
|---|---|
| `users` | Tài khoản khách hàng/admin và profile dùng cho account, checkout đã đăng nhập. |
| `auth_sessions` | Phiên refresh JWT có thể thu hồi; chỉ lưu hash refresh token. |
| `password_reset_tokens` | Token reset password one-time đã hash, có hạn dùng và TTL cleanup. |
| `products` | Catalog, giá, thông số giày, trạng thái tồn kho và bộ đếm lượt xem. Mỗi document là một đôi hàng độc nhất. |
| `categories` | Nhóm/collection biên tập có thể cấu hình trong tương lai. Brand, size, surface, color vẫn là thuộc tính lọc của product như UI hiện tại. |
| `orders` | Yêu cầu đặt hàng thủ công, customer/address snapshot, item/giá snapshot và trạng thái xử lý. |
| `carts` | Cart đồng bộ server trong tương lai; hiện UI lưu cart trong localStorage. |
| `wishlist_items` | Mỗi sản phẩm được lưu là một document riêng, phù hợp danh sách có thể tăng không giới hạn; hiện UI lưu wishlist trong localStorage. |
| `store_settings` | Cấu hình singleton của trang Settings: thông tin cửa hàng, phí ship, trạng thái mở và tùy chọn thông báo. |
| `reviews` | Testimonial đang seed trên Home và review sản phẩm nếu bật chức năng moderation động. |

Không cần collection `payments` khi chưa nhận thanh toán trực tuyến; `orders.payment` ghi nhận quy trình thanh toán thủ công. Doanh thu theo tháng được tổng hợp từ orders đã hoàn tất; lượt xem tích lũy lưu ở `products.viewsTotal`. Chỉ thêm collection rollup analytics nếu lượng dữ liệu khiến aggregation trên orders không còn đáp ứng SLA.

## 3. Schema chi tiết

Ký hiệu: **Bắt buộc** = phải có khi tạo document; **Tùy chọn** = có thể vắng. `_id: ObjectId`, `createdAt: Date`, `updatedAt: Date` do MongoDB/Mongoose quản lý được áp dụng như mô tả bên dưới.

### 3.1 `users`

Profile và danh sách địa chỉ nhỏ, có giới hạn được embed để tải account trong một lần đọc. Không embed orders hay wishlist trong user vì chúng tăng độc lập và không có giới hạn cố định.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID tài khoản. |
| `email` | String | Có | Trim, lowercase; định danh đăng nhập, unique. |
| `passwordHash` | String | Không | Hash mật khẩu do backend tạo; không trả về API. Có thể vắng với social/placeholder auth. |
| `role` | String enum `customer \| admin` | Có | Mặc định `customer`. |
| `status` | String enum `active \| disabled` | Có | Mặc định `active`. |
| `profile` | Embedded Document | Có | `name: String` (required), `phone: String?`, `instagram: String?`, `whatsapp: String?`, `zalo: String?`, `location: String?`. |
| `addresses` | Array<Embedded Document> | Không | Giới hạn khuyến nghị 10 địa chỉ; mỗi phần tử có `label`, `recipientName`, `phone`, `line1`, `line2?`, `suburb?`, `state?`, `postcode?`, `countryCode` (String, AU mặc định), `isDefault` (Boolean). |
| `preferences` | Embedded Document | Có | `dropAlerts`, `priceDrops`, `smsUpdates: Boolean`; mặc định lần lượt `true`, `true`, `false` để khớp các lựa chọn trong Account settings. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps UTC. |

Không lưu refresh token hoặc plaintext credential trong document user. Dùng password hashing an toàn và cơ chế session/token ở backend.

### 3.2 `products`

Thông số và các ảnh sản phẩm được embed vì số ảnh nhỏ, có giới hạn (khuyến nghị tối đa 12 URL). Không embed review hay lịch sử view vào product.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID nội bộ. |
| `legacyId` | String | Không | Mã mock cũ, ví dụ `bp-1000`; dùng khi migrate/adapter, unique sparse. |
| `slug` | String | Có | URL thân thiện, unique. |
| `name` | String | Có | Tên tìm kiếm/hiển thị, có thể lưu giá trị đã chuẩn hóa từ `brand + model`. |
| `brand`, `model` | String | Có | Hãng và dòng giày. |
| `pricing` | Embedded Document | Có | `priceMinor: Number` (integer, AUD cent), `retailPriceMinor: Number` (integer), `currency: String enum` (hiện `AUD`). |
| `size` | String | Có | Giữ định dạng UI như `US 9`, `US 8.5`; tránh ép thành Number làm mất hệ size. |
| `conditionScore` | Number | Có | Integer từ 1 đến 10. `conditionLabel` được tính ở API/UI. |
| `surface` | String enum | Có | `FG`, `SG`, `AG`, `TF`, `IC`. |
| `studType`, `colorway`, `color` | String | Có | Thông tin lọc/hiển thị sản phẩm. |
| `imageUrls` | Array<String> | Có | URL/key ảnh, ít nhất 1, tối đa 12. |
| `availability` | String enum | Có | `available`, `reserved`, `sold`; là trạng thái tồn kho duy nhất của một đôi. |
| `description` | String | Có | Mô tả condition và tình trạng sử dụng. |
| `listedAt` | Date | Có | Thời điểm listing; map từ mock `createdAt` cho sort “Newest”. |
| `viewsTotal` | Number | Có | Integer không âm, mặc định 0; tăng atomically khi ghi nhận view. |
| `categoryIds` | Array<ObjectId> | Không | Tham chiếu `categories` cho curated collection; mặc định `[]`. |
| `archivedAt` | Date \| null | Có | Mặc định `null`; archive listing thay vì xóa product có thể đã xuất hiện trong order. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps của document. |

### 3.3 `categories`

Category là tài liệu phân loại/collection biên tập; không thay thế các facet hiện tại (`brand`, `surface`, `size`, `color`) nằm trực tiếp trong product để query catalog nhanh. Giữ cấu trúc phẳng hoặc tối đa một cấp cha.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID category. |
| `slug` | String | Có | Unique, dùng trong URL/API. |
| `name` | String | Có | Tên nhóm sản phẩm. |
| `description` | String | Không | Mô tả collection. |
| `imageUrl` | String | Không | Ảnh đại diện, URL/object-storage key. |
| `parentId` | ObjectId ref `categories` | Không | Tối đa một cấp cha; không lưu cây đệ quy sâu. |
| `isActive` | Boolean | Có | Mặc định `true`. |
| `sortOrder` | Number | Có | Integer, mặc định 0. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps. |

### 3.4 `orders`

Embed danh sách item và snapshot giá/tên/ảnh tại thời điểm gửi yêu cầu. Tham chiếu `productId` để liên kết listing hiện tại, nhưng order không phụ thuộc dữ liệu product có thể thay đổi. Embed customer và địa chỉ như snapshot để dữ liệu order vẫn chính xác khi profile bị sửa/xóa. `items` có giới hạn hợp lý (ví dụ tối đa 20); `statusHistory` giới hạn 20 sự kiện gần nhất.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID nội bộ. |
| `orderNo` | String | Có | Mã public duy nhất, ví dụ `BY-2041`; dùng trong UI thay cho `_id`. |
| `customerId` | ObjectId ref `users` | Không | Có với khách đã đăng nhập; vắng ở guest checkout. |
| `customer` | Embedded Document | Có | Snapshot: `name`, `email`, `emailNormalized`, `phone` (String), `preferredChannel` enum `whatsapp \| messenger \| instagram \| zalo \| phone \| email`, `handle?` (String). Các trường contact chính bắt buộc theo validation checkout. |
| `shippingAddress` | Embedded Document | Có | Snapshot: `line1` (required; nhận chuỗi address hiện tại), `line2?`, `suburb?`, `state?`, `postcode?`, `countryCode` (String, AU mặc định). |
| `items` | Array<Embedded Document> | Có | Mỗi item: `productId: ObjectId`, `productSnapshot` (name, slug, brand, model, size, imageUrl dạng String), `quantity: Number` integer = 1 cho hàng one-of-one, `unitPriceMinor: Number`, `lineTotalMinor: Number`. Tối thiểu 1 item. |
| `totals` | Embedded Document | Có | `currency: String` (`AUD`), `subtotalMinor`, `shippingMinor`, `totalMinor`: Number integer. Đây là snapshot giá khi order được tạo. |
| `status` | String enum | Có | `pending`, `contacted`, `confirmed`, `completed`, `cancelled`; adapter map sang Title Case hiện tại của frontend. |
| `payment` | Embedded Document | Có | `method: String` hiện là `manual`; `status: String enum` `manual_pending \| paid \| refunded`; không thu tiền online. |
| `notes` | String | Không | Ghi chú checkout, giới hạn độ dài (ví dụ 2.000 ký tự). |
| `statusHistory` | Array<Embedded Document> | Không | Tối đa 20 phần tử gần nhất: `status`, `changedAt: Date`, `actorId: ObjectId?`, `note?: String`. |
| `guestAccessTokenHash` | String | Không | Hash của token ngẫu nhiên gửi cho guest để xem receipt; không bao giờ trả hash về client. |
| `guestAccessTokenExpiresAt` | Date | Không | Hạn token receipt guest; khuyến nghị 30 ngày. |
| `idempotencyKeyHash` | String | Không | Hash của Idempotency-Key được scope theo owner; unique sparse để retry checkout không tạo order trùng. |
| `idempotencyRequestHash` | String | Không | Hash canonical payload ứng với idempotency key; nếu cùng key nhưng payload khác, trả conflict. |
| `createdAt`, `updatedAt` | Date | Có | `createdAt` dùng cho ngày order và báo cáo doanh thu theo tháng. |

Không lưu thông tin thẻ/payment secret. Do hiện tại chưa có online payment, doanh thu chỉ tính từ orders đủ điều kiện (thường `status=completed`) và tổng `totalMinor`; xác nhận lại định nghĩa “revenue” trước khi triển khai report.

### 3.5 `carts`

Cart là dữ liệu có thể thay đổi nhanh, tách khỏi user. Một document cho mỗi user hoặc anonymous browser session. `ownerKey` là chuỗi duy nhất có dạng `user:<ObjectId>` hoặc `guest:<opaque-session-id>`; không dùng email làm session key. Giới hạn cart ở 20 line items.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID cart. |
| `ownerKey` | String | Có | Unique key của chủ cart. |
| `userId` | ObjectId ref `users` | Không | Chủ cart sau đăng nhập. |
| `sessionId` | String | Không | ID guest ngẫu nhiên; vắng khi cart thuộc user. |
| `items` | Array<Embedded Document> | Có | `productId: ObjectId`, `quantity: Number` integer 1 (mỗi đôi chỉ có một chiếc listing). Giá luôn lấy lại từ product khi checkout, không tin client price. |
| `expiresAt` | Date | Có | Guest cart hết hạn; TTL index. Với cart user có thể gia hạn theo chính sách. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps. |

### 3.6 `wishlist_items`

Dùng một document cho mỗi cặp owner/product thay vì một array wishlist không giới hạn trong user. `ownerKey` dùng quy ước giống cart.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID item wishlist. |
| `ownerKey` | String | Có | `user:<ObjectId>` hoặc `guest:<opaque-session-id>`. |
| `userId` | ObjectId ref `users` | Không | User đã đăng nhập. |
| `sessionId` | String | Không | Session guest. |
| `productId` | ObjectId ref `products` | Có | Product được lưu. |
| `createdAt` | Date | Có | Thời điểm lưu để sort gần nhất. |

### 3.7 `store_settings`

Một document singleton với `_id: "store"`. Không tạo settings document cho từng user.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | String | Có | Luôn là `store`. |
| `storeName` | String | Có | Ví dụ `Bootyard`. |
| `contactEmail`, `contactPhone`, `instagram` | String | Có | Thông tin hiển thị liên hệ. |
| `isOpen` | Boolean | Có | Store nhận order request hay không. |
| `fulfillment` | Embedded Document | Có | `freeShippingThresholdMinor`, `standardShippingFeeMinor: Number` integer (AUD cent); `paymentMode: String` hiện cố định `manual`. |
| `notifications` | Embedded Document | Có | `orderAlerts`, `inventoryAlerts`, `weeklySummary: Boolean`. |
| `updatedBy` | ObjectId ref `users` | Không | Admin cuối sửa cấu hình. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps. |

Frontend hiện tính free shipping khi subtotal **lớn hơn** 300 AUD (không phải lớn hơn hoặc bằng), phí thường 15 AUD. Khi tích hợp settings backend cần giữ đúng phép so sánh hiện tại hoặc cập nhật UX/chính sách riêng; dữ liệu tương ứng là `30000` và `1500` cent.

### 3.8 `reviews`

Có thể seed ba testimonial hiện có trên Home. Dùng `kind: "store"` cho testimonial cửa hàng và `kind: "product"` khi triển khai đánh giá sản phẩm. Nội dung author được snapshot để vẫn hiển thị khi account bị ẩn.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID review. |
| `kind` | String enum `store \| product` | Có | Loại đánh giá. |
| `productId` | ObjectId ref `products` | Không | Bắt buộc nếu `kind=product`, vắng với testimonial cửa hàng. |
| `userId` | ObjectId ref `users` | Không | Tài khoản tác giả nếu có. |
| `author` | Embedded Document | Có | `name: String`, `location: String?` snapshot. |
| `rating` | Number | Có | Integer từ 1 đến 5. |
| `text` | String | Có | Nội dung đánh giá. |
| `status` | String enum `pending \| published \| hidden` | Có | Mặc định `pending` cho review mới; testimonials seed được `published`. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps. |

### 3.9 `auth_sessions`

Lưu refresh session để logout/thu hồi thiết bị và rotate refresh token. Mỗi phiên là document độc lập để số thiết bị không làm tăng kích thước document user.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID phiên. |
| `userId` | ObjectId ref `users` | Có | Chủ phiên. |
| `refreshTokenHash` | String | Có | Hash của refresh token hiện hành; unique, không lưu raw token/JWT. |
| `familyId` | String | Có | ID nhóm rotation để phát hiện/revoke token reuse nếu áp dụng. |
| `expiresAt` | Date | Có | TTL expiration. |
| `revokedAt` | Date \| null | Có | Thời điểm logout/revoke; mặc định null. |
| `createdAt`, `updatedAt` | Date | Có | Timestamps; có thể lưu metadata thiết bị tối thiểu nếu privacy policy cho phép. |

Indexes: unique `{ refreshTokenHash: 1 }`, `{ userId: 1, createdAt: -1 }`, TTL `{ expiresAt: 1 }` với `expireAfterSeconds: 0`.

### 3.10 `password_reset_tokens`

Không lưu reset token thô. Gửi token ngẫu nhiên một lần qua email; chỉ lưu hash, hạn dùng ngắn và `usedAt` sau khi sử dụng. Không trả thông tin account từ forgot-password.

| Field | Type | Bắt buộc | Mô tả |
|---|---|---:|---|
| `_id` | ObjectId | Có | ID reset request. |
| `userId` | ObjectId ref `users` | Có | Chủ tài khoản. |
| `tokenHash` | String | Có | Hash token ngẫu nhiên; unique. |
| `expiresAt` | Date | Có | Hết hạn sau khoảng 15–30 phút; TTL cleanup. |
| `usedAt` | Date \| null | Có | Mặc định null; set khi reset thành công để đảm bảo một lần. |
| `createdAt` | Date | Có | Thời gian tạo UTC. |

Indexes: unique `{ tokenHash: 1 }`, `{ userId: 1, createdAt: -1 }`, TTL `{ expiresAt: 1 }` với `expireAfterSeconds: 0`.

## 4. Indexing đề xuất

Chỉ tạo index phục vụ truy vấn đang có hoặc dự kiến trực tiếp. Sau khi có dữ liệu thật, kiểm tra `explain("executionStats")` và bỏ index không được dùng; mọi index tăng chi phí ghi và dung lượng.

| Collection | Index |
|---|---|
| `users` | Unique `{ email: 1 }`; `{ role: 1, status: 1, createdAt: -1 }` cho admin/user management nếu cần. |
| `auth_sessions` | Unique `{ refreshTokenHash: 1 }`; `{ userId: 1, createdAt: -1 }`; TTL `{ expiresAt: 1 }` với `expireAfterSeconds: 0`. |
| `password_reset_tokens` | Unique `{ tokenHash: 1 }`; `{ userId: 1, createdAt: -1 }`; TTL `{ expiresAt: 1 }` với `expireAfterSeconds: 0`. |
| `products` | Unique `{ slug: 1 }`; unique sparse `{ legacyId: 1 }` trong giai đoạn migration; `{ availability: 1, listedAt: -1 }` cho catalog; `{ brand: 1, availability: 1, pricing.priceMinor: 1 }` cho brand/price; `{ surface: 1, size: 1, availability: 1 }` cho facet; `{ viewsTotal: -1 }` cho top viewed; `{ categoryIds: 1, availability: 1, listedAt: -1 }` nếu UI query theo curated category. |
| `products` search | Một text index duy nhất `{ name: "text", model: "text", colorway: "text", size: "text" }`. Native `$text` phù hợp full-text; với tìm kiếm substring/autocomplete giống `includes()` hiện tại, dùng MongoDB Atlas Search hoặc trường normalized + chiến lược prefix search. |
| `categories` | Unique `{ slug: 1 }`; `{ isActive: 1, sortOrder: 1 }` cho danh sách navigation. |
| `orders` | Unique `{ orderNo: 1 }`; unique sparse `{ idempotencyKeyHash: 1 }`; `{ customerId: 1, createdAt: -1 }` cho account order history; `{ status: 1, createdAt: -1 }` cho admin queue/revenue window; `{ "customer.emailNormalized": 1, createdAt: -1 }` để ghép/tìm khách từ checkout guest. |
| `carts` | Unique `{ ownerKey: 1 }`; TTL `{ expiresAt: 1 }` với `expireAfterSeconds: 0`. |
| `wishlist_items` | Unique `{ ownerKey: 1, productId: 1 }`; `{ productId: 1 }` cho dọn tham chiếu/tra cứu theo product. |
| `store_settings` | Dùng unique `_id` mặc định; singleton được tải bằng `_id: "store"`. |
| `reviews` | `{ kind: 1, status: 1, createdAt: -1 }` cho testimonial Home/moderation; `{ productId: 1, status: 1, createdAt: -1 }` cho review sản phẩm. |

Compound index cần theo thứ tự prefix: equality/facet trước, sort/range sau. Không tạo mọi tổ hợp brand × size × color × surface × condition ngay từ đầu; kiểm tra các filter thực sự phổ biến trước khi bổ sung. Text index không thay thế index cho lọc/sort.

## 5. Truy vấn chính và chiến lược đọc/ghi

1. **Catalog**: lọc `availability`, `brand`, `size`, `surface`, `color`, `conditionScore`, `pricing.priceMinor`; sort theo `listedAt`, `pricing.priceMinor` hoặc `conditionScore`. Trả pagination bằng cursor (ví dụ `listedAt + _id`), không dùng `skip` lớn.
2. **Product detail**: lookup bằng `slug` unique. Tăng view bằng `$inc: { viewsTotal: 1 }`; nếu cần lịch sử unique users/session, thêm event/rollup analytics sau.
3. **Checkout**: frontend gửi product IDs và contact/address; server tự đọc giá/trạng thái, tính totals, tạo `orders` và chuyển trạng thái tồn kho atomically. Không nhận `total` do client gửi như nguồn sự thật.
4. **Admin orders**: query theo `status` và `createdAt`; trang customer tổng hợp `orders` theo `customer.emailNormalized` hoặc `customerId`; profile/user không chứa bản sao toàn bộ orders.
5. **Analytics**: order revenue và số đơn nhóm theo `createdAt` từ các order `completed`; top viewed đọc `products.viewsTotal`. Khi lưu lượng tăng, tạo `analytics_daily` dạng rollup (`day`, `revenueMinor`, `completedOrders`, `productViews`) thay vì lưu raw view event vô hạn trong product.
6. **Cart/wishlist**: chuyển dữ liệu Zustand/localStorage lên server sau khi backend sẵn sàng; khi guest login, merge qua service theo `ownerKey`, kiểm tra lại availability.

## 6. Mongoose models mẫu

Đoạn mẫu TypeScript dưới đây khai báo các collection, enum, validation cơ bản và index. Cài `mongoose`, kết nối database ở bootstrap backend, rồi import các model. Không gọi `mongoose.connect()` trong từng model.

```ts
import { InferSchemaType, Schema, model, models, Types } from "mongoose";

const roles = ["customer", "admin"] as const;
const availability = ["available", "reserved", "sold"] as const;
const orderStatuses = ["pending", "contacted", "confirmed", "completed", "cancelled"] as const;
const contactChannels = ["whatsapp", "messenger", "instagram", "zalo", "phone", "email"] as const;
const surfaces = ["FG", "SG", "AG", "TF", "IC"] as const;
const timestamps = { timestamps: true, versionKey: false } as const;

const addressSchema = new Schema(
  {
    label: { type: String, trim: true },
    recipientName: { type: String, trim: true },
    phone: { type: String, trim: true },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    suburb: { type: String, trim: true },
    state: { type: String, trim: true },
    postcode: { type: String, trim: true },
    countryCode: { type: String, required: true, default: "AU", uppercase: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false },
);

const UserSchema = new Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: roles, required: true, default: "customer" },
    status: { type: String, enum: ["active", "disabled"], required: true, default: "active" },
    profile: {
      name: { type: String, required: true, trim: true, maxlength: 120 },
      phone: { type: String, trim: true },
      instagram: { type: String, trim: true },
      whatsapp: { type: String, trim: true },
      zalo: { type: String, trim: true },
      location: { type: String, trim: true },
    },
    preferences: {
      dropAlerts: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      smsUpdates: { type: Boolean, default: false },
    },
    addresses: { type: [addressSchema], default: [], validate: (v: unknown[]) => v.length <= 10 },
  },
  { ...timestamps, collection: "users" },
);
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1, status: 1, createdAt: -1 });

const ProductSchema = new Schema(
  {
    legacyId: { type: String, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    pricing: {
      priceMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      retailPriceMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      currency: { type: String, required: true, enum: ["AUD"], default: "AUD" },
    },
    size: { type: String, required: true, trim: true },
    conditionScore: { type: Number, required: true, min: 1, max: 10, validate: Number.isInteger },
    surface: { type: String, required: true, enum: surfaces },
    studType: { type: String, required: true, trim: true },
    colorway: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    imageUrls: {
      type: [{ type: String, trim: true }],
      required: true,
      validate: (v: string[]) => v.length >= 1 && v.length <= 12,
    },
    availability: { type: String, required: true, enum: availability, default: "available" },
    description: { type: String, required: true, maxlength: 5000 },
    listedAt: { type: Date, required: true, default: Date.now },
    viewsTotal: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    categoryIds: { type: [{ type: Schema.Types.ObjectId, ref: "Category" }], default: [] },
    archivedAt: { type: Date, default: null },
  },
  { ...timestamps, collection: "products" },
);
ProductSchema.index({ slug: 1 }, { unique: true });
ProductSchema.index({ legacyId: 1 }, { unique: true, sparse: true });
ProductSchema.index({ availability: 1, listedAt: -1 });
ProductSchema.index({ brand: 1, availability: 1, "pricing.priceMinor": 1 });
ProductSchema.index({ surface: 1, size: 1, availability: 1 });
ProductSchema.index({ viewsTotal: -1 });
ProductSchema.index({ categoryIds: 1, availability: 1, listedAt: -1 });
ProductSchema.index(
  { name: "text", model: "text", colorway: "text", size: "text" },
  { weights: { name: 10, model: 8, colorway: 4, size: 2 }, name: "catalog_text" },
);

const CategorySchema = new Schema(
  {
    slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    imageUrl: { type: String, trim: true },
    parentId: { type: Schema.Types.ObjectId, ref: "Category" },
    isActive: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0, validate: Number.isInteger },
  },
  { ...timestamps, collection: "categories" },
);
CategorySchema.index({ isActive: 1, sortOrder: 1 });

const customerSnapshotSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    emailNormalized: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    preferredChannel: { type: String, required: true, enum: contactChannels },
    handle: { type: String, trim: true },
  },
  { _id: false },
);
const shippingAddressSchema = new Schema(
  {
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    suburb: { type: String, trim: true },
    state: { type: String, trim: true },
    postcode: { type: String, trim: true },
    countryCode: { type: String, required: true, default: "AU", uppercase: true },
  },
  { _id: false },
);
const orderItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    productSnapshot: {
      name: { type: String, required: true },
      slug: { type: String, required: true },
      brand: { type: String, required: true },
      model: { type: String, required: true },
      size: { type: String, required: true },
      imageUrl: { type: String, required: true },
    },
    quantity: { type: Number, required: true, min: 1, max: 1, default: 1 },
    unitPriceMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
    lineTotalMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
  },
  { _id: false },
);
const OrderSchema = new Schema(
  {
    orderNo: { type: String, required: true, trim: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User" },
    customer: { type: customerSnapshotSchema, required: true },
    shippingAddress: { type: shippingAddressSchema, required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: (v: unknown[]) => v.length >= 1 && v.length <= 20,
    },
    totals: {
      currency: { type: String, enum: ["AUD"], required: true, default: "AUD" },
      subtotalMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      shippingMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      totalMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
    },
    status: { type: String, enum: orderStatuses, required: true, default: "pending" },
    payment: {
      method: { type: String, enum: ["manual"], required: true, default: "manual" },
      status: {
        type: String,
        enum: ["manual_pending", "paid", "refunded"],
        required: true,
        default: "manual_pending",
      },
    },
    notes: { type: String, trim: true, maxlength: 2000 },
    guestAccessTokenHash: { type: String, select: false },
    guestAccessTokenExpiresAt: { type: Date },
    idempotencyKeyHash: { type: String, select: false },
    idempotencyRequestHash: { type: String, select: false },
    statusHistory: {
      type: [
        new Schema(
          {
            status: { type: String, enum: orderStatuses, required: true },
            changedAt: { type: Date, required: true, default: Date.now },
            actorId: { type: Schema.Types.ObjectId, ref: "User" },
            note: { type: String, maxlength: 500 },
          },
          { _id: false },
        ),
      ],
      default: [],
      validate: (v: unknown[]) => v.length <= 20,
    },
  },
  { ...timestamps, collection: "orders" },
);
OrderSchema.index({ orderNo: 1 }, { unique: true });
OrderSchema.index({ idempotencyKeyHash: 1 }, { unique: true, sparse: true });
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ "customer.emailNormalized": 1, createdAt: -1 });

const cartItemSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, max: 1, default: 1 },
  },
  { _id: false },
);
const CartSchema = new Schema(
  {
    ownerKey: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    items: { type: [cartItemSchema], default: [], validate: (v: unknown[]) => v.length <= 20 },
    expiresAt: { type: Date, required: true },
  },
  { ...timestamps, collection: "carts" },
);
CartSchema.index({ ownerKey: 1 }, { unique: true });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const WishlistItemSchema = new Schema(
  {
    ownerKey: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    sessionId: { type: String },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "wishlist_items" },
);
WishlistItemSchema.index({ ownerKey: 1, productId: 1 }, { unique: true });
WishlistItemSchema.index({ productId: 1 });

const StoreSettingsSchema = new Schema(
  {
    _id: { type: String, default: "store" },
    storeName: { type: String, required: true, trim: true },
    contactEmail: { type: String, required: true, trim: true, lowercase: true },
    contactPhone: { type: String, required: true, trim: true },
    instagram: { type: String, required: true, trim: true },
    isOpen: { type: Boolean, required: true, default: true },
    fulfillment: {
      freeShippingThresholdMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      standardShippingFeeMinor: { type: Number, required: true, min: 0, validate: Number.isInteger },
      paymentMode: { type: String, enum: ["manual"], required: true, default: "manual" },
    },
    notifications: {
      orderAlerts: { type: Boolean, required: true, default: true },
      inventoryAlerts: { type: Boolean, required: true, default: true },
      weeklySummary: { type: Boolean, required: true, default: false },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { ...timestamps, collection: "store_settings" },
);

const ReviewSchema = new Schema(
  {
    kind: { type: String, enum: ["store", "product"], required: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    author: {
      name: { type: String, required: true, trim: true },
      location: { type: String, trim: true },
    },
    rating: { type: Number, required: true, min: 1, max: 5, validate: Number.isInteger },
    text: { type: String, required: true, trim: true, maxlength: 3000 },
    status: {
      type: String,
      enum: ["pending", "published", "hidden"],
      required: true,
      default: "pending",
    },
  },
  { ...timestamps, collection: "reviews" },
);
ReviewSchema.index({ kind: 1, status: 1, createdAt: -1 });
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

const AuthSessionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    refreshTokenHash: { type: String, required: true, select: false },
    familyId: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
  },
  { ...timestamps, collection: "auth_sessions" },
);
AuthSessionSchema.index({ refreshTokenHash: 1 }, { unique: true });
AuthSessionSchema.index({ userId: 1, createdAt: -1 });
AuthSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const PasswordResetTokenSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, select: false },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false }, versionKey: false, collection: "password_reset_tokens" },
);
PasswordResetTokenSchema.index({ tokenHash: 1 }, { unique: true });
PasswordResetTokenSchema.index({ userId: 1, createdAt: -1 });
PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type UserRecord = InferSchemaType<typeof UserSchema>;
export type ProductRecord = InferSchemaType<typeof ProductSchema>;
export type OrderRecord = InferSchemaType<typeof OrderSchema>;

export const UserModel = models.User ?? model("User", UserSchema);
export const ProductModel = models.Product ?? model("Product", ProductSchema);
export const CategoryModel = models.Category ?? model("Category", CategorySchema);
export const OrderModel = models.Order ?? model("Order", OrderSchema);
export const CartModel = models.Cart ?? model("Cart", CartSchema);
export const WishlistItemModel =
  models.WishlistItem ?? model("WishlistItem", WishlistItemSchema);
export const StoreSettingsModel =
  models.StoreSettings ?? model("StoreSettings", StoreSettingsSchema);
export const ReviewModel = models.Review ?? model("Review", ReviewSchema);
export const AuthSessionModel = models.AuthSession ?? model("AuthSession", AuthSessionSchema);
export const PasswordResetTokenModel =
  models.PasswordResetToken ?? model("PasswordResetToken", PasswordResetTokenSchema);

// `Types.ObjectId` is the TypeScript type for service/controller inputs.
export type MongoId = Types.ObjectId;
```

> Lưu ý triển khai: với MongoDB sharded cluster, unique index phải chứa shard key phù hợp. TTL deletion chạy nền nên `expiresAt` không đảm bảo document bị xóa đúng tức thời. Mongoose `unique` tạo index, không thay thế validation hoặc xử lý duplicate-key error trong service.

## 7. Seed/mapping từ frontend mock

| Frontend mock | MongoDB mapping |
|---|---|
| `Product.id` | `_id` mới; giữ `id` cũ vào `legacyId` khi import, sau đó API trả `id` public ổn định. |
| `Product.slug`, `brand`, `model`, `size`, `surface`, `color`, `colorway`, `studType`, `description`, `availability`, `views` | `slug`, các trường cùng tên, `viewsTotal`. |
| `Product.price`, `retailPrice` (AUD dollars) | `pricing.priceMinor`, `pricing.retailPriceMinor` nhân 100; frontend adapter đổi về AUD dollars. |
| `Product.condition` và `conditionLabel` | Lưu `conditionScore`; tính `conditionLabel` ở API/UI theo cùng ngưỡng hiện tại. |
| `Product.images` (Vite asset imports) | Upload asset và lưu URL/key vào `imageUrls`; không lưu import path dạng module trong MongoDB. |
| `AdminOrder.id`, `status`, `customer`, `contact`, `channel`, `items`, `total`, `date` | `orderNo`, enum status lowercase, customer snapshot; tách contact theo type; `items` chi tiết cần đọc snapshot từ product; tiền chuyển cent; `createdAt` từ ngày mock. |
| `storefrontCustomer` | Seed `users.profile` (nếu tài khoản login đã được tạo) hoặc giữ là guest/contact record; không suy luận rằng customer này sở hữu orders mock nếu dữ liệu không chứng minh điều đó. |
| `revenueSeries` | Seed chỉ cho demo; production tính từ `orders` completed theo tháng thay vì ghi cùng số liệu lặp lại. |
| `reviews` trên Home | Seed thành `reviews` có `kind="store"`, `status="published"`. |
| Zustand `cart` / `wishlist` | Giai đoạn đầu tiếp tục localStorage; khi bật API, đồng bộ sang `carts` / `wishlist_items` qua service và kiểm tra lại tồn kho. |

Thứ tự import khuyến nghị: `users`, `categories`, `products`, `orders`, rồi `reviews`; chỉ gắn `customerId` hoặc `userId` khi mapping email/user identity đã được xác minh. Không tạo liên kết user-order chỉ dựa trên tên hiển thị.
