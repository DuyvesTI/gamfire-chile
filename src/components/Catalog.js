// Renderizado dinámico del catálogo y productos destacados desde la API / base de datos
// Compatible con filtrado por categorías y cotización por WhatsApp.
import { fetchProducts } from '../services/api.js';
import { getCategoryLabel, formatCLP } from '../data/defaultCatalog.js';

export async function initCatalog() {
  const catalogGrid = document.getElementById('catalog-grid');
  const featuredGrid = document.getElementById('featured-products');

  if (!catalogGrid && !featuredGrid) return [];

  const products = await fetchProducts({ includeInactive: false });

  if (featuredGrid) {
    renderFeaturedProducts(featuredGrid, products);
  }

  if (catalogGrid) {
    renderCatalogGrid(catalogGrid, products);
    setupCategoryFilters(catalogGrid);
  }

  return products;
}

function resolveImageUrl(img) {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) {
    return img;
  }
  const rawBase = import.meta.env?.BASE_URL || './';
  if (rawBase === './' || rawBase === '.') {
    return img.replace(/^\//, '');
  }
  const base = rawBase.replace(/\/$/, '');
  return `${base}/${img.replace(/^\//, '')}`;
}

function renderFeaturedProducts(container, products) {
  const featured = products.filter((p) => p.featured);
  const list = featured.length > 0 ? featured : products.slice(0, 3);
  if (list.length === 0) return;

  container.replaceChildren();
  list.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';

    const imgWrap = createProductImageEl(product);
    const title = document.createElement('h3');
    title.textContent = product.name;

    const desc = document.createElement('p');
    desc.textContent = product.description || '';

    const priceEl = createPriceBlock(product);

    const link = document.createElement('a');
    link.href = 'catalogo.html';
    link.className = 'btn btn-dark-outline';
    link.textContent = 'Ver en catálogo';

    card.append(imgWrap, title, desc);
    if (priceEl) card.appendChild(priceEl);
    card.appendChild(link);

    container.appendChild(card);
  });
}

function renderCatalogGrid(container, products) {
  container.replaceChildren();

  products.forEach((product) => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.dataset.category = product.category || 'proteccion';
    card.dataset.productId = product.id;
    card.dataset.productJson = JSON.stringify({
      id: product.id,
      name: product.name,
      category: getCategoryLabel(product.category),
      normalPrice: product.normalPrice,
      offerPrice: product.offerPrice,
      showPrice: product.showPrice,
      colors: product.colors || [],
      sizes: product.sizes || [],
      minOrderQty: product.minOrderQty || 1,
    });

    const imgWrap = createProductImageEl(product);

    const title = document.createElement('h3');
    title.textContent = product.name;

    const catBadge = document.createElement('span');
    catBadge.className = 'category';
    catBadge.textContent = getCategoryLabel(product.category);

    const desc = document.createElement('p');
    desc.className = 'product-desc';
    desc.textContent = product.description || '';

    card.append(imgWrap, title, catBadge, desc);

    const priceEl = createPriceBlock(product);
    if (priceEl) card.appendChild(priceEl);

    const metaEl = createProductMetaBlock(product);
    if (metaEl) card.appendChild(metaEl);

    container.appendChild(card);
  });
}

function createProductImageEl(product) {
  const imgUrl = resolveImageUrl(product.image);
  const div = document.createElement('div');
  div.className = 'product-img-placeholder';
  div.setAttribute('role', 'img');
  div.setAttribute('aria-label', product.name);
  if (imgUrl) {
    div.style.backgroundImage = `url('${imgUrl}')`;
  }
  if (product.offerPrice && product.showPrice) {
    const badge = document.createElement('span');
    badge.className = 'product-offer-badge';
    badge.textContent = 'OFERTA';
    div.appendChild(badge);
  }
  return div;
}

function createPriceBlock(product) {
  if (!product.showPrice) return null;
  const normal = formatCLP(product.normalPrice);
  const offer = formatCLP(product.offerPrice);
  if (!normal && !offer) return null;

  const wrap = document.createElement('div');
  wrap.className = 'product-pricing';

  if (offer && normal && Number(product.offerPrice) < Number(product.normalPrice)) {
    const oldSpan = document.createElement('span');
    oldSpan.className = 'price-normal-struck';
    oldSpan.textContent = normal;

    const offerSpan = document.createElement('span');
    offerSpan.className = 'price-offer';
    offerSpan.textContent = offer;

    wrap.append(oldSpan, offerSpan);
  } else {
    const mainSpan = document.createElement('span');
    mainSpan.className = 'price-current';
    mainSpan.textContent = offer || normal;
    wrap.appendChild(mainSpan);
  }
  return wrap;
}

function createProductMetaBlock(product) {
  const colors = Array.isArray(product.colors) ? product.colors.filter(Boolean) : [];
  const sizes = Array.isArray(product.sizes) ? product.sizes.filter(Boolean) : [];
  const minQty = Number(product.minOrderQty) || 1;

  if (colors.length === 0 && sizes.length === 0 && minQty <= 1) return null;

  const wrap = document.createElement('div');
  wrap.className = 'product-specs-summary';

  if (colors.length > 0) {
    const row = document.createElement('div');
    row.className = 'spec-pill-row';
    row.innerHTML = `<span class="spec-label">Colores:</span> <span class="spec-val">${escapeHtml(colors.join(', '))}</span>`;
    wrap.appendChild(row);
  }

  if (sizes.length > 0) {
    const row = document.createElement('div');
    row.className = 'spec-pill-row';
    row.innerHTML = `<span class="spec-label">Tallas:</span> <span class="spec-val">${escapeHtml(sizes.join(' · '))}</span>`;
    wrap.appendChild(row);
  }

  if (minQty > 1) {
    const row = document.createElement('div');
    row.className = 'spec-min-qty';
    row.textContent = `Pedido mínimo: ${minQty} unidades`;
    wrap.appendChild(row);
  }

  return wrap;
}

function setupCategoryFilters(grid) {
  const buttons = document.querySelectorAll('.filter-btn');
  if (buttons.length === 0) return;

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.setAttribute('aria-pressed', 'false');
        b.classList.remove('active');
      });

      btn.setAttribute('aria-pressed', 'true');
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');
      const cards = grid.querySelectorAll('.product-card');

      cards.forEach((card) => {
        const category = card.getAttribute('data-category');
        const matches = filter === 'all' || category === filter;
        card.classList.toggle('is-hidden', !matches);
      });
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
