/**
 * products.js — ArtStore Customer Storefront
 * Loads products via Storage.getProducts() which fetches products.json first,
 * so every visitor always sees the same catalogue you published.
 */

document.addEventListener('DOMContentLoaded', async () => {
  UI.initTheme();
  UI.updateCartBadge();

  let allProducts    = [];
  let filtered       = [];
  let activeCategory = 'All';
  let sortOrder      = 'default';
  let searchQuery    = '';

  const grid       = document.getElementById('product-grid');
  const countEl    = document.getElementById('product-count');
  const searchInp  = document.getElementById('search-input');
  const navSearch  = document.getElementById('nav-search-input');
  const sortSel    = document.getElementById('sort-select');
  const filterWrap = document.getElementById('filter-tabs');
  const themeBtn   = document.getElementById('theme-toggle');

  /* ── Load ─────────────────────────────────────────────────── */
  async function load() {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:60px 20px;color:var(--muted)">
        <div class="spinner" style="margin:0 auto 16px;border-top-color:var(--accent)"></div>
        <p>Loading collection…</p>
      </div>`;

    // Try products.json first, then LocalStorage
    allProducts = await Storage.getProducts();

    // Nothing anywhere? Seed samples into LocalStorage
    if (allProducts.length === 0) {
      Storage.seedIfEmpty();
      allProducts = Storage.getProductsLocal();
    }

    buildCategoryTabs();
    applyFilters();
  }

  /* ── Category tabs ────────────────────────────────────────── */
  function buildCategoryTabs() {
    const cats = ['All', ...new Set(allProducts.map(p => p.category).filter(Boolean))];
    filterWrap.innerHTML = cats.map(c =>
      `<button class="filter-tab${c === activeCategory ? ' active' : ''}" data-cat="${c}">${c}</button>`
    ).join('');
    filterWrap.querySelectorAll('.filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        filterWrap.querySelectorAll('.filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        applyFilters();
      });
    });
  }

  /* ── Filter + Sort ────────────────────────────────────────── */
  function applyFilters() {
    filtered = allProducts.filter(p => {
      const matchCat = activeCategory === 'All' || p.category === activeCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchQ = !q ||
        p.name.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q);
      return matchCat && matchQ;
    });
    if (sortOrder === 'price-asc')  filtered.sort((a,b) => a.price - b.price);
    if (sortOrder === 'price-desc') filtered.sort((a,b) => b.price - a.price);
    if (sortOrder === 'name-asc')   filtered.sort((a,b) => a.name.localeCompare(b.name));
    if (sortOrder === 'newest')     filtered.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    renderGrid();
  }

  /* ── Render ───────────────────────────────────────────────── */
  function renderGrid() {
    if (countEl) countEl.textContent = filtered.length;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <p>No artworks found.<br><small>Try a different search or category.</small></p>
        </div>`;
      return;
    }

    grid.innerHTML = filtered.map(p => `
      <article class="product-card">
        <div class="card-img-wrap">
          <img src="${p.image || 'assets/placeholder-images/placeholder.svg'}"
               alt="${p.name}" loading="lazy"
               onerror="this.src='assets/placeholder-images/placeholder.svg'">
          ${p.category ? `<span class="card-category">${p.category}</span>` : ''}
        </div>
        <div class="card-body">
          <h3 class="card-name">${p.name}</h3>
          <p class="card-desc">${p.description || ''}</p>
          <div class="card-footer">
            <span class="card-price">${UI.formatPrice(p.price)}</span>
            <button class="btn-cart" data-id="${p.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>Add to Cart
            </button>
          </div>
        </div>
      </article>`).join('');

    grid.querySelectorAll('.btn-cart').forEach(btn => {
      btn.addEventListener('click', () => {
        const product = allProducts.find(p => p.id === btn.dataset.id);
        if (!product) return;
        Storage.addToCart(product);
        UI.updateCartBadge();
        UI.toast(`"${product.name}" added to cart`, 'success');
        btn.innerHTML = '✓ Added';
        btn.style.background = 'var(--accent)';
        btn.style.color = 'var(--indigo)';
        setTimeout(() => {
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>Add to Cart`;
          btn.style.background = '';
          btn.style.color = '';
        }, 1500);
      });
    });
  }

  /* ── Events ───────────────────────────────────────────────── */
  const onSearch = val => {
    searchQuery = val;
    if (searchInp && searchInp.value !== val) searchInp.value = val;
    if (navSearch && navSearch.value !== val) navSearch.value = val;
    applyFilters();
  };
  if (searchInp) searchInp.addEventListener('input', e => onSearch(e.target.value));
  if (navSearch) navSearch.addEventListener('input', e => onSearch(e.target.value));
  if (sortSel)   sortSel.addEventListener('change', () => { sortOrder = sortSel.value; applyFilters(); });
  if (themeBtn)  themeBtn.addEventListener('click', () => UI.toggleTheme());

  await load();
});
