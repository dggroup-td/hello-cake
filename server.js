const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3457;

// ═══ MIDDLEWARE ═══
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'src')));

// ═══ DATABASE ═══
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, 'hello-cake.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_bestseller INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT DEFAULT '',
    note TEXT DEFAULT '',
    payment_method TEXT DEFAULT 'Tiền mặt',
    items TEXT NOT NULL,
    subtotal INTEGER DEFAULT 0,
    total INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Mới',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT DEFAULT '',
    email TEXT DEFAULT '',
    birthday TEXT DEFAULT '',
    company_anniversary TEXT DEFAULT '',
    zalo TEXT DEFAULT '',
    facebook TEXT DEFAULT '',
    note TEXT DEFAULT '',
    customer_type TEXT DEFAULT 'retail',
    total_orders INTEGER DEFAULT 0,
    total_spent INTEGER DEFAULT 0,
    last_order_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    category TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    author TEXT DEFAULT 'Hello Cake',
    read_time TEXT DEFAULT '5 phút',
    tags TEXT DEFAULT '',
    is_featured INTEGER DEFAULT 0,
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS loyalty_programs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    segment TEXT NOT NULL DEFAULT 'all',
    type TEXT NOT NULL DEFAULT 'voucher',
    voucher_code TEXT,
    voucher_value INTEGER DEFAULT 0,
    voucher_type TEXT DEFAULT 'percent',
    min_order INTEGER DEFAULT 0,
    message TEXT DEFAULT '',
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS customer_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER,
    customer_phone TEXT,
    message TEXT NOT NULL,
    voucher_code TEXT,
    type TEXT DEFAULT 'promotion',
    sent_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vouchers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL DEFAULT 'percent',
    value INTEGER NOT NULL DEFAULT 0,
    min_order INTEGER DEFAULT 0,
    max_uses INTEGER DEFAULT 0,
    used_count INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    expires_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );
