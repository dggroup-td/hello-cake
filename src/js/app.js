// ═══════════════════════════════════════════════
// Hello Cake — Main Application Controller
// Full UX: beautiful cards, auto-cart, DB panel, SEO, search
// ═══════════════════════════════════════════════

let products = [], categories = [], cart = [], blogPosts = [];
let payM = 'Tiền mặt', cCat = 'Tất cả', cAdm = 'dash', si = 0, sT;
let blogFilter = 'Tất cả', blogShown = 4;
let dbTable = 'orders', dbSearch = '';
let searchQuery = '';

const CAT_ICONS = { 'Tất cả': '🏠', 'Croissant': '🥐', 'Tart': '🥧', 'Bánh Mì': '🍞', 'Đồ Uống': '🍵' };
const CAT_CLASS = { 'Croissant': 'croissant', 'Tart': 'tart', 'Bánh Mì': 'banh-mi', 'Đồ Uống': 'do-uong' };

// ══ API HELPER ══
async function api(path, options = {}) {
  const res = await fetch('/api' + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  return res.json();
}

// ══ UTILITIES ══
const fmt = n => Number(n).toLocaleString('vi-VN') + 'đ';
const esc = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') : '';
const cQ = () => cart.reduce((s, c) => s + c.qty, 0);
const cT = () => cart.reduce((s, c) => s + c.price * c.qty, 0);
function setTextById(id, text) { const el = document.getElementById(id); if (el) el.textContent = text; }
function formatTime(t) {
  if (!t) return '';
  const d = new Date(t);
  return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}
function formatBlogDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function toast(msg, type = 'success') {
  const el = document.getElementById('toast-el');
  if (!el) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  el.innerHTML = `${icons[type] || '✅'} ${msg}`;
  el.className = 'toast ' + type;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2600);
}

// ══ INITIALIZATION ══
async function init() {
  try {
    [products, blogPosts] = await Promise.all([
      api('/products'),
      api('/blog')
    ]);
    const cats = await api('/categories');
    categories = cats.map(c => c.name);
    renderSidebarCats();
    renderNavDropdown();
    initSlider();
    rHome();
    renderBlog();
  } catch (err) {
    console.error('Init error:', err);
  }
}

function renderSidebarCats() {
  const container = document.getElementById('sidebar-cats');
  if (!container) return;
  const allCount = products.length;
  let html = `<button class="cb on" onclick="fCat('Tất cả')"><span class="ce">🏠</span>Tất cả<span class="cc">${allCount}</span></button>`;
  for (const cat of categories) {
    const count = products.filter(p => p.category === cat).length;
    html += `<button class="cb" onclick="fCat('${esc(cat)}')"><span class="ce">${CAT_ICONS[cat] || '📦'}</span>${esc(cat)}<span class="cc">${count}</span></button>`;
  }
  container.innerHTML = html;
}

function renderNavDropdown() {
  const dd = document.getElementById('nav-menu-dropdown');
  if (!dd) return;
  dd.innerHTML = categories.map(c =>
    `<a href="#" onclick="fCat('${esc(c)}');return false">${CAT_ICONS[c] || '📦'} ${esc(c)}</a>`
  ).join('');
}

// ══ PRODUCT CARD — Real product images ══
function pCard(p) {
  const soldOut = p.stock <= 0;
  const cls = CAT_CLASS[p.category] || 'default';
  const icon = CAT_ICONS[p.category] || '🎂';
  const hasImg = p.image_url && p.image_url.length > 1;
  const imgHtml = hasImg
    ? `<img src="${esc(p.image_url)}" alt="${esc(p.name)}" class="pimg-real" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    + `<div class="pimg ${cls}" style="display:none">${icon}</div>`
    : `<div class="pimg ${cls}">${icon}</div>`;
  return `
    <div class="pc fade-in">
      <div class="pcf">
        ${imgHtml}
        ${p.is_bestseller ? '<div class="pcbs">★ Best Seller</div>' : ''}
        ${soldOut ? '<div class="pcso"><span>Tạm hết hàng</span></div>' : ''}
      </div>
      <div class="pcb">
        <div class="pccat">${esc(p.category)}</div>
        <div class="pcn">${esc(p.name)}</div>
        <div class="pcdesc">${esc(p.description ? p.description.split('.')[0] : '')}</div>
        <div class="pcft">
          <div class="pcp">${fmt(p.price)}</div>
          <button class="addb" id="addb-${p.id}" ${soldOut ? 'disabled' : ''} onclick="event.stopPropagation();addC(${p.id}, this)">
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>
      </div>
    </div>`;
}

// ══ SEARCH ══
function searchProducts(q) {
  searchQuery = q.trim().toLowerCase();
  rHome();
}

// ══ CATEGORY FILTER ══
function fCat(c) {
  cCat = c;
  searchQuery = '';
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('.cb').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.cb').forEach(b => {
    if (b.textContent.includes(c === 'Tất cả' ? 'Tất cả' : c)) b.classList.add('on');
  });
  rHome();
}

function rTabs() {
  const tabContainer = document.getElementById('bst');
  const tabContainer2 = document.getElementById('allt2');
  const allCats = ['Tất cả', ...categories];
  // Best seller tabs removed (B2B layout)
  if (tabContainer2) tabContainer2.innerHTML = allCats.map(c => `<button class="stab${c === cCat ? ' on' : ''}" onclick="fCat('${esc(c)}')">${esc(c)}</button>`).join('');
}

function fBS(c) {
  cCat = c;
  const bs = c === 'Tất cả' ? products.filter(p => p.is_bestseller) : products.filter(p => p.is_bestseller && p.category === c);
  const bsg = document.getElementById('bsg');
  if (bsg) bsg.innerHTML = bs.length > 0 ? bs.map(pCard).join('') : '<p style="color:var(--tx3);padding:20px;font-size:13px">Không có best seller trong danh mục này</p>';
  rTabs();
}

// ══ RENDER HOME ══
function rHome() {
  rTabs();

  let filtered = products;
  if (searchQuery) {
    filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery) || p.category.toLowerCase().includes(searchQuery));
  } else if (cCat !== 'Tất cả') {
    filtered = products.filter(p => p.category === cCat);
  }

  // Best sellers (thu gọn 6 SP)
  const bs = (searchQuery
    ? filtered.filter(p => p.is_bestseller)
    : (cCat === 'Tất cả' ? products.filter(p => p.is_bestseller) : products.filter(p => p.is_bestseller && p.category === cCat))
  ).slice(0, 6);
  const bsg = document.getElementById('bsg');
  if (bsg) bsg.innerHTML = bs.length > 0 ? bs.map(pCard).join('') : '<p style="color:var(--tx3);padding:20px;font-size:13px">Không có sản phẩm best seller</p>';

  // All products
  const allg = document.getElementById('allg');
  if (allg) allg.innerHTML = filtered.length > 0 ? filtered.map(pCard).join('') : `<p style="color:var(--tx3);padding:20px;font-size:13px">${searchQuery ? 'Không tìm thấy "' + esc(searchQuery) + '"' : 'Không có sản phẩm nào'}</p>`;

  const allt = document.getElementById('allt');
  if (allt) allt.textContent = searchQuery ? `🔍 Kết quả tìm kiếm` : (cCat === 'Tất cả' ? '🛍 Tất cả sản phẩm' : `🛍 ${cCat}`);
}

// ══ NAVIGATION ══
function gHome() {
  document.getElementById('pg-shop').style.display = 'block';
  document.getElementById('pg-admin').style.display = 'none';
  document.querySelectorAll('.na').forEach((el, i) => el.classList.toggle('on', i === 0));
  rHome();
}

const ADMIN_PW = 'hellocake2026';
let adminLoggedIn = false;

function gAdmin() {
  if (!adminLoggedIn) {
    document.getElementById('pg-admin-login').classList.add('show');
    document.getElementById('pg-shop').style.display = 'none';
    setTimeout(() => document.getElementById('admin-pw')?.focus(), 100);
    return;
  }
  showAdminPanel();
}

function adminLogin() {
  const pw = document.getElementById('admin-pw')?.value;
  const errEl = document.getElementById('admin-err');
  if (pw === ADMIN_PW) {
    adminLoggedIn = true;
    document.getElementById('pg-admin-login').classList.remove('show');
    showAdminPanel();
    toast('Đăng nhập thành công!', 'success');
  } else {
    if (errEl) errEl.textContent = 'Mật khẩu không đúng!';
  }
}

function showAdminPanel() {
  document.getElementById('pg-shop').style.display = 'none';
  document.getElementById('pg-admin').style.display = 'block';
  cAdm = 'dash';
  document.querySelectorAll('.atn').forEach((b, i) => b.classList.toggle('on', i === 0));
  rAdm();
}

function adminLogout() {
  adminLoggedIn = false;
  document.getElementById('pg-admin').style.display = 'none';
  document.getElementById('admin-pw').value = '';
  document.getElementById('admin-err').textContent = '';
  gHome();
  toast('Đã đăng xuất', 'info');
}

// ══ SEEDING REVIEWS AUTO SCROLL ══
const seedData = [
  { avatar:'🥐', name:'Lan Nguyễn', time:'2 phút trước', text:'"Croissant Matcha ngon xuất sắc! Lớp bơ giòn tan, nhân matcha thơm lừng 💚"', stars:'⭐⭐⭐⭐⭐' },
  { avatar:'☕', name:'Café Bình Minh', badge:'Đối tác', text:'"Đặt sỉ 50 chiếc/ngày, khách quán mê mẩn. Giao đúng 6h sáng!"', stat:'📦 1.500+ chiếc đã đặt' },
  { avatar:'🎂', name:'Huy Phạm', time:'Hôm qua', text:'"Tart Xoài cho sinh nhật vợ, ai cũng khen. Sẽ quay lại! 🥭"', stars:'⭐⭐⭐⭐⭐' },
  { avatar:'🏢', name:'VP ABC Corp', badge:'Doanh nghiệp', text:'"60 chiếc cho event, đồng nghiệp ai cũng thích. Giá sỉ rất tốt!"', stat:'💰 4.200.000đ / đơn' },
  { avatar:'💜', name:'Quỳnh Anh', time:'3 giờ trước', text:'"Dâu Tây + Vanilla combo hoàn hảo! Đóng hộp đẹp, tặng bạn rất ưng 🍓"', stars:'⭐⭐⭐⭐⭐' },
  { avatar:'🍵', name:'Quán Trà Mây', badge:'Đối tác', text:'"Hợp tác 6 tháng, không phải lo nguồn bánh. Hello Cake lo hết!"', stat:'📦 3.000+ chiếc đã đặt' },
  { avatar:'👨‍🍳', name:'Minh Tuấn', time:'5 phút trước', text:'"Pain Suisee nhân custard chảy tràn, ăn 1 chiếc là nghiện luôn!"', stars:'⭐⭐⭐⭐⭐' },
  { avatar:'🎀', name:'Thùy Linh', time:'1 giờ trước', text:'"Ruby Croissant màu hồng siêu xinh, vị berry thanh thanh. 10 điểm! 💗"', stars:'⭐⭐⭐⭐⭐' },
  { avatar:'🏪', name:'Bakery Minh Châu', badge:'Đại lý', text:'"Đại lý chiết khấu 25%, margin tốt. Khách khu vực rất thích!"', stat:'🤝 Đại lý chính thức' },
  { avatar:'🌟', name:'Đức Anh', time:'Hôm nay', text:'"Tiramisu croissant vị cà phê đậm đà, lớp cream mịn như lụa. Đỉnh!"', stars:'⭐⭐⭐⭐⭐' },
];

function initSeeding() {
  const el = document.getElementById('seed-scroll');
  if (!el) return;
  // Render 3 cards visible, rotate every 3s
  let idx = 0;
  function renderCards() {
    const visible = [0,1,2].map(i => seedData[(idx + i) % seedData.length]);
    el.innerHTML = visible.map((s, i) => `
      <div class="seed-card seed-anim" style="animation-delay:${i * 0.12}s">
        <div class="seed-avatar">${s.avatar}</div>
        <div class="seed-body">
          <div class="seed-name">${s.name} ${s.badge ? `<span class="seed-verified">✓ ${s.badge}</span>` : `<span class="seed-time">${s.time}</span>`}</div>
          <div class="seed-text">${s.text}</div>
          ${s.stars ? `<div class="seed-stars">${s.stars}</div>` : ''}
          ${s.stat ? `<div class="seed-stats">${s.stat}</div>` : ''}
        </div>
      </div>
    `).join('');
    idx = (idx + 1) % seedData.length;
  }
  renderCards();
  setInterval(renderCards, 3000);
}
setTimeout(initSeeding, 500);

function toggleCafeVideo() {
  const vid = document.getElementById('cafe-vid');
  const overlay = document.getElementById('cafe-vid-overlay');
  if (!vid) return;
  if (vid.paused) { vid.muted = false; vid.play().catch(()=>{}); if (overlay) overlay.classList.add('hidden'); }
  else { vid.pause(); vid.muted = true; if (overlay) overlay.classList.remove('hidden'); }
}

function scrollToPartner() {
  const el = document.getElementById('partner-sec');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

function scrollToBlog() {
  const el = document.getElementById('blog-sec');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// ══ SLIDER ══
function initSlider() {
  const slides = document.querySelectorAll('.sl');
  const dotsC = document.getElementById('sdots');
  if (!dotsC || slides.length === 0) return;
  dotsC.innerHTML = Array.from(slides).map((_, i) => `<div class="sdot ${i === 0 ? 'on' : ''}" onclick="gSl(${i})"></div>`).join('');
  gSl(0);
  clearInterval(sT);
  sT = setInterval(() => sMv(1), 5200);
}
function gSl(i) {
  si = i;
  const str = document.getElementById('str');
  if (str) str.style.transform = `translateX(-${i * 100}%)`;
  document.querySelectorAll('.sdot').forEach((d, j) => d.classList.toggle('on', j === i));
  document.querySelectorAll('.sl').forEach((s, j) => s.classList.toggle('on', j === i));
}
function sMv(d) { const slides = document.querySelectorAll('.sl'); gSl((si + d + slides.length) % slides.length); }

// ══ CART — Auto-open on add, fly animation ══
function addC(id, btnEl) {
  const p = products.find(x => x.id === id);
  if (!p || p.stock <= 0) return;

  const existing = cart.find(c => c.id === id);
  if (existing) {
    if (existing.qty >= p.stock) { toast('Đã đạt tối đa tồn kho!', 'warning'); return; }
    existing.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, qty: 1, category: p.category, image_url: p.image_url });
  }

  // Button pulse animation
  if (btnEl) {
    btnEl.classList.add('added');
    setTimeout(() => btnEl.classList.remove('added'), 350);
  }

  // Fly notification
  if (btnEl) {
    const rect = btnEl.getBoundingClientRect();
    const fly = document.createElement('div');
    fly.className = 'fly-notify';
    fly.textContent = '+1';
    fly.style.left = rect.left + 'px';
    fly.style.top = rect.top + 'px';
    document.body.appendChild(fly);
    setTimeout(() => fly.remove(), 600);
  }

  // Badge bump
  uBadge();
  const dot = document.getElementById('ccnt');
  if (dot) { dot.classList.remove('bump'); void dot.offsetWidth; dot.classList.add('bump'); setTimeout(() => dot.classList.remove('bump'), 200); }

  // Auto-open cart drawer (like original)
  openCart();
}

function uBadge() {
  const q = cQ();
  setTextById('ccnt', q);
  setTextById('hcn', q);
}

function chQ(id, d) {
  const i = cart.findIndex(x => x.id === id);
  if (i === -1) return;
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  uBadge();
  rCart();
}

function rCart() {
  const cbd = document.getElementById('cbd');
  const cft = document.getElementById('cft');
  if (!cbd) return;

  if (cart.length === 0) {
    cbd.innerHTML = '<div class="cemp"><svg viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><p>Giỏ hàng trống</p><p style="font-size:11px;color:var(--bd)">Thêm bánh yêu thích vào giỏ nhé!</p></div>';
    if (cft) cft.style.display = 'none';
    return;
  }

  cbd.innerHTML = cart.map(c => {
    const cls = CAT_CLASS[c.category] || 'default';
    const icon = CAT_ICONS[c.category] || '🎂';
    const hasImg = c.image_url && c.image_url.length > 1;
    const imgHtml = hasImg
      ? `<div class="ciph"><img src="${esc(c.image_url)}" alt="${esc(c.name)}" onerror="this.parentElement.innerHTML='<div class=\\'ci-img ${cls}\\'>${icon}</div>'"></div>`
      : `<div class="ci-img ${cls}">${icon}</div>`;
    return `
    <div class="ci">
      ${imgHtml}
      <div class="cii">
        <div class="cin">${esc(c.name)}</div>
        <div class="ciu">${fmt(c.price)} / chiếc</div>
        <div class="cit">${fmt(c.price * c.qty)}</div>
      </div>
      <div class="qc">
        <button class="qb" onclick="chQ(${c.id},-1)">−</button>
        <span class="qn">${c.qty}</span>
        <button class="qb" onclick="chQ(${c.id},1)">+</button>
      </div>
    </div>`;
  }).join('');

  if (cft) {
    cft.style.display = 'block';
    setTextById('icn', cQ());
    setTextById('csb', fmt(cT()));
    setTextById('ctv', fmt(cT()));
  }
}

function openCart() { document.getElementById('cov').classList.add('open'); rCart(); }
function closeCart() { document.getElementById('cov').classList.remove('open'); }

// ══ CHECKOUT ══
let appliedVoucher = null;
let discountAmount = 0;

function openCO() {
  closeCart();
  appliedVoucher = null;
  discountAmount = 0;
  renderOrderSummary();
  const fv = document.getElementById('fv');
  if (fv) fv.value = '';
  const vm = document.getElementById('voucher-msg');
  if (vm) { vm.textContent = ''; vm.className = 'voucher-msg'; }
  document.getElementById('mow').classList.add('open');
}

function renderOrderSummary() {
  const opv = document.getElementById('opv');
  if (!opv) return;
  const sub = cT();
  const total = Math.max(0, sub - discountAmount);
  opv.innerHTML = `<h4>📦 Đơn hàng của bạn</h4>` +
    cart.map(c => `<div class="or"><span>${esc(c.name)} × ${c.qty}</span><span>${fmt(c.price * c.qty)}</span></div>`).join('') +
    (discountAmount > 0 ? `<div class="or" style="color:#2E7D32"><span>🎫 Giảm giá</span><span>-${fmt(discountAmount)}</span></div>` : '') +
    `<div class="or tot"><span>Tổng cộng</span><span>${fmt(total)}</span></div>`;
}

async function applyVoucher() {
  const code = document.getElementById('fv')?.value.trim();
  const vm = document.getElementById('voucher-msg');
  if (!code) { vm.textContent = 'Nhập mã giảm giá'; vm.className = 'voucher-msg err'; return; }
  const result = await api('/vouchers/apply', { method: 'POST', body: { code, subtotal: cT() } });
  if (result.error) {
    appliedVoucher = null;
    discountAmount = 0;
    vm.textContent = result.error;
    vm.className = 'voucher-msg err';
  } else {
    appliedVoucher = result.voucher_id;
    discountAmount = result.discount;
    vm.textContent = `✓ ${result.description} (-${fmt(discountAmount)})`;
    vm.className = 'voucher-msg ok';
    if (payM === 'Chuyển khoản') updateQR();
  }
  renderOrderSummary();
}
function closeCO() { document.getElementById('mow').classList.remove('open'); }
function selP(el) {
  document.querySelectorAll('.po').forEach(e => e.classList.remove('on'));
  el.classList.add('on');
  payM = el.dataset.v;
  const qrBank = document.getElementById('qr-bank');
  if (qrBank) {
    if (payM === 'Chuyển khoản') {
      qrBank.classList.add('show');
      updateQR();
    } else {
      qrBank.classList.remove('show');
    }
  }
}

function updateQR() {
  const total = Math.max(0, cT() - discountAmount);
  const content = 'HelloCake ' + Date.now().toString(36).toUpperCase();
  const qrContent = document.getElementById('qr-content');
  if (qrContent) qrContent.textContent = content;
  // VietQR format: bank_id=970422 (MB Bank), account=0869120122
  const qrUrl = `https://img.vietqr.io/image/970422-0869120122-compact2.png?amount=${total}&addInfo=${encodeURIComponent(content)}&accountName=${encodeURIComponent('HELLO CAKE')}`;
  const qrImg = document.getElementById('qr-img');
  const qrPlaceholder = document.getElementById('qr-placeholder');
  if (qrImg && total > 0) {
    qrImg.src = qrUrl;
    qrImg.classList.add('show');
    if (qrPlaceholder) qrPlaceholder.style.display = 'none';
  }
}

