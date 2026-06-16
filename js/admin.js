/**
 * admin.js — ArtStore Admin Panel
 *
 * Workflow:
 *   1. Add / Edit / Delete products  →  saved to LocalStorage instantly
 *   2. Click "Publish (Download JSON)"  →  downloads products.json
 *   3. Commit products.json to GitHub root  →  visitors see changes
 */

document.addEventListener('DOMContentLoaded', () => {
  Auth.requireAuth();
  UI.initTheme();

  let editingId = null;

  /* ── Navigation ─────────────────────────────────────────── */
  const sections = document.querySelectorAll('.admin-section');
  const navLinks = document.querySelectorAll('.sidebar-link[data-section]');

  function showSection(id) {
    sections.forEach(s => s.classList.toggle('active', s.id === id));
    navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
    if (id === 'sec-products')  renderTable();
    if (id === 'sec-dashboard') renderDashboard();
  }

  navLinks.forEach(l => l.addEventListener('click', () => showSection(l.dataset.section)));
  showSection('sec-dashboard');

  /* ── Logout / theme ──────────────────────────────────────── */
  document.getElementById('logout-btn')?.addEventListener('click', Auth.logout);
  document.getElementById('theme-toggle')?.addEventListener('click', UI.toggleTheme);

  /* ── Publish button (top bar) ────────────────────────────── */
  document.getElementById('publish-btn')?.addEventListener('click', doPublish);

  function doPublish() {
    const count = Storage.getProductsLocal().length;
    if (count === 0) { UI.toast('No products to publish', 'error'); return; }
    Storage.exportProductsJSON();
    UI.toast(`products.json downloaded (${count} products) — now commit it to GitHub!`, 'success');
    // Show the publish guide modal
    UI.openModal('publish-modal');
  }

  /* ════════════════════════════════════════════════════════
     DASHBOARD
  ════════════════════════════════════════════════════════ */
  function renderDashboard() {
    const products = Storage.getProductsLocal();
    setEl('stat-products',   products.length);
    setEl('stat-categories', new Set(products.map(p=>p.category).filter(Boolean)).size);
    setEl('stat-cart',       Storage.getCart().length);
    const prices = products.map(p => p.price);
    setEl('stat-max', prices.length ? UI.formatPrice(Math.max(...prices)) : '—');

    const tbody = document.getElementById('dash-recent');
    if (tbody) {
      tbody.innerHTML = products.slice(-5).reverse().map(p => `
        <tr>
          <td><img class="tbl-img" src="${p.image}" alt="${p.name}" onerror="this.src='assets/placeholder-images/placeholder.svg'"></td>
          <td>${p.name}</td>
          <td>${p.category || '—'}</td>
          <td>${UI.formatPrice(p.price)}</td>
        </tr>`).join('')
        || '<tr><td colspan="4" style="text-align:center;padding:32px;color:var(--muted)">No products yet.</td></tr>';
    }

    // Publish reminder badge
    const badge = document.getElementById('unpublished-badge');
    if (badge) badge.style.display = products.length > 0 ? 'inline-flex' : 'none';
  }

  /* ════════════════════════════════════════════════════════
     PRODUCTS TABLE
  ════════════════════════════════════════════════════════ */
  function renderTable(query = '') {
    let products = Storage.getProductsLocal();
    if (query) {
      const q = query.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) || (p.category||'').toLowerCase().includes(q));
    }

    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;

    tbody.innerHTML = products.length === 0
      ? `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--muted)">
           No products yet. <a href="#" onclick="document.querySelector('[data-section=sec-add]').click();return false"
             style="color:var(--accent)">Add your first product →</a>
         </td></tr>`
      : products.map(p => `
        <tr>
          <td><img class="tbl-img" src="${p.image}" alt="${p.name}" onerror="this.src='assets/placeholder-images/placeholder.svg'"></td>
          <td><strong>${p.name}</strong></td>
          <td>${p.category || '—'}</td>
          <td>${UI.formatPrice(p.price)}</td>
          <td style="max-width:180px;font-size:.82rem;color:var(--muted)">${(p.description||'').slice(0,60)}${p.description&&p.description.length>60?'…':''}</td>
          <td>
            <div class="tbl-actions">
              <button class="btn btn-sm btn-edit" data-edit="${p.id}">Edit</button>
              <button class="btn btn-sm btn-del"  data-del="${p.id}">Delete</button>
            </div>
          </td>
        </tr>`).join('');

    tbody.querySelectorAll('[data-edit]').forEach(btn =>
      btn.addEventListener('click', () => openEditForm(btn.dataset.edit)));

    tbody.querySelectorAll('[data-del]').forEach(btn =>
      btn.addEventListener('click', () => {
        UI.confirm('Delete this product permanently?', () => {
          Storage.deleteProduct(btn.dataset.del);
          renderTable(document.getElementById('table-search')?.value || '');
          renderDashboard();
          UI.toast('Product deleted — remember to Publish!', 'info');
        });
      }));
  }

  document.getElementById('table-search')?.addEventListener('input', e => renderTable(e.target.value));

  /* ════════════════════════════════════════════════════════
     ADD / EDIT FORM
  ════════════════════════════════════════════════════════ */
  const addForm    = document.getElementById('add-product-form');
  const imgPreview = document.getElementById('img-preview');
  const imgInput   = document.getElementById('prod-image');
  const imgWrap    = document.getElementById('img-preview-wrap');
  let   imageB64   = '';

  // File picker
  imgInput?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { UI.toast('Please choose an image file', 'error'); return; }
    if (file.size > 5 * 1024 * 1024)    { UI.toast('Image must be under 5 MB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      imageB64 = ev.target.result;
      imgPreview.src = imageB64;
      imgPreview.style.display = 'block';
      document.getElementById('img-placeholder').style.display = 'none';
    };
    reader.readAsDataURL(file);
  });

  imgWrap?.addEventListener('click', () => imgInput?.click());

  // Submit
  addForm?.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm()) return;

    const product = {
      name:        document.getElementById('prod-name').value.trim(),
      price:       parseFloat(document.getElementById('prod-price').value),
      category:    document.getElementById('prod-category').value.trim(),
      description: document.getElementById('prod-desc').value.trim(),
      image:       imageB64 || autoPlaceholder(document.getElementById('prod-name').value),
    };

    UI.showSpinner();
    setTimeout(() => {
      if (editingId) {
        Storage.updateProduct(editingId, product);
        UI.toast('Product updated — click Publish to go live!', 'success');
        editingId = null;
        setFormMode('add');
      } else {
        Storage.addProduct(product);
        UI.toast('Product saved — click Publish to go live!', 'success');
      }
      UI.hideSpinner();
      resetForm();
      renderDashboard();
      showSection('sec-products');
    }, 300);
  });

  document.getElementById('cancel-edit-btn')?.addEventListener('click', () => {
    editingId = null;
    resetForm();
    setFormMode('add');
  });

  function openEditForm(id) {
    const p = Storage.getProduct(id);
    if (!p) return;
    editingId = id;
    document.getElementById('prod-name').value     = p.name;
    document.getElementById('prod-price').value    = p.price;
    document.getElementById('prod-category').value = p.category || '';
    document.getElementById('prod-desc').value     = p.description || '';
    imageB64 = p.image || '';
    if (imageB64) {
      imgPreview.src = imageB64;
      imgPreview.style.display = 'block';
      document.getElementById('img-placeholder').style.display = 'none';
    }
    setFormMode('edit');
    showSection('sec-add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setFormMode(mode) {
    const isEdit = mode === 'edit';
    setEl('form-title', isEdit ? 'Edit Product' : 'Add New Product');
    document.getElementById('submit-btn').textContent = isEdit ? 'Update Product' : 'Save Product';
    const cancelBtn = document.getElementById('cancel-edit-btn');
    if (cancelBtn) cancelBtn.style.display = isEdit ? 'inline-flex' : 'none';
  }

  function resetForm() {
    addForm?.reset();
    imageB64 = '';
    imgPreview.src = '';
    imgPreview.style.display = 'none';
    document.getElementById('img-placeholder').style.display = '';
  }

  function validateForm() {
    let ok = true;
    [
      { id: 'prod-name',  rule: v => v.trim().length >= 2,           msg: 'prod-name-err' },
      { id: 'prod-price', rule: v => !isNaN(v) && parseFloat(v) > 0, msg: 'prod-price-err' },
    ].forEach(f => {
      const inp = document.getElementById(f.id);
      const err = document.getElementById(f.msg);
      const pass = f.rule(inp.value);
      inp.classList.toggle('error', !pass);
      if (err) err.style.display = pass ? 'none' : 'block';
      if (!pass) { if (ok) inp.focus(); ok = false; }
    });
    return ok;
  }

  function autoPlaceholder(name) {
    const hue = Math.abs([...name].reduce((a,c) => a + c.charCodeAt(0), 0)) % 360;
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450">
      <rect width="600" height="450" fill="hsl(${hue},40%,22%)"/>
      <rect x="60" y="60" width="480" height="330" fill="hsl(${hue},35%,30%)" rx="8"/>
      <text x="300" y="225" text-anchor="middle" font-family="Georgia,serif"
        font-size="36" fill="hsl(${hue},60%,75%)" font-style="italic">${name.slice(0,20)}</text>
    </svg>`;
    return 'data:image/svg+xml;base64,' + btoa(s);
  }

  /* ════════════════════════════════════════════════════════
     IMPORT / EXPORT (settings section)
  ════════════════════════════════════════════════════════ */
  // Publish button in I/O section (same as top-bar button)
  document.getElementById('publish-io-btn')?.addEventListener('click', doPublish);

  document.getElementById('import-btn')?.addEventListener('click', () =>
    document.getElementById('import-file')?.click());

  document.getElementById('import-file')?.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const result = Storage.importProductsJSON(ev.target.result);
      if (result.ok) {
        UI.toast(`Imported ${result.count} products — click Publish to go live!`, 'success');
        renderTable(); renderDashboard();
      } else {
        UI.toast('Import failed: ' + result.error, 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  /* ── Publish modal close ─────────────────────────────────── */
  document.querySelectorAll('[data-close-modal]').forEach(btn =>
    btn.addEventListener('click', () => UI.closeModal(btn.dataset.closeModal)));

  /* ── Helper ──────────────────────────────────────────────── */
  function setEl(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  }
});