`);

// Seed demo data if empty
const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
if (count.c === 0) seedDemoData();

function seedDemoData() {
  // Categories
  const insertCat = db.prepare('INSERT OR IGNORE INTO categories (name, icon, sort_order) VALUES (?, ?, ?)');
  insertCat.run('Croissant', '🥐', 1);
  insertCat.run('Bánh Mì', '🍞', 2);
  insertCat.run('Tart', '🥧', 3);
  insertCat.run('Đồ Uống', '🍵', 4);

  // Products — theo menu thực tế Hello Cake
  const insertP = db.prepare('INSERT INTO products (code, name, price, stock, category, description, image_url, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  // === CROISSANT ===
  insertP.run('SP001', 'Trà Bá Tước',    69000, 50, 'Croissant', 'Kem trà earl grey thơm dịu, vị nhẹ thanh. Nhân kem trà tươi mát', '/images/products/tra-ba-tuoc.jpg', 0);
  insertP.run('SP002', 'Tiramisu',        69000, 40, 'Croissant', 'Kem mascarpone espresso đậm, rắc bột cacao. Vị cà phê Ý đậm đà', '/images/products/tiramisu.jpg', 1);
  insertP.run('SP003', 'Matcha',          69000, 40, 'Croissant', 'Kem matcha Nhật Bản đậm vị, béo ngậy tự nhiên. Thanh mát, không quá ngọt', '/images/products/matcha.jpg', 1);
  insertP.run('SP004', 'Dâu Tây',         69000, 45, 'Croissant', 'Kem dâu tươi, mứt dâu homemade chua ngọt. Dâu tươi theo mùa', '/images/products/dau-tay.jpg', 1);
  insertP.run('SP005', 'Hạnh Nhân',       64000, 30, 'Croissant', 'Kem frangipane, hạnh nhân lát giòn rang vàng. Giòn thơm, ngọt vừa phải', '/images/products/hanh-nhan.jpg', 1);
  insertP.run('SP006', 'Socola',          69000, 55, 'Croissant', 'Kem socola Bỉ đậm vị, ganache mịn mềm. Dành cho người yêu chocolate', '/images/products/socola.jpg', 0);
  insertP.run('SP007', 'Vanilla',         69000, 35, 'Croissant', 'Kem vanilla Madagascar thơm, béo tự nhiên. Classic — không bao giờ lỗi mốt', '/images/products/vanilla.jpg', 1);
  insertP.run('SP008', 'Ruby',            69000, 42, 'Croissant', 'Socola Ruby hồng tự nhiên, vị nhẹ berry. Màu hồng đẹp, độc đáo', '/images/products/ruby.jpg', 0);
  insertP.run('SP009', 'Việt Quất',       69000, 35, 'Croissant', 'Kem việt quất tươi, sốt berry chua ngọt. Màu tím đặc trưng, giàu antioxidant', '/images/products/viet-quat.jpg', 1);
  insertP.run('SP010', 'Vani Xoài',       74000, 30, 'Croissant', 'Kem vanilla & xoài Cát tươi ngọt lịm. Hương xoài nhiệt đới đặc trưng', '/images/products/vani-xoai.jpg', 0);

  // === BÁNH MÌ ===
  insertP.run('SP011', 'Pain Suisee',     64000, 50, 'Bánh Mì', 'Nhân kem custard sữa mềm mịn kiểu Thụy Sĩ. Vỏ giòn nhiều lớp, nhân béo ngậy', '/images/products/pain-suisee.jpg', 0);
  insertP.run('SP012', 'Truyền Thống',    49000, 60, 'Bánh Mì', 'Bơ Pháp nguyên chất, vỏ vàng giòn rum. Đơn giản mà đỉnh cao', '/images/products/truyen-thong.jpg', 0);

  // === TART ===
  insertP.run('SP013', 'Tart Dưa Lưới',  129000, 15, 'Tart', 'Kem tươi dưa lưới mát lạnh, trái dưa tươi ngọt. Thanh mát, giải nhiệt mùa hè', '/images/products/tart-dua-luoi.jpg', 1);
  insertP.run('SP014', 'Tart Xoài',      129000, 18, 'Tart', 'Kem xoài Cát Hòa Lộc, xoài tươi miếng lớn. Ngọt tự nhiên, không cần thêm đường', '/images/products/tart-xoai.jpg', 1);
  insertP.run('SP015', 'Tart Chuối',     129000, 20, 'Tart', 'Kem chuối caramel, chuối tươi lát mỏng. Béo ngậy, thơm mùi caramel', '/images/products/tart-chuoi.jpg', 1);
  insertP.run('SP016', 'Tart Nama',      129000, 12, 'Tart', 'Nama chocolate Nhật, ganache tan mềm chảy. Đậm vị sang trọng', '/images/products/tart-nama.jpg', 0);

  // === ĐỒ UỐNG ===
  insertP.run('SP017', 'Latte Matcha',   39000, 80, 'Đồ Uống', 'Matcha Nhật xay tươi, sữa tươi, kem bọt mềm. Vị trà thuần khiết, không thêm đường', '/images/products/latte-matcha.jpg', 0);

  // === DEMO DATA: 30 ngày, ~300 đơn, doanh thu ~1 tỷ ===
  const insertO = db.prepare('INSERT INTO orders (order_code, customer_name, customer_phone, customer_address, payment_method, items, subtotal, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const insertC2 = db.prepare('INSERT INTO customers (name, phone, address, email, birthday, company_anniversary, zalo, facebook, note, customer_type, total_orders, total_spent, last_order_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)');

  const demoCustomers = [
    { name: 'Nguyễn Thị Lan', phone: '0901234567', addr: 'Tòa S2.08 Ocean Park' },
    { name: 'Trần Văn Minh', phone: '0912345678', addr: 'Tòa S1.05 Ocean Park' },
    { name: 'Lê Hương Giang', phone: '0923456789', addr: 'Tòa S3.12 Ocean Park' },
    { name: 'Phạm Đức Huy', phone: '0934567890', addr: 'Tòa S2.01 Ocean Park' },
    { name: 'Hoàng Thanh Mai', phone: '0945678901', addr: 'Tòa S2.20 Ocean Park' },
    { name: 'Ngô Quỳnh Anh', phone: '0956789012', addr: 'Tòa S1.18 Ocean Park' },
    { name: 'Đỗ Minh Tuấn', phone: '0967890123', addr: 'Tòa S3.06 Ocean Park' },
    { name: 'Vũ Hồng Nhung', phone: '0978901234', addr: 'Ngõ 5 Gia Lâm' },
    { name: 'Bùi Anh Tú', phone: '0989012345', addr: 'Tòa S2.15 Ocean Park' },
    { name: 'Lý Thị Hà', phone: '0990123456', addr: 'Phố Yên Viên, Gia Lâm' },
    { name: 'Café Bình Minh', phone: '0381234567', addr: 'Số 12 Ngọc Lâm, Long Biên' },
    { name: 'Quán Café Mây', phone: '0392345678', addr: '88 Trâu Quỳ, Gia Lâm' },
    { name: 'Trà Sữa Sunny', phone: '0353456789', addr: 'Tầng 1 TTTM Ocean Park' },
    { name: 'Bakery Minh Châu', phone: '0364567890', addr: '25 Dương Xá, Gia Lâm' },
    { name: 'Phan Thị Ngọc', phone: '0375678901', addr: 'Tòa S1.22 Ocean Park' },
    { name: 'Trương Hoàng Nam', phone: '0316789012', addr: 'Đa Tốn, Gia Lâm' },
    { name: 'Đinh Thùy Linh', phone: '0327890123', addr: 'Tòa S3.09 Ocean Park' },
    { name: 'Văn phòng ABC Corp', phone: '0338901234', addr: 'Tầng 5 Tòa S2 Ocean Park' },
    { name: 'Nguyễn Đức Anh', phone: '0349012345', addr: 'Kiêu Kỵ, Gia Lâm' },
    { name: 'Café Latte Art', phone: '0350123456', addr: '15 Cổ Bi, Gia Lâm' },
  ];

  const demoProducts = [
    { name: 'Trà Bá Tước', price: 69000 }, { name: 'Tiramisu', price: 69000 },
    { name: 'Matcha', price: 69000 }, { name: 'Dâu Tây', price: 69000 },
    { name: 'Hạnh Nhân', price: 64000 }, { name: 'Socola', price: 69000 },
    { name: 'Vanilla', price: 69000 }, { name: 'Ruby', price: 69000 },
    { name: 'Việt Quất', price: 69000 }, { name: 'Vani Xoài', price: 74000 },
    { name: 'Pain Suisee', price: 64000 }, { name: 'Truyền Thống', price: 49000 },
    { name: 'Tart Dưa Lưới', price: 129000 }, { name: 'Tart Xoài', price: 129000 },
    { name: 'Tart Chuối', price: 129000 }, { name: 'Tart Nama', price: 129000 },
    { name: 'Latte Matcha', price: 39000 },
  ];
  const payments = ['Tiền mặt', 'Chuyển khoản', 'COD'];
  const statuses = ['Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Hoàn thành', 'Đang làm', 'Mới', 'Hủy'];

  // Tạo 300 đơn hàng trong 30 ngày (~1.2 tỷ doanh thu)
  const custStats = {};
  for (let i = 1; i <= 300; i++) {
    const c = demoCustomers[Math.floor(Math.random() * demoCustomers.length)];
    const numItems = 3 + Math.floor(Math.random() * 7);
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const p = demoProducts[Math.floor(Math.random() * demoProducts.length)];
      const qty = 3 + Math.floor(Math.random() * 15);
      items.push({ name: p.name, qty, price: p.price });
    }
    const total = items.reduce((s, it) => s + it.price * it.qty, 0);
    const day = Math.floor(Math.random() * 30);
    const hour = 7 + Math.floor(Math.random() * 14);
    const min = Math.floor(Math.random() * 60);
    const date = new Date(2026, 2, 29 - day, hour, min);
    const dateStr = date.toISOString().replace('T', ' ').slice(0, 19);
    const status = i <= 5 ? ['Mới', 'Mới', 'Mới', 'Đang làm', 'Đang làm'][i - 1] : statuses[Math.floor(Math.random() * statuses.length)];
    const code = 'HC-' + String(i).padStart(3, '0');
    const pay = payments[Math.floor(Math.random() * payments.length)];

    insertO.run(code, c.name, c.phone, c.addr, pay, JSON.stringify(items), total, total, status, dateStr);

    if (!custStats[c.phone]) custStats[c.phone] = { name: c.name, phone: c.phone, addr: c.addr, orders: 0, spent: 0, last: dateStr };
    custStats[c.phone].orders++;
    custStats[c.phone].spent += total;
    if (dateStr > custStats[c.phone].last) custStats[c.phone].last = dateStr;
  }

  // Tạo customers đa dạng: VIP, Thường, Mới, Ngủ đông
  const custFull = [
    // VIP (5+ đơn) — từ custStats
    ...Object.values(custStats).filter(c => c.orders >= 5).map(c => ({ ...c, type: (function(){ const l=c.name.toLowerCase(); if(['văn phòng','corp','công ty'].some(k=>l.includes(k))) return 'biz'; if(['café','cafe','quán','bakery','trà sữa','đại lý'].some(k=>l.includes(k))) return 'partner'; return 'retail'; })() })),
    // Thường (2-4 đơn) — thêm khách mới
    { name:'Đặng Thị Hoa', phone:'0701111111', addr:'Tòa S1.03 Ocean Park', orders:3, spent:450000, last:'2026-03-25', type:'retail' },
    { name:'Lưu Văn Bình', phone:'0702222222', addr:'Ngõ 3 Trâu Quỳ', orders:2, spent:280000, last:'2026-03-20', type:'retail' },
    { name:'Trịnh Thùy Dương', phone:'0703333333', addr:'Tòa S3.15 Ocean Park', orders:4, spent:620000, last:'2026-03-28', type:'retail' },
    { name:'Café Sách Hà Đông', phone:'0704444444', addr:'25 Nguyễn Trãi, Hà Đông', orders:3, spent:1850000, last:'2026-03-22', type:'partner' },
    // Mới (1 đơn) — chưa quay lại
    { name:'Hoàng Minh Khôi', phone:'0711111111', addr:'Tòa S2.22 Ocean Park', orders:1, spent:138000, last:'2026-03-29', type:'retail' },
    { name:'Nguyễn Thanh Tâm', phone:'0712222222', addr:'Dương Xá, Gia Lâm', orders:1, spent:195000, last:'2026-03-28', type:'retail' },
    { name:'Phạm Thị Yến', phone:'0713333333', addr:'Kiêu Kỵ, Gia Lâm', orders:1, spent:69000, last:'2026-03-27', type:'retail' },
    { name:'Café Mộc Bắc Ninh', phone:'0714444444', addr:'12 Lý Thái Tổ, TP Bắc Ninh', orders:1, spent:2500000, last:'2026-03-26', type:'partner' },
    { name:'Công ty TNHH Greenfield', phone:'0715555555', addr:'Tầng 8, 35 Lê Văn Lương', orders:1, spent:4200000, last:'2026-03-25', type:'biz' },
    // Ngủ đông (>30 ngày chưa mua)
    { name:'Vương Thị Nga', phone:'0721111111', addr:'Tòa S1.10 Ocean Park', orders:6, spent:890000, last:'2026-02-10', type:'retail' },
    { name:'Tạ Quốc Đạt', phone:'0722222222', addr:'Cổ Bi, Gia Lâm', orders:3, spent:420000, last:'2026-01-28', type:'retail' },
    { name:'Quán Trà Chanh 36', phone:'0723333333', addr:'36 Phố Cổ Bi', orders:8, spent:3200000, last:'2026-02-05', type:'partner' },
  ];

  const custExtras = {
    '0901234567': { email:'lan.nguyen@gmail.com', birthday:'1995-06-15', note:'Thích Matcha, hay đặt cho con gái' },
    '0912345678': { email:'minh.tran@outlook.com', birthday:'1990-11-20', note:'Đặt sỉ cho bạn bè cuối tuần' },
    '0923456789': { email:'giang.le92@gmail.com', birthday:'1992-04-08', note:'Hay gọi thêm Latte Matcha' },
    '0934567890': { email:'huy.pham@gmail.com', birthday:'1988-09-25', note:'Khách VIP, mua tặng đối tác' },
    '0945678901': { email:'mai.hoang@yahoo.com', birthday:'1997-12-01', note:'Fan Ruby + Tiramisu' },
    '0956789012': { email:'quynhanh.ngo@gmail.com', birthday:'1994-03-18', zalo:'0956789012', note:'Fan Dâu Tây + Vanilla' },
    '0967890123': { email:'tuan.do@hotmail.com', birthday:'1991-07-30', note:'Hay đặt Tart cho tiệc' },
    '0978901234': { email:'nhung.vu88@gmail.com', birthday:'1988-02-14', note:'Đặt combo Valentine hàng năm' },
    '0989012345': { email:'tu.bui@gmail.com', birthday:'1993-08-22', note:'Thích thử vị mới' },
    '0990123456': { email:'ha.ly@gmail.com', birthday:'1996-10-05', note:'Ở xa, hay đặt ship' },
    '0381234567': { email:'cafebinhminh@gmail.com', company_anniversary:'2024-01-15', note:'Quán café 30 chỗ, đặt 20 chiếc/ngày', facebook:'cafebinhminh.lb' },
    '0392345678': { email:'quancafemay@gmail.com', company_anniversary:'2023-06-20', note:'Đối tác sỉ, giao 6h sáng', facebook:'cafemay.gl' },
    '0353456789': { email:'trasua.sunny@gmail.com', company_anniversary:'2025-03-01', note:'Chuỗi 2 chi nhánh Ocean Park' },
    '0364567890': { email:'bakery.minhchau@gmail.com', company_anniversary:'2022-09-10', note:'Đại lý, chiết khấu 25%', zalo:'0364567890' },
    '0375678901': { email:'ngoc.phan@gmail.com', birthday:'1999-05-28', note:'Sinh viên, hay mua combo rẻ' },
    '0316789012': { email:'nam.truong@gmail.com', birthday:'1987-01-12', note:'Đặt party cuối tháng' },
    '0327890123': { email:'linh.dinh@gmail.com', birthday:'1995-11-03', note:'Review trên Facebook, tặng voucher' },
    '0338901234': { email:'hr@abccorp.vn', company_anniversary:'2020-04-01', note:'VP 50 người, đặt tiệc SN hàng tháng', facebook:'abccorp.vn' },
    '0349012345': { email:'anh.nguyen.d@gmail.com', birthday:'1992-06-18', note:'Mua tặng bạn gái' },
    '0350123456': { email:'latteart.cafe@gmail.com', company_anniversary:'2024-08-15', note:'Quán specialty coffee, cần croissant cao cấp', zalo:'0350123456' },
    '0701111111': { email:'hoa.dang@gmail.com', birthday:'1994-04-02', note:'Mới biết qua Facebook' },
    '0702222222': { email:'binh.luu@gmail.com', birthday:'1990-08-15', note:'Hàng xóm, hay mua sáng' },
    '0703333333': { email:'duong.trinh@gmail.com', birthday:'1996-03-30', note:'Đặt nhiều Tart' },
    '0704444444': { email:'cafesach.hd@gmail.com', company_anniversary:'2025-02-01', note:'Quán café sách, 40 chỗ, cần bánh mỗi sáng' },
    '0711111111': { email:'khoi.hoang99@gmail.com', birthday:'1999-07-20', note:'Khách mới, cần follow up' },
    '0712222222': { email:'tam.nguyen@gmail.com', birthday:'1991-12-10', note:'Mới thử lần đầu, mua Dâu Tây' },
    '0713333333': { email:'yen.pham@gmail.com', birthday:'2000-01-15', note:'Sinh viên, mua 1 chiếc Hạnh Nhân' },
    '0714444444': { email:'cafemoc.bn@gmail.com', company_anniversary:'2023-11-01', note:'Quán café Bắc Ninh, muốn làm đại lý' },
    '0715555555': { email:'mua@greenfield.vn', company_anniversary:'2020-06-15', note:'Đặt 60 chiếc cho event công ty' },
    '0721111111': { email:'nga.vuong@gmail.com', birthday:'1993-09-08', note:'Ngủ đông >30 ngày, gửi MISSYOU20' },
    '0722222222': { email:'dat.ta@gmail.com', birthday:'1989-05-22', note:'Lâu chưa quay lại' },
    '0723333333': { email:'trachanh36@gmail.com', company_anniversary:'2022-04-10', note:'Đối tác cũ, ngưng đặt từ T2/2026' },
  };

  for (const c of custFull) {
    const ext = custExtras[c.phone] || {};
    insertC2.run(c.name, c.phone, c.addr, ext.email||'', ext.birthday||'', ext.company_anniversary||'', ext.zalo||'', ext.facebook||'', ext.note||'', c.type, c.orders, c.spent, c.last);
  }

  // Blog posts
  const insertB = db.prepare('INSERT INTO blog_posts (title, excerpt, content, category, image_url, author, read_time, tags, is_featured, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');

  // === BÀI 1: Croissant giòn rụm ===
  insertB.run(
    'Bí quyết làm Croissant giòn rụm tại nhà',
    'Hướng dẫn chi tiết từng bước để bạn có thể làm croissant hoàn hảo với 27 lớp bơ giòn tan.',
    '<h3>Nguyên liệu cần chuẩn bị</h3><p>Bột mì cường lực 500g, bơ lạt Président 250g, men instant 7g, đường 50g, muối 10g, sữa tươi 280ml, trứng 1 quả.</p><h3>Các bước thực hiện</h3><p><strong>Bước 1:</strong> Trộn bột mì, đường, muối, men. Thêm sữa ấm 35°C, nhào 8 phút đến bột mịn. Ủ lần 1 trong 2 giờ ở nhiệt phòng.</p><p><strong>Bước 2:</strong> Bơ cán thành tấm vuông 15x15cm, giữ lạnh 4°C. Bọc bơ vào bột đã cán dài, gấp 3 lần — mỗi lần gấp tạo thêm 3 lớp.</p><p><strong>Bước 3:</strong> Nghỉ bột trong tủ lạnh 30 phút giữa mỗi lần gấp. Tổng 3 lần gấp = 27 lớp bơ.</p><p><strong>Bước 4:</strong> Cán bột dày 4mm, cắt tam giác đáy 9cm. Cuộn từ đáy lên đỉnh, uốn cong hai đầu.</p><p><strong>Bước 5:</strong> Ủ nở lần cuối 90 phút ở 28°C. Phết trứng lên mặt.</p><p><strong>Bước 6:</strong> Nướng 200°C trong 15-18 phút đến vàng đều.</p><div class="tip"><strong>Mẹo quan trọng:</strong> Nhiệt độ bơ phải luôn dưới 16°C khi cán. Nếu bơ bắt đầu mềm, DỪNG NGAY và cho vào tủ lạnh 15 phút. Bơ chảy = croissant bẹp!</div>',
    'Kỹ thuật', '/images/blog/croissant-guide.jpg', 'Chef Hà', '8 phút',
    'croissant,kỹ thuật,bơ pháp,handmade', 1, '2026-03-28'
  );

  // === BÀI 2: Chọn bơ Pháp ===
  insertB.run(
    'Cách chọn bơ Pháp chuẩn cho bánh',
    'Không phải loại bơ nào cũng phù hợp cho croissant. Tìm hiểu tiêu chí chọn bơ đúng cách.',
    '<h3>Tại sao bơ quan trọng?</h3><p>Bơ chiếm tới 40% khối lượng croissant. Chất lượng bơ quyết định 80% hương vị và độ giòn của thành phẩm.</p><h3>Tiêu chí chọn bơ</h3><ul><li><strong>Hàm lượng chất béo:</strong> Từ 82% trở lên (bơ VN thường chỉ 72-78%)</li><li><strong>Loại bơ:</strong> Bơ lạt (unsalted), không muối</li><li><strong>Dạng bơ:</strong> Tấm (sheet butter) dễ cán, ít vỡ hơn bơ thỏi</li><li><strong>Thương hiệu uy tín:</strong> Président, Isigny Sainte-Mère, Elle & Vire, Lescure</li></ul><h3>Cách test bơ tại nhà</h3><p>Bẻ đôi miếng bơ lạnh: bơ tốt sẽ bẻ gãy giòn, không dính tay. Bơ kém sẽ mềm nhũn, dính.</p><div class="tip"><strong>Hello Cake sử dụng:</strong> Bơ Président 82% nhập trực tiếp từ Pháp — đảm bảo 27 lớp giòn tan hoàn hảo.</div>',
    'Nguyên liệu', '/images/blog/butter-guide.jpg', 'Chef Hà', '5 phút',
    'nguyên liệu,bơ,chất lượng,président', 0, '2026-03-26'
  );

  // === BÀI 3: Tart trái cây ===
  insertB.run(
    'Công thức Tart trái cây mùa hè',
    'Tart giòn, cream mềm mịn kết hợp trái cây tươi — món tráng miệng hoàn hảo cho mùa nóng.',
    '<h3>Vỏ tart giòn (Pâte Sucrée)</h3><p>Bột mì 200g, bơ lạnh 100g, đường bột 60g, trứng 1 quả, vani 1 thìa. Trộn nhanh tay theo kiểu "sablage" — không nhào quá kỹ để giữ giòn.</p><h3>Cream Patisserie</h3><p>Sữa tươi 500ml, lòng đỏ 4 quả, đường 100g, bột ngô 40g, vani. Nấu lửa nhỏ, khuấy đều đến khi sệt mịn. Phủ màng bọc sát mặt, để nguội.</p><h3>Topping trái cây</h3><p>Dưa lưới Hokkaido, xoài Cát Hòa Lộc, kiwi, dâu tây — cắt lát mỏng 2mm, xếp hình xoáy ốc từ ngoài vào trong.</p><h3>Lắp ráp</h3><p>Vỏ tart nướng xong → phết lớp socola trắng tan chảy lên đáy → đổ cream → xếp trái cây → phết gel bóng.</p><div class="tip"><strong>Bí quyết Hello Cake:</strong> Lớp socola trắng giữa vỏ và cream là "barrier" — giữ vỏ giòn tới 48 giờ thay vì bị ỉu sau 4 tiếng.</div>',
    'Công thức', '/images/blog/tart-recipe.jpg', 'Chef Lan', '6 phút',
    'tart,trái cây,mùa hè,công thức,cream', 1, '2026-03-24'
  );

  // === BÀI 4: Bảo quản bánh ===
  insertB.run(
    '5 mẹo bảo quản bánh tươi lâu',
    'Làm sao để bánh croissant vẫn giòn sau 1-2 ngày? Đây là những mẹo từ Chef chuyên nghiệp.',
    '<h3>1. Bọc kín trong túi zip</h3><p>Loại bỏ hết không khí trước khi đóng kín. Không dùng túi nilon thường — dễ đọng hơi nước.</p><h3>2. Bảo quản ở nhiệt phòng (không phải tủ lạnh!)</h3><p>Nhiều người lầm tưởng tủ lạnh giữ tươi, nhưng thực tế: lạnh khiến tinh bột thoái hóa (retrogradation), bánh dai và cứng. Croissant giữ giòn tốt nhất ở 20-25°C.</p><h3>3. Hâm nóng đúng cách</h3><p>Xịt nhẹ nước lên mặt bánh, nướng 180°C trong 3-5 phút. Nước bốc hơi sẽ "phục hồi" các lớp giòn.</p><h3>4. Không xếp chồng</h3><p>Mỗi chiếc croissant cần không gian riêng. Xếp chồng = ép bẹp + đọng ẩm.</p><h3>5. Đông đá nếu để lâu hơn 2 ngày</h3><p>Bọc kín từng chiếc bằng màng bọc + túi zip. Trữ đông tới 1 tháng. Rã đông tự nhiên 30 phút rồi nướng lại.</p><div class="tip"><strong>Quy tắc vàng:</strong> Croissant ngon nhất trong 4 giờ đầu sau khi nướng. Đây là lý do Hello Cake nướng mới mỗi sáng!</div>',
    'Mẹo hay', '/images/blog/storage-tips.jpg', 'Chef Hà', '4 phút',
    'bảo quản,mẹo,croissant,tươi lâu', 0, '2026-03-22'
  );

  // === BÀI 5: Matcha Nhật vs TQ ===
  insertB.run(
    'Matcha Nhật Bản vs Matcha Trung Quốc — Khác biệt thật sự',
    'Sự khác biệt lớn giữa hai loại matcha phổ biến nhất và cách nhận biết matcha chất lượng.',
    '<h3>Nguồn gốc và quy trình</h3><p>Matcha Nhật Bản (Uji, Nishio, Kagoshima) được che nắng 20-30 ngày trước thu hoạch, tạo vị umami đặc trưng và màu xanh sáng. Lá trà hấp ngay sau thu hoạch, sấy khô, loại bỏ gân lá, nghiền bằng cối đá granite (10g/giờ).</p><p>Matcha Trung Quốc thường thu hoạch không che nắng, rang (thay vì hấp), và nghiền bằng máy — nhanh hơn nhưng mất hương.</p><h3>Cách nhận biết bằng mắt thường</h3><ul><li><strong>Màu sắc:</strong> Nhật = xanh lá sáng vivid; TQ = xanh vàng hoặc xanh xỉn</li><li><strong>Mùi:</strong> Nhật = thơm cỏ tươi, kem, umami; TQ = đắng gắt, hơi tanh</li><li><strong>Kết cấu:</strong> Nhật = mịn như phấn, 5-10 micron; TQ = thô hơn, hạt to</li><li><strong>Giá:</strong> Nhật ceremonial grade: 800k-2tr/100g; TQ: 100-300k/100g</li></ul><h3>Test nhanh tại nhà</h3><p>Pha 2g matcha + 60ml nước 80°C. Matcha Nhật tạo bọt mịn đẹp, vị ngọt hậu. Matcha TQ bọt thô, đắng.</p><div class="tip"><strong>Hello Cake sử dụng:</strong> Matcha Ceremonial Grade từ Uji, Kyoto — cùng loại dùng trong trà đạo Nhật Bản. Đây là lý do croissant Matcha của chúng mình có màu xanh sáng tự nhiên.</div>',
    'Nguyên liệu', '/images/blog/matcha-compare.jpg', 'Chef Hà', '7 phút',
    'matcha,nguyên liệu,nhật bản,so sánh', 0, '2026-03-20'
  );

  // === BÀI 6: Lịch sử Croissant ===
  insertB.run(
    'Lịch sử Croissant — Hành trình từ Áo đến Pháp',
    'Hành trình thú vị của chiếc bánh sừng bò từ Vienna đến Paris và trở thành biểu tượng ẩm thực thế giới.',
    '<h3>Nguồn gốc tại Áo (thế kỷ 13)</h3><p>Kipferl — tiền thân của croissant — xuất hiện từ thế kỷ 13 tại Vienna. Bánh hình lưỡi liềm, làm từ bột mì đơn giản, không có lớp bơ.</p><h3>Truyền thuyết 1683</h3><p>Tương truyền, sau khi quân Ottoman thất bại tại Vienna, các thợ bánh đã làm kipferl hình trăng lưỡi liềm (biểu tượng Ottoman) để ăn mừng chiến thắng.</p><h3>Đến Paris (1838)</h3><p>August Zang — doanh nhân người Áo — mở "Boulangerie Viennoise" tại số 92 Rue de Richelieu, Paris. Ông giới thiệu kipferl, người Pháp mê mẩn và bắt đầu cải tiến.</p><h3>Croissant hiện đại (1920s)</h3><p>Người Pháp sáng tạo ra "croissant au beurre" — kết hợp kipferl với kỹ thuật pâte feuilletée (bột ngàn lớp). 27 lớp bơ xen kẽ bột tạo nên sự giòn tan huyền thoại.</p><h3>Ngày nay</h3><p>Croissant là biểu tượng ẩm thực Pháp, được UNESCO công nhận. Mỗi năm, người Pháp tiêu thụ 30 triệu chiếc croissant!</p><div class="tip"><strong>Fun fact:</strong> Croissant "thật" phải có hình thoi thẳng (chứ không cong). Bánh cong = dùng margarine. Bánh thẳng = dùng bơ thật!</div>',
    'Kỹ thuật', '/images/blog/croissant-history.jpg', 'Chef Lan', '7 phút',
    'lịch sử,croissant,văn hóa,pháp,áo', 0, '2026-03-18'
  );

  // === BÀI 7 (MỚI): Bí mật Tiramisu ===
  insertB.run(
    'Bí mật đằng sau Tiramisu Croissant hoàn hảo',
    'Kết hợp hai huyền thoại — Tiramisu Ý và Croissant Pháp. Đây là công thức độc quyền của Hello Cake.',
    '<h3>Tại sao Tiramisu + Croissant?</h3><p>Tiramisu có vị đắng espresso, ngọt mascarpone, thơm cacao — tất cả hòa quyện tuyệt vời với lớp bơ giòn của croissant. Thay vì dùng bánh savoiardi (ladyfinger), chúng tôi biến croissant thành "vỏ bọc" cho nhân tiramisu.</p><h3>Nhân Tiramisu đặc biệt</h3><ul><li><strong>Mascarpone cream:</strong> Mascarpone Galbani (Ý) 200g + đường 40g + lòng đỏ 2 quả — đánh mịn, không vón</li><li><strong>Espresso syrup:</strong> 2 shot espresso + 30g đường + 1 thìa Marsala wine — tẩm vào lòng croissant</li><li><strong>Cacao topping:</strong> Bột cacao Valrhona rắc qua rây mịn</li></ul><h3>Quy trình lắp ráp</h3><p>Croissant nướng chín → cắt ngang → tẩm espresso syrup lên mặt cắt → pipe mascarpone cream → đậy nắp → rắc cacao → ướp lạnh 2 giờ.</p><div class="tip"><strong>Bí mật Chef Hà:</strong> Ướp lạnh 2 giờ là bước quan trọng nhất! Cream thấm vào các lớp croissant, tạo kết cấu "melt-in-mouth" mà ăn ngay không có được.</div>',
    'Công thức', '/images/blog/tiramisu-secret.jpg', 'Chef Hà', '6 phút',
    'tiramisu,công thức,croissant,espresso,mascarpone', 1, '2026-03-27'
  );

  // === BÀI 8 (MỚI): Nghệ thuật Cream ===
  insertB.run(
    'Nghệ thuật pipe cream — Từ cơ bản đến nâng cao',
    'Hướng dẫn 5 kỹ thuật pipe cream phổ biến nhất trong nghề bánh, từ đơn giản đến chuyên nghiệp.',
    '<h3>1. Kỹ thuật cơ bản: Rosette</h3><p>Dùng đui sao 1M. Bắt đầu từ tâm, xoay tay ra ngoài theo chiều kim đồng hồ. Áp lực đều — không bóp mạnh rồi nhẹ.</p><h3>2. Kỹ thuật Shell (vỏ sò)</h3><p>Đui sao 1M, nghiêng 45°. Bóp mạnh → nhẹ → kéo → dừng. Lặp lại tạo hàng vỏ sò đều.</p><h3>3. Kỹ thuật Ruffle (xếp nếp)</h3><p>Đui petal 104. Cạnh mỏng hướng lên, di chuyển lên-xuống tạo sóng. Phù hợp trang trí hoa.</p><h3>4. Kỹ thuật Drop flower</h3><p>Đui 2D. Bóp đều tại chỗ → nhấc lên nhanh. Mỗi bông = 1 giây. Đơn giản nhưng hiệu quả.</p><h3>5. Kỹ thuật nâng cao: Ombré</h3><p>Pha 3 mức màu cream (đậm → nhạt). Pipe từng hàng từ dưới lên, blend bằng spatula. Tạo hiệu ứng gradient tuyệt đẹp.</p><div class="tip"><strong>Mẹo vàng:</strong> Cream quá mềm sẽ không giữ form. Nhiệt độ cream lý tưởng: 18-20°C. Nếu cream chảy, cho vào tủ lạnh 10 phút rồi pipe lại.</div>',
    'Kỹ thuật', '/images/blog/cream-art.jpg', 'Chef Lan', '5 phút',
    'cream,kỹ thuật,trang trí,pipe,nâng cao', 0, '2026-03-25'
  );

  // === BÀI 9 (MỚI): Dâu tây mùa nào? ===
  insertB.run(
    'Dâu tây Đà Lạt — Mùa nào ngon nhất?',
    'Tìm hiểu chu kỳ mùa vụ dâu tây và cách chọn dâu tươi nhất cho bánh.',
    '<h3>Chu kỳ mùa dâu tây Đà Lạt</h3><p>Dâu tây Đà Lạt có 2 mùa chính: <strong>Tháng 11 - Tháng 3</strong> (mùa chính, dâu ngọt nhất) và <strong>Tháng 5 - Tháng 7</strong> (mùa phụ, sản lượng ít hơn). Tháng 12-2 là đỉnh cao — dâu to, ngọt, thơm, ít chua.</p><h3>3 giống dâu phổ biến</h3><ul><li><strong>Mara des Bois (Pháp):</strong> Nhỏ, thơm dữ, vị chua ngọt cân bằng — Hello Cake dùng loại này</li><li><strong>Akihime (Nhật):</strong> To, đỏ sáng, rất ngọt, ít chua</li><li><strong>Camarosa (Mỹ):</strong> Cứng, bảo quản tốt, vị trung tính</li></ul><h3>Cách chọn dâu tươi</h3><ul><li>Cuống xanh, lá tươi (không héo)</li><li>Đỏ đều từ cuống đến đuôi (không có phần trắng/xanh)</li><li>Hương thơm rõ khi đưa lên mũi</li><li>Thịt cứng, không bị bầm hoặc mềm nhũn</li></ul><div class="tip"><strong>Tại Hello Cake:</strong> Chúng mình nhập dâu Mara des Bois trực tiếp từ farm ở Đà Lạt mỗi tuần. Ngoài mùa, dâu được thay bằng mứt dâu homemade nấu từ dâu mùa chính — giữ nguyên hương vị tươi.</div>',
    'Nguyên liệu', '/images/blog/strawberry-cake.jpg', 'Chef Hà', '5 phút',
    'dâu tây,nguyên liệu,đà lạt,mùa vụ', 0, '2026-03-23'
  );

  // === BÀI 10 (MỚI): Pain Suisee ===
  insertB.run(
    'Pain Suisee — Bánh mì Thụy Sĩ với custard mềm mịn',
    'Tất tần tật về Pain Suisee: nguồn gốc, công thức, và tại sao nó trở thành best seller tại Hello Cake.',
    '<h3>Pain Suisee là gì?</h3><p>"Pain Suisse" (bánh mì Thụy Sĩ) thực ra là sáng tạo của người Pháp! Tên gọi "Suisse" (Thụy Sĩ) ám chỉ nhân custard cream — liên tưởng đến sữa Thụy Sĩ nổi tiếng.</p><h3>Cấu trúc đặc biệt</h3><ul><li><strong>Vỏ ngoài:</strong> Bột croissant ngàn lớp, giòn tan</li><li><strong>Nhân trong:</strong> Crème pâtissière (custard cream) mềm mịn + chocolate chips</li><li><strong>Kết hợp:</strong> Giòn bên ngoài, mềm mịn bên trong, ngọt thanh</li></ul><h3>Công thức custard cream</h3><p>Sữa tươi 500ml + đường 100g + lòng đỏ 4 quả + bột ngô 40g + vani. Nấu khuấy đều lửa nhỏ đến khi sệt. Thêm 20g bơ khi còn nóng — tạo độ bóng mượt.</p><h3>Tạo hình</h3><p>Cán bột croissant thành chữ nhật 10x20cm → phết custard → rải chocolate chips → cuộn chặt → cắt ngang lộ mặt cắt xoáy đẹp → ủ nở → nướng 190°C 18 phút.</p><div class="tip"><strong>Fun fact:</strong> Tại Hello Cake, Pain Suisee là sản phẩm "ẩn" — không nằm trong danh mục Croissant mà là Bánh Mì. Nhiều khách mua thử rồi "nghiện" vì vị custard tan chảy!</div>',
    'Công thức', '/images/blog/bread-baking.jpg', 'Chef Hà', '6 phút',
    'pain suisee,bánh mì,custard,công thức', 1, '2026-03-21'
  );

  // === BÀI 11 (MỚI): Thế giới Socola ===
  insertB.run(
    'Thế giới Socola — Từ hạt cacao đến thanh chocolate',
    'Hiểu rõ sự khác biệt giữa các loại socola và tại sao socola Bỉ được coi là đỉnh cao.',
    '<h3>3 loại socola chính</h3><ul><li><strong>Dark chocolate (55-85% cacao):</strong> Đắng, đậm, ít ngọt. Dùng cho ganache, tart nama</li><li><strong>Milk chocolate (30-45% cacao):</strong> Ngọt vừa, có sữa. Phổ biến nhất</li><li><strong>White chocolate (0% cacao, 20%+ bơ cacao):</strong> Ngọt, béo, vị sữa. Dùng trang trí, làm barrier</li></ul><h3>Tại sao socola Bỉ đặc biệt?</h3><p>Bỉ có truyền thống chocolate từ thế kỷ 17. Kỹ thuật "conching" (nghiền, trộn, gia nhiệt) của Bỉ kéo dài 72 giờ — gấp 3 lần tiêu chuẩn. Kết quả: chocolate mịn như lụa, tan đều trên lưỡi.</p><h3>Các thương hiệu chocolate cao cấp</h3><ul><li><strong>Callebaut (Bỉ):</strong> Chuẩn công nghiệp, ổn định</li><li><strong>Valrhona (Pháp):</strong> Cao cấp nhất, single origin</li><li><strong>Barry (Pháp):</strong> Giá tốt, chất lượng cao</li></ul><h3>Ruby Chocolate — Loại thứ 4</h3><p>Ra đời năm 2017 bởi Barry Callebaut. Màu hồng tự nhiên từ hạt cacao ruby, vị chua thanh berry — không thêm màu hay hương liệu. Đây là nguyên liệu cho croissant Ruby của Hello Cake!</p><div class="tip"><strong>Mẹo tempering:</strong> Chocolate cần "temper" (gia nhiệt đúng cách) để bóng đẹp và giòn khi cắn. Dark: 50°C → 28°C → 31°C. Milk: 45°C → 27°C → 30°C.</div>',
    'Nguyên liệu', '/images/blog/chocolate-world.jpg', 'Chef Lan', '8 phút',
    'socola,chocolate,bỉ,ruby,nguyên liệu', 0, '2026-03-19'
  );

  // === BÀI 12 (MỚI): Caramel homemade ===
  insertB.run(
    'Caramel homemade — Nghệ thuật "cháy đường" hoàn hảo',
    'Từ caramel cơ bản đến salted caramel sauce — hướng dẫn chi tiết kỹ thuật nấu caramel không bị hỏng.',
    '<h3>Nguyên lý caramel hóa</h3><p>Đường ở 160°C bắt đầu caramel hóa — phân tử đường vỡ ra tạo hàng trăm hợp chất hương vị mới. 170°C = caramel vàng (ngọt, nhẹ). 180°C = caramel hổ phách (đắng nhẹ, sâu). Trên 190°C = cháy!</p><h3>Công thức Salted Caramel Sauce</h3><ul><li>Đường trắng 200g</li><li>Kem whipping 35% 120ml (ấm)</li><li>Bơ lạt 60g</li><li>Muối biển Fleur de sel 1 thìa</li></ul><h3>Các bước</h3><p><strong>1.</strong> Đổ đường vào nồi đáy dày, lửa vừa. KHÔNG KHUẤY — chỉ xoay nồi nhẹ.</p><p><strong>2.</strong> Khi đường chuyển hổ phách đều, tắt lửa. Đổ kem ấm vào TỪNG CHÚT — caramel sẽ sôi bùng rất mạnh!</p><p><strong>3.</strong> Khuấy đều, thêm bơ, khuấy đến mịn. Rắc muối biển.</p><p><strong>4.</strong> Để nguội, đổ vào lọ thuỷ tinh. Bảo quản tủ lạnh 2 tuần.</p><h3>Tại sao dùng trong Tart Chuối?</h3><p>Caramel + chuối = "hôn nhân hoàn hảo" trong ẩm thực. Vị ngọt đắng caramel cân bằng vị ngọt thanh chuối, tạo chiều sâu hương vị mà đường thông thường không thể.</p><div class="tip"><strong>Sai lầm phổ biến:</strong> Khuấy đường khi đang nấu = kết tinh = cục đường. Chỉ xoay nồi, KHÔNG ĐƯỢC khuấy!</div>',
    'Công thức', '/images/blog/caramel-sauce.jpg', 'Chef Hà', '6 phút',
    'caramel,công thức,kỹ thuật,salted caramel,tart chuối', 0, '2026-03-17'
  );

  // Vouchers
  const insertV = db.prepare('INSERT INTO vouchers (code, type, value, min_order, max_uses, used_count, is_active, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  insertV.run('HELLOCAKE', 'percent', 10, 100000, 100, 5, 1, '2026-12-31');
  insertV.run('GIAM20K', 'fixed', 20000, 150000, 50, 2, 1, '2026-06-30');
  insertV.run('FREESHIP', 'fixed', 30000, 200000, 200, 10, 1, '2026-12-31');
  insertV.run('TART10', 'percent', 10, 129000, 30, 0, 1, '2026-04-30');

  // Loyalty Programs — chương trình chăm sóc + kênh gửi
  const insertLP = db.prepare('INSERT INTO loyalty_programs (name, segment, type, voucher_code, voucher_value, voucher_type, min_order, message, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
  insertLP.run('Chào mừng khách mới', 'new', 'voucher', 'WELCOME10', 10, 'percent', 0, 'Chào bạn! Cảm ơn bạn đã chọn Hello Cake. Tặng bạn mã WELCOME10 giảm 10% cho đơn tiếp theo. Đặt hàng: hellocake.vn | Hotline: 0869.120.122', 1);
  insertLP.run('Tri ân khách thường', 'regular', 'voucher', 'THANKYOU15', 15, 'percent', 100000, 'Hello Cake cảm ơn bạn đã quay lại! Mã THANKYOU15 giảm 15% cho đơn từ 100K. Áp dụng tất cả sản phẩm. ☎ 0869.120.122', 1);
  insertLP.run('VIP Exclusive', 'vip', 'voucher', 'VIP20', 20, 'percent', 0, 'Xin chào khách VIP! Bạn nhận ưu đãi đặc biệt: mã VIP20 giảm 20% không giới hạn. Cảm ơn bạn đã đồng hành cùng Hello Cake!', 1);
  insertLP.run('Sinh nhật khách hàng', 'all', 'voucher', 'BIRTHDAY30K', 30000, 'fixed', 100000, 'Happy Birthday! 🎂 Hello Cake tặng bạn 30.000đ cho đơn từ 100K. Mã: BIRTHDAY30K. Chúc bạn một ngày thật vui!', 1);
  insertLP.run('Kéo khách ngủ đông', 'inactive', 'voucher', 'MISSYOU20', 20, 'percent', 0, 'Hello Cake nhớ bạn! Lâu rồi chưa thấy bạn ghé. Tặng mã MISSYOU20 giảm 20% — quay lại thử vị mới nhé! 🥐', 1);
  insertLP.run('Ưu đãi đối tác sỉ', 'all', 'voucher', 'PARTNER25', 25, 'percent', 500000, 'Chương trình ưu đãi đối tác Hello Cake: giảm 25% cho đơn sỉ từ 500K. Mã: PARTNER25. Liên hệ Zalo 0869120122 để được tư vấn.', 1);
  insertLP.run('Kỷ niệm đối tác', 'all', 'voucher', 'ANNIV50K', 50000, 'fixed', 200000, 'Chúc mừng kỷ niệm thành lập! 🎉 Hello Cake tặng quý đối tác 50.000đ. Mã: ANNIV50K. Cảm ơn sự hợp tác!', 1);
  insertLP.run('Flash Sale cuối tuần', 'all', 'voucher', 'WEEKEND15', 15, 'percent', 0, '🔥 Flash Sale cuối tuần! Giảm 15% TẤT CẢ sản phẩm chỉ T7-CN. Mã: WEEKEND15. Nhanh tay đặt hàng!', 1);

  // Thêm voucher cho tất cả programs
  insertV.run('WELCOME10', 'percent', 10, 0, 0, 0, 1, '2026-12-31');
  insertV.run('THANKYOU15', 'percent', 15, 100000, 0, 0, 1, '2026-12-31');
  insertV.run('VIP20', 'percent', 20, 0, 0, 0, 1, '2026-12-31');
  insertV.run('BIRTHDAY30K', 'fixed', 30000, 100000, 0, 0, 1, '2026-12-31');
  insertV.run('MISSYOU20', 'percent', 20, 0, 0, 0, 1, '2026-12-31');
  insertV.run('PARTNER25', 'percent', 25, 500000, 0, 0, 1, '2026-12-31');
  insertV.run('ANNIV50K', 'fixed', 50000, 200000, 0, 0, 1, '2026-12-31');
  insertV.run('WEEKEND15', 'percent', 15, 0, 0, 0, 1, '2026-12-31');

  // Activity logs
  const insertLog = db.prepare('INSERT INTO activity_logs (type, message, created_at) VALUES (?, ?, ?)');
  insertLog.run('success', 'Hệ thống khởi tạo thành công', '2026-03-27 07:00:00');
  insertLog.run('success', 'Đã nhập 17 sản phẩm vào hệ thống', '2026-03-27 07:00:01');
  insertLog.run('info', 'Đã xử lý 5 đơn hàng demo', '2026-03-27 07:00:02');

  console.log('[DB] Demo data seeded successfully');
}

function logActivity(type, message) {
  db.prepare('INSERT INTO activity_logs (type, message) VALUES (?, ?)').run(type, message);
}

function nextOrderCode() {
  const last = db.prepare("SELECT order_code FROM orders ORDER BY id DESC LIMIT 1").get();
  if (!last) return 'HC-001';
  const num = parseInt(last.order_code.split('-')[1]) + 1;
  return 'HC-' + String(num).padStart(3, '0');
}

// ═══ API ROUTES ═══

// ── Dashboard ──
app.get('/api/dashboard/stats', (req, res) => {
  const products = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_active = 1').get();
  const totalOrders = db.prepare('SELECT COUNT(*) as c FROM orders').get();
  const revenue = db.prepare("SELECT COALESCE(SUM(total), 0) as t FROM orders WHERE status IN ('Hoàn thành', 'Đang làm')").get();
  const customers = db.prepare('SELECT COUNT(*) as c FROM customers').get();
  const newOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Mới'").get();
  const processingOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Đang làm'").get();
  const completedOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Hoàn thành'").get();
  const cancelledOrders = db.prepare("SELECT COUNT(*) as c FROM orders WHERE status = 'Hủy'").get();
  const lowStock = db.prepare('SELECT COUNT(*) as c FROM products WHERE stock <= 10 AND is_active = 1').get();
  const bestSellers = db.prepare('SELECT COUNT(*) as c FROM products WHERE is_bestseller = 1').get();

  res.json({
    products: products.c,
    totalOrders: totalOrders.c,
    revenue: revenue.t,
    customers: customers.c,
    newOrders: newOrders.c,
    processingOrders: processingOrders.c,
    completedOrders: completedOrders.c,
    cancelledOrders: cancelledOrders.c,
    lowStock: lowStock.c,
    bestSellers: bestSellers.c
  });
});

app.get('/api/dashboard/activity', (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  res.json(db.prepare('SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?').all(limit));
});

// ── Analytics: Revenue ──
app.get('/api/dashboard/revenue', (req, res) => {
  const period = req.query.period || '7days';
  const validStatuses = "('Hoàn thành', 'Đang làm')";

  // Daily revenue (7 or 30 days)
  const days = period === '30days' ? 30 : 7;
  const daily = db.prepare(`
    SELECT date(created_at) as day, COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
    FROM orders WHERE status IN ${validStatuses} AND created_at >= date('now', '-${days} days')
    GROUP BY date(created_at) ORDER BY day
  `).all();

  // Monthly revenue (12 months)
  const monthly = db.prepare(`
    SELECT strftime('%Y-%m', created_at) as month, COALESCE(SUM(total), 0) as revenue, COUNT(*) as order_count
    FROM orders WHERE status IN ${validStatuses} AND created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at) ORDER BY month
  `).all();

  // Comparison: today vs yesterday, this week vs last week
  const comp = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN date(created_at) = date('now') THEN total END), 0) as today,
      COALESCE(SUM(CASE WHEN date(created_at) = date('now', '-1 day') THEN total END), 0) as yesterday,
      COALESCE(COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END), 0) as today_orders,
      COALESCE(COUNT(CASE WHEN date(created_at) = date('now', '-1 day') THEN 1 END), 0) as yesterday_orders
    FROM orders WHERE status IN ${validStatuses}
  `).get();

  const weeks = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN created_at >= date('now', 'weekday 0', '-6 days') THEN total END), 0) as this_week,
      COALESCE(SUM(CASE WHEN created_at >= date('now', 'weekday 0', '-13 days') AND created_at < date('now', 'weekday 0', '-6 days') THEN total END), 0) as last_week
    FROM orders WHERE status IN ${validStatuses}
  `).get();

  const avg = db.prepare(`SELECT COALESCE(AVG(total), 0) as avg_per_order FROM orders WHERE status IN ${validStatuses}`).get();

  res.json({
    daily, monthly,
    comparison: { ...comp, this_week: weeks.this_week, last_week: weeks.last_week },
    avg_per_order: Math.round(avg.avg_per_order)
  });
});

// ── Analytics: Top Products ──
app.get('/api/dashboard/top-products', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const orders = db.prepare("SELECT items FROM orders WHERE status IN ('Hoàn thành', 'Đang làm')").all();
  const productMap = {};
  for (const o of orders) {
    for (const item of JSON.parse(o.items)) {
      if (!productMap[item.name]) productMap[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productMap[item.name].qty += item.qty;
      productMap[item.name].revenue += item.price * item.qty;
    }
  }
  const topProducts = Object.values(productMap).sort((a, b) => b.revenue - a.revenue).slice(0, limit);

  // Category revenue
  const prods = db.prepare('SELECT name, category FROM products').all();
  const catLookup = {};
  for (const p of prods) catLookup[p.name] = p.category;
  const categoryRevenue = {};
  for (const [name, data] of Object.entries(productMap)) {
    const cat = catLookup[name] || 'Khác';
    categoryRevenue[cat] = (categoryRevenue[cat] || 0) + data.revenue;
  }
  res.json({ topProducts, categoryRevenue });
});

// ── Analytics: Customer Analytics ──
app.get('/api/dashboard/customers-analytics', (req, res) => {
  const summary = db.prepare(`
    SELECT COUNT(*) as total,
      SUM(CASE WHEN total_orders >= 2 THEN 1 ELSE 0 END) as repeat_customers,
      SUM(CASE WHEN total_orders = 1 THEN 1 ELSE 0 END) as new_customers,
      SUM(CASE WHEN total_orders BETWEEN 2 AND 4 THEN 1 ELSE 0 END) as regular,
      SUM(CASE WHEN total_orders >= 5 THEN 1 ELSE 0 END) as vip
    FROM customers
  `).get();
  summary.returning = summary.repeat_customers;
  summary.returning_rate = summary.total > 0 ? Math.round(summary.repeat_customers / summary.total * 100) : 0;

  const topCustomers = db.prepare(`
    SELECT name, phone, total_orders, total_spent, last_order_at,
      ROUND(total_spent * 1.0 / MAX(total_orders, 1)) as avg_per_order
    FROM customers ORDER BY total_spent DESC LIMIT 10
  `).all();

  const avgs = db.prepare('SELECT AVG(total_orders) as avg_orders, AVG(total_spent) as avg_ltv FROM customers').get();

  res.json({
    summary,
    topCustomers,
    avgOrdersPerCustomer: Math.round((avgs.avg_orders || 0) * 10) / 10,
    avgLifetimeValue: Math.round(avgs.avg_ltv || 0)
  });
});

// ── Analytics: Inventory ──
app.get('/api/dashboard/inventory', (req, res) => {
  const summary = db.prepare(`
    SELECT
      SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) as out_of_stock,
      SUM(CASE WHEN stock > 0 AND stock <= 5 THEN 1 ELSE 0 END) as critical_low,
      SUM(CASE WHEN stock > 5 AND stock <= 10 THEN 1 ELSE 0 END) as low_stock,
      SUM(CASE WHEN stock > 10 THEN 1 ELSE 0 END) as in_stock
    FROM products WHERE is_active = 1
  `).get();
  const alerts = db.prepare('SELECT id, name, code, stock, category, price FROM products WHERE is_active = 1 AND stock <= 10 ORDER BY stock ASC').all();
  res.json({ summary, alerts });
});

// ── Analytics: Slow Moving ──
app.get('/api/dashboard/slow-moving', (req, res) => {
  const allProducts = db.prepare('SELECT id, name, stock, category FROM products WHERE is_active = 1').all();
  const orders = db.prepare("SELECT items FROM orders WHERE status IN ('Hoàn thành', 'Đang làm')").all();
  const soldMap = {};
  for (const o of orders) { for (const item of JSON.parse(o.items)) { soldMap[item.name] = (soldMap[item.name] || 0) + item.qty; } }
  res.json(allProducts.map(p => ({ ...p, sold: soldMap[p.name] || 0 })).filter(p => p.sold < 3).sort((a, b) => a.sold - b.sold));
});

// ── Products ──
app.get('/api/products', (req, res) => {
  const { category, search, bestseller } = req.query;
  let query = 'SELECT * FROM products WHERE is_active = 1';
  const params = [];

  if (category && category !== 'Tất cả') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (search) {
    query += ' AND (name LIKE ? OR code LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }
  if (bestseller === '1') {
    query += ' AND is_bestseller = 1';
  }

  query += ' ORDER BY is_bestseller DESC, created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.get('/api/products/:id', (req, res) => {
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ error: 'Product not found' });
  res.json(p);
});

app.post('/api/products', (req, res) => {
  const { code, name, price, stock, category, description, image_url, is_bestseller } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'name and price required' });
  try {
    const pCode = code || 'SP' + String(Date.now()).slice(-6);
    const result = db.prepare('INSERT INTO products (code, name, price, stock, category, description, image_url, is_bestseller) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(pCode, name, price, stock || 0, category || '', description || '', image_url || '', is_bestseller || 0);
    logActivity('success', `Thêm sản phẩm: ${name}`);
    res.json({ id: result.lastInsertRowid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const data = req.body;
  const sets = Object.keys(data).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE products SET ${sets}, updated_at = datetime('now') WHERE id = ?`).run(...Object.values(data), req.params.id);
  logActivity('info', `Cập nhật sản phẩm #${req.params.id}`);
  res.json({ success: true });
});