async function placeOrder() {
  const name = document.getElementById('fn').value.trim();
  const phone = document.getElementById('fp').value.trim();
  const address = document.getElementById('fa').value.trim();
  const note = document.getElementById('fo').value.trim();

  if (!name || !phone) { toast('Vui lòng nhập họ tên và SĐT!', 'error'); return; }
  if (!cart.length) { toast('Giỏ hàng trống!', 'error'); return; }

  try {
    const items = cart.map(c => ({ name: c.name, qty: c.qty, price: c.price }));
    const subtotal = cT();
    const total = Math.max(0, subtotal - discountAmount);
    const result = await api('/orders', {
      method: 'POST',
      body: { customer_name: name, customer_phone: phone, customer_address: address, note, payment_method: payM, items, subtotal, total, voucher_id: appliedVoucher }
    });

    closeCO();
    document.getElementById('soid').textContent = `Mã đơn: ${result.order_code} — ${fmt(total)}`;
    document.getElementById('sow').classList.add('open');

    cart = [];
    appliedVoucher = null;
    discountAmount = 0;
    uBadge();
    ['fn', 'fp', 'fa', 'fo', 'fv'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    products = await api('/products');
    rHome();
    toast('Đặt hàng thành công!', 'success');
  } catch (err) {
    toast('Lỗi đặt hàng: ' + err.message, 'error');
  }
}

function closeSuccess() {
  document.getElementById('sow').classList.remove('open');
  rHome();
}

// ══ ADMIN ══
function aTab(t) {
  cAdm = t;
  const tabs = ['dash', 'ord', 'pro', 'cus', 'crm', 'voucher', 'api', 'db', 'seo'];
  document.querySelectorAll('.atn').forEach((b, i) => b.classList.toggle('on', tabs[i] === t));
  rAdm();
}

async function rAdm() {
  const c = document.getElementById('adc');
  if (!c) return;
  if (cAdm === 'dash') c.innerHTML = await rDash();
  else if (cAdm === 'ord') c.innerHTML = await rOrd();
  else if (cAdm === 'pro') c.innerHTML = await rPro();
  else if (cAdm === 'cus') c.innerHTML = await rCus();
  else if (cAdm === 'crm') c.innerHTML = await rCRM();
  else if (cAdm === 'voucher') c.innerHTML = await rVoucher();
  else if (cAdm === 'api') c.innerHTML = rAPI();
  else if (cAdm === 'db') c.innerHTML = await rDB();
  else if (cAdm === 'seo') c.innerHTML = rSEO();
}

const stc = st => st === 'Mới' ? 'new' : st === 'Đang làm' ? 'proc' : st === 'Hoàn thành' ? 'done' : 'can';

let revenueChartInstance = null;
let categoryChartInstance = null;
let _lastRevenue = null;

function calcDelta(a, b) {
  if (b === 0) return a > 0 ? '+100%' : '0%';
  const d = Math.round((a - b) / b * 100);
  return (d >= 0 ? '+' : '') + d + '%';
}

async function rDash() {
  const [stats, revenue, topProducts, custAnalytics, inventory, logs] = await Promise.all([
    api('/dashboard/stats'),
    api('/dashboard/revenue?period=7days'),
    api('/dashboard/top-products?limit=10'),
    api('/dashboard/customers-analytics'),
    api('/dashboard/inventory'),
    api('/dashboard/activity?limit=6')
  ]);
  _lastRevenue = revenue;
  const comp = revenue.comparison;
  const todayD = calcDelta(comp.today, comp.yesterday);
  const cs = custAnalytics.summary;

  let h = '';

  // ── 6 Stat Cards ──
  h += `<div class="sgrid" style="grid-template-columns:repeat(6,1fr)">
    <div class="sc2" style="border-top-color:#2D6A4F"><div class="sl2">Doanh thu</div><div class="sv">${fmt(stats.revenue)}</div></div>
    <div class="sc2" style="border-top-color:#1877f2"><div class="sl2">Tổng đơn</div><div class="sv">${stats.totalOrders}</div></div>
    <div class="sc2" style="border-top-color:#d97706"><div class="sl2">Sản phẩm</div><div class="sv">${stats.products}</div></div>
    <div class="sc2" style="border-top-color:#7c3aed"><div class="sl2">Khách hàng</div><div class="sv">${stats.customers}</div></div>
    <div class="sc2" style="border-top-color:#059669"><div class="sl2">TB / đơn</div><div class="sv">${fmt(revenue.avg_per_order)}</div></div>
    <div class="sc2" style="border-top-color:#e11d48"><div class="sl2">Khách quay lại</div><div class="sv">${cs.returning_rate}%</div></div>
  </div>`;

  // ── Revenue Chart ──
  h += `<div class="acd">
    <div class="ach"><span>📈 Biểu đồ doanh thu</span>
      <div class="chart-period-btns">
        <button class="cpb on" onclick="switchRevenuePeriod('7days',this)">7 ngày</button>
        <button class="cpb" onclick="switchRevenuePeriod('30days',this)">30 ngày</button>
        <button class="cpb" onclick="switchRevenuePeriod('12months',this)">12 tháng</button>
      </div>
    </div>
    <canvas id="revenueChart" height="240"></canvas>
  </div>`;

  // ── Comparison Cards ──
  const weekD = calcDelta(comp.this_week, comp.last_week);
  h += `<div class="dash-2col">
    <div class="acd" style="margin-bottom:0">
      <div style="font-size:11px;color:var(--tx3);margin-bottom:4px">Hôm nay vs Hôm qua</div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="font-size:22px;font-weight:700;color:#2D6A4F">${fmt(comp.today)}</span>
        <span class="delta ${comp.today >= comp.yesterday ? 'up' : 'down'}">${todayD}</span>
      </div>
      <div style="font-size:11px;color:var(--tx3)">Hôm qua: ${fmt(comp.yesterday)} · ${comp.today_orders} đơn hôm nay</div>
    </div>
    <div class="acd" style="margin-bottom:0">
      <div style="font-size:11px;color:var(--tx3);margin-bottom:4px">Tuần này vs Tuần trước</div>
      <div style="display:flex;align-items:baseline;gap:8px">
        <span style="font-size:22px;font-weight:700;color:#2D6A4F">${fmt(comp.this_week)}</span>
        <span class="delta ${comp.this_week >= comp.last_week ? 'up' : 'down'}">${weekD}</span>
      </div>
      <div style="font-size:11px;color:var(--tx3)">Tuần trước: ${fmt(comp.last_week)}</div>
    </div>
  </div>`;

  // ── Top Products + Customer Analytics (2 col) ──
  const maxRev = topProducts.topProducts[0]?.revenue || 1;
  h += `<div class="dash-2col">
    <div class="acd" style="margin-bottom:0">
      <div class="ach"><span>🏆 Top sản phẩm bán chạy</span></div>
      ${topProducts.topProducts.slice(0, 5).map((p, i) => `
        <div style="display:flex;align-items:center;gap:10px;padding:7px 0;border-bottom:1px solid var(--cr2)">
          <span style="font-size:16px;font-weight:700;color:${i < 3 ? '#D4A843' : 'var(--tx3)'};width:22px">#${i+1}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.name)}</div>
            <div style="font-size:10px;color:var(--tx3)">SL: ${p.qty} · DT: ${fmt(p.revenue)}</div>
          </div>
          <div class="stat-bar" style="width:70px"><div class="stat-bar-fill" style="width:${Math.round(p.revenue/maxRev*100)}%"></div></div>
        </div>
      `).join('')}
      <div style="margin-top:14px"><div style="font-size:12px;font-weight:600;margin-bottom:8px">Doanh thu theo danh mục</div><canvas id="categoryChart" height="180"></canvas></div>
    </div>
    <div class="acd" style="margin-bottom:0">
      <div class="ach"><span>👥 Phân tích khách hàng</span></div>
      <div style="text-align:center;margin-bottom:14px">
        <div style="font-size:36px;font-weight:700;color:#2D6A4F">${cs.returning_rate}%</div>
        <div style="font-size:11px;color:var(--tx3)">Tỉ lệ khách quay lại</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
        <div class="seg-card seg-new"><div class="seg-num">${cs.new_customers}</div><div class="seg-label">Mới (1 đơn)</div></div>
        <div class="seg-card seg-regular"><div class="seg-num">${cs.regular}</div><div class="seg-label">Thường (2-4)</div></div>
        <div class="seg-card seg-vip"><div class="seg-num">${cs.vip}</div><div class="seg-label">VIP (5+)</div></div>
      </div>
      <div style="font-size:12px">
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cr2)"><span style="color:var(--tx3)">TB đơn/khách</span><strong>${custAnalytics.avgOrdersPerCustomer}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--cr2)"><span style="color:var(--tx3)">CLV trung bình</span><strong style="color:#2D6A4F">${fmt(custAnalytics.avgLifetimeValue)}</strong></div>
        <div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--tx3)">Tổng khách quay lại</span><strong>${cs.returning}/${cs.total}</strong></div>
      </div>
      ${custAnalytics.topCustomers.length ? `<div style="margin-top:12px"><div style="font-size:11px;font-weight:700;color:var(--tx3);margin-bottom:6px">TOP KHÁCH HÀNG</div>
      ${custAnalytics.topCustomers.slice(0, 5).map((c, i) => `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;border-bottom:1px solid var(--cr2)">
        <span style="font-weight:700;color:${i < 3 ? '#D4A843' : 'var(--tx3)'}">#${i+1}</span>
        <span style="flex:1">${esc(c.name)}</span>
        <span style="color:var(--tx3)">${c.total_orders} đơn</span>
        <strong style="color:#2D6A4F">${fmt(c.total_spent)}</strong>
      </div>`).join('')}</div>` : ''}
    </div>
  </div>`;

  // ── Inventory Alerts ──
  if (inventory.alerts.length) {
    h += `<div class="acd" style="border-left:4px solid #d97706">
      <div class="ach"><span>⚠️ Cảnh báo tồn kho (${inventory.alerts.length} SP)</span></div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">
        <div class="seg-card" style="background:#FDECEA"><div class="seg-num" style="color:#A0291F">${inventory.summary.out_of_stock}</div><div class="seg-label">Hết hàng</div></div>
        <div class="seg-card" style="background:#FEF3CD"><div class="seg-num" style="color:#A05000">${inventory.summary.critical_low}</div><div class="seg-label">Sắp hết (&lt;5)</div></div>
        <div class="seg-card" style="background:#FFF8E1"><div class="seg-num" style="color:#F59E0B">${inventory.summary.low_stock}</div><div class="seg-label">Thấp (&lt;10)</div></div>
        <div class="seg-card" style="background:#E8F5E9"><div class="seg-num" style="color:#2E7D32">${inventory.summary.in_stock}</div><div class="seg-label">Đủ hàng</div></div>
      </div>
      ${inventory.alerts.map(p => `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--cr2);font-size:12px">
        <span style="font-weight:700;min-width:30px;color:${p.stock === 0 ? '#A0291F' : '#A05000'}">${p.stock === 0 ? 'HẾT' : p.stock}</span>
        <span style="flex:1">${esc(p.name)}</span>
        <span class="bdg done">${esc(p.category)}</span>
        <button class="ab" onclick="editStock(${p.id}, ${p.stock})">📦 Nhập</button>
      </div>`).join('')}
    </div>`;
  }

  // ── Order Status + Activity + Quick Actions ──
  h += `<div class="dash-2col">
    <div class="acd" style="margin-bottom:0">
      <div class="ach"><span>📊 Trạng thái đơn hàng</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="seg-card" style="background:#EBF5FB"><div class="seg-num" style="color:#1A75A5">${stats.newOrders}</div><div class="seg-label">Đơn mới</div></div>
        <div class="seg-card" style="background:#FEF3CD"><div class="seg-num" style="color:#A05000">${stats.processingOrders}</div><div class="seg-label">Đang làm</div></div>
        <div class="seg-card" style="background:#E8F5E9"><div class="seg-num" style="color:#2E7D32">${stats.completedOrders}</div><div class="seg-label">Hoàn thành</div></div>
        <div class="seg-card" style="background:#FDECEA"><div class="seg-num" style="color:#A0291F">${stats.cancelledOrders}</div><div class="seg-label">Đã hủy</div></div>
      </div>
    </div>
    <div class="acd" style="margin-bottom:0">
      <div class="ach"><span>🔔 Hoạt động gần đây</span></div>
      ${logs.map(l => `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--cr2);font-size:12px"><span style="font-size:14px">${l.type==='success'?'✅':l.type==='error'?'❌':l.type==='warning'?'⚠️':'🔄'}</span><span style="flex:1;color:var(--tx2)">${esc(l.message)}</span><span style="font-size:10px;color:var(--tx3);white-space:nowrap">${formatTime(l.created_at)}</span></div>`).join('')}
    </div>
  </div>
  <div class="acd"><div class="ach"><span>⚡ Thao tác nhanh</span></div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
      <button class="db-btn green" onclick="aTab('ord')">📦 Xem đơn hàng</button>
      <button class="db-btn green" onclick="aTab('pro')">🛍 Quản lý sản phẩm</button>
      <button class="db-btn ghost" onclick="downloadCSV('/export/orders','orders.csv')">⬇ Export đơn</button>
      <button class="db-btn ghost" onclick="downloadCSV('/export/products','products.csv')">⬇ Export SP</button>
      <button class="db-btn ghost" onclick="gHome()">🏠 Về trang chủ</button>
    </div>
  </div>`;

  // Init charts after DOM render
  setTimeout(() => {
    initRevenueChart(revenue.daily);
    initCategoryChart(topProducts.categoryRevenue);
  }, 80);

  return h;
}

// ── Chart.js: Revenue Bar Chart ──
function initRevenueChart(data) {
  const ctx = document.getElementById('revenueChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (revenueChartInstance) revenueChartInstance.destroy();
  revenueChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => {
        if (d.day) return new Date(d.day).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' });
        if (d.month) { const [,m] = d.month.split('-'); return 'T' + parseInt(m); }
        return '';
      }),
      datasets: [{
        label: 'Doanh thu',
        data: data.map(d => d.revenue),
        backgroundColor: 'rgba(50,158,96,0.7)',
        borderColor: '#2D6A4F',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: c => fmt(c.raw) } } },
      scales: {
        y: { ticks: { callback: v => (v/1000)+'k' }, grid: { color:'#E8F7EE' } },
        x: { grid: { display: false } }
      }
    }
  });
}

// ── Chart.js: Category Doughnut ──
function initCategoryChart(data) {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || typeof Chart === 'undefined') return;
  if (categoryChartInstance) categoryChartInstance.destroy();
  const labels = Object.keys(data);
  const values = Object.values(data);
  const colors = ['#329E60','#D4A843','#1877f2','#e11d48','#7c3aed','#d97706'];
  categoryChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#fff' }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
        tooltip: { callbacks: { label: c => `${c.label}: ${fmt(c.raw)}` } }
      }
    }
  });
}

// ── Switch Revenue Period ──
async function switchRevenuePeriod(period, btn) {
  document.querySelectorAll('.cpb').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  const data = await api(`/dashboard/revenue?period=${period}`);
  const chartData = period === '12months' ? data.monthly : data.daily;
  initRevenueChart(chartData);
}

let ordFilter = { status: 'Tất cả', search: '', dateFrom: '', dateTo: '', preset: 'all' };

function dateStr(d) { return d.toISOString().slice(0, 10); }
function applyDatePreset(preset) {
  ordFilter.preset = preset;
  const now = new Date();
  const today = dateStr(now);
  const yesterday = dateStr(new Date(now - 86400000));
  const weekStart = dateStr(new Date(now - now.getDay() * 86400000));
  const lastWeekStart = dateStr(new Date(now - (now.getDay() + 7) * 86400000));
  const lastWeekEnd = dateStr(new Date(now - (now.getDay() + 1) * 86400000));
  const monthStart = today.slice(0, 8) + '01';
  const lastMonthEnd = dateStr(new Date(now.getFullYear(), now.getMonth(), 0));
  const lastMonthStart = lastMonthEnd.slice(0, 8) + '01';

  const presets = {
    'all': { from: '', to: '' },
    'today': { from: today, to: today },
    'yesterday': { from: yesterday, to: yesterday },
    'today_yesterday': { from: yesterday, to: today },
    '7days': { from: dateStr(new Date(now - 7 * 86400000)), to: today },
    '14days': { from: dateStr(new Date(now - 14 * 86400000)), to: today },
    '28days': { from: dateStr(new Date(now - 28 * 86400000)), to: today },
    '30days': { from: dateStr(new Date(now - 30 * 86400000)), to: today },
    'this_week': { from: weekStart, to: today },
    'last_week': { from: lastWeekStart, to: lastWeekEnd },
    'this_month': { from: monthStart, to: today },
    'last_month': { from: lastMonthStart, to: lastMonthEnd },
  };
  const p = presets[preset] || presets['all'];
  ordFilter.dateFrom = p.from;
  ordFilter.dateTo = p.to;
  rAdm();
}

const presetLabels = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'yesterday', label: 'Hôm qua' },
  { key: 'today_yesterday', label: 'Hôm nay & qua' },
  { key: '7days', label: '7 ngày qua' },
  { key: '14days', label: '14 ngày qua' },
  { key: '30days', label: '30 ngày qua' },
  { key: 'this_week', label: 'Tuần này' },
  { key: 'last_week', label: 'Tuần trước' },
  { key: 'this_month', label: 'Tháng này' },
  { key: 'last_month', label: 'Tháng trước' },
];

async function rOrd() {
  const orders = await api('/orders');

  // Apply filters
  let filtered = orders;
  if (ordFilter.status !== 'Tất cả') filtered = filtered.filter(o => o.status === ordFilter.status);
  if (ordFilter.search) {
    const q = ordFilter.search.toLowerCase();
    filtered = filtered.filter(o => o.customer_name.toLowerCase().includes(q) || o.order_code.toLowerCase().includes(q) || o.customer_phone.includes(q));
  }
  if (ordFilter.dateFrom) filtered = filtered.filter(o => o.created_at >= ordFilter.dateFrom);
  if (ordFilter.dateTo) filtered = filtered.filter(o => o.created_at <= ordFilter.dateTo + ' 23:59:59');

  // Stats
  const totalRevenue = filtered.filter(o => ['Hoàn thành', 'Đang làm'].includes(o.status)).reduce((s, o) => s + o.total, 0);
  const completed = filtered.filter(o => o.status === 'Hoàn thành').length;
  const pending = filtered.filter(o => o.status === 'Mới').length;
  const processing = filtered.filter(o => o.status === 'Đang làm').length;
  const cancelled = filtered.filter(o => o.status === 'Hủy').length;

  return `
    <!-- Stats cards -->
    <div class="sgrid" style="grid-template-columns:repeat(5,1fr);margin-bottom:14px">
      <div class="sc2" style="border-top-color:#2D6A4F"><div class="sl2">Doanh thu (lọc)</div><div class="sv">${fmt(totalRevenue)}</div></div>
      <div class="sc2" style="border-top-color:#1A75A5;cursor:pointer" onclick="ordFilterStatus('Mới')"><div class="sl2">Đơn mới</div><div class="sv" style="color:#1A75A5">${pending}</div></div>
      <div class="sc2" style="border-top-color:#A05000;cursor:pointer" onclick="ordFilterStatus('Đang làm')"><div class="sl2">Đang làm</div><div class="sv" style="color:#A05000">${processing}</div></div>
      <div class="sc2" style="border-top-color:#2E7D32;cursor:pointer" onclick="ordFilterStatus('Hoàn thành')"><div class="sl2">Hoàn thành</div><div class="sv" style="color:#2E7D32">${completed}</div></div>
      <div class="sc2" style="border-top-color:#A0291F;cursor:pointer" onclick="ordFilterStatus('Hủy')"><div class="sl2">Đã hủy</div><div class="sv" style="color:#A0291F">${cancelled}</div></div>
    </div>

    <div class="acd">
      <div class="ach"><span>📦 Đơn hàng (${filtered.length}/${orders.length})</span>
        <button class="apb" onclick="downloadCSV('/export/orders','orders.csv')"><svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export</button>
      </div>

      <!-- Date Presets -->
      <div class="date-presets">
        ${presetLabels.map(p => `<button class="dp-btn ${ordFilter.preset === p.key ? 'on' : ''}" onclick="applyDatePreset('${p.key}')">${p.label}</button>`).join('')}
      </div>

      <!-- Filters -->
      <div class="ord-filters">
        <input type="text" class="db-search" placeholder="🔍 Tìm mã đơn, tên, SĐT..." value="${esc(ordFilter.search)}" oninput="ordFilter.search=this.value;rAdm()">
        <select class="ord-select" onchange="ordFilter.status=this.value;rAdm()">
          <option ${ordFilter.status==='Tất cả'?'selected':''}>Tất cả</option>
          <option ${ordFilter.status==='Mới'?'selected':''}>Mới</option>
          <option ${ordFilter.status==='Đang làm'?'selected':''}>Đang làm</option>
          <option ${ordFilter.status==='Hoàn thành'?'selected':''}>Hoàn thành</option>
          <option ${ordFilter.status==='Hủy'?'selected':''}>Hủy</option>
        </select>
        <input type="date" class="ord-date" value="${ordFilter.dateFrom}" onchange="ordFilter.dateFrom=this.value;ordFilter.preset='custom';rAdm()" title="Từ ngày">
        <input type="date" class="ord-date" value="${ordFilter.dateTo}" onchange="ordFilter.dateTo=this.value;ordFilter.preset='custom';rAdm()" title="Đến ngày">
        <button class="db-btn ghost" onclick="ordFilter={status:'Tất cả',search:'',dateFrom:'',dateTo:'',preset:'all'};rAdm()">↺ Reset</button>
      </div>

      ${!filtered.length ? '<p style="color:var(--tx3);font-size:13px;padding:20px 0;text-align:center">Không tìm thấy đơn hàng phù hợp</p>' : ''}
      ${filtered.length ? `<div style="overflow-x:auto"><table>
        <tr><th>#</th><th>Mã đơn</th><th>Khách hàng</th><th>SĐT</th><th>Sản phẩm</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày</th><th>Thao tác</th></tr>
        ${filtered.map((o, idx) => {
          const items = typeof o.items === 'string' ? JSON.parse(o.items) : o.items;
          const itemSummary = items.map(i => i.name + ' ×' + i.qty).join(', ');
          return `
          <tr>
            <td style="color:var(--tx3);font-size:11px">${idx + 1}</td>
            <td><strong style="color:#2D6A4F">${esc(o.order_code)}</strong></td>
            <td><strong>${esc(o.customer_name)}</strong></td>
            <td style="font-family:monospace;font-size:11px">${o.customer_phone}</td>
            <td style="font-size:11px;color:var(--tx3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(itemSummary)}">${esc(itemSummary)}</td>
            <td><strong style="color:#2D6A4F">${fmt(o.total)}</strong></td>
            <td><span class="bdg ${o.payment_method === 'Chuyển khoản' ? 'done' : o.payment_method === 'COD' ? 'proc' : 'new'}">${o.payment_method}</span></td>
            <td><span class="bdg ${stc(o.status)}">${o.status}</span></td>
            <td style="font-size:11px;color:var(--tx3);white-space:nowrap">${formatTime(o.created_at)}</td>
            <td style="white-space:nowrap">
              ${o.status === 'Mới' ? `<button class="ab" onclick="upO(${o.id},'Đang làm')">Nhận</button>` : ''}
              ${o.status === 'Đang làm' ? `<button class="ab" onclick="upO(${o.id},'Hoàn thành')">Xong</button>` : ''}
              ${['Mới', 'Đang làm'].includes(o.status) ? `<button class="ab" onclick="upO(${o.id},'Hủy')">Hủy</button>` : ''}
              <button class="ab" onclick="printReceipt(${o.id})">🖨</button>
            </td>
          </tr>`;
        }).join('')}
      </table></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--cr2);font-size:12px;color:var(--tx3)">
        <span>Hiển thị ${filtered.length} / ${orders.length} đơn hàng</span>
        <span>Tổng doanh thu (lọc): <strong style="color:#2D6A4F;font-size:14px">${fmt(totalRevenue)}</strong></span>
      </div>` : ''}
    </div>`;
}

function ordFilterStatus(status) {
  ordFilter.status = status;
  rAdm();
}

async function upO(id, status) {
  await api(`/orders/${id}/status`, { method: 'PUT', body: { status } });
  toast(`Cập nhật: ${status}`, 'success');
  rAdm();
}

async function rPro() {
  const allProducts = await api('/products');
  return `
    <div class="acd">
      <div class="ach"><span>🛍 Sản phẩm (${allProducts.length})</span>
        <button class="apb" onclick="showAddProductForm()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Thêm SP</button>
      </div>
      <div style="overflow-x:auto"><table>
        <tr><th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá bán</th><th>Tồn kho</th><th>BS</th><th>Thao tác</th></tr>
        ${allProducts.map(p => {
          const cls = CAT_CLASS[p.category] || 'default';
          const icon = CAT_ICONS[p.category] || '🎂';
          const hasImg = p.image_url && p.image_url.length > 1;
          const thumbHtml = hasImg
            ? `<img class="pth" src="${esc(p.image_url)}" alt="${esc(p.name)}" onerror="this.outerHTML='<div class=\\'pth-wrap ${cls}\\'>${icon}</div>'">`
            : `<div class="pth-wrap ${cls}">${icon}</div>`;
          return `
          <tr>
            <td>${thumbHtml}</td>
            <td><strong>${esc(p.name)}</strong>${p.is_bestseller ? ' <span class="bdg bsp">★ BS</span>' : ''}</td>
            <td><span class="bdg done">${esc(p.category)}</span></td>
            <td><strong style="color:#2D6A4F">${fmt(p.price)}</strong></td>
            <td style="font-weight:700;color:${p.stock === 0 ? '#A0291F' : p.stock < 10 ? '#A05000' : '#2D6A4F'}">${p.stock === 0 ? 'Hết' : p.stock}</td>
            <td><input type="checkbox" ${p.is_bestseller ? 'checked' : ''} onchange="toggleBS(${p.id}, ${p.is_bestseller})" style="cursor:pointer;accent-color:#329E60"></td>
            <td style="white-space:nowrap">
              <button class="ab" onclick="editStock(${p.id}, ${p.stock})">📦 Kho</button>
              <button class="ab" onclick="editPrice(${p.id}, ${p.price})">💰 Giá</button>
            </td>
          </tr>`;
        }).join('')}
      </table></div>
      <div class="fp" id="fpn" style="display:none">
        <div style="font-size:13px;font-weight:700;color:var(--tx);margin-bottom:10px" id="fpt">Thêm sản phẩm mới</div>
        <div class="fpr">
          <input id="pfn" placeholder="Tên sản phẩm">
          <select id="pfc"><option>Croissant</option><option>Bánh Mì</option><option>Tart</option><option>Đồ Uống</option></select>
        </div>
        <div class="fpr">
          <input id="pfp" placeholder="Giá bán (đ)" type="number">
          <input id="pfs" placeholder="Tồn kho" type="number">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="svbtn" onclick="saveProduct()">💾 Lưu</button>
          <button class="clbtn" onclick="document.getElementById('fpn').style.display='none'">Hủy</button>
        </div>
      </div>
    </div>`;
}

function showAddProductForm() {
  setTimeout(() => {
    const el = document.getElementById('fpn');
    if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); }
    ['pfn', 'pfp', 'pfs'].forEach(f => { const el = document.getElementById(f); if (el) el.value = ''; });
  }, 50);
}

async function saveProduct() {
  const name = document.getElementById('pfn')?.value.trim();
  const category = document.getElementById('pfc')?.value;
  const price = parseInt(document.getElementById('pfp')?.value) || 0;
  const stock = parseInt(document.getElementById('pfs')?.value) || 0;
  if (!name) { toast('Nhập tên sản phẩm!', 'error'); return; }
  if (!price) { toast('Nhập giá bán!', 'error'); return; }
  await api('/products', { method: 'POST', body: { name, category, price, stock } });
  products = await api('/products');
  toast('Thêm sản phẩm thành công!', 'success');
  rAdm();
  rHome();
}

async function editStock(id, currentStock) {
  const val = prompt('Nhập tồn kho mới:', currentStock);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) { toast('Số lượng không hợp lệ!', 'error'); return; }
  await api(`/products/${id}`, { method: 'PUT', body: { stock: n } });
  products = await api('/products');
  toast('Cập nhật tồn kho OK', 'success');
  rAdm(); rHome();
}

async function editPrice(id, currentPrice) {
  const val = prompt('Nhập giá mới (đ):', currentPrice);
  if (val === null) return;
  const n = parseInt(val);
  if (isNaN(n) || n < 0) { toast('Giá không hợp lệ!', 'error'); return; }
  await api(`/products/${id}`, { method: 'PUT', body: { price: n } });
  products = await api('/products');
  toast('Cập nhật giá OK', 'success');
  rAdm(); rHome();
}

async function toggleBS(id, current) {
  await api(`/products/${id}`, { method: 'PUT', body: { is_bestseller: current ? 0 : 1 } });
  products = await api('/products');
  toast(current ? 'Bỏ Best Seller' : 'Đánh dấu Best Seller', 'success');
  rAdm(); rHome();
}

function custSegment(orders) {
  if (orders >= 5) return { label: 'VIP', cls: 'seg-vip-badge' };
  if (orders >= 2) return { label: 'Thường', cls: 'seg-regular-badge' };
  return { label: 'Mới', cls: 'seg-new-badge' };
}

const partnerKeywords = ['café', 'cafe', 'quán', 'bakery', 'trà sữa', 'đại lý', 'minimart', 'store', 'cửa hàng', 'shop bánh'];
const bizKeywords = ['văn phòng', 'vp ', 'corp', 'công ty', 'cty', 'group', 'jsc', 'tnhh', 'co.', 'office', 'studio', 'agency', 'tech', 'media'];
function custType(name) {
  const lower = name.toLowerCase();
  if (bizKeywords.some(kw => lower.includes(kw))) return 'biz';
  if (partnerKeywords.some(kw => lower.includes(kw))) return 'partner';
  return 'retail';
}

let cusTab = 'all'; // 'all', 'retail', 'partner', 'biz'

async function rCus() {
  const [customers, analytics] = await Promise.all([api('/customers'), api('/dashboard/customers-analytics')]);
  const cs = analytics.summary;

  const retail = customers.filter(c => custType(c.name) === 'retail');
  const partners = customers.filter(c => custType(c.name) === 'partner');
  const biz = customers.filter(c => custType(c.name) === 'biz');
  const display = cusTab === 'partner' ? partners : cusTab === 'biz' ? biz : cusTab === 'retail' ? retail : customers;

  const retailRevenue = retail.reduce((s, c) => s + c.total_spent, 0);
  const partnerRevenue = partners.reduce((s, c) => s + c.total_spent, 0);
  const bizRevenue = biz.reduce((s, c) => s + c.total_spent, 0);
  const totalRevenue = retailRevenue + partnerRevenue + bizRevenue;

  const typeIcon = { retail: '🛍 Lẻ', partner: '🤝 Đối tác', biz: '🏢 Doanh nghiệp' };
  const typeCls = { retail: 'new', partner: 'proc', biz: 'bsp' };

  let h = `
    <div class="sgrid" style="grid-template-columns:repeat(6,1fr);margin-bottom:14px">
      <div class="sc2" style="border-top-color:#2D6A4F;cursor:pointer" onclick="cusTab='all';rAdm()"><div class="sl2">Tổng khách</div><div class="sv">${cs.total}</div></div>
      <div class="sc2" style="border-top-color:#1877f2;cursor:pointer" onclick="cusTab='retail';rAdm()"><div class="sl2">Khách lẻ</div><div class="sv" style="color:#1877f2">${retail.length}</div><div style="font-size:10px;color:var(--tx3)">${fmt(retailRevenue)}</div></div>
      <div class="sc2" style="border-top-color:#d97706;cursor:pointer" onclick="cusTab='partner';rAdm()"><div class="sl2">Đối tác / Sỉ</div><div class="sv" style="color:#d97706">${partners.length}</div><div style="font-size:10px;color:var(--tx3)">${fmt(partnerRevenue)}</div></div>
      <div class="sc2" style="border-top-color:#7c3aed;cursor:pointer" onclick="cusTab='biz';rAdm()"><div class="sl2">Doanh nghiệp</div><div class="sv" style="color:#7c3aed">${biz.length}</div><div style="font-size:10px;color:var(--tx3)">${fmt(bizRevenue)}</div></div>
      <div class="sc2" style="border-top-color:#059669"><div class="sl2">Tỉ lệ quay lại</div><div class="sv">${cs.returning_rate}%</div></div>
      <div class="sc2" style="border-top-color:#e11d48"><div class="sl2">CLV trung bình</div><div class="sv">${fmt(analytics.avgLifetimeValue)}</div></div>
    </div>

    <!-- Tab chuyển đổi -->
    <div class="date-presets" style="margin-bottom:14px">
      <button class="dp-btn ${cusTab==='all'?'on':''}" onclick="cusTab='all';rAdm()">👥 Tất cả (${customers.length})</button>
      <button class="dp-btn ${cusTab==='retail'?'on':''}" onclick="cusTab='retail';rAdm()">🛍 Khách lẻ (${retail.length})</button>
      <button class="dp-btn ${cusTab==='partner'?'on':''}" onclick="cusTab='partner';rAdm()">🤝 Đối tác / Sỉ (${partners.length})</button>
      <button class="dp-btn ${cusTab==='biz'?'on':''}" onclick="cusTab='biz';rAdm()">🏢 Doanh nghiệp (${biz.length})</button>
    </div>

    ${(cusTab === 'partner' || cusTab === 'biz') && display.length ? `
    <div class="acd" style="border-left:4px solid ${cusTab === 'biz' ? '#7c3aed' : '#d97706'};margin-bottom:14px">
      <div class="ach"><span>${cusTab === 'biz' ? '🏢 Thống kê Doanh nghiệp' : '🤝 Thống kê Đối tác'}</span></div>
      <div class="sgrid" style="grid-template-columns:repeat(4,1fr)">
        <div class="seg-card" style="background:${cusTab === 'biz' ? '#F3E8FF' : '#FEF3CD'}"><div class="seg-num" style="color:${cusTab === 'biz' ? '#7c3aed' : '#d97706'}">${display.length}</div><div class="seg-label">${cusTab === 'biz' ? 'Doanh nghiệp' : 'Đối tác'}</div></div>
        <div class="seg-card" style="background:#E8F5E9"><div class="seg-num" style="color:#2E7D32">${fmt(cusTab === 'biz' ? bizRevenue : partnerRevenue)}</div><div class="seg-label">Tổng doanh thu</div></div>
        <div class="seg-card" style="background:#EBF5FB"><div class="seg-num" style="color:#1A75A5">${display.length ? fmt(Math.round((cusTab === 'biz' ? bizRevenue : partnerRevenue) / display.length)) : '0đ'}</div><div class="seg-label">TB / ${cusTab === 'biz' ? 'DN' : 'đối tác'}</div></div>
        <div class="seg-card" style="background:#FEF3CD"><div class="seg-num" style="color:#d97706">${totalRevenue ? Math.round((cusTab === 'biz' ? bizRevenue : partnerRevenue) / totalRevenue * 100) : 0}%</div><div class="seg-label">Tỉ trọng DT</div></div>
      </div>
    </div>` : ''}

    <div class="acd">
      <div class="ach"><span>${cusTab === 'biz' ? '🏢 Doanh nghiệp' : cusTab === 'partner' ? '🤝 Đối tác / Đại lý / Sỉ' : cusTab === 'retail' ? '🛍 Khách lẻ' : '👤 Tất cả khách hàng'} (${display.length})</span></div>
      ${!display.length ? '<p style="color:var(--tx3);font-size:13px;padding:16px 0;text-align:center">Không có dữ liệu</p>' : ''}
      ${display.length ? `<div style="overflow-x:auto"><table>
        <tr><th>#</th><th>Tên</th><th>SĐT</th><th>Địa chỉ</th><th>Email</th><th>Loại</th><th>Sinh nhật / KN</th><th>Đơn / DT</th><th>Ghi chú</th><th></th></tr>
        ${display.map((c, i) => {
          const seg = custSegment(c.total_orders);
          const ct = custType(c.name);
          const bdayLabel = c.birthday ? '🎂 ' + c.birthday : c.company_anniversary ? '🏢 ' + c.company_anniversary : '—';
          return `<tr>
            <td style="color:var(--tx3);font-size:11px">${i + 1}</td>
            <td><strong>${esc(c.name)}</strong><br><span class="bdg ${typeCls[ct]}" style="font-size:9px">${typeIcon[ct]}</span> <span class="bdg ${seg.cls}" style="font-size:9px">${seg.label}</span></td>
            <td style="font-family:monospace;font-size:11px">${c.phone}</td>
            <td style="font-size:11px;color:var(--tx3);max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(c.address || '')}">${esc(c.address) || '—'}</td>
            <td style="font-size:11px;color:var(--tx3)">${c.email || '—'}</td>
            <td><strong style="color:#2D6A4F">${fmt(c.total_spent)}</strong><br><span style="font-size:10px;color:var(--tx3)">${c.total_orders} đơn</span></td>
            <td style="font-size:11px">${bdayLabel}</td>
            <td style="font-size:11px">${c.total_orders} đơn<br><strong style="color:#2D6A4F;font-size:10px">${fmt(c.total_spent)}</strong></td>
            <td style="font-size:10px;color:var(--tx3);max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${esc(c.note || '')}">${esc(c.note) || '—'}</td>
            <td><button class="ab" onclick="editCustomer(${c.id})">✏️</button></td>
          </tr>`;
        }).join('')}
      </table></div>` : ''}
    </div>

    <div id="cus-reminders"></div>`;

  // Load reminders after render
  setTimeout(async () => {
    const reminders = await api('/customers/reminders');
    const el = document.getElementById('cus-reminders');
    if (!el || !reminders.length) return;
    el.innerHTML = `<div class="acd" style="border-left:4px solid #e11d48">
      <div class="ach"><span>🔔 Lịch nhắc tri ân — 7 ngày tới (${reminders.length})</span></div>
      ${reminders.map(r => `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--cr2);font-size:12px">
        <span style="font-size:20px">${r.event === 'birthday' ? '🎂' : '🏢'}</span>
        <div style="flex:1">
          <strong>${esc(r.name)}</strong> — ${r.event_label}
          <div style="font-size:10px;color:var(--tx3)">${r.phone} · ${r.event_date}</div>
        </div>
        <span class="bdg ${r.days_until === 0 ? 'can' : r.days_until <= 2 ? 'proc' : 'new'}" style="font-size:11px">
          ${r.days_until === 0 ? 'HÔM NAY!' : r.days_until === 1 ? 'Ngày mai' : r.days_until + ' ngày nữa'}
        </span>
        <button class="ab" onclick="toast('Gửi chúc mừng ${esc(r.name)}!','success')">🎁 Gửi</button>
      </div>`).join('')}
    </div>`;
  }, 100);

  return h;
}

// ══ EDIT CUSTOMER ══
async function editCustomer(id) {
  const customers = await api('/customers');
  const c = customers.find(x => x.id === id);
  if (!c) return;
  document.getElementById('send-modal-title').textContent = `✏️ Chỉnh sửa — ${c.name}`;
  document.getElementById('send-modal-body').innerHTML = `
    <div class="api-fields">
      <div class="api-field-row"><label>Email</label><input id="ce-email" class="seo-input" value="${esc(c.email || '')}"></div>
      <div class="api-field-row"><label>Địa chỉ</label><input id="ce-addr" class="seo-input" value="${esc(c.address || '')}"></div>
      <div class="api-field-row"><label>Sinh nhật (YYYY-MM-DD)</label><input id="ce-bday" type="date" class="seo-input" value="${c.birthday || ''}"></div>
      <div class="api-field-row"><label>KN thành lập (Đối tác/DN)</label><input id="ce-ann" type="date" class="seo-input" value="${c.company_anniversary || ''}"></div>
      <div class="api-field-row"><label>Zalo</label><input id="ce-zalo" class="seo-input" value="${esc(c.zalo || '')}"></div>
      <div class="api-field-row"><label>Facebook</label><input id="ce-fb" class="seo-input" value="${esc(c.facebook || '')}"></div>
      <div class="api-field-row"><label>Loại khách</label>
        <select id="ce-type" class="seo-input"><option value="retail" ${c.customer_type==='retail'?'selected':''}>🛍 Khách lẻ</option><option value="partner" ${c.customer_type==='partner'?'selected':''}>🤝 Đối tác</option><option value="biz" ${c.customer_type==='biz'?'selected':''}>🏢 Doanh nghiệp</option></select>
      </div>
      <div class="api-field-row"><label>Ghi chú</label><input id="ce-note" class="seo-input" value="${esc(c.note || '')}"></div>
    </div>
    <button type="button" class="cfbtn" onclick="saveCustomer(${id})">💾 Lưu thay đổi</button>
    <button type="button" class="bkbtn" onclick="closeSendModal()">← Quay lại</button>
  `;
  document.getElementById('send-modal').classList.add('open');
}

async function saveCustomer(id) {
  const data = {
    email: document.getElementById('ce-email')?.value || '',
    address: document.getElementById('ce-addr')?.value || '',
    birthday: document.getElementById('ce-bday')?.value || '',
    company_anniversary: document.getElementById('ce-ann')?.value || '',
    zalo: document.getElementById('ce-zalo')?.value || '',
    facebook: document.getElementById('ce-fb')?.value || '',
    customer_type: document.getElementById('ce-type')?.value || 'retail',
    note: document.getElementById('ce-note')?.value || ''
  };
  await api(`/customers/${id}`, { method: 'PUT', body: data });
  closeSendModal();
  toast('Đã cập nhật thông tin!', 'success');
  rAdm();
}

// ══ DATABASE PANEL — Full featured ══
async function rDB() {
  const stats = await api('/db/stats');
  const formatSize = bytes => bytes < 1024 ? bytes + ' B' : bytes < 1024 * 1024 ? (bytes / 1024).toFixed(1) + ' KB' : (bytes / (1024 * 1024)).toFixed(1) + ' MB';

  // Get data for current table
  let tableData = [];
  if (dbTable === 'orders') tableData = await api('/orders');
  else if (dbTable === 'products') tableData = await api('/products');
  else tableData = await api('/customers');

  const filtered = dbSearch ? tableData.filter(r => JSON.stringify(r).toLowerCase().includes(dbSearch.toLowerCase())) : tableData;

  // JSON viewer
  const jsonData = filtered.slice(0, 15);
  const jsonStr = JSON.stringify(jsonData, null, 2)
    .replace(/"([^"]+)":/g, '<span class="json-key">"$1"</span>:')
    .replace(/: "([^"]*)"(,?)/g, ': <span class="json-str">"$1"</span>$2')
    .replace(/: (\d+)(,?)/g, ': <span class="json-num">$1</span>$2')
    .replace(/: (true|false)(,?)/g, ': <span class="json-bool">$1</span>$2');

  // Category stats
  const catStats = [...new Set(products.map(p => p.category))].map(c => {
    const ps = products.filter(p => p.category === c);
    const totalStock = ps.reduce((s, p) => s + p.stock, 0);
    const totalValue = ps.reduce((s, p) => s + p.price * p.stock, 0);
    const maxVal = Math.max(...[...new Set(products.map(p => p.category))].map(cc => products.filter(p => p.category === cc).reduce((s, p) => s + p.price * p.stock, 0))) || 1;
    return `<div style="margin-bottom:12px">
      <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
        <span style="font-weight:600">${CAT_ICONS[c] || '📦'} ${c} (${ps.length} sp)</span>
        <span style="color:#2D6A4F;font-weight:700">${fmt(totalValue)}</span>
      </div>
      <div class="stat-bar"><div class="stat-bar-fill" style="width:${Math.round(totalValue / maxVal * 100) || 5}%"></div></div>
      <div style="font-size:10px;color:var(--tx3);margin-top:3px">${totalStock} sản phẩm tồn kho</div>
    </div>`;
  }).join('');

  // Table HTML
  let tableHtml = '';
  const DB_LABELS = { orders: '📦 Đơn hàng', products: '🛍 Sản phẩm', customers: '👤 Khách hàng' };

  if (dbTable === 'orders') {
    tableHtml = `<div class="db-table-wrap"><table class="db-table">
      <thead><tr><th>Mã đơn</th><th>Khách</th><th>SĐT</th><th>Tổng</th><th>Thanh toán</th><th>Trạng thái</th><th>Ngày</th></tr></thead>
      <tbody>${filtered.length ? filtered.map(o => `<tr>
        <td class="mono">${esc(o.order_code)}</td><td><strong>${esc(o.customer_name)}</strong></td>
        <td class="mono">${o.customer_phone}</td><td style="font-weight:700;color:#2D6A4F">${fmt(o.total)}</td>
        <td>${o.payment_method}</td><td><span class="bdg ${stc(o.status)}">${o.status}</span></td>
        <td class="mono" style="font-size:10px">${formatTime(o.created_at)}</td>
      </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--tx3)">Chưa có dữ liệu</td></tr>'}</tbody></table></div>`;
  } else if (dbTable === 'products') {
    tableHtml = `<div class="db-table-wrap"><table class="db-table">
      <thead><tr><th>Mã SP</th><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Tồn kho</th><th>Best Seller</th></tr></thead>
      <tbody>${filtered.map(p => `<tr>
        <td class="mono">${esc(p.code)}</td><td><strong>${esc(p.name)}</strong></td>
        <td><span class="bdg done">${esc(p.category)}</span></td>
        <td><input class="inline-edit" style="width:90px" value="${p.price}" onchange="quickUpdateProduct(${p.id},'price',+this.value)"></td>
        <td><input class="inline-edit" style="width:60px" value="${p.stock}" onchange="quickUpdateProduct(${p.id},'stock',+this.value)"></td>
        <td><input type="checkbox" ${p.is_bestseller ? 'checked' : ''} onchange="quickUpdateProduct(${p.id},'is_bestseller',this.checked?1:0)" style="cursor:pointer;accent-color:#329E60"></td>
      </tr>`).join('')}</tbody></table></div>`;
  } else {
    tableHtml = `<div class="db-table-wrap"><table class="db-table">
      <thead><tr><th>Họ tên</th><th>SĐT</th><th>Số đơn</th><th>Tổng chi</th><th>TB / đơn</th></tr></thead>
      <tbody>${filtered.length ? filtered.map(k => `<tr>
        <td><strong>${esc(k.name)}</strong></td><td class="mono">${k.phone}</td>
        <td style="text-align:center;font-weight:700">${k.total_orders}</td>
        <td style="font-weight:700;color:#2D6A4F">${fmt(k.total_spent)}</td>
        <td style="color:var(--tx3)">${k.total_orders ? fmt(Math.round(k.total_spent / k.total_orders)) : '—'}</td>
      </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--tx3)">Chưa có khách hàng</td></tr>'}</tbody></table></div>`;
  }

  return `
    <div class="db-grid">
      <div class="db-card"><h4>📦 Đơn hàng</h4><div class="dv">${stats.orders}</div><div class="ds">Tổng bản ghi</div></div>
      <div class="db-card"><h4>🛍 Sản phẩm</h4><div class="dv">${stats.products}</div><div class="ds">Danh mục: ${categories.length} loại</div></div>
      <div class="db-card"><h4>👤 Khách hàng</h4><div class="dv">${stats.customers}</div><div class="ds">DB: ${formatSize(stats.dbSize)}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 320px;gap:14px">
      <div>
        <div class="acd">
          <div class="ach"><span>📊 Trình quản lý dữ liệu</span><span style="font-size:11px;color:var(--tx3);font-weight:400">${filtered.length} / ${tableData.length} bản ghi</span></div>
          <div class="db-tabs">
            ${['orders', 'products', 'customers'].map(t => `<button class="db-tab${t === dbTable ? ' on' : ''}" onclick="switchDBTable('${t}')">${DB_LABELS[t]} (${t === 'orders' ? stats.orders : t === 'products' ? stats.products : stats.customers})</button>`).join('')}
          </div>
          <div class="db-toolbar">
            <input class="db-search" placeholder="🔍 Tìm kiếm trong ${DB_LABELS[dbTable]}..." value="${esc(dbSearch)}" oninput="dbSearch=this.value;rAdm()">
            <button class="db-btn ghost" onclick="downloadCSV('/export/orders','orders.csv')">⬇ Export CSV</button>
            <button class="db-btn ghost" onclick="exportJSON()">⬇ JSON</button>
          </div>
          ${tableHtml}
        </div>
        <div class="acd">
          <div class="ach"><span>🔍 JSON Viewer</span><span style="font-size:10px;color:var(--tx3);font-weight:400">(${Math.min(15, filtered.length)} bản ghi đầu)</span></div>
          <div class="json-box">${jsonStr}</div>
        </div>
      </div>
      <div>
        <div class="acd">
          <div class="ach"><span>📈 Giá trị theo danh mục</span></div>
          ${catStats || '<p style="color:var(--tx3);font-size:12px">Chưa có dữ liệu</p>'}
        </div>
        <div class="acd">
          <div class="ach"><span>🖥️ Thông tin hệ thống</span></div>
          <div style="display:flex;flex-direction:column;gap:8px;font-size:12px">
            <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Database</span><span style="font-weight:600">${esc(stats.dbPath)}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Kích thước</span><span style="font-weight:600">${formatSize(stats.dbSize)}</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Engine</span><span style="font-weight:600">SQLite WAL</span></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--tx3)">Blog posts</span><span style="font-weight:600">${stats.blogs} bài</span></div>
          </div>
        </div>
        <div class="acd">
          <div class="ach"><span>⚡ Thao tác nhanh</span></div>
          <div style="display:flex;flex-direction:column;gap:8px">
            <button class="db-btn green" style="justify-content:center" onclick="resetAllStock()">🔄 Reset tồn kho về 50</button>
            <button class="db-btn ghost" style="justify-content:center" onclick="downloadCSV('/export/products','products.csv')">📦 Export sản phẩm</button>
            <button class="db-btn ghost" style="justify-content:center" onclick="downloadCSV('/export/orders','orders.csv')">📦 Export đơn hàng</button>
          </div>
        </div>
      </div>
    </div>`;
}

