# Hello Cake - Master Plan

**Ngay tao:** 2026-03-28
**Trang thai:** Draft v1
**Quy mo:** 100+ loai banh | Web (khach hang) + Admin (quan ly)

---

## Muc luc

1. [Tong quan kien truc](#1-tong-quan-kien-truc)
2. [Tech Stack](#2-tech-stack)
3. [Database Schema](#3-database-schema)
4. [Cau truc thu muc](#4-cau-truc-thu-muc)
5. [Phan chia Phase](#5-phan-chia-phase)
6. [Chi tiet tung Phase](#6-chi-tiet-tung-phase)
7. [Deploy & Infrastructure](#7-deploy--infrastructure)
8. [Tich hop thanh toan](#8-tich-hop-thanh-toan)
9. [Tich hop van chuyen](#9-tich-hop-van-chuyen)
10. [Thong bao & Lien lac](#10-thong-bao--lien-lac)
11. [SEO & Performance](#11-seo--performance)
12. [Bao mat](#12-bao-mat)
13. [Cau hoi chua giai quyet](#13-cau-hoi-chua-giai-quyet)

---

## 1. Tong quan kien truc

```
                    +------------------+
                    |   Cloudflare     |
                    |   CDN + DNS      |
                    +--------+---------+
                             |
                    +--------+---------+
                    |  Next.js 15      |
                    |  (Vercel/VPS)    |
                    |                  |
                    |  - SSG: Trang chu|
                    |  - ISR: San pham |
                    |  - SSR: Gio hang |
                    |  - API Routes    |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
     +--------+--------+          +--------+--------+
     |   PostgreSQL     |          |   Redis          |
     |   (Supabase/     |          |   (Upstash)      |
     |    Neon)          |          |   - Session      |
     +------------------+          |   - Cart cache   |
                                   |   - Rate limit   |
                                   +------------------+

     +------------------+          +------------------+
     |   Cloudflare R2  |          |   SePay/VNPay    |
     |   (Anh san pham) |          |   MoMo/ZaloPay   |
     +------------------+          +------------------+

     +------------------+
     |   Wails Desktop  |
     |   (Admin app -   |
     |    optional)      |
     +------------------+
```

### Giai thich quyet dinh kien truc

**Tai sao Next.js thay vi tach rieng Frontend/Backend?**
- SEO la yeu to song con cho tiem banh (khach tim "banh kem sinh nhat HCM" tren Google)
- ISR cho trang san pham = nhanh nhu static, cap nhat tu dong
- API Routes gom chung, khong can quan ly 2 server rieng
- Ecosystem Viet Nam lon: nhieu dev biet React/Next.js, de tuyen nguoi

**Tai sao PostgreSQL thay vi SQLite (prototype hien tai)?**
- Prototype hien tai dung Express + SQLite, phu hop PoC nhung khong scale
- PostgreSQL: concurrent connections, full-text search tieng Viet, JSON columns, robust transactions
- Supabase/Neon cho free tier tot, managed hosting

**Tai sao giu lai option Wails cho Admin?**
- User da co kinh nghiem Wails (du an Veo3 Manager)
- Desktop app admin: in hoa don offline, thong bao system tray, chay background
- Tuy nhien web admin la uu tien truoc (MVP), Wails la Phase 4+

---

## 2. Tech Stack

### Frontend (Web khach hang + Web admin)

| Layer | Cong nghe | Ly do |
|-------|-----------|-------|
| Framework | **Next.js 15** (App Router) | SSG/ISR/SSR linh hoat, SEO tot |
| Language | **TypeScript 5** | Type safety, DX tot |
| Styling | **Tailwind CSS v4** | Utility-first, responsive nhanh |
| UI Components | **shadcn/ui** | Vendored, customizable, Radix-based |
| State Management | **Zustand** | User preference, lightweight |
| Toast | **Sonner** | User preference |
| Forms | **React Hook Form + Zod** | Validation strong-typed |
| Charts | **Recharts** | Bieu do doanh thu admin |
| Icons | **Lucide React** | Consistent, tree-shakeable |
| Image | **Next.js Image** | Auto optimize, WebP/AVIF, lazy load |

### Backend

| Layer | Cong nghe | Ly do |
|-------|-----------|-------|
| API | **Next.js API Routes** (Route Handlers) | Gom chung, deploy 1 laan |
| ORM | **Prisma** | Type-safe, migration tot, ecosystem lon |
| Database | **PostgreSQL** (Neon/Supabase) | Free tier, managed, scale tot |
| Cache | **Upstash Redis** | Serverless Redis, cart/session/rate-limit |
| Auth | **Better Auth** | Full-featured, Prisma adapter san |
| File Storage | **Cloudflare R2** | S3-compatible, egress mien phi |
| Email | **Resend** | Transactional email (xac nhan don hang) |

### Admin Desktop (Phase 4+ - Optional)

| Layer | Cong nghe | Ly do |
|-------|-----------|-------|
| Framework | **Wails v2** | User da co kinh nghiem |
| Backend | **Go** | User da co kinh nghiem |
| Frontend | **React + Zustand + Sonner** | Tai su dung code tu web admin |

### Dev Tools

| Tool | Muc dich |
|------|----------|
| pnpm | Package manager (nhanh, tiet kiem disk) |
| ESLint + Prettier | Code quality |
| Husky + lint-staged | Pre-commit hooks |
| Vitest | Unit test |
| Playwright | E2E test |

---

## 3. Database Schema

### 3.1 Core Schema (Prisma)

```prisma
// === AUTHENTICATION ===
// Better Auth tu tao tables: user, session, account, verification

// === CATALOG ===
model Category {
  id          String    @id @default(cuid())
  name        String    @unique          // "Banh kem", "Croissant"
  slug        String    @unique          // "banh-kem"
  icon        String?                    // emoji hoac icon name
  description String?
  imageUrl    String?
  sortOrder   Int       @default(0)
  active      Boolean   @default(true)
  products    Product[]
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Product {
  id              String           @id @default(cuid())
  name            String                              // "Banh Kem Dau"
  slug            String           @unique            // "banh-kem-dau"
  description     String?                             // Mo ta HTML/Markdown
  shortDesc       String?                             // Mo ta ngan cho card
  category        Category         @relation(fields: [categoryId], references: [id])
  categoryId      String
  basePrice       Decimal          @db.Decimal(12, 0) // VND, khong can thap phan
  salePrice       Decimal?         @db.Decimal(12, 0)
  sku             String           @unique
  stock           Int              @default(0)
  minOrderQty     Int              @default(1)
  maxOrderQty     Int              @default(99)
  weight          Float?                              // gram
  tags            String[]                            // ["bestseller", "new"]
  active          Boolean          @default(true)
  featured        Boolean          @default(false)
  preorderOnly    Boolean          @default(false)    // chi dat truoc
  leadTimeDays    Int              @default(0)        // thoi gian lam banh
  variants        ProductVariant[]
  images          ProductImage[]
  reviews         Review[]
  orderItems      OrderItem[]
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  @@index([categoryId])
  @@index([active, featured])
  @@index([slug])
}

model ProductVariant {
  id        String     @id @default(cuid())
  product   Product    @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String
  name      String                              // "Size S", "Size M", "Vi Socola"
  sku       String     @unique
  price     Decimal    @db.Decimal(12, 0)
  stock     Int        @default(0)
  active    Boolean    @default(true)
  sortOrder Int        @default(0)
  orderItems OrderItem[]

  @@index([productId])
}

model ProductImage {
  id        String  @id @default(cuid())
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String
  url       String
  alt       String?
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)

  @@index([productId])
}

// === ORDERS ===
model Order {
  id              String       @id @default(cuid())
  orderNumber     String       @unique               // "HC-20260328-001"
  customer        Customer     @relation(fields: [customerId], references: [id])
  customerId      String
  status          OrderStatus  @default(PENDING)
  type            OrderType    @default(IMMEDIATE)    // mua ngay vs dat truoc
  deliveryMethod  DeliveryMethod @default(SELF_DELIVERY)

  // Dia chi giao
  recipientName   String
  recipientPhone  String
  address         String?
  ward            String?
  district        String?
  city            String       @default("Ho Chi Minh")
  note            String?                             // ghi chu don hang
  cakeMessage     String?                             // chu viet len banh

  // Thoi gian
  scheduledDate   DateTime?                           // ngay giao (dat truoc)
  scheduledSlot   String?                             // "9:00-12:00", "14:00-17:00"
  deliveredAt     DateTime?

  // Tien
  subtotal        Decimal      @db.Decimal(12, 0)
  shippingFee     Decimal      @db.Decimal(12, 0) @default(0)
  discount        Decimal      @db.Decimal(12, 0) @default(0)
  total           Decimal      @db.Decimal(12, 0)

  // Thanh toan
  paymentMethod   PaymentMethod @default(COD)
  paymentStatus   PaymentStatus @default(UNPAID)
  paymentRef      String?                             // ma giao dich

  // Voucher
  voucher         Voucher?     @relation(fields: [voucherId], references: [id])
  voucherId       String?

  // Van chuyen
  shippingProvider String?                            // "GHN", "GHTK", "GRAB"
  trackingCode    String?

  items           OrderItem[]
  statusHistory   OrderStatusHistory[]
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  @@index([customerId])
  @@index([status])
  @@index([orderNumber])
  @@index([createdAt])
  @@index([scheduledDate])
}

model OrderItem {
  id        String          @id @default(cuid())
  order     Order           @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  product   Product         @relation(fields: [productId], references: [id])
  productId String
  variant   ProductVariant? @relation(fields: [variantId], references: [id])
  variantId String?
  name      String                                   // snapshot ten san pham
  price     Decimal         @db.Decimal(12, 0)       // snapshot gia tai thoi diem mua
  quantity  Int

  @@index([orderId])
}

model OrderStatusHistory {
  id        String      @id @default(cuid())
  order     Order       @relation(fields: [orderId], references: [id], onDelete: Cascade)
  orderId   String
  status    OrderStatus
  note      String?
  createdAt DateTime    @default(now())

  @@index([orderId])
}

// === CUSTOMERS ===
model Customer {
  id        String   @id @default(cuid())
  name      String
  phone     String   @unique                          // so dien thoai la dinh danh chinh
  email     String?
  address   String?
  ward      String?
  district  String?
  city      String?
  note      String?                                   // ghi chu noi bo (VIP, di ung...)
  totalOrders Int    @default(0)
  totalSpent  Decimal @db.Decimal(12, 0) @default(0)
  orders    Order[]
  reviews   Review[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([phone])
}

// === REVIEWS ===
model Review {
  id        String   @id @default(cuid())
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  productId String
  customer  Customer @relation(fields: [customerId], references: [id])
  customerId String
  rating    Int                                       // 1-5
  content   String?
  images    String[]                                  // URL anh review
  approved  Boolean  @default(false)                  // admin duyet
  createdAt DateTime @default(now())

  @@index([productId])
  @@unique([productId, customerId])                   // 1 review/san pham/khach
}

// === VOUCHERS ===
model Voucher {
  id            String       @id @default(cuid())
  code          String       @unique                  // "HELLO10", "FREESHIP"
  description   String?
  type          VoucherType                           // PERCENTAGE, FIXED, FREE_SHIPPING
  value         Decimal      @db.Decimal(12, 0)       // % hoac so tien
  minOrderValue Decimal?     @db.Decimal(12, 0)       // don toi thieu
  maxDiscount   Decimal?     @db.Decimal(12, 0)       // giam toi da (cho %)
  maxUses       Int?                                  // tong so luot dung
  usedCount     Int          @default(0)
  startDate     DateTime
  endDate       DateTime
  active        Boolean      @default(true)
  orders        Order[]
  createdAt     DateTime     @default(now())

  @@index([code])
  @@index([active, startDate, endDate])
}

// === SETTINGS ===
model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

// === ENUMS ===
enum OrderStatus {
  PENDING           // Cho xac nhan
  CONFIRMED         // Da xac nhan
  PREPARING         // Dang lam banh
  READY             // Banh xong, cho giao
  SHIPPING          // Dang giao
  DELIVERED         // Da giao
  COMPLETED         // Hoan thanh
  CANCELLED         // Da huy
}

enum OrderType {
  IMMEDIATE         // Mua ngay
  PREORDER          // Dat truoc
}

enum DeliveryMethod {
  SELF_DELIVERY     // Tu giao
  GHN               // Giao Hang Nhanh
  GHTK              // Giao Hang Tiet Kiem
  GRAB              // Grab Express
  BE                // Be Express
  PICKUP            // Den lay tai tiem
}

enum PaymentMethod {
  COD               // Thanh toan khi nhan hang
  BANK_TRANSFER     // Chuyen khoan QR
  VNPAY
  MOMO
  SEPAY
  ZALOPAY
}

enum PaymentStatus {
  UNPAID
  PAID
  REFUNDED
  PARTIALLY_REFUNDED
}

enum VoucherType {
  PERCENTAGE        // Giam %
  FIXED             // Giam so tien co dinh
  FREE_SHIPPING     // Mien phi ship
}
```

### 3.2 ERD Tom tat

```
Category 1──N Product 1──N ProductVariant
                      1──N ProductImage
                      1──N Review
                      1──N OrderItem

Customer 1──N Order 1──N OrderItem
                   1──N OrderStatusHistory
         1──N Review

Voucher 1──N Order
```

---

## 4. Cau truc thu muc

```
hello-cake/
├── .env.local                        # Secrets (DB URL, API keys)
├── .env.example                      # Template env
├── next.config.ts
├── tailwind.config.ts
├── prisma/
│   ├── schema.prisma                 # Database schema
│   ├── migrations/                   # Auto-generated
│   └── seed.ts                       # Seed data (danh muc, san pham mau)
│
├── public/
│   ├── images/                       # Static assets (logo, banner)
│   └── fonts/
│
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout (font, metadata, Toaster)
│   │   ├── page.tsx                  # Trang chu (SSG)
│   │   ├── not-found.tsx
│   │   │
│   │   ├── (shop)/                   # Route group: cua hang
│   │   │   ├── layout.tsx            # Shop layout (header, footer, cart sidebar)
│   │   │   ├── menu/
│   │   │   │   └── page.tsx          # Danh muc tat ca banh
│   │   │   ├── menu/[slug]/
│   │   │   │   └── page.tsx          # Danh muc theo loai (ISR)
│   │   │   ├── product/[slug]/
│   │   │   │   └── page.tsx          # Chi tiet san pham (ISR)
│   │   │   ├── cart/
│   │   │   │   └── page.tsx          # Gio hang
│   │   │   ├── checkout/
│   │   │   │   └── page.tsx          # Thanh toan
│   │   │   ├── order-tracking/
│   │   │   │   └── page.tsx          # Tra cuu don hang (bang SDT)
│   │   │   └── about/
│   │   │       └── page.tsx          # Gioi thieu tiem
│   │   │
│   │   ├── (admin)/                  # Route group: admin
│   │   │   ├── layout.tsx            # Admin layout (sidebar, auth guard)
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Dashboard (thong ke nhanh)
│   │   │   │   ├── products/
│   │   │   │   │   ├── page.tsx      # Danh sach san pham (DataTable)
│   │   │   │   │   ├── new/page.tsx  # Them san pham
│   │   │   │   │   └── [id]/page.tsx # Sua san pham
│   │   │   │   ├── categories/
│   │   │   │   │   └── page.tsx      # Quan ly danh muc
│   │   │   │   ├── orders/
│   │   │   │   │   ├── page.tsx      # Danh sach don hang
│   │   │   │   │   └── [id]/page.tsx # Chi tiet don hang
│   │   │   │   ├── customers/
│   │   │   │   │   └── page.tsx      # Danh sach khach hang
│   │   │   │   ├── vouchers/
│   │   │   │   │   └── page.tsx      # Quan ly voucher
│   │   │   │   ├── reports/
│   │   │   │   │   └── page.tsx      # Bao cao doanh thu
│   │   │   │   └── settings/
│   │   │   │       └── page.tsx      # Cai dat tiem
│   │   │
│   │   ├── api/                      # Route Handlers
│   │   │   ├── auth/[...all]/route.ts      # Better Auth catch-all
│   │   │   ├── products/route.ts
│   │   │   ├── orders/route.ts
│   │   │   ├── orders/[id]/status/route.ts
│   │   │   ├── cart/route.ts
│   │   │   ├── checkout/route.ts
│   │   │   ├── vouchers/validate/route.ts
│   │   │   ├── reviews/route.ts
│   │   │   ├── upload/route.ts             # Upload anh -> R2
│   │   │   ├── payment/
│   │   │   │   ├── vnpay/route.ts
│   │   │   │   ├── momo/route.ts
│   │   │   │   ├── sepay/route.ts
│   │   │   │   ├── zalopay/route.ts
│   │   │   │   └── webhook/route.ts        # Payment callback chung
│   │   │   ├── shipping/
│   │   │   │   ├── ghn/route.ts
│   │   │   │   └── ghtk/route.ts
│   │   │   ├── reports/route.ts
│   │   │   └── notify/route.ts             # Zalo/Telegram webhook
│   │   │
│   │   └── sitemap.ts                # Auto sitemap
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components (Button, Card, Dialog...)
│   │   ├── shop/                     # Shop-specific components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── CartItem.tsx
│   │   │   ├── CheckoutForm.tsx
│   │   │   ├── PaymentSelector.tsx
│   │   │   ├── DeliverySelector.tsx
│   │   │   ├── ReviewList.tsx
│   │   │   ├── ReviewForm.tsx
│   │   │   ├── VoucherInput.tsx
│   │   │   ├── CategoryNav.tsx
│   │   │   └── OrderTracker.tsx
│   │   ├── admin/                    # Admin-specific components
│   │   │   ├── AdminSidebar.tsx
│   │   │   ├── DashboardStats.tsx
│   │   │   ├── OrderTable.tsx
│   │   │   ├── ProductForm.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── RevenueChart.tsx
│   │   │   ├── OrderStatusBadge.tsx
│   │   │   └── InvoicePrint.tsx
│   │   └── shared/                   # Shared components
│   │       ├── Logo.tsx
│   │       ├── ThemeToggle.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   │
│   ├── hooks/
│   │   ├── use-cart.ts               # Zustand cart store
│   │   ├── use-auth.ts               # Auth hooks
│   │   └── use-debounce.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── auth.ts                   # Better Auth config
│   │   ├── auth-client.ts            # Client-side auth
│   │   ├── r2.ts                     # Cloudflare R2 upload
│   │   ├── payment/
│   │   │   ├── vnpay.ts
│   │   │   ├── momo.ts
│   │   │   ├── sepay.ts
│   │   │   └── zalopay.ts
│   │   ├── shipping/
│   │   │   ├── ghn.ts
│   │   │   └── ghtk.ts
│   │   ├── notify/
│   │   │   ├── telegram.ts
│   │   │   └── zalo.ts
│   │   ├── utils.ts                  # cn(), formatVND(), slugify()
│   │   └── validators.ts            # Zod schemas
│   │
│   ├── stores/
│   │   ├── cart-store.ts             # Zustand: gio hang
│   │   └── admin-store.ts           # Zustand: admin UI state
│   │
│   └── types/
│       └── index.ts                  # Shared TypeScript types
│
├── tests/
│   ├── unit/
│   └── e2e/
│
└── docs/
    └── development-rules.md
```

---

## 5. Phan chia Phase

```
Phase 1 (MVP)          Phase 2               Phase 3              Phase 4
4-5 tuan               3-4 tuan              2-3 tuan             2-3 tuan
──────────────────────────────────────────────────────────────────────────────
Catalog + Cart         Payment Gateway       Van chuyen           Desktop Admin
Checkout (COD+QR)      VNPay/MoMo/ZaloPay    GHN/GHTK/Grab       Wails app
Admin CRUD             Review system         Bao cao doanh thu    Thong bao realtime
Don hang co ban        Voucher/Ma giam gia   CRM khach hang       Facebook tich hop
Auth admin             SEO nang cao          Dat truoc nang cao   In hoa don
                       Email xac nhan        Theo doi don hang    Toi uu performance
```

---

## 6. Chi tiet tung Phase

### Phase 1: MVP Core (4-5 tuan)

**Muc tieu:** Website hoat dong duoc, khach co the xem banh va dat hang

#### Tuan 1: Setup + Catalog
- [ ] Init Next.js 15 + TypeScript + Tailwind v4 + shadcn/ui
- [ ] Setup Prisma + PostgreSQL (Neon free tier)
- [ ] Schema: Category, Product, ProductImage
- [ ] Seed data: 5-10 danh muc, 20-30 san pham mau
- [ ] API: GET products, GET product by slug, GET categories
- [ ] UI trang chu: Hero banner, danh muc noi bat, san pham bestseller
- [ ] UI trang danh muc: filter, sort, product grid
- [ ] UI trang chi tiet: gallery, thong tin, variants

#### Tuan 2: Cart + Checkout
- [ ] Zustand cart store (persist localStorage)
- [ ] Cart sidebar (them, xoa, cap nhat so luong)
- [ ] Trang checkout: form dia chi, chon phuong thuc giao hang
- [ ] Thanh toan COD (luu don hang vao DB)
- [ ] Thanh toan QR chuyen khoan (tao QR VietQR API)
- [ ] Schema: Order, OrderItem, Customer
- [ ] Trang xac nhan don hang (thank you page)

#### Tuan 3: Admin Core
- [ ] Better Auth setup (email/password admin)
- [ ] Admin layout: sidebar, header, auth guard
- [ ] Admin Dashboard: tong don hom nay, doanh thu, so san pham
- [ ] CRUD Products: DataTable, form them/sua, upload anh (R2)
- [ ] CRUD Categories: them/sua/xoa danh muc
- [ ] Quan ly don hang: danh sach, cap nhat trang thai

#### Tuan 4: Polish + Deploy
- [ ] Responsive mobile-first (tat ca trang shop)
- [ ] Dark/Light theme toggle
- [ ] Loading states, error boundaries, empty states
- [ ] SEO co ban: metadata, Open Graph, sitemap.xml
- [ ] Deploy len Vercel (hoac VPS)
- [ ] Domain + SSL
- [ ] Test manual toan bo flow

**Deliverable Phase 1:** Website ban banh hoat dong, admin quan ly duoc san pham va don hang, thanh toan COD va QR.

---

### Phase 2: Thanh toan + Review + Voucher (3-4 tuan)

#### Tuan 5-6: Payment Gateway
- [ ] Tich hop VNPay (sandbox -> production)
- [ ] Tich hop MoMo (sandbox -> production)
- [ ] Tich hop SePay (VietQR nang cao + webhook xac nhan tu dong)
- [ ] Tich hop ZaloPay
- [ ] Payment webhook handler chung (xac nhan thanh toan tu dong)
- [ ] Cap nhat trang thai don hang khi thanh toan thanh cong
- [ ] Trang ket qua thanh toan (success/fail)

#### Tuan 7: Review + Voucher
- [ ] Schema: Review, Voucher
- [ ] UI review san pham (rating 1-5 sao, viet nhan xet, upload anh)
- [ ] Admin duyet review
- [ ] Hien thi rating trung binh tren product card
- [ ] Tao/sua/xoa voucher trong admin
- [ ] Ap dung voucher tai checkout (validate server-side)
- [ ] Cac loai: giam %, giam co dinh, free ship

#### Tuan 8: SEO nang cao + Email
- [ ] JSON-LD structured data (Product, BreadcrumbList, LocalBusiness)
- [ ] Toi uu hinh anh: WebP/AVIF, srcset, lazy load
- [ ] Resend email: xac nhan don hang, cap nhat trang thai
- [ ] Template email dep (react-email)

**Deliverable Phase 2:** Da thanh toan, review san pham, ma giam gia, email thong bao.

---

### Phase 3: Van chuyen + Bao cao + CRM (2-3 tuan)

#### Tuan 9: Tich hop van chuyen
- [ ] GHN API: tao don, tinh phi ship, theo doi
- [ ] GHTK API: tao don, tinh phi ship, theo doi
- [ ] Grab Express / Be Express (neu co API)
- [ ] Tu dong tinh phi ship theo dia chi
- [ ] Webhook cap nhat trang thai giao hang

#### Tuan 10: Bao cao + CRM
- [ ] Dashboard doanh thu: bieu do theo ngay/tuan/thang (Recharts)
- [ ] Bao cao san pham ban chay
- [ ] Bao cao don hang theo trang thai
- [ ] Export CSV/Excel
- [ ] CRM: danh sach khach hang, lich su mua hang, ghi chu
- [ ] Loc khach VIP (tong chi tieu cao)

#### Tuan 11: Dat truoc nang cao + Theo doi
- [ ] Dat truoc: chon ngay gio giao, tinh lead time
- [ ] Lich san xuat cho admin (ngay nao can lam banh gi)
- [ ] Trang theo doi don hang (khach nhap SDT de xem)
- [ ] Timeline trang thai don hang

**Deliverable Phase 3:** He thong van chuyen tu dong, bao cao doanh thu, CRM co ban, dat truoc nang cao.

---

### Phase 4: Nang cao + Desktop (2-3 tuan)

#### Tuan 12: Thong bao + Facebook
- [ ] Telegram bot: gui thong bao don moi, don huy
- [ ] Zalo OA: gui thong bao cho khach
- [ ] Facebook fanpage: plugin chat, link san pham
- [ ] Facebook Pixel (tracking quang cao)

#### Tuan 13-14: Desktop Admin (Optional)
- [ ] Wails v2 app: ket noi API cua web
- [ ] Thong bao system tray khi co don moi
- [ ] In hoa don truc tiep tu desktop
- [ ] Quick actions: xac nhan don, cap nhat trang thai
- [ ] Hoat dong offline (sync khi co mang)

**Deliverable Phase 4:** Thong bao tu dong, tich hop Facebook, desktop admin app.

---

## 7. Deploy & Infrastructure

### De xuat: Phuong an toi uu chi phi

| Service | Provider | Chi phi | Ghi chu |
|---------|----------|---------|---------|
| Web App | **Vercel** (Hobby) | Mien phi | Next.js deploy 1 click, auto SSL |
| Database | **Neon** (Free) | Mien phi | 0.5 GB storage, auto-suspend |
| Redis | **Upstash** (Free) | Mien phi | 10K commands/ngay |
| File Storage | **Cloudflare R2** | ~0 | 10GB free, egress mien phi |
| Email | **Resend** (Free) | Mien phi | 100 emails/ngay |
| Domain | **.vn domain** | ~350K/nam | SEO tot hon .com cho VN |

**Tong chi phi MVP: gan nhu 0 dong/thang** (chi tra domain)

### Khi scale (100+ don/ngay)

| Service | Provider | Chi phi |
|---------|----------|---------|
| Web App | **Vercel Pro** | $20/thang |
| Database | **Neon Scale** | $19/thang |
| Redis | **Upstash Pro** | $10/thang |

### Phuong an VPS (tu quan ly)

Neu muon toan quyen kiem soat:

| Provider | Spec | Chi phi |
|----------|------|---------|
| **Vultr/DigitalOcean** (SG) | 2 vCPU, 4GB RAM | ~$24/thang |
| Cai dat | Docker + Nginx + PostgreSQL + Redis | Tu setup |
| Backup | Daily snapshot | +$4/thang |

---

## 8. Tich hop thanh toan

### Flow thanh toan chung

```
Khach chon san pham -> Checkout -> Chon phuong thuc thanh toan
                                          |
                    +---------------------+---------------------+
                    |         |            |          |          |
                   COD    QR Bank       VNPay      MoMo     ZaloPay
                    |         |            |          |          |
               Luu don   Tao QR     Redirect     Redirect   Redirect
               UNPAID    VietQR     VNPay page   MoMo app   ZaloPay
                    |         |            |          |          |
                    |    Webhook       Callback   Callback  Callback
                    |    SePay            |          |          |
                    |         |            |          |          |
                    +-----> Cap nhat PaymentStatus -> PAID
                            |
                        Gui thong bao (Telegram/Zalo/Email)
```

### Thanh toan QR (uu tien - pho bien nhat VN)

- Dung **VietQR API** (`api.vietqr.vn`) tao QR code
- Tich hop **SePay** de nhan webhook xac nhan tu dong
- Flow: Tao QR -> Khach scan -> Chuyen khoan -> SePay webhook -> Cap nhat don

### Luu y quan trong
- Gia VND **khong co thap phan** -> dung `Decimal(12, 0)`
- Luon validate gia server-side (khong tin client)
- Luu snapshot gia vao OrderItem (phong truong hop doi gia sau)
- Timeout don hang chua thanh toan: 30 phut tu dong huy

---

## 9. Tich hop van chuyen

### API Van chuyen

| Provider | API | Tinh phi | Theo doi | Ghi chu |
|----------|-----|----------|----------|---------|
| **GHN** | REST API | Co | Co | Pho bien nhat |
| **GHTK** | REST API | Co | Co | Gia re |
| **Grab** | Grab Express API | Co | Co | Giao nhanh |
| **Be** | Chua co API chinh thuc | - | - | Goi thu cong |

### Flow giao hang

```
Don xac nhan -> Admin chon phuong thuc giao
                    |
        +-----------+-----------+
        |           |           |
    Tu giao      GHN/GHTK    Grab
        |           |           |
    Cap nhat    Tao don API   Goi Grab
    thu cong    Lay ma van don   |
        |           |           |
        +-----> Webhook cap nhat trang thai
                    |
              Thong bao khach hang
```

### Tinh phi ship tu dong
- Goi API GHN/GHTK voi dia chi khach -> tra ve phi ship
- Hien thi phi ship real-time tai checkout
- Free ship cho don > X dong (config trong admin)

---

## 10. Thong bao & Lien lac

### Telegram Bot
- Tao bot qua @BotFather
- Gui thong bao khi: don moi, thanh toan xac nhan, don huy
- Format: emoji + thong tin don hang + link admin

### Zalo OA (Official Account)
- Gui ZNS (Zalo Notification Service) cho khach hang
- Template: xac nhan don, dang giao, da giao
- Can dang ky Zalo OA Business

### Email (Resend)
- Xac nhan don hang
- Cap nhat trang thai giao hang
- Marketing (newsletter - Phase 4+)

---

## 11. SEO & Performance

### SEO Strategy
- **SSG** trang chu, trang gioi thieu -> CDN cache, TTFB < 100ms
- **ISR** trang san pham, danh muc -> cap nhat moi 1h, van nhanh
- **Metadata API**: title, description, Open Graph cho moi trang
- **JSON-LD**: Product schema, LocalBusiness, BreadcrumbList
- **Sitemap** tu dong (`app/sitemap.ts`)
- **URL slug** khong dau: `/banh-kem-dau-tay` (khong phai `/bánh-kem-dâu-tây`)

### Performance
- **Next.js Image**: auto WebP/AVIF, srcset, lazy load
- **Cloudflare CDN**: cache static assets
- **Upstash Redis**: cache query nang (bao cao, thong ke)
- **Bundle size**: tree-shake, dynamic import cho admin components
- **Core Web Vitals** muc tieu: LCP < 2.5s, FID < 100ms, CLS < 0.1

---

## 12. Bao mat

### Authentication
- Better Auth: email/password cho admin
- Khach hang **khong can dang ky** - dat hang bang SDT (giam friction)
- Admin 2FA (Phase 2+)

### API Security
- Rate limiting (Upstash Redis)
- CSRF protection (Next.js built-in)
- Input validation (Zod) moi request
- SQL injection: Prisma parameterized queries
- XSS: React auto-escape, CSP headers

### Payment Security
- HTTPS only
- Webhook signature verification (moi payment gateway)
- Server-side price validation
- Khong luu thong tin the/tai khoan

### Data
- Backup database hang ngay
- Encrypt sensitive data (API keys, tokens)
- `.env` KHONG commit vao git

---

## 13. Cau hoi chua giai quyet

1. **Nhieu chi nhanh?** Hien tai plan cho 1 tiem. Neu co nhieu chi nhanh -> can them model Store, inventory per store
2. **He thong diem thuong / loyalty?** Chua co trong plan. Neu can -> Phase 5
3. **Multi-language?** Chi tieng Viet hien tai. Neu can tieng Anh -> i18n Phase 5
4. **PWA / App mobile?** Web responsive la du hay can native app? Neu can -> React Native Phase 5+
5. **E-invoice (hoa don dien tu)?** Luat yeu cau tu 2022. Tich hop GDT API khi nao?
6. **Grab/Be API:** Be chua co API chinh thuc. Grab Express API co can hop dong doanh nghiep?
7. **Zalo OA:** Can xac minh doanh nghiep. User da co Zalo OA chua?
8. **Domain:** Da co domain .vn chua? Can mua truoc khi deploy
9. **Anh san pham:** Ai chup anh? Can quy chuan kich thuoc/chat luong (1200x1200px, nen trang)
10. **Khu vuc giao hang:** Chi noi thanh HCM hay toan quoc? Anh huong den doi tac van chuyen
