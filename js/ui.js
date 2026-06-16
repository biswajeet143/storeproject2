/**
 * ui.js — ArtStore UI Utilities
 * Toast notifications, loading spinner, theme toggle, helpers.
 */

const UI = (() => {

  /* ── Toast Notifications ─────────────────────────────────── */
  function toast(message, type = 'info', duration = 2800) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const icons = { success: '✓', error: '✕', info: 'ℹ' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span style="font-size:1rem">${icons[type] || '•'}</span><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => el.remove(), duration + 350);
  }

  /* ── Spinner ─────────────────────────────────────────────── */
  function showSpinner() {
    if (document.getElementById('spinner-overlay')) return;
    const el = document.createElement('div');
    el.id = 'spinner-overlay';
    el.className = 'spinner-overlay';
    el.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(el);
  }

  function hideSpinner() {
    const el = document.getElementById('spinner-overlay');
    if (el) el.remove();
  }

  /* ── Theme Toggle ────────────────────────────────────────── */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    Storage.setTheme(theme);
  }

  function toggleTheme() {
    const current = Storage.getTheme();
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    return next;
  }

  function initTheme() {
    applyTheme(Storage.getTheme());
  }

  /* ── Modal ───────────────────────────────────────────────── */
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  }

  /* Close modal on backdrop click */
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('open');
    }
  });

  /* ── Cart Count Badge ────────────────────────────────────── */
  function updateCartBadge() {
    const badges = document.querySelectorAll('.cart-count');
    const count = Storage.getCartCount();
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  /* ── Format Currency ─────────────────────────────────────── */
  function formatPrice(n) {
    return '₹' + Number(n).toLocaleString('en-IN');
  }

  /* ── Confirm Dialog ──────────────────────────────────────── */
  function confirm(message, onYes) {
    // Use a simple modal-style confirm
    const id = 'confirm-modal';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'modal-backdrop';
      el.innerHTML = `
        <div class="modal" style="max-width:380px;text-align:center">
          <p style="font-size:1rem;margin-bottom:24px" id="confirm-msg"></p>
          <div style="display:flex;gap:12px;justify-content:center">
            <button class="btn btn-outline" id="confirm-no">Cancel</button>
            <button class="btn btn-danger" id="confirm-yes">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(el);
      document.getElementById('confirm-no').onclick = () => closeModal(id);
    }
    document.getElementById('confirm-msg').textContent = message;
    document.getElementById('confirm-yes').onclick = () => { onYes(); closeModal(id); };
    openModal(id);
  }

  return {
    toast, showSpinner, hideSpinner,
    applyTheme, toggleTheme, initTheme,
    openModal, closeModal,
    updateCartBadge, formatPrice, confirm,
  };
})();