function switchDBTable(t) { dbTable = t; dbSearch = ''; rAdm(); }

async function quickUpdateProduct(id, field, value) {
  await api(`/products/${id}`, { method: 'PUT', body: { [field]: value } });
  products = await api('/products');
  toast('Cập nhật OK', 'success');
}

async function resetAllStock() {
  if (!confirm('Reset tồn kho tất cả sản phẩm về 50?')) return;
  for (const p of products) {
    await api(`/products/${p.id}`, { method: 'PUT', body: { stock: 50 } });
  }
  products = await api('/products');
  toast('Reset tồn kho thành công!', 'success');
  rAdm(); rHome();
}

function exportJSON() {
  const data = { products, orders: 'Use /api/orders', timestamp: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'hello-cake-data.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  toast('Exported JSON!', 'success');
}

// ══ SEO PANEL ══
// ══ API CONNECTIONS ══
function rAPI() {
  const apis = [
    {
      id: 'zalo', icon: '💬', name: 'Zalo OA', desc: 'Gửi tin nhắn chăm sóc khách hàng qua Zalo Official Account',
      status: localStorage.getItem('api_zalo_token') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_zalo_oa_id', label: 'OA ID', placeholder: 'VD: 4318236243xxx', type: 'text' },
        { key: 'api_zalo_token', label: 'Access Token', placeholder: 'Lấy từ Zalo Developers Console', type: 'password' },
        { key: 'api_zalo_refresh', label: 'Refresh Token', placeholder: 'Dùng để gia hạn token tự động', type: 'password' }
      ],
      docs: 'https://developers.zalo.me/docs/official-account',
      guide: '1. Đăng ký Zalo OA tại oa.zalo.me\n2. Tạo app tại developers.zalo.me\n3. Lấy OA ID + Access Token\n4. Dán vào đây → Lưu'
    },
    {
      id: 'facebook', icon: '📘', name: 'Facebook Messenger', desc: 'Gửi tin nhắn qua Fanpage Facebook Messenger',
      status: localStorage.getItem('api_fb_token') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_fb_page_id', label: 'Page ID', placeholder: 'VD: 123456789', type: 'text' },
        { key: 'api_fb_token', label: 'Page Access Token', placeholder: 'Lấy từ Facebook Graph API Explorer', type: 'password' }
      ],
      docs: 'https://developers.facebook.com/docs/messenger-platform',
      guide: '1. Tạo Facebook App tại developers.facebook.com\n2. Thêm Messenger product\n3. Kết nối Fanpage → lấy Page Access Token\n4. Dán vào đây → Lưu'
    },
    {
      id: 'sms', icon: '📱', name: 'SMS (eSMS / Twilio)', desc: 'Gửi tin nhắn SMS đến số điện thoại khách hàng',
      status: localStorage.getItem('api_sms_key') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_sms_provider', label: 'Nhà cung cấp', placeholder: 'eSMS, Twilio, SpeedSMS', type: 'text' },
        { key: 'api_sms_key', label: 'API Key', placeholder: 'Lấy từ trang quản trị SMS', type: 'password' },
        { key: 'api_sms_secret', label: 'Secret Key', placeholder: 'Lấy từ trang quản trị SMS', type: 'password' },
        { key: 'api_sms_brand', label: 'Brandname', placeholder: 'VD: HELLOCAKE', type: 'text' }
      ],
      docs: 'https://esms.vn/documents',
      guide: '1. Đăng ký tài khoản tại esms.vn hoặc twilio.com\n2. Đăng ký Brandname (HELLOCAKE)\n3. Lấy API Key + Secret Key\n4. Dán vào đây → Lưu'
    },
    {
      id: 'email', icon: '📧', name: 'Email (Resend / SMTP)', desc: 'Gửi email khuyến mãi, xác nhận đơn hàng',
      status: localStorage.getItem('api_email_key') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_email_provider', label: 'Nhà cung cấp', placeholder: 'Resend, SendGrid, SMTP', type: 'text' },
        { key: 'api_email_key', label: 'API Key', placeholder: 'Lấy từ dashboard nhà cung cấp', type: 'password' },
        { key: 'api_email_from', label: 'Email gửi', placeholder: 'VD: hello@hellocake.vn', type: 'email' },
        { key: 'api_email_name', label: 'Tên hiển thị', placeholder: 'VD: Hello Cake', type: 'text' }
      ],
      docs: 'https://resend.com/docs',
      guide: '1. Đăng ký tại resend.com (miễn phí 3.000 email/tháng)\n2. Xác minh domain hellocake.vn\n3. Lấy API Key\n4. Dán vào đây → Lưu'
    },
    {
      id: 'payment', icon: '💳', name: 'Thanh toán (VNPay / MoMo)', desc: 'Thanh toán online tự động qua VNPay, MoMo, SePay',
      status: localStorage.getItem('api_payment_key') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_payment_provider', label: 'Nhà cung cấp', placeholder: 'VNPay, MoMo, SePay', type: 'text' },
        { key: 'api_payment_key', label: 'Merchant Key / API Key', placeholder: 'Lấy từ dashboard thanh toán', type: 'password' },
        { key: 'api_payment_secret', label: 'Secret / Hash Key', placeholder: 'Lấy từ dashboard thanh toán', type: 'password' },
        { key: 'api_payment_merchant', label: 'Merchant ID', placeholder: 'VD: HELLOCAKE001', type: 'text' }
      ],
      docs: 'https://sandbox.vnpayment.vn/apis',
      guide: '1. Đăng ký merchant tại vnpay.vn hoặc momo.vn\n2. Nhận Merchant ID + Secret Key\n3. Dán vào đây → Lưu\n4. Test trên sandbox trước khi go-live'
    },
    {
      id: 'shipping', icon: '🚚', name: 'Vận chuyển (GHN / GHTK)', desc: 'Tự động tạo đơn vận chuyển, tracking đơn hàng',
      status: localStorage.getItem('api_ship_token') ? 'connected' : 'disconnected',
      fields: [
        { key: 'api_ship_provider', label: 'Nhà cung cấp', placeholder: 'GHN, GHTK, Grab Express', type: 'text' },
        { key: 'api_ship_token', label: 'API Token', placeholder: 'Lấy từ dashboard đối tác vận chuyển', type: 'password' },
        { key: 'api_ship_shop_id', label: 'Shop ID', placeholder: 'VD: 12345', type: 'text' }
      ],
      docs: 'https://api.ghn.vn/home/docs/detail',
      guide: '1. Đăng ký shop tại ghn.vn hoặc ghtk.vn\n2. Vào Cài đặt → API → Lấy Token\n3. Dán vào đây → Lưu\n4. Đơn hàng sẽ tự động tạo vận đơn'
    }
  ];

  const connected = apis.filter(a => a.status === 'connected').length;

  let h = `<div class="sgrid" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px">
    <div class="sc2" style="border-top-color:#2D6A4F"><div class="sl2">Tổng kết nối</div><div class="sv">${apis.length}</div></div>
    <div class="sc2" style="border-top-color:#2E7D32"><div class="sl2">Đã kết nối</div><div class="sv" style="color:#2E7D32">${connected}</div></div>
    <div class="sc2" style="border-top-color:#A05000"><div class="sl2">Chờ cấu hình</div><div class="sv" style="color:#A05000">${apis.length - connected}</div></div>
  </div>`;

  h += apis.map(a => {
    const isConnected = a.status === 'connected';
    return `<div class="acd api-card ${isConnected ? 'api-connected' : ''}">
      <div class="ach">
        <span>${a.icon} ${a.name}</span>
        <span class="bdg ${isConnected ? 'done' : 'proc'}">${isConnected ? '✓ Đã kết nối' : '○ Chờ cấu hình'}</span>
      </div>
      <p style="font-size:12px;color:var(--tx3);margin-bottom:12px">${a.desc}</p>

      <div class="api-fields" id="api-fields-${a.id}">
        ${a.fields.map(f => `
          <div class="api-field-row">
            <label>${f.label}</label>
            <input type="${f.type}" id="${f.key}" placeholder="${f.placeholder}" value="${localStorage.getItem(f.key) || ''}" class="seo-input">
          </div>
        `).join('')}
      </div>

      <div class="api-guide">
        <details>
          <summary style="cursor:pointer;font-size:11px;font-weight:700;color:#2D6A4F;margin-bottom:6px">📖 Hướng dẫn kết nối</summary>
          <pre style="font-size:11px;color:var(--tx3);white-space:pre-wrap;line-height:1.8;margin-top:6px">${a.guide}</pre>
        </details>
      </div>

      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="db-btn green" onclick="saveAPIConfig('${a.id}', ${JSON.stringify(a.fields.map(f => f.key))})">💾 Lưu cấu hình</button>
        ${isConnected ? `<button class="db-btn red" onclick="disconnectAPI('${a.id}', ${JSON.stringify(a.fields.map(f => f.key))})">🔌 Ngắt kết nối</button>` : ''}
        <a href="${a.docs}" target="_blank" class="db-btn ghost" style="text-decoration:none">📄 Docs</a>
      </div>
    </div>`;
  }).join('');

  return h;
}

