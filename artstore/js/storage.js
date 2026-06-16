/**
 * storage.js — ArtStore Storage Layer (Option 2: products.json)
 *
 * HOW IT WORKS:
 *   Storefront  → always fetches /products.json (same file for every visitor)
 *   Admin panel → reads/writes LocalStorage, then "Publish" exports products.json
 *   You commit products.json to GitHub → all visitors see the update
 */

const Storage = (() => {
  const KEYS = {
    PRODUCTS: 'artstore_products',
    CART:     'artstore_cart',
    THEME:    'artstore_theme',
    ADMIN:    'artstore_admin_auth',
  };

  /* ── LocalStorage helpers (Admin use) ───────────────────── */
  function getProductsLocal() {
    try { return JSON.parse(localStorage.getItem(KEYS.PRODUCTS) || '[]'); }
    catch { return []; }
  }

  function saveProducts(products) {
    localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(products));
  }

  function addProduct(product) {
    const list = getProductsLocal();
    product.id        = Date.now().toString();
    product.createdAt = new Date().toISOString();
    list.push(product);
    saveProducts(list);
    return product;
  }

  function updateProduct(id, data) {
    const list = getProductsLocal();
    const idx  = list.findIndex(p => p.id === id);
    if (idx === -1) return false;
    list[idx] = { ...list[idx], ...data, updatedAt: new Date().toISOString() };
    saveProducts(list);
    return list[idx];
  }

  function deleteProduct(id) {
    saveProducts(getProductsLocal().filter(p => p.id !== id));
  }

  function getProduct(id) {
    return getProductsLocal().find(p => p.id === id) || null;
  }

  /* ── getProducts (async) — used by Storefront ───────────── */
  // 1. Try products.json (the committed file, same for all visitors)
  // 2. Fall back to LocalStorage (admin preview / local dev)
  async function getProducts() {
    try {
      const res = await fetch('products.json?_=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        // Sync into LocalStorage so admin starts from the published state
        if (getProductsLocal().length === 0) saveProducts(data);
        return data;
      }
    } catch (e) {
      console.warn('[ArtStore] products.json not available, using LocalStorage:', e.message);
    }
    return getProductsLocal();
  }

  /* ── Cart ───────────────────────────────────────────────── */
  function getCart() {
    try { return JSON.parse(localStorage.getItem(KEYS.CART) || '[]'); }
    catch { return []; }
  }

  function saveCart(cart) { localStorage.setItem(KEYS.CART, JSON.stringify(cart)); }

  function addToCart(product) {
    const cart = getCart();
    const item = cart.find(i => i.id === product.id);
    if (item) item.qty += 1; else cart.push({ ...product, qty: 1 });
    saveCart(cart);
    return cart;
  }

  function updateCartQty(id, qty) {
    const cart = getCart();
    const item = cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) { removeFromCart(id); return getCart(); }
    item.qty = qty;
    saveCart(cart);
    return cart;
  }

  function removeFromCart(id) { saveCart(getCart().filter(i => i.id !== id)); }
  function clearCart()        { localStorage.removeItem(KEYS.CART); }
  function getCartTotal()     { return getCart().reduce((s,i) => s + i.price * i.qty, 0); }
  function getCartCount()     { return getCart().reduce((s,i) => s + i.qty, 0); }

  /* ── Theme ──────────────────────────────────────────────── */
  function getTheme() { return localStorage.getItem(KEYS.THEME) || 'light'; }
  function setTheme(t){ localStorage.setItem(KEYS.THEME, t); }

  /* ── Admin Auth ─────────────────────────────────────────── */
  function setAdminAuth(v) { sessionStorage.setItem(KEYS.ADMIN, v ? '1' : ''); }
  function isAdminAuthed() { return sessionStorage.getItem(KEYS.ADMIN) === '1'; }
  function clearAdminAuth(){ sessionStorage.removeItem(KEYS.ADMIN); }

  /* ── Export as products.json ────────────────────────────── */
  // Downloads the current LocalStorage catalogue as "products.json".
  // Commit this file to the root of your GitHub repo to publish changes.
  function exportProductsJSON() {
    const blob = new Blob(
      [JSON.stringify(getProductsLocal(), null, 2)],
      { type: 'application/json' }
    );
    const a  = document.createElement('a');
    a.href   = URL.createObjectURL(blob);
    a.download = 'products.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  /* ── Import products.json ───────────────────────────────── */
  function importProductsJSON(json) {
    try {
      const data = JSON.parse(json);
      if (!Array.isArray(data)) throw new Error('Expected an array');
      saveProducts(data);
      return { ok: true, count: data.length };
    } catch(e) {
      return { ok: false, error: e.message };
    }
  }

  /* ── Seed (fallback when both sources empty) ─────────────── */
  function _svg(hue, emoji) {
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
      <rect width="600" height="450" fill="hsl(${hue},40%,22%)"/>
      <rect x="60" y="60" width="480" height="330" fill="hsl(${hue},35%,30%)" rx="8"/>
      <text x="300" y="210" text-anchor="middle" font-family="Georgia,serif"
        font-size="48" fill="hsl(${hue},60%,75%)">${emoji}</text>
      <text x="300" y="270" text-anchor="middle" font-family="sans-serif"
        font-size="18" fill="hsl(${hue},30%,60%)">ArtStore</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(s);
  }

  function seedIfEmpty() {
    if (getProductsLocal().length > 0) return;
    [
      { name:'Wall Painting',     price:999,  category:'Painting', description:'A stunning hand-crafted wall painting that adds warmth and character to any room.', image:_svg(30,'🎨') },
      { name:'Handmade Portrait', price:1499, category:'Portrait', description:'A detailed handmade portrait rendered in charcoal and pastel. Perfect as a keepsake.', image:_svg(200,'🖼') },
      { name:'Canvas Art',        price:1999, category:'Canvas',   description:'Contemporary canvas art with bold abstract forms. Gallery-ready on a wooden frame.',  image:_svg(270,'🖌') },
    ].forEach(p => addProduct(p));
  }

  return {
    /* Storefront */
    getProducts,
    /* Admin (sync) */
    getProductsLocal, saveProducts, addProduct, updateProduct, deleteProduct, getProduct,
    /* Cart */
    getCart, saveCart, addToCart, updateCartQty, removeFromCart, clearCart,
    getCartTotal, getCartCount,
    /* Theme */
    getTheme, setTheme,
    /* Auth */
    setAdminAuth, isAdminAuthed, clearAdminAuth,
    /* JSON I/O */
    exportProductsJSON, importProductsJSON,
    /* Seed */
    seedIfEmpty,
  };
})();