app.delete('/api/products/:id', (req, res) => {
  const p = db.prepare('SELECT name FROM products WHERE id = ?').get(req.params.id);
  db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(req.params.id);
  if (p) logActivity('info', `Ẩn sản phẩm: ${p.name}`);
  res.json({ success: true });
});

// ── Categories ──
app.get('/api/categories', (req, res) => {
  res.json(db.prepare('SELECT * FROM categories ORDER BY sort_order').all());
});

// ── Orders ──
app.get('/api/orders', (req, res) => {
  const { status, search } = req.query;
  let query = 'SELECT * FROM orders WHERE 1=1';
  const params = [];
  if (status && status !== 'Tất cả') { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (customer_name LIKE ? OR order_code LIKE ? OR customer_phone LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC';
  res.json(db.prepare(query).all(...params));
});

app.post('/api/orders', (req, res) => {
  const { customer_name, customer_phone, customer_address, note, payment_method, items, subtotal, total, voucher_id } = req.body;
  if (!customer_name || !customer_phone || !items) {
    return res.status(400).json({ error: 'customer_name, customer_phone, and items required' });
  }

  // Update voucher usage
  if (voucher_id) {
    db.prepare('UPDATE vouchers SET used_count = used_count + 1 WHERE id = ?').run(voucher_id);
  }

  const orderCode = nextOrderCode();
  const result = db.prepare('INSERT INTO orders (order_code, customer_name, customer_phone, customer_address, note, payment_method, items, subtotal, total) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(orderCode, customer_name, customer_phone, customer_address || '', note || '', payment_method || 'Tiền mặt', typeof items === 'string' ? items : JSON.stringify(items), subtotal || 0, total || 0);

  // Update or create customer
  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(customer_phone);
  if (existing) {
    db.prepare("UPDATE customers SET total_orders = total_orders + 1, total_spent = total_spent + ?, last_order_at = datetime('now'), name = ?, address = CASE WHEN ? != '' THEN ? ELSE address END WHERE id = ?").run(total || 0, customer_name, customer_address || '', customer_address || '', existing.id);
  } else {
    db.prepare('INSERT INTO customers (name, phone, address, total_orders, total_spent, last_order_at) VALUES (?, ?, ?, 1, ?, datetime(\'now\'))').run(customer_name, customer_phone, customer_address || '', total || 0);
  }

  // Decrease stock
  const itemList = typeof items === 'string' ? JSON.parse(items) : items;
  for (const item of itemList) {
    db.prepare('UPDATE products SET stock = MAX(0, stock - ?) WHERE name = ?').run(item.qty, item.name);
  }

  logActivity('success', `Đơn hàng mới: ${orderCode} — ${customer_name}`);
  res.json({ id: result.lastInsertRowid, order_code: orderCode });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, req.params.id);
  const order = db.prepare('SELECT order_code FROM orders WHERE id = ?').get(req.params.id);
  logActivity('info', `Cập nhật đơn ${order?.order_code}: ${status}`);
  res.json({ success: true });
});

app.delete('/api/orders/:id', (req, res) => {
  const order = db.prepare('SELECT order_code FROM orders WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  if (order) logActivity('info', `Xóa đơn: ${order.order_code}`);
  res.json({ success: true });
});

// ── Customers ──
app.get('/api/customers', (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];
  if (search) { query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  query += ' ORDER BY total_spent DESC';
  res.json(db.prepare(query).all(...params));
});

app.put('/api/customers/:id', (req, res) => {
  const { email, birthday, company_anniversary, zalo, facebook, note, customer_type, address } = req.body;
  db.prepare(`UPDATE customers SET email=?, birthday=?, company_anniversary=?, zalo=?, facebook=?, note=?, customer_type=?, address=? WHERE id=?`).run(
    email || '', birthday || '', company_anniversary || '', zalo || '', facebook || '', note || '', customer_type || 'retail', address || '', req.params.id
  );
  logActivity('info', `Cập nhật thông tin khách #${req.params.id}`);
  res.json({ success: true });
});

// Lịch nhắc nhở sinh nhật / kỷ niệm trong 7 ngày tới
app.get('/api/customers/reminders', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers').all();
  const now = new Date();
  const reminders = [];
  for (const c of customers) {
    // Check birthday
    if (c.birthday) {
      const bday = new Date(c.birthday);
      const thisYear = new Date(now.getFullYear(), bday.getMonth(), bday.getDate());
      const diff = Math.floor((thisYear - now) / 86400000);
      if (diff >= -1 && diff <= 7) {
        reminders.push({ ...c, event: 'birthday', event_label: 'Sinh nhật', event_date: c.birthday, days_until: diff < 0 ? 0 : diff });
      }
    }
    // Check company anniversary
    if (c.company_anniversary) {
      const ann = new Date(c.company_anniversary);
      const thisYear = new Date(now.getFullYear(), ann.getMonth(), ann.getDate());
      const diff = Math.floor((thisYear - now) / 86400000);
      if (diff >= -1 && diff <= 7) {
        reminders.push({ ...c, event: 'anniversary', event_label: 'Kỷ niệm thành lập', event_date: c.company_anniversary, days_until: diff < 0 ? 0 : diff });
      }
    }
  }
  reminders.sort((a, b) => a.days_until - b.days_until);
  res.json(reminders);
});

// ── Blog ──
app.get('/api/blog', (req, res) => {
  const { category, limit: lim } = req.query;
  let query = 'SELECT * FROM blog_posts WHERE 1=1';
  const params = [];
  if (category && category !== 'Tất cả') { query += ' AND category = ?'; params.push(category); }
  query += ' ORDER BY is_featured DESC, created_at DESC';
  if (lim) { query += ' LIMIT ?'; params.push(parseInt(lim)); }
  res.json(db.prepare(query).all(...params));
});

app.get('/api/blog/:id', (req, res) => {
  const post = db.prepare('SELECT * FROM blog_posts WHERE id = ?').get(req.params.id);
  if (!post) return res.status(404).json({ error: 'Blog post not found' });
  db.prepare('UPDATE blog_posts SET views = views + 1 WHERE id = ?').run(req.params.id);
  res.json(post);
});

// ── Export ──
app.get('/api/export/orders', (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  const headers = ['Mã đơn', 'Khách hàng', 'SĐT', 'Địa chỉ', 'Thanh toán', 'Tổng', 'Trạng thái', 'Ngày tạo'];
  const csvLines = [headers.join(',')];
  for (const r of rows) {
    csvLines.push([`"${r.order_code}"`, `"${(r.customer_name || '').replace(/"/g, '""')}"`, r.customer_phone, `"${(r.customer_address || '').replace(/"/g, '""')}"`, r.payment_method, r.total, r.status, r.created_at].join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
  res.send('\ufeff' + csvLines.join('\n'));
});

app.get('/api/export/products', (req, res) => {
  const rows = db.prepare('SELECT * FROM products ORDER BY category, name').all();
  const headers = ['Mã SP', 'Tên', 'Giá', 'Tồn kho', 'Danh mục', 'Best Seller'];
  const csvLines = [headers.join(',')];
  for (const r of rows) {
    csvLines.push([r.code, `"${(r.name || '').replace(/"/g, '""')}"`, r.price, r.stock, `"${r.category}"`, r.is_bestseller ? 'Có' : 'Không'].join(','));
  }
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
  res.send('\ufeff' + csvLines.join('\n'));
});

// ── Database stats ──
app.get('/api/db/stats', (req, res) => {
  const products = db.prepare('SELECT COUNT(*) as c FROM products').get();
  const orders = db.prepare('SELECT COUNT(*) as c FROM orders').get();
  const customers = db.prepare('SELECT COUNT(*) as c FROM customers').get();
  const blogs = db.prepare('SELECT COUNT(*) as c FROM blog_posts').get();

  let dbSize = 0;
  try { dbSize = fs.statSync(dbPath).size; } catch {}

  res.json({
    products: products.c,
    orders: orders.c,
    customers: customers.c,
    blogs: blogs.c,
    dbSize,
    dbPath: path.basename(dbPath)
  });
});

// ── Settings ──
app.get('/api/settings', (req, res) => {
  const rows = db.prepare('SELECT * FROM settings').all();
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

app.put('/api/settings', (req, res) => {
  const stmt = db.prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = datetime('now')");
  for (const [key, value] of Object.entries(req.body)) {
    stmt.run(key, value, value);
  }
  res.json({ success: true });
});

// ── Vouchers ──
app.get('/api/vouchers', (req, res) => {
  res.json(db.prepare('SELECT * FROM vouchers ORDER BY created_at DESC').all());
});

app.post('/api/vouchers', (req, res) => {
  const { code, type, value, min_order, max_uses, expires_at } = req.body;
  if (!code || !value) return res.status(400).json({ error: 'Thiếu mã hoặc giá trị' });
  try {
    const result = db.prepare('INSERT INTO vouchers (code, type, value, min_order, max_uses, expires_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      code.toUpperCase(), type || 'percent', value, min_order || 0, max_uses || 0, expires_at || null
    );
    logActivity('success', `Tạo voucher: ${code.toUpperCase()}`);
    res.json({ id: result.lastInsertRowid });
  } catch (e) {
    res.status(400).json({ error: 'Mã voucher đã tồn tại' });
  }
});

app.post('/api/vouchers/apply', (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: 'Nhập mã giảm giá' });
  const voucher = db.prepare('SELECT * FROM vouchers WHERE code = ? AND is_active = 1').get(code.toUpperCase());
  if (!voucher) return res.status(404).json({ error: 'Mã không hợp lệ' });
  if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) return res.status(400).json({ error: 'Mã đã hết hạn' });
  if (voucher.max_uses > 0 && voucher.used_count >= voucher.max_uses) return res.status(400).json({ error: 'Mã đã hết lượt sử dụng' });
  if (subtotal < voucher.min_order) return res.status(400).json({ error: `Đơn tối thiểu ${voucher.min_order.toLocaleString('vi-VN')}đ` });

  let discount = 0;
  if (voucher.type === 'percent') {
    discount = Math.round(subtotal * voucher.value / 100);
  } else {
    discount = voucher.value;
  }
  discount = Math.min(discount, subtotal);
  res.json({ discount, voucher_id: voucher.id, description: voucher.type === 'percent' ? `Giảm ${voucher.value}%` : `Giảm ${voucher.value.toLocaleString('vi-VN')}đ` });
});

app.delete('/api/vouchers/:id', (req, res) => {
  db.prepare('DELETE FROM vouchers WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── Loyalty Programs ──
app.get('/api/loyalty', (req, res) => {
  res.json(db.prepare('SELECT * FROM loyalty_programs ORDER BY created_at DESC').all());
});

app.post('/api/loyalty', (req, res) => {
  const { name, segment, voucher_code, voucher_value, voucher_type, min_order, message } = req.body;
  if (!name || !voucher_code) return res.status(400).json({ error: 'Thiếu tên hoặc mã voucher' });
  const result = db.prepare('INSERT INTO loyalty_programs (name, segment, type, voucher_code, voucher_value, voucher_type, min_order, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    name, segment || 'all', 'voucher', voucher_code.toUpperCase(), voucher_value || 0, voucher_type || 'percent', min_order || 0, message || ''
  );
  // Tự tạo voucher tương ứng
  try {
    db.prepare('INSERT INTO vouchers (code, type, value, min_order, max_uses, is_active, expires_at) VALUES (?, ?, ?, ?, ?, 1, ?)').run(
      voucher_code.toUpperCase(), voucher_type || 'percent', voucher_value || 0, min_order || 0, 0, '2026-12-31'
    );
  } catch(e) { /* voucher đã tồn tại */ }
  logActivity('success', `Tạo chương trình: ${name}`);
  res.json({ id: result.lastInsertRowid });
});

app.delete('/api/loyalty/:id', (req, res) => {
  db.prepare('DELETE FROM loyalty_programs WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ── CRM: Phân tích chi tiết khách hàng theo segment ──
app.get('/api/crm/segments', (req, res) => {
  const customers = db.prepare('SELECT * FROM customers ORDER BY total_spent DESC').all();
  const now = new Date();
  const segments = {
    new_customers: [],       // 1 đơn
    regular: [],             // 2-4 đơn
    vip: [],                 // 5+ đơn
    inactive: [],            // >30 ngày chưa mua
    high_value: [],          // chi tiêu > 500K
    recent: []               // mua trong 7 ngày gần
  };

  for (const c of customers) {
    const daysSince = c.last_order_at ? Math.floor((now - new Date(c.last_order_at)) / 86400000) : 999;
    c.days_since_order = daysSince;
    c.segment = c.total_orders >= 5 ? 'VIP' : c.total_orders >= 2 ? 'Thường' : 'Mới';

    if (c.total_orders === 1) segments.new_customers.push(c);
    if (c.total_orders >= 2 && c.total_orders < 5) segments.regular.push(c);
    if (c.total_orders >= 5) segments.vip.push(c);
    if (daysSince > 30) segments.inactive.push(c);
    if (c.total_spent > 500000) segments.high_value.push(c);
    if (daysSince <= 7) segments.recent.push(c);
  }

  const programs = db.prepare('SELECT * FROM loyalty_programs WHERE is_active = 1').all();
  const messages = db.prepare('SELECT * FROM customer_messages ORDER BY sent_at DESC LIMIT 50').all();

  res.json({
    segments: {
      new_customers: { count: segments.new_customers.length, customers: segments.new_customers },
      regular: { count: segments.regular.length, customers: segments.regular },
      vip: { count: segments.vip.length, customers: segments.vip },
      inactive: { count: segments.inactive.length, customers: segments.inactive },
      high_value: { count: segments.high_value.length, customers: segments.high_value },
      recent: { count: segments.recent.length, customers: segments.recent }
    },
    programs,
    recentMessages: messages
  });
});

// ── CRM: Gửi ưu đãi cho nhóm khách ──
app.post('/api/crm/send-offer', (req, res) => {
  const { segment, program_id } = req.body;
  const program = db.prepare('SELECT * FROM loyalty_programs WHERE id = ?').get(program_id);
  if (!program) return res.status(404).json({ error: 'Không tìm thấy chương trình' });

  const customers = db.prepare('SELECT * FROM customers ORDER BY total_spent DESC').all();
  let targets = [];
  const now = new Date();

  for (const c of customers) {
    const daysSince = c.last_order_at ? Math.floor((now - new Date(c.last_order_at)) / 86400000) : 999;
    if (segment === 'new' && c.total_orders === 1) targets.push(c);
    else if (segment === 'regular' && c.total_orders >= 2 && c.total_orders < 5) targets.push(c);
    else if (segment === 'vip' && c.total_orders >= 5) targets.push(c);
    else if (segment === 'inactive' && daysSince > 30) targets.push(c);
    else if (segment === 'all') targets.push(c);
  }

  const channels = req.body.channels || ['system'];
  const insertMsg = db.prepare('INSERT INTO customer_messages (customer_id, customer_phone, message, voucher_code, type) VALUES (?, ?, ?, ?, ?)');
  for (const c of targets) {
    const channelStr = channels.join(',');
    insertMsg.run(c.id, c.phone, `[${channelStr}] ${program.message}`, program.voucher_code, 'promotion');
  }

  logActivity('success', `Gửi ưu đãi "${program.name}" qua ${channels.join(', ')} cho ${targets.length} khách (${segment})`);
  res.json({ sent: targets.length, segment, program: program.name, channels });
});

// ═══ START SERVER ═══
app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log('');
  console.log('  ╔══════════════════════════════════════════╗');
  console.log('  ║   Hello Cake — Bánh Tươi Handmade        ║');
  console.log('  ║                                          ║');
  console.log(`  ║   🌐 ${url}                  ║`);
  console.log('  ║   📁 DB: ' + path.basename(dbPath).padEnd(32) + '║');
  console.log('  ║                                          ║');
  console.log('  ║   Ctrl+C to stop                         ║');
  console.log('  ╚══════════════════════════════════════════╝');
  console.log('');

  if (process.argv.includes('--open') || process.argv.includes('--dev')) {
    try {
      const open = (await import('open')).default;
      await open(url);
    } catch {
      console.log('  Open in browser: ' + url);
    }
  }
});

process.on('SIGINT', () => { console.log('\n  Shutting down...'); db.close(); process.exit(0); });
process.on('SIGTERM', () => { db.close(); process.exit(0); });