function saveAPIConfig(id, keys) {
  let hasValue = false;
  for (const key of keys) {
    const el = document.getElementById(key);
    if (el && el.value.trim()) {
      localStorage.setItem(key, el.value.trim());
      hasValue = true;
    }
  }
  if (!hasValue) { toast('Nhập ít nhất 1 trường!', 'error'); return; }
  toast(`Đã lưu cấu hình ${id.toUpperCase()}! Sẵn sàng đấu nối.`, 'success');
  rAdm();
}

function disconnectAPI(id, keys) {
  if (!confirm('Ngắt kết nối ' + id.toUpperCase() + '?')) return;
  for (const key of keys) localStorage.removeItem(key);
  toast(`Đã ngắt ${id.toUpperCase()}`, 'info');
  rAdm();
}

function rSEO() {
  const score = 82;
  const circ = 2 * Math.PI * 36;
  const offset = circ - (circ * score / 100);

  // Từ khóa B2C (bán lẻ)
  const kwRetail = [
    { kw: 'croissant hà nội', vol: 'Cao', cls: 'kw-high', diff: 40, tip: 'Viết bài "Top 10 tiệm croissant Hà Nội" nhắc Hello Cake' },
    { kw: 'bánh ngọt ocean park', vol: 'Cao', cls: 'kw-high', diff: 20, tip: 'Local SEO: Google My Business + review 5 sao' },
    { kw: 'tiệm bánh gia lâm', vol: 'TB', cls: 'kw-mid', diff: 15, tip: 'Đăng bài trên nhóm Facebook Gia Lâm' },
    { kw: 'bánh sừng bò handmade', vol: 'TB', cls: 'kw-mid', diff: 30, tip: 'Video TikTok quy trình làm bánh' },
    { kw: 'tart trái cây hà nội', vol: 'TB', cls: 'kw-mid', diff: 25, tip: 'Bài blog "Công thức tart" + backlink' },
    { kw: 'đặt bánh online hà nội', vol: 'Cao', cls: 'kw-high', diff: 50, tip: 'Landing page riêng + Google Ads' },
    { kw: 'bánh sinh nhật ocean park', vol: 'TB', cls: 'kw-mid', diff: 20, tip: 'Bài viết mùa sinh nhật + combo' },
    { kw: 'ship bánh tươi hà nội', vol: 'Cao', cls: 'kw-high', diff: 45, tip: 'Meta desc nhấn mạnh "giao trong 30 phút"' },
  ];

  // Từ khóa B2B (đối tác)
  const kwB2B = [
    { kw: 'nhượng quyền tiệm bánh', vol: 'Cao', cls: 'kw-high', diff: 55, tip: 'Landing page nhượng quyền + form đăng ký' },
    { kw: 'cung cấp bánh sỉ hà nội', vol: 'Cao', cls: 'kw-high', diff: 35, tip: 'Bài viết "Bảng giá sỉ croissant 2026"' },
    { kw: 'đại lý bánh ngọt miền bắc', vol: 'TB', cls: 'kw-mid', diff: 25, tip: 'Đăng tin trên muabannhanh, chotot' },
    { kw: 'cung cấp croissant cho quán cafe', vol: 'TB', cls: 'kw-mid', diff: 20, tip: 'Bài blog "Cách mở quán cafe có bánh"' },
    { kw: 'mở đại lý bánh ocean park', vol: 'Thấp', cls: 'kw-low', diff: 10, tip: 'SEO địa phương, nhắc tên khu vực' },
    { kw: 'bánh sỉ hải phòng bắc ninh', vol: 'TB', cls: 'kw-mid', diff: 15, tip: 'Bài viết "Ship sỉ bánh tỉnh lân cận"' },
    { kw: 'hợp tác kinh doanh bánh ngọt', vol: 'TB', cls: 'kw-mid', diff: 30, tip: 'Trang "Hợp tác" riêng với SEO title' },
  ];

  const renderKW = (list) => list.map(k => `
    <div class="kw-row">
      <span style="flex:1;font-weight:500">${k.kw}</span>
      <span class="kw-vol ${k.cls}">${k.vol}</span>
      <div class="kw-diff"><div class="kw-diff-fill ${k.diff < 30 ? 'diff-easy' : k.diff < 50 ? 'diff-med' : 'diff-hard'}" style="width:${k.diff}%"></div></div>
      <span style="font-size:10px;color:var(--tx3);max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${k.tip}">💡 ${k.tip}</span>
    </div>
  `).join('');

  return `
    <div class="seo-grid">
      <div class="seo-score">
        <div class="seo-score-ring">
          <svg viewBox="0 0 80 80"><circle class="bg" cx="40" cy="40" r="36"/><circle class="fg" cx="40" cy="40" r="36" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"/></svg>
          <div class="seo-score-num">${score}</div>
        </div>
        <div class="seo-score-info">
          <h3>Điểm SEO tổng</h3>
          <p>Khá tốt — Cần tối ưu thêm từ khóa & backlink</p>
          <div class="seo-checks" style="margin-top:8px">
            <div class="seo-check"><div class="ic ok">✓</div><span>Meta title + description chuẩn</span></div>
            <div class="seo-check"><div class="ic ok">✓</div><span>Mobile responsive</span></div>
            <div class="seo-check"><div class="ic ok">✓</div><span>Ảnh sản phẩm có alt text</span></div>
            <div class="seo-check"><div class="ic warn">!</div><span>Cần thêm Schema.org markup</span></div>
            <div class="seo-check"><div class="ic warn">!</div><span>Cần Google My Business</span></div>
          </div>
        </div>
      </div>
      <div class="seo-card">
        <h4>🔍 Google Preview</h4>
        <div class="seo-preview">
          <div class="seo-preview-url">hellocake.vn</div>
          <div class="seo-preview-title">Hello Cake — Croissant & Tart Handmade Hà Nội | Tìm Đại Lý</div>
          <div class="seo-preview-date">29 thg 3, 2026</div>
          <div class="seo-preview-desc">Croissant, Tart trái cây handmade tươi mỗi ngày tại Ocean Park, Hà Nội. Cung cấp sỉ cho quán café. Tuyển đại lý miền Bắc. Giao hàng từ 2 chiếc. ☎ 0869.120.122</div>
        </div>
        <div class="seo-preview" style="margin-top:10px">
          <div class="seo-preview-url">hellocake.vn/dai-ly</div>
          <div class="seo-preview-title">Tuyển Đại Lý Bánh Hello Cake — Chiết Khấu 25% | Miền Bắc</div>
          <div class="seo-preview-date">29 thg 3, 2026</div>
          <div class="seo-preview-desc">Mở đại lý Hello Cake: vốn từ 15 triệu, chiết khấu 25%, hỗ trợ marketing. Cung cấp sỉ croissant từ 45K/chiếc. Hà Nội, Bắc Ninh, Hải Phòng, Hải Dương.</div>
        </div>
      </div>
    </div>

    <div class="seo-card" style="margin-bottom:14px">
      <h4>🛒 Từ khóa bán lẻ (B2C) — Hà Nội & lân cận</h4>
      ${renderKW(kwRetail)}
    </div>

    <div class="seo-card" style="margin-bottom:14px">
      <h4>🤝 Từ khóa tìm đối tác (B2B) — Miền Bắc</h4>
      ${renderKW(kwB2B)}
    </div>

    <div class="dash-2col">
      <div class="seo-card">
        <h4>📝 Meta Tags tối ưu</h4>
        <div class="seo-field">
          <label>Title <span>58/60 ký tự</span></label>
          <input class="seo-input ok" value="Hello Cake — Croissant & Tart Handmade Hà Nội | Tìm Đại Lý">
          <div class="seo-bar"><div class="seo-bar-fill" style="width:96%;background:#40916C"></div></div>
          <div class="seo-hint ok">✓ Chứa từ khóa chính + địa phương + B2B</div>
        </div>
        <div class="seo-field">
          <label>Description <span>155/160 ký tự</span></label>
          <textarea class="seo-input ok" rows="3">Croissant, Tart trái cây handmade tươi mỗi ngày tại Ocean Park, Hà Nội. Cung cấp sỉ cho quán café. Tuyển đại lý miền Bắc. Giao hàng từ 2 chiếc. ☎ 0869.120.122</textarea>
          <div class="seo-bar"><div class="seo-bar-fill" style="width:97%;background:#40916C"></div></div>
          <div class="seo-hint ok">✓ Chứa CTA + SĐT + từ khóa</div>
        </div>
      </div>
      <div class="seo-card">
        <h4>📊 Thang điểm bài viết chuẩn SEO</h4>
        <div style="font-size:12px">
          ${[
            { label: 'Tiêu đề có từ khóa chính', pts: 15, desc: 'VD: "Croissant Hà Nội" trong H1' },
            { label: 'Độ dài 1.500-2.500 từ', pts: 10, desc: 'Bài dài rank tốt hơn bài ngắn' },
            { label: 'Có heading H2, H3 phân cấp', pts: 10, desc: 'Ít nhất 3-5 heading phụ' },
            { label: 'Từ khóa trong 100 từ đầu', pts: 10, desc: 'Google đọc đoạn đầu trước' },
            { label: 'Ảnh có alt text mô tả', pts: 10, desc: 'VD: alt="croissant matcha hello cake"' },
            { label: 'Internal link (liên kết nội bộ)', pts: 10, desc: 'Link đến bài khác trong blog' },
            { label: 'External link (nguồn uy tín)', pts: 5, desc: 'Link đến Wikipedia, báo chí' },
            { label: 'URL thân thiện (slug ngắn)', pts: 5, desc: 'VD: /croissant-ha-noi thay vì /p?id=123' },
            { label: 'Meta description hấp dẫn', pts: 10, desc: 'Có CTA + số liệu cụ thể' },
            { label: 'Tốc độ tải < 3 giây', pts: 10, desc: 'Nén ảnh, lazy load, minify CSS/JS' },
            { label: 'Mobile-friendly 100%', pts: 5, desc: 'Test trên Google Mobile-Friendly' },
          ].map(s => `
            <div style="display:flex;align-items:center;gap:8px;padding:7px 0;border-bottom:1px solid var(--cr2)">
              <span style="background:#2D6A4F;color:#fff;font-size:10px;font-weight:700;padding:2px 6px;border-radius:4px;min-width:28px;text-align:center">${s.pts}</span>
              <div style="flex:1">
                <div style="font-weight:600;font-size:12px">${s.label}</div>
                <div style="font-size:10px;color:var(--tx3)">${s.desc}</div>
              </div>
            </div>
          `).join('')}
          <div style="display:flex;justify-content:space-between;padding:10px 0;font-weight:700;border-top:2px solid var(--bd);margin-top:4px">
            <span>TỔNG ĐIỂM TỐI ĐA</span>
            <span style="color:#2D6A4F;font-size:16px">100 điểm</span>
          </div>
          <div style="margin-top:6px;font-size:11px;color:var(--tx3)">
            <span style="color:#2E7D32">■ 80-100: Xuất sắc</span> ·
            <span style="color:#A05000">■ 60-79: Khá</span> ·
            <span style="color:#A0291F">■ &lt;60: Cần cải thiện</span>
          </div>
        </div>
      </div>
    </div>

    <div class="acd" style="margin-top:14px">
      <div class="ach"><span>📖 Hướng dẫn SEO hiệu quả nhất cho Hello Cake</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div>
          <div class="guide-step"><div class="guide-num">1</div><div class="guide-body"><h5>Google My Business (ƯU TIÊN #1)</h5><p>Tạo trang Google Business cho "Hello Cake Ocean Park". Upload ảnh, giờ mở cửa, SĐT. Khuyến khích khách để review 5 sao. <strong>Đây là cách nhanh nhất lên top local search.</strong></p></div></div>
          <div class="guide-step"><div class="guide-num">2</div><div class="guide-body"><h5>Viết blog 2 bài/tuần</h5><p>Chủ đề: "Croissant ngon nhất Hà Nội", "Cách chọn bánh cho quán café", "Review tiệm bánh Ocean Park". Mỗi bài 1.500+ từ, chứa từ khóa mục tiêu.</p></div></div>
          <div class="guide-step"><div class="guide-num">3</div><div class="guide-body"><h5>SEO địa phương (Local SEO)</h5><p>Nhắc tên: Gia Lâm, Ocean Park, Hà Nội, Bắc Ninh, Hải Phòng, Hải Dương trong bài viết. Google ưu tiên kết quả gần người tìm.</p></div></div>
          <div class="guide-step"><div class="guide-num">4</div><div class="guide-body"><h5>Backlink từ food blogger</h5><p>Mời 5-10 food blogger review. Mỗi backlink từ blog uy tín = 1 "phiếu bầu" cho Google. Ưu tiên: Foody, Diadiemanuong, blogger local.</p></div></div>
        </div>
        <div>
          <div class="guide-step"><div class="guide-num">5</div><div class="guide-body"><h5>Video TikTok & YouTube Shorts</h5><p>Quay quy trình làm bánh, behind-the-scenes. Video rank trên cả Google lẫn TikTok. Hashtag: #croissanthanoi #hellocake #banhhandmade</p></div></div>
          <div class="guide-step"><div class="guide-num">6</div><div class="guide-body"><h5>Trang "Đại lý" riêng biệt</h5><p>Tạo URL <code>/dai-ly</code> hoặc <code>/hop-tac</code> riêng. SEO title: "Tuyển Đại Lý Bánh Hello Cake Miền Bắc". Đây là trang B2B quan trọng nhất.</p></div></div>
          <div class="guide-step"><div class="guide-num">7</div><div class="guide-body"><h5>Schema.org Markup</h5><p>Thêm LocalBusiness schema, Product schema, Review schema. Google sẽ hiện rich snippet (sao, giá, giờ mở cửa) trong kết quả tìm kiếm.</p></div></div>
          <div class="guide-step"><div class="guide-num">8</div><div class="guide-body"><h5>Đăng tin trên các sàn</h5><p>Đăng tuyển đại lý trên: muabannhanh.com, chotot.com, raovat.net. Đăng cung cấp sỉ trên: các nhóm Facebook kinh doanh F&B miền Bắc.</p></div></div>
        </div>
      </div>
    </div>

    <div class="acd" style="margin-top:14px">
      <div class="ach"><span>✅ SEO Checklist</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
        ${[
          { text: 'Google My Business đã tạo', done: false },
          { text: 'Meta title chứa từ khóa + địa phương', done: true },
          { text: 'Meta description có CTA + SĐT', done: true },
          { text: 'Heading H1 duy nhất, có từ khóa', done: true },
          { text: 'Ảnh sản phẩm có alt text', done: true },
          { text: 'Open Graph tags (Facebook share)', done: false },
          { text: 'Schema.org LocalBusiness', done: false },
          { text: 'Trang /dai-ly riêng biệt', done: false },
          { text: 'Sitemap.xml', done: false },
          { text: 'Mobile Responsive', done: true },
          { text: 'Blog 2 bài/tuần', done: false },
          { text: 'Backlink từ 5+ food blogger', done: false },
          { text: 'Page Speed > 90 (Lighthouse)', done: true },
          { text: 'SSL Certificate (HTTPS)', done: false },
        ].map(c => `
          <div class="checklist-item">
            <input type="checkbox" ${c.done ? 'checked' : ''}>
            <label>${c.done ? '<strong>' + c.text + '</strong>' : c.text}</label>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ══ EXPORT ══
function downloadCSV(url, filename) {
  fetch('/api' + url)
    .then(res => res.blob())
    .then(blob => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      toast('Đã tải: ' + filename, 'success');
    })
    .catch(() => toast('Lỗi tải file', 'error'));
}

