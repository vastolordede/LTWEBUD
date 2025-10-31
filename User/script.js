// ======= LocalStorage Keys =======
const LS_PRODUCTS_KEY = 'admin_products';
const LS_CART_KEY = 'cart';
const LS_USERS_KEY = 'admin_users';         // <— NEW: nơi lưu danh sách user cho admin_users
const LS_CURRENT_USER = 'current_user';     // <— NEW: user đã đăng nhập (nếu có)

// ======= Utilities =======
function formatVND(n){ return Number(n||0).toLocaleString('vi-VN'); }
function todayVN(){ const d=new Date(); return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`; }
function isoNow(){ return new Date().toISOString(); }

// ======= Users helpers (NEW) =======
function getUsers(){
  try{ return JSON.parse(localStorage.getItem(LS_USERS_KEY)||'[]'); }catch(e){ return []; }
}
function saveUsers(arr){
  localStorage.setItem(LS_USERS_KEY, JSON.stringify(arr||[]));
}
function findUserByUsername(username){
  const uname = String(username||'').trim().toLowerCase();
  return getUsers().find(u => String(u.username||'').toLowerCase() === uname);
}
function genUserId(){
  // VD: U-20251029-AB12CD
  const d = new Date();
  const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
  return `U-${ds}-${rnd}`;
}
function setCurrentUser(user){
  if(!user) localStorage.removeItem(LS_CURRENT_USER);
  else localStorage.setItem(LS_CURRENT_USER, JSON.stringify(user));
}
function getCurrentUser(){
  try{ return JSON.parse(localStorage.getItem(LS_CURRENT_USER)||'null'); }catch(e){ return null; }
}

// ======= Catalog / Products =======
function loadProducts() {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_PRODUCTS_KEY) || '[]');
    if (Array.isArray(arr) && arr.length) return arr.filter(p => !p.hidden);
  } catch(e){}
}

// ======= Cart helpers =======
function getCart(){ try{ return JSON.parse(localStorage.getItem(LS_CART_KEY) || '[]'); }catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem(LS_CART_KEY, JSON.stringify(cart||[])); }
function updateCartCount(){
  const cart = getCart();
  const count = cart.reduce((s,i) => s + (i.qty||0), 0);
  const el = document.getElementById('cart-count'); if (el) el.textContent = count;
}
function addToCart(ma, qty=1){
  const catalog = loadProducts();
  const p = catalog.find(x => String(x.ma) === String(ma));
  if(!p){ alert('Sản phẩm không tồn tại'); return; }
  const cart = getCart();
  const idx = cart.findIndex(i => String(i.ma) === String(ma));
  if (idx > -1) cart[idx].qty += qty;
  else cart.push({ ma: p.ma, ten: p.ten, gia: p.gia, imgSrc: p.imgSrc, qty });
  saveCart(cart);
  updateCartCount();
  alert('✅ Đã thêm vào giỏ hàng!');
}
window.addToCart = addToCart; // dùng trong HTML

// ======= Page: INDEX =======
if (document.title.includes('Trang chủ')) {
  const list = document.getElementById('product-list');
  const catalog = loadProducts();
  if (list) {
    list.innerHTML = catalog.map(p => {
      const img = p.imgSrc || 'https://via.placeholder.com/200x150?text=No+Image';
      return `
        <div class="product-card card">
          <img src="${img}" alt="${p.ten}">
          <div class="card-body">
            <div class="title">${p.ten}</div>
            <div class="price">${formatVND(p.gia)}₫</div>
            <div class="actions">
              <button class="btn" onclick="addToCart('${p.ma}')">Thêm vào giỏ</button>
              <a class="btn primary" href="product.html?ma=${encodeURIComponent(p.ma)}">Xem chi tiết</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  updateCartCount();
}

// ======= Page: PRODUCT DETAIL =======
if (document.title.includes('Chi tiết sản phẩm')) {
  const params = new URLSearchParams(location.search);
  const ma = params.get('ma');
  const catalog = loadProducts();
  const p = catalog.find(x => String(x.ma) === String(ma));
  const detail = document.getElementById('product-detail');

  if (p && detail) {
    const img = p.imgSrc || 'https://via.placeholder.com/600x400?text=No+Image';
    detail.innerHTML = `
      <div class="product-info">
        <img src="${img}" alt="${p.ten}">
        <div>
          <h2>${p.ten}</h2>
          <p class="price">${formatVND(p.gia)}₫</p>
          <button onclick="addToCart('${p.ma}')" class="btn primary">Thêm vào giỏ hàng</button>
        </div>
      </div>
    `;
  } else if (detail) {
    detail.innerHTML = `<p>❌ Sản phẩm không tồn tại.</p>`;
  }
  updateCartCount();
}

