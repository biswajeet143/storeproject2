/**
 * cart.js — ArtStore Cart, Checkout & WhatsApp Order
 */

document.addEventListener('DOMContentLoaded', () => {
  UI.initTheme();
  UI.updateCartBadge();

  const PAGE = document.body.dataset.page;

  if (PAGE === 'cart') initCartPage();
  if (PAGE === 'checkout') initCheckoutPage();

  /* Theme toggle */
  document.querySelectorAll('[data-theme-toggle]').forEach(btn => {
    btn.addEventListener('click', () => UI.toggleTheme());
  });
});

/* ════════════════════════════════════════════════════════════
   CART PAGE
   ════════════════════════════════════════════════════════════ */
function initCartPage() {
  renderCart();

  document.getElementById('checkout-btn')?.addEventListener('click', () => {
    if (Storage.getCart().length === 0) {
      UI.toast('Your cart is empty!', 'error');
      return;
    }
    window.location.href = 'checkout.html';
  });

  document.getElementById('clear-cart-btn')?.addEventListener('click', () => {
    if (Storage.getCart().length === 0) return;
    UI.confirm('Clear all items from your cart?', () => {
      Storage.clearCart();
      UI.updateCartBadge();
      renderCart();
      UI.toast('Cart cleared', 'info');
    });
  });
}

function renderCart() {
  const cart = Storage.getCart();
  const tbody = document.getElementById('cart-body');
  const emptyEl = document.getElementById('cart-empty');
  const tableWrap = document.getElementById('cart-table-wrap');
  const actionsWrap = document.getElementById('cart-actions');

  // Subtotals
  const subtotal = Storage.getCartTotal();
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping
  const total = subtotal + shipping;

  // Update summary
  setEl('summary-subtotal', UI.formatPrice(subtotal));
  setEl('summary-shipping', shipping === 0 ? 'Free' : UI.formatPrice(shipping));
  setEl('summary-total', UI.formatPrice(total));
  setEl('summary-items', cart.reduce((s,i) => s + i.qty, 0));

  UI.updateCartBadge();

  if (cart.length === 0) {
    if (emptyEl)  emptyEl.style.display = 'block';
    if (tableWrap) tableWrap.style.display = 'none';
    if (actionsWrap) actionsWrap.style.display = 'none';
    return;
  }

  if (emptyEl)  emptyEl.style.display = 'none';
  if (tableWrap) tableWrap.style.display = '';
  if (actionsWrap) actionsWrap.style.display = '';

  tbody.innerHTML = cart.map(item => `
    <tr data-id="${item.id}">
      <td>
        <div class="cart-item-info">
          <img class="cart-item-img"
            src="${item.image || 'assets/placeholder-images/placeholder.svg'}"
            alt="${item.name}"
            onerror="this.src='assets/placeholder-images/placeholder.svg'">
          <div>
            <div class="cart-item-name">${item.name}</div>
            ${item.category ? `<div class="cart-item-cat">${item.category}</div>` : ''}
          </div>
        </div>
      </td>
      <td>${UI.formatPrice(item.price)}</td>
      <td>
        <div class="qty-control">
          <button class="qty-btn" data-action="dec" data-id="${item.id}">−</button>
          <span class="qty-val">${item.qty}</span>
          <button class="qty-btn" data-action="inc" data-id="${item.id}">+</button>
        </div>
      </td>
      <td><strong>${UI.formatPrice(item.price * item.qty)}</strong></td>
      <td>
        <button class="btn-remove" data-id="${item.id}">Remove</button>
      </td>
    </tr>`).join('');

  // Qty controls
  tbody.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const item = Storage.getCart().find(i => i.id === id);
      if (!item) return;
      const delta = btn.dataset.action === 'inc' ? 1 : -1;
      Storage.updateCartQty(id, item.qty + delta);
      renderCart();
    });
  });

  // Remove buttons
  tbody.querySelectorAll('.btn-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      Storage.removeFromCart(btn.dataset.id);
      renderCart();
      UI.toast('Item removed', 'info');
    });
  });
}

/* ════════════════════════════════════════════════════════════
   CHECKOUT PAGE
   ════════════════════════════════════════════════════════════ */
function initCheckoutPage() {
  const cart = Storage.getCart();

  // Redirect if cart empty
  if (cart.length === 0) {
    UI.toast('Your cart is empty!', 'error');
    setTimeout(() => window.location.href = 'cart.html', 1000);
    return;
  }

  renderOrderSummary(cart);

  const form = document.getElementById('checkout-form');
  const confirmBtn = document.getElementById('confirm-btn');

  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => {
      if (!validateForm()) return;
      placeOrder();
    });
  }
}

function renderOrderSummary(cart) {
  const wrap = document.getElementById('order-items');
  if (!wrap) return;
  const total = Storage.getCartTotal();

  wrap.innerHTML = cart.map(i => `
    <div class="order-item-row">
      <span>${i.name} × ${i.qty}</span>
      <span>${UI.formatPrice(i.price * i.qty)}</span>
    </div>`).join('');

  setEl('order-subtotal', UI.formatPrice(total));
  setEl('order-shipping', 'Free');
  setEl('order-total', UI.formatPrice(total));
}

function validateForm() {
  let valid = true;

  const fields = [
    { id: 'cust-name',    msg: 'Please enter your name',         rule: v => v.trim().length >= 2 },
    { id: 'cust-phone',   msg: 'Enter a valid 10-digit phone',   rule: v => /^[6-9]\d{9}$/.test(v.replace(/\s/g,'')) },
    { id: 'cust-address', msg: 'Please enter your full address', rule: v => v.trim().length >= 10 },
  ];

  fields.forEach(f => {
    const inp = document.getElementById(f.id);
    const errEl = document.getElementById(f.id + '-err');
    if (!inp) return;
    const ok = f.rule(inp.value);
    inp.classList.toggle('error', !ok);
    if (errEl) errEl.style.display = ok ? 'none' : 'block';
    if (!ok) valid = false;
  });

  return valid;
}

function placeOrder() {
  const cart = Storage.getCart();
  const name    = document.getElementById('cust-name').value.trim();
  const phone   = document.getElementById('cust-phone').value.trim();
  const address = document.getElementById('cust-address').value.trim();
  const total   = Storage.getCartTotal();

  // Build WhatsApp message
  const WHATSAPP_NUMBER = '918789484462';

  let msg = `🎨 *New ArtStore Order*\n\n`;
  msg += `*Customer Details*\n`;
  msg += `Name: ${name}\n`;
  msg += `Phone: ${phone}\n`;
  msg += `Address: ${address}\n\n`;
  msg += `*Order Items*\n`;
  cart.forEach(i => {
    msg += `• ${i.name} × ${i.qty} — ${UI.formatPrice(i.price * i.qty)}\n`;
  });
  msg += `\n*Total Amount: ${UI.formatPrice(total)}*\n`;
  msg += `\n_Order placed via ArtStore_`;

  const waURL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

  // Show success popup then open WhatsApp
  UI.openModal('success-modal');

  document.getElementById('wa-link').href = waURL;
  document.getElementById('wa-link').onclick = () => {
    Storage.clearCart();
    UI.updateCartBadge();
  };

  // Clear cart after short delay and redirect
  setTimeout(() => {
    window.open(waURL, '_blank');
    Storage.clearCart();
    UI.updateCartBadge();
  }, 1200);
}

/* ── Helper ───────────────────────────────────────────────── */
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