// ══ BLOG ══
function renderBlog() {
  const filtered = blogFilter === 'Tất cả' ? blogPosts : blogPosts.filter(p => p.category === blogFilter);
  const featured = filtered.filter(p => p.is_featured);
  const regular = filtered.filter(p => !p.is_featured);
  const blogIcons = { 'Kỹ thuật': '🔧', 'Nguyên liệu': '🧈', 'Công thức': '📋', 'Mẹo hay': '💡' };

  const featContainer = document.getElementById('blog-featured');
  if (featContainer && featured.length > 0) {
    const main = featured[0];
    const side = filtered.slice(1, 4);
    featContainer.innerHTML = `
      <div class="blog-feat-card" onclick="openBlog(${main.id})">
        <div class="blog-feat-wrap">${main.image_url ? `<img class="blog-feat-img" src="${esc(main.image_url)}" alt="${esc(main.title)}" onerror="this.style.display='none'">` : `<div class="pimg do-uong" style="height:260px;font-size:72px">📖</div>`}<div class="blog-tag" style="position:absolute;top:12px;left:12px;z-index:1">${esc(main.category)}</div></div>
        <div class="blog-feat-body">
          <div class="blog-meta"><span>✍️ ${esc(main.author)}</span><span>📅 ${formatBlogDate(main.created_at)}</span><span>⏱ ${main.read_time}</span></div>
          <div class="blog-feat-title">${esc(main.title)}</div>
          <div class="blog-feat-excerpt">${esc(main.excerpt)}</div>
          <div class="blog-read">Đọc tiếp <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
      </div>
      <div class="blog-side">
        ${side.map(p => `
          <div class="blog-mini" onclick="openBlog(${p.id})">
            ${p.image_url ? `<img class="blog-mini-img" src="${esc(p.image_url)}" alt="${esc(p.title)}" onerror="this.className='pimg ${CAT_CLASS[p.category]||'default'} blog-mini-img';this.style.fontSize='28px';this.textContent='📖'">` : `<div class="pimg ${CAT_CLASS[p.category] || 'default'} blog-mini-img" style="font-size:28px;border-radius:8px">${blogIcons[p.category] || '📖'}</div>`}
            <div class="blog-mini-body">
              <div class="blog-mini-tag">${esc(p.category)}</div>
              <div class="blog-mini-title">${esc(p.title)}</div>
              <div class="blog-mini-date">${formatBlogDate(p.created_at)}</div>
            </div>
          </div>
        `).join('')}
      </div>`;
  } else if (featContainer) {
    featContainer.innerHTML = '';
  }

  const gridContainer = document.getElementById('blog-grid');
  if (gridContainer) {
    const toShow = regular.slice(0, blogShown);
    gridContainer.innerHTML = toShow.map(p => `
      <div class="blog-card" onclick="openBlog(${p.id})">
        <div class="blog-img-wrap">${p.image_url ? `<img class="blog-img" src="${esc(p.image_url)}" alt="${esc(p.title)}" onerror="this.style.display='none'">` : `<div class="pimg ${CAT_CLASS[p.category] || 'default'}" style="width:100%;height:200px;font-size:48px;position:relative">${blogIcons[p.category] || '📖'}</div>`}<div class="blog-tag">${esc(p.category)}</div></div>
        <div class="blog-body">
          <div class="blog-meta"><span>✍️ ${esc(p.author)}</span><span>⏱ ${p.read_time}</span></div>
          <div class="blog-title">${esc(p.title)}</div>
          <div class="blog-excerpt">${esc(p.excerpt)}</div>
          <div class="blog-read">Đọc tiếp <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg></div>
        </div>
      </div>
    `).join('');
  }
}