// ======= Page: CART =======
if (document.title.includes('Giỏ hàng')) {
  const container = document.getElementById('cart-container');

  function renderCart(){
    const cart = getCart();
    if (!cart.length) { container.innerHTML = '<p>Giỏ hàng trống.</p>'; return; }
    let total = 0;
    container.innerHTML = cart.map(item => {
      total += (item.gia || 0) * (item.qty || 0);
      const img = item.imgSrc || 'https://via.placeholder.com/120x90?text=No+Image';
      return `
        <div class="cart-row">
          <img src="${img}" alt="${item.ten}">
          <div class="cart-info">
            <h4>${item.ten}</h4>
            <p>${formatVND(item.gia)}₫</p>
            <p>Số lượng:
              <input type="number" min="1" value="${item.qty}" data-ma="${item.ma}" class="qty-input">
            </p>
            <button class="btn danger" onclick="removeFromCart('${item.ma}')">Xóa</button>
          </div>
        </div>
      `;
    }).join('') + `<div class="cart-summary">Tổng cộng: ${formatVND(total)}₫</div>`;

    document.querySelectorAll('.qty-input').forEach(input => {
      input.addEventListener('change', e => {
        const ma = e.target.dataset.ma;
        const qty = Math.max(1, parseInt(e.target.value,10) || 1);
        const cart = getCart();
        const idx = cart.findIndex(i => String(i.ma) === String(ma));
        if (idx > -1) cart[idx].qty = qty;
        saveCart(cart);
        renderCart();
        updateCartCount();
      });
    });
  }

  window.removeFromCart = function(ma){
    const cart = getCart().filter(i => String(i.ma) !== String(ma));
    saveCart(cart);
    renderCart();
    updateCartCount();
  };

  renderCart();
  updateCartCount();
}

// ======= Page: CHECKOUT =======
if (document.title.includes('Thanh toán')) {
  const summary = document.getElementById("checkout-summary");
  const form    = document.getElementById("checkout-form");

  const cart = getCart();
  if (!cart.length) {
    summary.innerHTML = "<p>Giỏ hàng của bạn đang trống.</p>";
  } else {
    let total = 0;
    summary.innerHTML = `
      <h3>Tóm tắt đơn hàng:</h3>
      <ul>
        ${cart.map(item => {
          total += (item.gia||0) * (item.qty||0);
          return `<li>${item.ten} x${item.qty} - ${formatVND(item.gia)}₫</li>`;
        }).join("")}
      </ul>
      <p><strong>Tổng cộng: ${formatVND(total)}₫</strong></p>
    `;
  }

  // Lưu đơn
  const LS_ORDERS_KEY = 'admin_orders';

  function getOrders(){
    try { return JSON.parse(localStorage.getItem(LS_ORDERS_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function saveOrders(arr){
    localStorage.setItem(LS_ORDERS_KEY, JSON.stringify(arr || []));
  }
  function genOrderId(){
    const d = new Date();
    const ds = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
    const rnd = Math.random().toString(36).slice(2,8).toUpperCase();
    return `#DH-${ds}-${rnd}`;
  }
  function calcCartTotal(cart){
    return (cart || []).reduce((s,i)=> s + (Number(i.gia||0) * Number(i.qty||0)), 0);
  }

  form.addEventListener("submit", e => {
    e.preventDefault();

    const fd = new FormData(form);
    const customer = {
      name: (fd.get('name') || '').trim(),
      address: (fd.get('address') || '').trim(),
      phone: (fd.get('phone') || '').trim(),
    };

    const cartNow = getCart();
    if (!cartNow.length){
      alert('Giỏ hàng của bạn đang trống.');
      return;
    }

    const total = calcCartTotal(cartNow);

    const order = {
      id: genOrderId(),
      customer,
      items: cartNow,
      total,
      status: 'Mới đặt',
      createdAt: isoNow()
    };

    const orders = getOrders();
    orders.unshift(order);
    saveOrders(orders);

    // Dọn giỏ + reset UI
    localStorage.removeItem(LS_CART_KEY);
    updateCartCount();
    form.reset();
    summary.innerHTML = "";

    // Thông báo đơn giản
    alert(`🎉 Đặt hàng thành công!\nMã đơn: ${order.id}\nTổng: ${formatVND(total)}₫`);

    // (Tuỳ chọn) quay về trang chủ:
    // location.href = 'index.html';
  });
}


// ======= Auth dropdown (open under header buttons) =======
const authModal = document.getElementById('authModal');
const authPanel = authModal?.querySelector('.auth-panel');
const openLoginBtn = document.getElementById('open-login');
const openRegisterBtn = document.getElementById('open-register');
const loginFormEl = document.getElementById('loginForm');
const registerFormEl = document.getElementById('registerForm');
const authTitle = document.getElementById('authTitle');
const switchToReg = document.getElementById('switchToRegister');
const switchToLogin = document.getElementById('switchToLogin');
const authMsg = document.getElementById('authMsg');

function showAuthMsg(text, ok = true, autoHideMs = ok ? 2500 : 0){
  if(!authMsg) return;
  authMsg.textContent = text;
  // màu xanh khi ok, màu đỏ khi lỗi
  authMsg.style.background = ok ? '#ecfdf5' : '#fef2f2';
  authMsg.style.borderColor = ok ? '#bbf7d0' : '#fecaca';
  authMsg.style.color = ok ? '#065f46' : '#991b1b';
  authMsg.hidden = false;

  // tự ẩn nếu là thông báo thành công
  if (autoHideMs > 0){
    clearTimeout(showAuthMsg._t);
    showAuthMsg._t = setTimeout(clearAuthMsg, autoHideMs);
  }
}

function clearAuthMsg(){
  if(!authMsg) return;
  authMsg.hidden = true;
  authMsg.textContent = '';
}


function placePanel(anchor){
  if(!authPanel || !anchor) return;
  const r = anchor.getBoundingClientRect();
  const panelW = Math.min(380, window.innerWidth - 24);
  let left = r.right - panelW; // canh phải với nút
  left = Math.max(12, Math.min(left, window.innerWidth - panelW - 12));
  const top = r.bottom + 8;    // rơi xuống dưới 8px
  authPanel.style.setProperty('--auth-left', left + 'px');
  authPanel.style.setProperty('--auth-top',  top  + 'px');
}

function openAuth(mode, anchor){
  if(!authModal) return;
  clearAuthMsg();
  authModal.classList.add('open','dropdown');
  placePanel(anchor);
  if(mode === 'login'){
    loginFormEl.style.display = '';
    registerFormEl.style.display = 'none';
    authTitle.textContent = 'Đăng nhập';
    setTimeout(()=> document.getElementById('luser')?.focus(), 0);
  }else{
    loginFormEl.style.display = 'none';
    registerFormEl.style.display = '';
    authTitle.textContent = 'Tạo tài khoản';
    setTimeout(()=> document.getElementById('rname')?.focus(), 0);
  }
}
function closeAuth(){ authModal.classList.remove('open','dropdown'); }

openLoginBtn?.addEventListener('click', e => { e.preventDefault(); openAuth('login', e.currentTarget); });
openRegisterBtn?.addEventListener('click', e => { e.preventDefault(); openAuth('register', e.currentTarget); });

switchToReg?.addEventListener('click', e => { e.preventDefault(); openAuth('register', openRegisterBtn || openLoginBtn); });
switchToLogin?.addEventListener('click', e => { e.preventDefault(); openAuth('login', openLoginBtn || openRegisterBtn); });

authModal?.querySelectorAll('[data-close]')?.forEach(btn => btn.addEventListener('click', closeAuth));

document.addEventListener('click', e => {
  if(!authModal?.classList.contains('open')) return;
  const clickedInside = authPanel?.contains(e.target);
  const clickedBtn = e.target === openLoginBtn || e.target === openRegisterBtn;
  if(!clickedInside && !clickedBtn) closeAuth();
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeAuth(); });
window.addEventListener('resize', () => {
  if(authModal?.classList.contains('open')){
    const anchor = (registerFormEl.style.display !== 'none') ? openRegisterBtn : openLoginBtn;
    placePanel(anchor || openLoginBtn || openRegisterBtn);
  }
});

// ======= Auth: Register & Login (NEW) =======
registerFormEl?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(registerFormEl);
  const fullname = (fd.get('fullname')||'').trim();
  const username = (fd.get('username')||'').trim();
  const email = (fd.get('email')||'').trim();
  const password = String(fd.get('password')||'');
  const confirm = String(fd.get('confirm')||'');

  if(password !== confirm){
    showAuthMsg('❌ Mật khẩu nhập lại không khớp.', false);
    return;
  }
  const users = getUsers();
  if(users.some(u => String(u.username||'').toLowerCase() === username.toLowerCase())){
    showAuthMsg('❌ Tên đăng nhập đã tồn tại.', false); return;
  }
  if(users.some(u => String(u.email||'').toLowerCase() === email.toLowerCase())){
    showAuthMsg('❌ Email đã tồn tại.', false); return;
  }

  const user = {
    id: genUserId(),
    name: fullname,
    username,
    email,
    password,        // Demo: lưu plain-text (thực tế cần hash)
    active: true,
    date: todayVN(), // dùng để hiển thị trên admin_users
    createdAt: isoNow(),
    role: 'customer'
  };
  users.unshift(user);
  saveUsers(users);

  // Chuyển sang form đăng nhập + prefill username
  openAuth('login', openLoginBtn || openRegisterBtn);
  document.getElementById('luser').value = username;
  showAuthMsg('✅ Tạo tài khoản thành công. Vui lòng đăng nhập.');
});

loginFormEl?.addEventListener('submit', e => {
  e.preventDefault();
  const fd = new FormData(loginFormEl);
  const username = (fd.get('username')||'').trim();
  const password = String(fd.get('password')||'');

  const user = findUserByUsername(username);
  if(!user){ showAuthMsg('❌ Tài khoản không tồn tại.', false); return; }
  if(!user.active){ showAuthMsg('❌ Tài khoản đã bị khóa. Liên hệ hỗ trợ.', false); return; }
  if(user.password !== password){ showAuthMsg('❌ Mật khẩu không đúng.', false); return; }

  setCurrentUser({ id:user.id, name:user.name, username:user.username, email:user.email });
  showAuthMsg('✅ Đăng nhập thành công!');
   setTimeout(()=> { closeAuth(); renderAuthUI(); }, 500);
});

/* ======= Header Auth UI: ẩn 2 nút khi đã login, hiện icon user + hover Logout ======= */
function renderAuthUI(){
  const nav = document.querySelector('.site-header nav') || document.querySelector('nav');
  const loginBtn = document.getElementById('open-login');
  const registerBtn = document.getElementById('open-register');
  const existed = document.getElementById('userMenu');
  if (existed) existed.remove();

  const user = getCurrentUser();

  if (user) {
    // Ẩn 2 nút
    if (loginBtn) loginBtn.style.display = 'none';
    if (registerBtn) registerBtn.style.display = 'none';

    // Tạo icon user + dropdown Logout (hover)
    const wrap = document.createElement('span');
    wrap.id = 'userMenu';
    wrap.style.position = 'relative';
    wrap.style.display = 'inline-block';
    wrap.style.marginLeft = '12px';

    const btn = document.createElement('button');
    btn.id = 'userBtn';
    btn.className = 'nav-btn';
    btn.title = user.name || user.username || 'Tài khoản';
    btn.style.display = 'inline-flex';
    btn.style.alignItems = 'center';
    btn.style.gap = '8px';
    btn.innerHTML = `👤 <span>${user.name || user.username}</span>`;

    const menu = document.createElement('div');
    menu.id = 'userDropdown';
    Object.assign(menu.style, {
      position: 'absolute',
      right: '0',
      top: '100%',   
      minWidth: '160px',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '8px',
      boxShadow: '0 10px 30px rgba(0,0,0,.12)',
      display: 'none',
      zIndex: '1001'
    });

    const logout = document.createElement('button');
    logout.id = 'logoutBtn';
    logout.className = 'nav-btn';
    logout.style.margin = '0';
    logout.style.width = '100%';
    logout.textContent = 'Đăng xuất';

    menu.appendChild(logout);
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    if (nav) nav.appendChild(wrap);

    // Hover để hiện/ẩn dropdown
    wrap.addEventListener('mouseenter', () => { menu.style.display = 'block'; });
    wrap.addEventListener('mouseleave', () => { menu.style.display = 'none'; });

    // Đăng xuất
    logout.addEventListener('click', (e) => {
      e.preventDefault();
      setCurrentUser(null);
      // Hiện lại 2 nút
      if (loginBtn) loginBtn.style.display = '';
      if (registerBtn) registerBtn.style.display = '';
      renderAuthUI();
    });

  } else {
    // Chưa đăng nhập => đảm bảo 2 nút hiện lại, gỡ user menu nếu có
    if (loginBtn) loginBtn.style.display = '';
    if (registerBtn) registerBtn.style.display = '';
    const old = document.getElementById('userMenu');
    if (old) old.remove();
  }
}

// Khởi tạo UI theo trạng thái lưu trong localStorage
renderAuthUI();