function filterBlog(tag, btn) {
  blogFilter = tag;
  blogShown = 4;
  document.querySelectorAll('.blog-sec .stab').forEach(b => b.classList.remove('on'));
  if (btn) btn.classList.add('on');
  renderBlog();
}

function loadMoreBlog() { blogShown += 4; renderBlog(); }

async function openBlog(id) {
  try {
    const post = await api(`/blog/${id}`);
    document.getElementById('bm-tag').textContent = post.category;
    document.getElementById('bm-title').textContent = post.title;
    document.getElementById('bm-meta').innerHTML = `<span>✍️ ${esc(post.author)}</span><span>📅 ${formatBlogDate(post.created_at)}</span><span>⏱ ${post.read_time}</span><span>👁 ${post.views} lượt đọc</span>`;
    document.getElementById('bm-body').innerHTML = post.content;
    const tags = (post.tags || '').split(',').filter(Boolean);
    document.getElementById('bm-tags').innerHTML = tags.map(t => `<span class="btag">${t.trim()}</span>`).join('');
    document.getElementById('blog-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (err) {
    toast('Lỗi tải bài viết', 'error');
  }
}

function closeBlog() {
  document.getElementById('blog-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ══ CRM — Chăm sóc khách hàng ══
async function rCRM() {
  const data = await api('/crm/segments');
  const { segments, programs, recentMessages } = data;
  const segLabels = {
    new_customers: { icon: '🆕', name: 'Khách mới', desc: 'Mua 1 lần, chưa quay lại', color: '#1A75A5', bg: '#EBF5FB' },
    regular: { icon: '🔄', name: 'Khách thường', desc: '2-4 đơn, đang giữ chân', color: '#A05000', bg: '#FEF3CD' },
    vip: { icon: '👑', name: 'Khách VIP', desc: '5+ đơn, trung thành', color: '#2E7D32', bg: '#E8F5E9' },
    inactive: { icon: '😴', name: 'Ngủ đông', desc: '>30 ngày chưa mua', color: '#A0291F', bg: '#FDECEA' },
    high_value: { icon: '💎', name: 'Chi tiêu cao', desc: 'Tổng >500K', color: '#7c3aed', bg: '#F3E8FF' },
    recent: { icon: '🔥', name: 'Mua gần đây', desc: 'Trong 7 ngày qua', color: '#059669', bg: '#D1FAE5' }
  };

  let h = '';

  // ── 6 Segment Cards ──
  h += `<div class="sgrid" style="grid-template-columns:repeat(6,1fr);margin-bottom:16px">`;
  for (const [key, seg] of Object.entries(segLabels)) {
    const count = segments[key]?.count || 0;
    h += `<div class="sc2" style="border-top-color:${seg.color};cursor:pointer" onclick="showSegment('${key}')">
      <div style="font-size:20px;margin-bottom:4px">${seg.icon}</div>
      <div class="sv">${count}</div>
      <div class="sl2">${seg.name}</div>
    </div>`;
  }
  h += `</div>`;

  // ── Chương trình ưu đãi ──
  h += `<div class="acd">
    <div class="ach"><span>💝 Chương trình chăm sóc khách hàng (${programs.length})</span>
      <div style="display:flex;gap:6px">
        <button class="db-btn yellow" id="run-all-btn" onclick="runAllPrograms()">🚀 Chạy tất cả</button>
        <button class="apb" onclick="showAddLoyaltyForm()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tạo chương trình</button>
      </div>
    </div>
    ${programs.map(p => {
      const segInfo = { new: '🆕 Khách mới', regular: '🔄 Thường', vip: '👑 VIP', inactive: '😴 Ngủ đông', all: '👥 Tất cả' };
      return `<div class="crm-program">
        <div class="crm-program-info">
          <div class="crm-program-name">${esc(p.name)}</div>
          <div class="crm-program-detail">
            <span class="bdg seg-${p.segment === 'vip' ? 'vip' : p.segment === 'regular' ? 'regular' : p.segment === 'inactive' ? 'inactive' : 'new'}-badge">${segInfo[p.segment] || p.segment}</span>
            <span>🎫 ${esc(p.voucher_code)} — ${p.voucher_type === 'percent' ? p.voucher_value + '%' : fmt(p.voucher_value)}</span>
          </div>
          <div class="crm-program-msg">"${esc(p.message)}"</div>
        </div>
        <div class="crm-program-actions">
          <button class="db-btn green" onclick="sendOffer('${p.segment}', ${p.id})">📤 Gửi ưu đãi</button>
          <button class="db-btn red" onclick="deleteLoyalty(${p.id})">🗑</button>
        </div>
      </div>`;
    }).join('')}
    <div class="fp" id="fln" style="display:none">
      <div style="font-size:13px;font-weight:700;color:var(--tx);margin-bottom:10px">Tạo chương trình mới</div>
      <div class="fpr">
        <input id="ln" placeholder="Tên chương trình (VD: Chào khách mới)">
        <select id="ls"><option value="new">🆕 Khách mới</option><option value="regular">🔄 Thường</option><option value="vip">👑 VIP</option><option value="inactive">😴 Ngủ đông</option><option value="all">👥 Tất cả</option></select>
      </div>
      <div class="fpr">
        <input id="lc" placeholder="Mã voucher (VD: WELCOME10)" style="text-transform:uppercase">
        <select id="lt"><option value="percent">% Phần trăm</option><option value="fixed">₫ Cố định</option></select>
        <input id="lv" placeholder="Giá trị" type="number">
      </div>
      <div class="fpr">
        <input id="lm" placeholder="Đơn tối thiểu (0 = không giới hạn)" type="number">
      </div>
      <div class="fpr">
        <textarea id="lmsg" placeholder="Tin nhắn gửi khách hàng..." style="width:100%;min-height:60px;resize:none;padding:8px;border:1.5px solid var(--bd);border-radius:7px;font-family:'Be Vietnam Pro',sans-serif;font-size:12px"></textarea>
      </div>
      <div style="display:flex;gap:8px;margin-top:8px">
        <button class="svbtn" onclick="saveLoyalty()">💾 Lưu</button>
        <button class="clbtn" onclick="document.getElementById('fln').style.display='none'">Hủy</button>
      </div>
    </div>
  </div>`;

  // ── Chi tiết từng segment (ẩn mặc định) ──
  h += `<div id="crm-segment-detail"></div>`;

  // ── Lịch sử gửi ưu đãi ──
  if (recentMessages.length) {
    h += `<div class="acd">
      <div class="ach"><span>📨 Lịch sử gửi ưu đãi gần đây</span></div>
      <div style="overflow-x:auto"><table>
        <tr><th>SĐT</th><th>Mã voucher</th><th>Nội dung</th><th>Thời gian</th></tr>
        ${recentMessages.slice(0, 20).map(m => `<tr>
          <td style="font-family:monospace;font-size:11px">${m.customer_phone}</td>
          <td><strong style="color:#2D6A4F">${esc(m.voucher_code)}</strong></td>
          <td style="font-size:11px;color:var(--tx3);max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(m.message)}</td>
          <td style="font-size:10px;color:var(--tx3)">${formatTime(m.sent_at)}</td>
        </tr>`).join('')}
      </table></div>
    </div>`;
  }

  return h;
}

async function showSegment(key) {
  const data = await api('/crm/segments');
  const seg = data.segments[key];
  if (!seg || !seg.customers.length) { toast('Không có khách hàng trong nhóm này', 'info'); return; }
  const labels = { new_customers: 'Khách mới', regular: 'Khách thường', vip: 'Khách VIP', inactive: 'Ngủ đông (>30 ngày)', high_value: 'Chi tiêu cao (>500K)', recent: 'Mua gần đây (7 ngày)' };
  const el = document.getElementById('crm-segment-detail');
  if (!el) return;
  el.innerHTML = `<div class="acd">
    <div class="ach"><span>📋 ${labels[key] || key} (${seg.count} khách)</span>
      <button class="apb" onclick="document.getElementById('crm-segment-detail').innerHTML=''">✕ Đóng</button>
    </div>
    <div style="overflow-x:auto"><table>
      <tr><th>Tên</th><th>SĐT</th><th>Số đơn</th><th>Tổng chi</th><th>TB/đơn</th><th>Ngày cuối</th><th>Số ngày</th></tr>
      ${seg.customers.map(c => `<tr>
        <td><strong>${esc(c.name)}</strong></td>
        <td style="font-family:monospace;font-size:11px">${c.phone}</td>
        <td>${c.total_orders}</td>
        <td><strong style="color:#2D6A4F">${fmt(c.total_spent)}</strong></td>
        <td style="color:var(--tx3)">${c.total_orders ? fmt(Math.round(c.total_spent / c.total_orders)) : '—'}</td>
        <td style="font-size:11px">${c.last_order_at || '—'}</td>
        <td style="font-weight:700;color:${c.days_since_order > 30 ? '#A0291F' : c.days_since_order <= 7 ? '#2E7D32' : 'var(--tx3)'}">${c.days_since_order < 999 ? c.days_since_order + ' ngày' : '—'}</td>
      </tr>`).join('')}
    </table></div>
  </div>`;
  el.scrollIntoView({ behavior: 'smooth' });
}

function showAddLoyaltyForm() {
  setTimeout(() => {
    const el = document.getElementById('fln');
    if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); }
  }, 50);
}

async function saveLoyalty() {
  const name = document.getElementById('ln')?.value.trim();
  const segment = document.getElementById('ls')?.value;
  const voucher_code = document.getElementById('lc')?.value.trim();
  const voucher_type = document.getElementById('lt')?.value;
  const voucher_value = parseInt(document.getElementById('lv')?.value) || 0;
  const min_order = parseInt(document.getElementById('lm')?.value) || 0;
  const message = document.getElementById('lmsg')?.value.trim();
  if (!name) { toast('Nhập tên chương trình!', 'error'); return; }
  if (!voucher_code) { toast('Nhập mã voucher!', 'error'); return; }
  if (!voucher_value) { toast('Nhập giá trị ưu đãi!', 'error'); return; }
  const result = await api('/loyalty', { method: 'POST', body: { name, segment, voucher_code, voucher_value, voucher_type, min_order, message } });
  if (result.error) { toast(result.error, 'error'); return; }
  toast('Tạo chương trình thành công!', 'success');
  rAdm();
}

async function deleteLoyalty(id) {
  if (!confirm('Xóa chương trình này?')) return;
  await api(`/loyalty/${id}`, { method: 'DELETE' });
  toast('Đã xóa', 'success');
  rAdm();
}

let _sendSegment = '', _sendProgramId = 0;

async function sendOffer(segment, programId) {
  _sendSegment = segment;
  _sendProgramId = programId;

  // Lấy data để preview
  const [crmData, programs] = await Promise.all([api('/crm/segments'), api('/loyalty')]);
  const program = programs.find(p => p.id === programId);
  if (!program) { toast('Không tìm thấy chương trình', 'error'); return; }

  const segMap = { new: 'new_customers', regular: 'regular', vip: 'vip', inactive: 'inactive', all: 'all' };
  let targets = [];
  if (segment === 'all') {
    for (const s of Object.values(crmData.segments)) targets.push(...s.customers);
    targets = [...new Map(targets.map(c => [c.id, c])).values()];
  } else {
    targets = crmData.segments[segMap[segment]]?.customers || [];
  }

  const segLabels = { new: 'Khách mới', regular: 'Khách thường', vip: 'Khách VIP', inactive: 'Ngủ đông', all: 'Tất cả' };

  document.getElementById('send-modal-title').textContent = `Gửi ưu đãi — ${program.name}`;
  document.getElementById('send-modal-body').innerHTML = `
    <div class="send-info">
      <div class="send-stat"><span>👥 Nhóm:</span><strong>${segLabels[segment] || segment}</strong></div>
      <div class="send-stat"><span>📨 Số người nhận:</span><strong>${targets.length} khách</strong></div>
      <div class="send-stat"><span>🎫 Mã voucher:</span><strong style="color:#2D6A4F">${esc(program.voucher_code)}</strong></div>
    </div>

    ${targets.length > 0 ? `<div class="send-preview-list">
      <div style="font-size:11px;font-weight:700;color:var(--tx3);margin-bottom:6px">DANH SÁCH NHẬN (${targets.length} người)</div>
      ${targets.slice(0, 5).map(c => `<div class="send-customer"><span>${esc(c.name)}</span><span style="color:var(--tx3);font-family:monospace;font-size:11px">${c.phone}</span></div>`).join('')}
      ${targets.length > 5 ? `<div style="font-size:11px;color:var(--tx3);padding:4px 0">... và ${targets.length - 5} khách khác</div>` : ''}
    </div>` : ''}

    <div class="send-channels">
      <div style="font-size:12px;font-weight:700;color:var(--tx);margin-bottom:8px">Chọn kênh gửi:</div>
      <div class="channel-grid">
        <label class="channel-card">
          <input type="checkbox" name="ch" value="zalo" checked>
          <div class="channel-icon">💬</div>
          <div class="channel-name">Zalo OA</div>
          <div class="channel-status connected">Sẵn sàng</div>
        </label>
        <label class="channel-card">
          <input type="checkbox" name="ch" value="facebook">
          <div class="channel-icon">📘</div>
          <div class="channel-name">Messenger</div>
          <div class="channel-status pending">Chưa kết nối</div>
        </label>
        <label class="channel-card">
          <input type="checkbox" name="ch" value="sms">
          <div class="channel-icon">📱</div>
          <div class="channel-name">SMS</div>
          <div class="channel-status connected">Sẵn sàng</div>
        </label>
        <label class="channel-card">
          <input type="checkbox" name="ch" value="email">
          <div class="channel-icon">📧</div>
          <div class="channel-name">Email</div>
          <div class="channel-status pending">Chưa cấu hình</div>
        </label>
      </div>
    </div>

    <div class="send-message-preview">
      <div style="font-size:12px;font-weight:700;color:var(--tx);margin-bottom:6px">Xem trước tin nhắn:</div>
      <textarea id="send-msg-preview" class="send-msg-textarea">${esc(program.message)}\n\nMã ưu đãi: ${esc(program.voucher_code)}\nÁp dụng tại: hellocake.vn\nHotline: 0869.120.122</textarea>
    </div>

    <button type="button" class="cfbtn" id="send-btn" onclick="confirmSendOffer()">📤 Gửi ưu đãi cho ${targets.length} khách hàng</button>
    <button type="button" class="bkbtn" onclick="closeSendModal()">← Quay lại</button>
  `;
  document.getElementById('send-modal').classList.add('open');
}

function closeSendModal() {
  document.getElementById('send-modal').classList.remove('open');
}

async function confirmSendOffer() {
  const checkboxes = document.querySelectorAll('input[name="ch"]:checked');
  const channels = Array.from(checkboxes).map(cb => cb.value);
  if (!channels.length) { toast('Chọn ít nhất 1 kênh gửi!', 'error'); return; }

  const btn = document.getElementById('send-btn');
  btn.disabled = true;
  btn.textContent = '⏳ Đang gửi...';

  const result = await api('/crm/send-offer', {
    method: 'POST',
    body: { segment: _sendSegment, program_id: _sendProgramId, channels }
  });

  if (result.error) {
    toast(result.error, 'error');
    btn.disabled = false;
    btn.textContent = '📤 Gửi lại';
    return;
  }

  closeSendModal();
  const channelNames = { zalo: 'Zalo', facebook: 'Messenger', sms: 'SMS', email: 'Email' };
  const chNames = channels.map(c => channelNames[c] || c).join(', ');
  toast(`Đã gửi qua ${chNames} cho ${result.sent} khách!`, 'success');
  rAdm();
}

// ══ RUN ALL PROGRAMS ══
async function runAllPrograms() {
  const programs = await api('/loyalty');
  const active = programs.filter(p => p.is_active);
  if (!active.length) { toast('Không có chương trình nào đang hoạt động', 'info'); return; }
  if (!confirm(`Chạy tự động ${active.length} chương trình ưu đãi?\n\nHệ thống sẽ gửi voucher cho tất cả nhóm khách hàng tương ứng.`)) return;

  const btn = document.getElementById('run-all-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang chạy...'; }

  let totalSent = 0;
  const results = [];
  for (const p of active) {
    try {
      const result = await api('/crm/send-offer', {
        method: 'POST',
        body: { segment: p.segment, program_id: p.id, channels: ['zalo', 'sms'] }
      });
      totalSent += result.sent;
      results.push({ name: p.name, sent: result.sent, ok: true });
    } catch (e) {
      results.push({ name: p.name, sent: 0, ok: false });
    }
  }

  if (btn) { btn.disabled = false; btn.textContent = '🚀 Chạy tất cả'; }

  // Hiện kết quả
  const summary = results.map(r => `${r.ok ? '✅' : '❌'} ${r.name}: ${r.sent} khách`).join('\n');
  toast(`Hoàn tất! Đã gửi ưu đãi cho ${totalSent} khách hàng`, 'success');
  alert(`🚀 Kết quả chạy tự động\n\n${summary}\n\n📊 Tổng: ${totalSent} khách đã nhận ưu đãi`);
  rAdm();
}

// ══ VOUCHER ADMIN ══
async function rVoucher() {
  const vouchers = await api('/vouchers');
  return `
    <div class="acd">
      <div class="ach"><span>🎫 Mã giảm giá (${vouchers.length})</span>
        <button class="apb" onclick="showAddVoucherForm()"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>Tạo mã</button>
      </div>
      ${!vouchers.length ? '<p style="color:var(--tx3);font-size:13px;padding:16px 0;text-align:center">Chưa có mã giảm giá nào</p>' : ''}
      ${vouchers.length ? `<div style="overflow-x:auto"><table>
        <tr><th>Mã</th><th>Loại</th><th>Giá trị</th><th>Đơn tối thiểu</th><th>Đã dùng</th><th>Hết hạn</th><th>Trạng thái</th><th>Xóa</th></tr>
        ${vouchers.map(v => `
          <tr>
            <td><strong style="color:#2D6A4F;font-family:monospace">${esc(v.code)}</strong></td>
            <td>${v.type === 'percent' ? '% Phần trăm' : '₫ Cố định'}</td>
            <td><strong>${v.type === 'percent' ? v.value + '%' : fmt(v.value)}</strong></td>
            <td>${v.min_order ? fmt(v.min_order) : '—'}</td>
            <td>${v.used_count}${v.max_uses ? '/' + v.max_uses : ''}</td>
            <td style="font-size:11px">${v.expires_at || '—'}</td>
            <td><span class="bdg ${v.is_active ? 'done' : 'can'}">${v.is_active ? 'Hoạt động' : 'Tắt'}</span></td>
            <td><button class="ab" onclick="deleteVoucher(${v.id})">🗑</button></td>
          </tr>
        `).join('')}
      </table></div>` : ''}
      <div class="fp" id="fvn" style="display:none">
        <div style="font-size:13px;font-weight:700;color:var(--tx);margin-bottom:10px">Tạo mã giảm giá mới</div>
        <div class="fpr">
          <input id="vc" placeholder="Mã (VD: GIAM10)" style="text-transform:uppercase">
          <select id="vt"><option value="percent">% Phần trăm</option><option value="fixed">₫ Cố định</option></select>
        </div>
        <div class="fpr">
          <input id="vv" placeholder="Giá trị (10 = 10%)" type="number">
          <input id="vm" placeholder="Đơn tối thiểu (đ)" type="number">
        </div>
        <div class="fpr">
          <input id="vmu" placeholder="Giới hạn lượt (0=không giới hạn)" type="number">
          <input id="ve" placeholder="Hết hạn (YYYY-MM-DD)" type="date">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button class="svbtn" onclick="saveVoucher()">💾 Lưu</button>
          <button class="clbtn" onclick="document.getElementById('fvn').style.display='none'">Hủy</button>
        </div>
      </div>
    </div>`;
}

function showAddVoucherForm() {
  setTimeout(() => {
    const el = document.getElementById('fvn');
    if (el) { el.style.display = 'block'; el.scrollIntoView({ behavior: 'smooth' }); }
  }, 50);
}

async function saveVoucher() {
  const code = document.getElementById('vc')?.value.trim();
  const type = document.getElementById('vt')?.value;
  const value = parseInt(document.getElementById('vv')?.value) || 0;
  const min_order = parseInt(document.getElementById('vm')?.value) || 0;
  const max_uses = parseInt(document.getElementById('vmu')?.value) || 0;
  const expires_at = document.getElementById('ve')?.value || null;
  if (!code) { toast('Nhập mã giảm giá!', 'error'); return; }
  if (!value) { toast('Nhập giá trị giảm!', 'error'); return; }
  const result = await api('/vouchers', { method: 'POST', body: { code, type, value, min_order, max_uses, expires_at } });
  if (result.error) { toast(result.error, 'error'); return; }
  toast('Tạo voucher thành công!', 'success');
  rAdm();
}

async function deleteVoucher(id) {
  if (!confirm('Xóa mã giảm giá này?')) return;
  await api(`/vouchers/${id}`, { method: 'DELETE' });
  toast('Đã xóa voucher', 'success');
  rAdm();
}

// ══ PRINT RECEIPT ══
async function printReceipt(id) {
  const orders = await api('/orders');
  const order = orders.find(o => o.id === id);
  if (!order) { toast('Không tìm thấy đơn', 'error'); return; }
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const w = window.open('', '_blank', 'width=380,height=600');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Hóa đơn ${order.order_code}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;padding:20px;font-size:13px;color:#222;max-width:380px;margin:0 auto}
.center{text-align:center}.bold{font-weight:700}.line{border-top:1px dashed #999;margin:10px 0}
.row{display:flex;justify-content:space-between;padding:3px 0}
h2{font-size:18px;margin:4px 0}h3{font-size:13px;color:#666;margin-bottom:10px}
.total{font-size:16px;font-weight:700;color:#2D6A4F}
@media print{body{padding:10px}button{display:none!important}}</style></head>
<body>
<div class="center"><h2>🎂 HELLO CAKE</h2><h3>Bánh Tươi Handmade</h3>
<p style="font-size:11px;color:#888">Toà S2.15 Ocean Park 1 · 0869.120.122</p></div>
<div class="line"></div>
<div class="row"><span class="bold">Mã đơn:</span><span>${order.order_code}</span></div>
<div class="row"><span class="bold">Ngày:</span><span>${formatTime(order.created_at)}</span></div>
<div class="row"><span class="bold">Khách:</span><span>${esc(order.customer_name)}</span></div>
<div class="row"><span class="bold">SĐT:</span><span>${order.customer_phone}</span></div>
${order.customer_address ? `<div class="row"><span class="bold">Địa chỉ:</span><span>${esc(order.customer_address)}</span></div>` : ''}
${order.note ? `<div class="row"><span class="bold">Ghi chú:</span><span>${esc(order.note)}</span></div>` : ''}
<div class="line"></div>
<div class="row bold"><span>Sản phẩm</span><span>Thành tiền</span></div>
<div class="line"></div>
${items.map(i => `<div class="row"><span>${esc(i.name)} × ${i.qty}</span><span>${fmt(i.price * i.qty)}</span></div>`).join('')}
<div class="line"></div>
<div class="row"><span>Thanh toán:</span><span>${order.payment_method}</span></div>
<div class="row total"><span>TỔNG CỘNG:</span><span>${fmt(order.total)}</span></div>
<div class="line"></div>
<div class="center" style="margin-top:14px"><p style="font-size:11px;color:#888">Cảm ơn quý khách!</p>
<p style="font-size:10px;color:#aaa;margin-top:4px">hello-cake.vn · @hellocake.op1</p></div>
<div class="center" style="margin-top:16px"><button onclick="window.print()" style="padding:8px 24px;background:#2D6A4F;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:13px">🖨 In hóa đơn</button></div>
</body></html>`);
  w.document.close();
}

// ══ MOBILE MENU ══
function toggleMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
}
function closeMobileMenu() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');
  if (hamburger) hamburger.classList.remove('open');
  if (navLinks) navLinks.classList.remove('open');
}

// ══ INIT ══
init();
