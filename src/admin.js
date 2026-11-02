// Controlador del Panel de Administración (Login seguro, RBAC de 2 roles,
// Mantenedor de Catálogo con tallas 6-6XL, colores, precios Normal/Oferta, subida de fotos y Usuarios).
import {
  login,
  logout,
  getCurrentUser,
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImage,
  fetchBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  fetchSiteContent,
  updateSiteContent,
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from './services/api.js';
import {
  KIDS_SIZES,
  ADULT_SIZES,
  DEFAULT_SITE_CONTENT,
  getCategoryLabel,
  normalizeCategoryId,
  formatCLP,
} from './data/defaultCatalog.js';

let currentUser = null;
let allProducts = [];
let allBanners = [];
let allUsers = [];
let siteContentDraft = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
let activeCatBannerKey = 'all';
let activeDivisionFilter = 'all';

const loginView = document.getElementById('admin-login-view');
const dashboardView = document.getElementById('admin-dashboard-view');
const loginForm = document.getElementById('admin-login-form');
const loginAlert = document.getElementById('login-alert');
const userBadge = document.getElementById('admin-user-badge');
const logoutBtn = document.getElementById('admin-logout-btn');
const feedbackBanner = document.getElementById('dashboard-feedback');

const tabBtnCatalog = document.getElementById('tab-btn-catalog');
const tabBtnBanners = document.getElementById('tab-btn-banners');
const tabBtnContent = document.getElementById('tab-btn-content');
const tabBtnUsers = document.getElementById('tab-btn-users');
const tabPanelCatalog = document.getElementById('tab-panel-catalog');
const tabPanelBanners = document.getElementById('tab-panel-banners');
const tabPanelContent = document.getElementById('tab-panel-content');
const tabPanelUsers = document.getElementById('tab-panel-users');

const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const bannerModal = document.getElementById('banner-modal');
const bannerForm = document.getElementById('banner-form');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');

initAdminApp();

async function initAdminApp() {
  setupPasswordToggle();
  setupTabs();
  setupDivisionFilters();
  setupModalClosers();
  renderSizeCheckboxes();
  setupSizePresetButtons();
  setupImageUploader();
  setupBannerMediaUploaders();
  setupSiteContentEditor();
  setupUserAccountTypeHandlers();

  loginForm?.addEventListener('submit', handleLoginSubmit);
  logoutBtn?.addEventListener('click', handleLogout);

  document.getElementById('btn-new-product')?.addEventListener('click', () => openProductModal());
  document.getElementById('admin-product-search')?.addEventListener('input', renderProductsTable);
  productForm?.addEventListener('submit', handleProductSave);

  document.getElementById('btn-new-banner')?.addEventListener('click', () => openBannerModal());
  bannerForm?.addEventListener('submit', handleBannerSave);

  document.getElementById('btn-new-user')?.addEventListener('click', () => openUserModal());
  userForm?.addEventListener('submit', handleUserSave);

  // Verificar si ya hay una sesión activa válida
  const sessionUser = await getCurrentUser();
  if (sessionUser) {
    await enterDashboard(sessionUser);
  } else {
    showLoginScreen();
  }
}

function setupDivisionFilters() {
  const filterBar = document.getElementById('admin-division-filters');
  if (!filterBar) return;

  filterBar.querySelectorAll('[data-div-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      activeDivisionFilter = btn.getAttribute('data-div-filter') || 'all';
      filterBar.querySelectorAll('[data-div-filter]').forEach((b) => {
        b.classList.toggle('active', b === btn);
      });
      renderProductsTable();
    });
  });
}

function setupPasswordToggle() {
  const pwdInput = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-pwd-btn');
  if (!pwdInput || !toggleBtn) return;

  toggleBtn.addEventListener('click', () => {
    const isPwd = pwdInput.type === 'password';
    pwdInput.type = isPwd ? 'text' : 'password';
  });
}

function showLoginScreen() {
  currentUser = null;
  loginView.hidden = false;
  dashboardView.hidden = true;
  userBadge.hidden = true;
  logoutBtn.hidden = true;
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  loginAlert.hidden = true;

  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;

  if (!username || !password) {
    showLoginError('Ingresa tu usuario y contraseña.');
    return;
  }

  const submitBtn = document.getElementById('login-submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Verificando credenciales...';

  try {
    const user = await login(username, password);
    loginForm.reset();
    await enterDashboard(user);
  } catch (err) {
    showLoginError(err.message || 'Credenciales inválidas.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Iniciar Sesión Segura';
  }
}

function showLoginError(msg) {
  loginAlert.textContent = msg;
  loginAlert.hidden = false;
}

function handleLogout() {
  logout();
  showLoginScreen();
}

function getUserPermissions(user) {
  if (!user) return [];
  if (user.role === 'admin') return ['catalog', 'banners', 'content', 'users'];
  if (Array.isArray(user.permissions) && user.permissions.length > 0) {
    return user.permissions;
  }
  if (user.role === 'catalogo') return ['catalog'];
  return ['catalog'];
}

async function enterDashboard(user) {
  currentUser = user;
  loginView.hidden = true;
  dashboardView.hidden = false;

  const perms = getUserPermissions(user);
  const isAdmin = user.role === 'admin';
  const roleName = isAdmin ? 'Administrador' : 'Personalizado';
  userBadge.textContent = `👤 ${user.name} (${roleName})`;
  userBadge.hidden = false;
  logoutBtn.hidden = false;

  // Control de acceso a pestañas según perfiles
  if (tabBtnCatalog) tabBtnCatalog.hidden = !perms.includes('catalog');
  if (tabBtnBanners) tabBtnBanners.hidden = !perms.includes('banners');
  if (tabBtnContent) tabBtnContent.hidden = !perms.includes('content');
  if (tabBtnUsers) tabBtnUsers.hidden = !perms.includes('users');

  // Si la pestaña activa no está permitida para el usuario, abrir la primera que sí tenga
  const availableTabs = ['catalog', 'banners', 'content', 'users'].filter((t) => perms.includes(t));
  const activeTabEl = document.querySelector('.admin-tab.active');
  const activeTabName = activeTabEl ? activeTabEl.getAttribute('data-tab') : 'catalog';

  if (!perms.includes(activeTabName)) {
    if (availableTabs.length > 0) {
      switchTab(availableTabs[0]);
    }
  } else {
    switchTab(activeTabName);
  }

  if (perms.includes('catalog')) await loadCatalogData();
  if (perms.includes('banners')) await loadBannersData();
  if (perms.includes('content')) await loadSiteContentData();
  if (perms.includes('users')) {
    await loadUsersData();
  }
}

function setupTabs() {
  const tabs = [tabBtnCatalog, tabBtnBanners, tabBtnContent, tabBtnUsers];
  tabs.forEach((btn) => {
    btn?.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      const perms = getUserPermissions(currentUser);
      if (!perms.includes(target)) {
        showFeedback('No tienes permiso para acceder a esta sección.', 'error');
        return;
      }
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  const isCatalog = tabName === 'catalog';
  const isBanners = tabName === 'banners';
  const isContent = tabName === 'content';
  const isUsers = tabName === 'users';

  tabBtnCatalog?.classList.toggle('active', isCatalog);
  tabBtnCatalog?.setAttribute('aria-selected', String(isCatalog));

  tabBtnBanners?.classList.toggle('active', isBanners);
  tabBtnBanners?.setAttribute('aria-selected', String(isBanners));

  tabBtnContent?.classList.toggle('active', isContent);
  tabBtnContent?.setAttribute('aria-selected', String(isContent));

  tabBtnUsers?.classList.toggle('active', isUsers);
  tabBtnUsers?.setAttribute('aria-selected', String(isUsers));

  if (tabPanelCatalog) tabPanelCatalog.hidden = !isCatalog;
  if (tabPanelBanners) tabPanelBanners.hidden = !isBanners;
  if (tabPanelContent) tabPanelContent.hidden = !isContent;
  if (tabPanelUsers) tabPanelUsers.hidden = !isUsers;
}

function showFeedback(message, type = 'success') {
  feedbackBanner.textContent = message;
  feedbackBanner.className = `admin-alert ${type}`;
  feedbackBanner.hidden = false;
  clearTimeout(showFeedback._timer);
  showFeedback._timer = setTimeout(() => {
    feedbackBanner.hidden = true;
  }, 4500);
}

function setupModalClosers() {
  document.querySelectorAll('[data-close-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-close-modal');
      document.getElementById(id)?.close();
    });
  });
}

// ==========================================================
// MANTENEDOR DE CATÁLOGO
// ==========================================================
async function loadCatalogData() {
  allProducts = await fetchProducts({ includeInactive: true });
  syncAdminTopDivisionBar();
  renderProductsTable();
}

function syncAdminTopDivisionBar() {
  const guardStyle = document.getElementById('inline-active-divisions-guard');
  if (guardStyle) {
    guardStyle.remove();
  }

  const activeCategories = new Set(
    allProducts.filter((p) => p && p.active !== false).map((p) => normalizeCategoryId(p.category))
  );
  document.querySelectorAll('.top-division-bar [data-division-tab]').forEach((tab) => {
    const cat = normalizeCategoryId(tab.getAttribute('data-division-tab'));
    tab.hidden = !activeCategories.has(cat);
  });
  document.querySelectorAll('.top-division-bar').forEach((bar) => {
    bar.hidden = false;
  });
}

function resolveImg(img) {
  if (!img) return 'https://placehold.co/120x90?text=Sin+Foto';
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/')) return img;
  const rawBase = import.meta.env?.BASE_URL || './';
  if (rawBase === './' || rawBase === '.') {
    return img.replace(/^\//, '');
  }
  const base = rawBase.replace(/\/$/, '');
  return `${base}/${img.replace(/^\//, '')}`;
}

function updateDivisionCounts() {
  const counts = {
    all: allProducts.length,
    featured: 0,
    corporativa: 0,
    fire: 0,
    seven: 0,
    accesorios: 0,
  };
  allProducts.forEach((p) => {
    const cat = normalizeCategoryId(p.category);
    if (counts[cat] !== undefined) counts[cat] += 1;
    if (p.featured && p.active !== false) counts.featured += 1;
  });

  Object.entries(counts).forEach(([key, val]) => {
    const el = document.getElementById(`count-div-${key}`);
    if (el) el.textContent = String(val);
  });
}

function renderProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  const countEl = document.getElementById('admin-product-count');
  const query = (document.getElementById('admin-product-search')?.value || '').trim().toLowerCase();

  updateDivisionCounts();

  const filtered = allProducts.filter((p) => {
    const normCat = normalizeCategoryId(p.category);
    if (activeDivisionFilter === 'featured') {
      if (!p.featured) return false;
    } else if (activeDivisionFilter !== 'all' && normCat !== activeDivisionFilter) {
      return false;
    }
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      getCategoryLabel(normCat).toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query)
    );
  });

  if (countEl) countEl.textContent = String(allProducts.length);
  tbody.replaceChildren();

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    const isFeaturedFilter = activeDivisionFilter === 'featured';
    const divLabel =
      !isFeaturedFilter && activeDivisionFilter !== 'all'
        ? getCategoryLabel(activeDivisionFilter)
        : '';
    tr.innerHTML = `
      <td colspan="7" class="text-center" style="padding: 2.2rem; color: #555;">
        <div style="margin-bottom: 0.75rem;">
          ${
            isFeaturedFilter
              ? 'No hay productos marcados con <strong>⭐ En Carrusel</strong>. Marca cualquier producto desde la tabla o al editarlo para mostrarlo en el carrusel de inicio.'
              : divLabel
                ? `Aún no hay productos cargados en la división <strong>${escapeHtml(divLabel)}</strong>.`
                : 'No se encontraron productos con ese criterio.'
          }
        </div>
        ${
          divLabel
            ? `<button type="button" class="btn btn-sm btn-primary" id="btn-empty-div-add">+ Agregar producto en ${escapeHtml(divLabel)}</button>`
            : ''
        }
      </td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('#btn-empty-div-add')?.addEventListener('click', () => openProductModal());
    return;
  }

  filtered.forEach((p) => {
    const tr = document.createElement('tr');
    if (p.active === false) tr.classList.add('row-inactive');
    const normCat = normalizeCategoryId(p.category);

    const normalStr = formatCLP(p.normalPrice) || '—';
    const offerStr = formatCLP(p.offerPrice) || '—';
    const priceVisibility = p.showPrice
      ? '<span class="badge-mini badge-green">Público</span>'
      : '<span class="badge-mini badge-gray">Solo cotización</span>';

    const colorsStr =
      Array.isArray(p.colors) && p.colors.length > 0 ? p.colors.join(', ') : '<span class="muted">Sin especificar</span>';
    const sizesStr =
      Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.join(', ') : '<span class="muted">Talla única / N/A</span>';

    const activeBtnHtml =
      p.active !== false
        ? `<button type="button" class="status-pill active status-toggle-btn" data-toggle-active="${escapeAttr(p.id)}" title="Clic para ocultar del catálogo">✅ Activo</button>`
        : `<button type="button" class="status-pill inactive status-toggle-btn" data-toggle-active="${escapeAttr(p.id)}" title="Clic para activar en el catálogo">🚫 Oculto</button>`;

    const featuredBtnHtml = p.featured
      ? `<button type="button" class="status-pill featured status-toggle-btn" data-toggle-featured="${escapeAttr(p.id)}" title="Clic para quitar del Carrusel de Inicio">⭐ En Carrusel</button>`
      : `<button type="button" class="status-pill status-pill-muted status-toggle-btn" data-toggle-featured="${escapeAttr(p.id)}" title="Clic para mostrar en el Carrusel de Inicio">☆ Poner en Carrusel</button>`;

    tr.innerHTML = `
      <td>
        <div class="admin-prod-cell">
          <img src="${escapeAttr(resolveImg(p.image))}" alt="${escapeAttr(p.name)}" class="admin-prod-thumb" />
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="admin-prod-desc-preview">${escapeHtml(p.description || '')}</div>
          </div>
        </div>
      </td>
      <td><span class="category admin-cat-badge cat-${escapeAttr(normCat)}">${escapeHtml(getCategoryLabel(normCat))}</span></td>
      <td>
        <div class="admin-price-stack">
          <span>Normal: <strong>${normalStr}</strong></span>
          <span>Oferta: <strong class="text-offer">${offerStr}</strong></span>
          ${priceVisibility}
        </div>
      </td>
      <td>
        <div class="admin-specs-stack">
          <div><strong>Colores:</strong> ${colorsStr}</div>
          <div><strong>Tallas:</strong> ${sizesStr}</div>
        </div>
      </td>
      <td><strong>${Number(p.minOrderQty) || 1}</strong> u.</td>
      <td><div class="status-stack">${activeBtnHtml} ${featuredBtnHtml}</div></td>
      <td>
        <div class="admin-row-actions">
          <button type="button" class="btn-action edit" data-edit-prod="${escapeAttr(p.id)}">Editar</button>
          <button type="button" class="btn-action delete" data-del-prod="${escapeAttr(p.id)}">Eliminar</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-toggle-active]')?.addEventListener('click', () => handleQuickToggleActive(p));
    tr.querySelector('[data-toggle-featured]')?.addEventListener('click', () => handleQuickToggleFeatured(p));
    tr.querySelector('[data-edit-prod]')?.addEventListener('click', () => openProductModal(p));
    tr.querySelector('[data-del-prod]')?.addEventListener('click', () => handleProductDelete(p));

    tbody.appendChild(tr);
  });
}

async function handleQuickToggleActive(product) {
  const nextActive = product.active === false;
  try {
    await updateProduct(product.id, { ...product, active: nextActive });
    showFeedback(
      nextActive
        ? `"${product.name}" ahora está ACTIVO en el catálogo.`
        : `"${product.name}" se ocultó del catálogo público.`
    );
    await loadCatalogData();
  } catch (err) {
    alert(err.message || 'No se pudo cambiar el estado del producto.');
  }
}

async function handleQuickToggleFeatured(product) {
  const nextFeatured = !product.featured;
  const nextActive = nextFeatured ? true : product.active !== false;
  try {
    await updateProduct(product.id, {
      ...product,
      featured: nextFeatured,
      active: nextActive,
    });
    showFeedback(
      nextFeatured
        ? `⭐ "${product.name}" agregado al Carrusel de Inicio y Destacados.`
        : `"${product.name}" quitado del Carrusel de Inicio.`
    );
    await loadCatalogData();
  } catch (err) {
    alert(err.message || 'No se pudo actualizar el carrusel.');
  }
}

function renderSizeCheckboxes() {
  const kidsContainer = document.getElementById('sizes-kids-container');
  const adultsContainer = document.getElementById('sizes-adults-container');
  if (!kidsContainer || !adultsContainer) return;

  kidsContainer.replaceChildren();
  KIDS_SIZES.forEach((sz) => {
    kidsContainer.appendChild(createSizePill(sz));
  });

  adultsContainer.replaceChildren();
  ADULT_SIZES.forEach((sz) => {
    adultsContainer.appendChild(createSizePill(sz));
  });
}

function createSizePill(sizeValue) {
  const label = document.createElement('label');
  label.className = 'size-check-pill';
  label.innerHTML = `
    <input type="checkbox" name="prod-size" value="${escapeAttr(sizeValue)}" />
    <span>${escapeHtml(sizeValue)}</span>
  `;
  return label;
}

function setupSizePresetButtons() {
  document.querySelectorAll('[data-size-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const preset = btn.getAttribute('data-size-preset');
      const checks = document.querySelectorAll('input[name="prod-size"]');
      checks.forEach((chk) => {
        if (preset === 'all') chk.checked = true;
        else if (preset === 'none') chk.checked = false;
        else if (preset === 'kids' && KIDS_SIZES.includes(chk.value)) chk.checked = true;
        else if (preset === 'adults' && ADULT_SIZES.includes(chk.value)) chk.checked = true;
      });
    });
  });
}

function setupImageUploader() {
  const fileInput = document.getElementById('prod-image-file');
  const urlInput = document.getElementById('prod-image-url');
  const clearBtn = document.getElementById('prod-image-clear');

  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressImageFile(file, 900, 0.84);
      const uploadedUrl = await uploadProductImage(compressedDataUrl);
      urlInput.value = uploadedUrl;
      updateImagePreview(uploadedUrl);
    } catch (err) {
      alert(err.message || 'No se pudo procesar la imagen.');
    } finally {
      fileInput.value = '';
    }
  });

  urlInput?.addEventListener('input', () => {
    updateImagePreview(urlInput.value.trim());
  });

  clearBtn?.addEventListener('click', () => {
    urlInput.value = '';
    updateImagePreview('');
  });
}

function compressImageFile(file, maxWidth = 900, quality = 0.84) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Archivo de imagen inválido.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

function updateImagePreview(url) {
  const preview = document.getElementById('prod-image-preview');
  if (!preview) return;
  if (!url) {
    preview.style.backgroundImage = 'none';
    preview.textContent = 'Sin imagen';
  } else {
    preview.style.backgroundImage = `url('${resolveImg(url)}')`;
    preview.textContent = '';
  }
}

function openProductModal(product = null) {
  productForm.reset();
  const titleEl = document.getElementById('product-modal-title');
  const idInput = document.getElementById('prod-id');

  if (product) {
    titleEl.textContent = `Editar Producto: ${product.name}`;
    idInput.value = product.id;
    document.getElementById('prod-name').value = product.name || '';
    document.getElementById('prod-category').value = normalizeCategoryId(product.category);
    document.getElementById('prod-description').value = product.description || '';
    document.getElementById('prod-normal-price').value = product.normalPrice ?? '';
    document.getElementById('prod-offer-price').value = product.offerPrice ?? '';
    document.getElementById('prod-min-qty').value = product.minOrderQty || 1;
    document.getElementById('prod-show-price').checked = Boolean(product.showPrice);
    document.getElementById('prod-featured').checked = Boolean(product.featured);
    document.getElementById('prod-active').checked = product.active !== false;
    document.getElementById('prod-colors').value = Array.isArray(product.colors)
      ? product.colors.join(', ')
      : '';
    document.getElementById('prod-image-url').value = product.image || '';
    updateImagePreview(product.image || '');

    const activeSizes = Array.isArray(product.sizes) ? product.sizes : [];
    document.querySelectorAll('input[name="prod-size"]').forEach((chk) => {
      chk.checked = activeSizes.includes(chk.value);
    });
  } else {
    titleEl.textContent = 'Agregar Nuevo Producto';
    idInput.value = '';
    if (activeDivisionFilter !== 'all' && activeDivisionFilter !== 'featured') {
      document.getElementById('prod-category').value = activeDivisionFilter;
    }
    document.getElementById('prod-min-qty').value = '1';
    document.getElementById('prod-show-price').checked = true;
    document.getElementById('prod-featured').checked = activeDivisionFilter === 'featured';
    document.getElementById('prod-active').checked = true;
    updateImagePreview('');
    document.querySelectorAll('input[name="prod-size"]').forEach((chk) => {
      chk.checked = false;
    });
  }

  productModal.showModal();
}

async function handleProductSave(e) {
  e.preventDefault();
  if (!productForm.checkValidity()) {
    productForm.reportValidity();
    return;
  }

  const id = document.getElementById('prod-id').value.trim();
  const selectedSizes = Array.from(document.querySelectorAll('input[name="prod-size"]:checked')).map(
    (chk) => chk.value
  );
  const colorsRaw = document.getElementById('prod-colors').value;
  const colors = colorsRaw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);

  const normalVal = document.getElementById('prod-normal-price').value;
  const offerVal = document.getElementById('prod-offer-price').value;

  const payload = {
    name: document.getElementById('prod-name').value.trim(),
    category: document.getElementById('prod-category').value,
    description: document.getElementById('prod-description').value.trim(),
    normalPrice: normalVal !== '' ? Number(normalVal) : null,
    offerPrice: offerVal !== '' ? Number(offerVal) : null,
    minOrderQty: Math.max(1, parseInt(document.getElementById('prod-min-qty').value, 10) || 1),
    showPrice: document.getElementById('prod-show-price').checked,
    featured: document.getElementById('prod-featured').checked,
    active: document.getElementById('prod-active').checked,
    colors,
    sizes: selectedSizes,
    image: document.getElementById('prod-image-url').value.trim(),
  };

  const saveBtn = document.getElementById('prod-save-btn');
  saveBtn.disabled = true;

  try {
    if (id) {
      await updateProduct(id, payload);
      showFeedback(`Producto "${payload.name}" actualizado correctamente.`);
    } else {
      await createProduct(payload);
      showFeedback(`Producto "${payload.name}" agregado al catálogo.`);
    }
    productModal.close();
    await loadCatalogData();
  } catch (err) {
    alert(err.message || 'Error al guardar el producto.');
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleProductDelete(product) {
  const confirmed = confirm(
    `¿Estás seguro de eliminar el producto "${product.name}" del catálogo? Esta acción no se puede deshacer.`
  );
  if (!confirmed) return;

  try {
    await deleteProduct(product.id);
    showFeedback(`Producto "${product.name}" eliminado.`);
    await loadCatalogData();
  } catch (err) {
    alert(err.message || 'No se pudo eliminar el producto.');
  }
}

// ==========================================================
// MANTENEDOR DE PROPAGANDA / BANNERS CARRUSEL (<sr7-poster>)
// ==========================================================
const LAYOUT_LABELS = {
  split: '1. Franja Central Doble + GAM CHILE',
  vignette: '2. Viñeta Oscura Izquierda + Sello',
  'bottom-bar': '3. Barra Inferior + Flecha ">"',
  showcase: '4. Vitrina 6 Tarjetas (Dual-Line)',
  clean: '5. Poster / Video Limpio',
};

async function loadBannersData() {
  allBanners = await fetchBanners({ includeInactive: true });
  renderBannersTable();
}

function renderBannersTable() {
  const tbody = document.getElementById('admin-banners-tbody');
  const countEl = document.getElementById('admin-banner-count');
  if (!tbody) return;

  if (countEl) countEl.textContent = String(allBanners.length);
  tbody.replaceChildren();

  if (allBanners.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td colspan="7" class="text-center" style="padding: 2.2rem; color: #555;">
        No hay banners promocionales configurados. Haz clic en <strong>+ Nueva Propaganda / Banner</strong> para agregar uno.
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  allBanners.forEach((b) => {
    const tr = document.createElement('tr');
    if (b.active === false) tr.classList.add('row-inactive');

    const activeBtnHtml =
      b.active !== false
        ? `<button type="button" class="status-pill active status-toggle-btn" data-toggle-banner="${escapeAttr(b.id)}" title="Clic para ocultar del carrusel">✅ Activa en Carrusel</button>`
        : `<button type="button" class="status-pill inactive status-toggle-btn" data-toggle-banner="${escapeAttr(b.id)}" title="Clic para mostrar en el carrusel">🚫 Oculta</button>`;

    const posterImg = b.posterImage || b.poster || '';
    const videoSrc = b.videoUrl || b.video || '';
    const mediaInfo = videoSrc
      ? `<span class="badge-mini badge-green">🎥 Video (${escapeHtml(videoSrc.split('/').pop())})</span>`
      : `<span class="badge-mini badge-gray">🖼️ Poster &lt;sr7-poster&gt;</span>`;

    const thumbMediaHtml = videoSrc
      ? `<div class="admin-banner-thumb-wrap" data-preview-bnr="${escapeAttr(b.id)}" title="Clic para editar y ver vista previa">
           <video src="${escapeAttr(resolveImg(videoSrc))}" poster="${escapeAttr(resolveImg(posterImg))}" class="admin-banner-thumb" autoplay muted loop playsinline></video>
           <span class="admin-thumb-badge">▶ VIDEO</span>
         </div>`
      : `<div class="admin-banner-thumb-wrap" data-preview-bnr="${escapeAttr(b.id)}" title="Clic para editar y ver vista previa">
           <img src="${escapeAttr(resolveImg(posterImg))}" alt="${escapeAttr(b.title)}" class="admin-banner-thumb" />
           <span class="admin-thumb-badge">🖼️ POSTER</span>
         </div>`;

    const rightHeadline =
      b.layout === 'split' && (b.titleRight || b.highlightRight)
        ? `<div class="admin-prod-desc-preview">Derecha: <strong>${escapeHtml(b.titleRight || '')} ${escapeHtml(b.highlightRight || '')}</strong></div>`
        : '';

    tr.innerHTML = `
      <td>
        ${thumbMediaHtml}
      </td>
      <td>
        <div>
          <strong>${escapeHtml(b.title || '')}</strong>
          <span style="color: #f05a00; font-weight: 700;"> ${escapeHtml(b.highlight || '')}</span>
          ${rightHeadline}
          <div class="admin-prod-desc-preview">${escapeHtml(b.subtitle || b.badge || '')}</div>
        </div>
      </td>
      <td><span class="admin-layout-badge">${escapeHtml(LAYOUT_LABELS[b.layout] || b.layout)}</span></td>
      <td><code>${escapeHtml(b.ctaLink || 'catalogo.html')}</code></td>
      <td>${mediaInfo}</td>
      <td>${activeBtnHtml}</td>
      <td>
        <div class="admin-row-actions">
          <button type="button" class="btn-action edit" data-edit-bnr="${escapeAttr(b.id)}">Editar</button>
          <button type="button" class="btn-action delete" data-del-bnr="${escapeAttr(b.id)}">Eliminar</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-preview-bnr]')?.addEventListener('click', () => openBannerModal(b));
    tr.querySelector('[data-toggle-banner]')?.addEventListener('click', () => handleQuickToggleBanner(b));
    tr.querySelector('[data-edit-bnr]')?.addEventListener('click', () => openBannerModal(b));
    tr.querySelector('[data-del-bnr]')?.addEventListener('click', () => handleBannerDelete(b));

    tbody.appendChild(tr);
  });
}

async function handleQuickToggleBanner(banner) {
  const nextActive = banner.active === false;
  try {
    await updateBanner(banner.id, { ...banner, active: nextActive });
    showFeedback(
      nextActive
        ? `Propaganda "${banner.title}" activada en el Carrusel de Inicio.`
        : `Propaganda "${banner.title}" ocultada del Carrusel.`
    );
    await loadBannersData();
  } catch (err) {
    alert(err.message || 'No se pudo actualizar el estado de la propaganda.');
  }
}

function setupBannerMediaUploaders() {
  const posterFile = document.getElementById('bnr-poster-file');
  const posterUrl = document.getElementById('bnr-poster-url');
  const videoFile = document.getElementById('bnr-video-file');
  const videoUrl = document.getElementById('bnr-video-url');
  const videoClear = document.getElementById('bnr-video-clear');
  const layoutSelect = document.getElementById('bnr-layout');

  layoutSelect?.addEventListener('change', () => {
    syncBannerFieldsByLayout();
    updateBannerLivePreview();
  });

  // Actualizar vista previa en vivo al editar cualquier campo de texto
  [
    'bnr-badge',
    'bnr-title',
    'bnr-highlight',
    'bnr-title-right',
    'bnr-highlight-right',
    'bnr-subtitle',
    'bnr-cta-text',
    'bnr-cta-link',
  ].forEach((fieldId) => {
    document.getElementById(fieldId)?.addEventListener('input', () => updateBannerLivePreview());
  });

  posterFile?.addEventListener('change', async () => {
    const file = posterFile.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 1600, 0.88);
      const uploadedUrl = await uploadProductImage(compressedDataUrl);
      posterUrl.value = uploadedUrl;
      updateBannerPosterPreview(uploadedUrl);
      updateBannerLivePreview();
    } catch (err) {
      alert(err.message || 'No se pudo procesar la imagen del poster.');
    } finally {
      posterFile.value = '';
    }
  });

  posterUrl?.addEventListener('input', () => {
    updateBannerPosterPreview(posterUrl.value.trim());
    updateBannerLivePreview();
  });

  videoFile?.addEventListener('change', async () => {
    const file = videoFile.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert('El video supera el tamaño máximo recomendado de 15 MB.');
      videoFile.value = '';
      return;
    }
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const uploadedUrl = await uploadProductImage(dataUrl);
      videoUrl.value = uploadedUrl;
      updateBannerVideoPreview(uploadedUrl, posterUrl?.value.trim());
      updateBannerLivePreview();
      showFeedback('Video subido y vinculado al banner.');
    } catch (err) {
      alert(err.message || 'No se pudo subir el video.');
    } finally {
      videoFile.value = '';
    }
  });

  videoUrl?.addEventListener('input', () => {
    updateBannerVideoPreview(videoUrl.value.trim(), posterUrl?.value.trim());
    updateBannerLivePreview();
  });

  videoClear?.addEventListener('click', () => {
    if (videoUrl) videoUrl.value = '';
    updateBannerVideoPreview('', posterUrl?.value.trim());
    updateBannerLivePreview();
  });

  document.getElementById('bnr-prods-select-all')?.addEventListener('click', () => {
    const checks = Array.from(document.querySelectorAll('input[name="bnr-showcase-prod"]:not(:disabled)'));
    checks.forEach((chk, idx) => {
      chk.checked = idx < 6;
    });
    updateBannerSelectedProdsCounter();
    updateBannerLivePreview();
  });

  document.getElementById('bnr-prods-clear')?.addEventListener('click', () => {
    document.querySelectorAll('input[name="bnr-showcase-prod"]').forEach((chk) => {
      chk.checked = false;
    });
    updateBannerSelectedProdsCounter();
    updateBannerLivePreview();
  });
}

function getSelectedBannerProductIds() {
  return Array.from(document.querySelectorAll('input[name="bnr-showcase-prod"]:checked'))
    .map((chk) => chk.value)
    .slice(0, 6);
}

function updateBannerSelectedProdsCounter() {
  const countEl = document.getElementById('bnr-selected-prods-count');
  const selected = getSelectedBannerProductIds();
  if (countEl) {
    countEl.textContent = `${selected.length} / 6 seleccionados`;
  }
}

function renderBannerProductsPicker(selectedIds = []) {
  const container = document.getElementById('bnr-showcase-products-list');
  if (!container) return;

  const activeProds = allProducts.filter((p) => p.active !== false);
  container.replaceChildren();

  if (activeProds.length === 0) {
    container.innerHTML = `
      <div class="bnr-showcase-empty-msg">
        ⚠️ Actualmente no hay productos activos en el catálogo. Activa al menos 1 producto en la pestaña <strong>📦 Mantenedor de Catálogo</strong> para poder seleccionarlo aquí.
      </div>
    `;
    updateBannerSelectedProdsCounter();
    return;
  }

  const effectiveSelected =
    Array.isArray(selectedIds) && selectedIds.length > 0
      ? selectedIds
      : activeProds.slice(0, 6).map((p) => p.id);

  activeProds.forEach((p) => {
    const normCat = normalizeCategoryId(p.category);
    const isChecked = effectiveSelected.includes(p.id);
    const label = document.createElement('label');
    label.className = 'bnr-prod-pick-card';
    label.innerHTML = `
      <input type="checkbox" name="bnr-showcase-prod" value="${escapeAttr(p.id)}" ${isChecked ? 'checked' : ''} />
      <img src="${escapeAttr(resolveImg(p.image))}" alt="${escapeAttr(p.name)}" class="bnr-prod-pick-thumb" />
      <div class="bnr-prod-pick-info">
        <strong>${escapeHtml(p.name)}</strong>
        <span class="admin-cat-badge cat-${escapeAttr(normCat)}">${escapeHtml(getCategoryLabel(normCat))}</span>
      </div>
    `;

    const checkbox = label.querySelector('input');
    checkbox?.addEventListener('change', () => {
      const checkedNow = document.querySelectorAll('input[name="bnr-showcase-prod"]:checked');
      if (checkedNow.length > 6) {
        checkbox.checked = false;
        alert('Puedes seleccionar un máximo de 6 productos activos para una vitrina.');
        return;
      }
      updateBannerSelectedProdsCounter();
      updateBannerLivePreview();
    });

    container.appendChild(label);
  });

  updateBannerSelectedProdsCounter();
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de video.'));
    reader.readAsDataURL(file);
  });
}

function updateBannerPosterPreview(url) {
  const preview = document.getElementById('bnr-poster-preview');
  if (!preview) return;
  if (!url) {
    preview.style.backgroundImage = 'none';
    preview.textContent = 'Sin poster';
  } else {
    preview.style.backgroundImage = `url('${resolveImg(url)}')`;
    preview.textContent = '';
  }
}

function updateBannerVideoPreview(videoUrl, posterUrl = '') {
  const preview = document.getElementById('bnr-video-preview');
  if (!preview) return;
  if (!videoUrl) {
    preview.innerHTML = 'Sin video';
  } else {
    const resolvedVid = resolveImg(videoUrl);
    const resolvedPoster = posterUrl ? resolveImg(posterUrl) : '';
    preview.innerHTML = `<video src="${escapeAttr(resolvedVid)}" ${
      resolvedPoster ? `poster="${escapeAttr(resolvedPoster)}"` : ''
    } autoplay muted loop playsinline class="admin-mini-video-player"></video>`;
  }
}

const LAYOUT_FIELD_RULES = {
  split: {
    enabled: ['title', 'highlight', 'titleRight', 'highlightRight'],
    titleLabel: 'Bloque Izquierdo - Línea Blanca *',
    titleRequired: true,
  },
  vignette: {
    enabled: ['badge', 'title', 'highlight', 'subtitle'],
    titleLabel: 'Línea Principal (Texto Blanco) *',
    titleRequired: true,
  },
  'bottom-bar': {
    enabled: ['badge', 'title', 'highlight', 'subtitle'],
    titleLabel: 'Línea Principal (Texto Blanco) *',
    titleRequired: true,
  },
  showcase: {
    enabled: ['title', 'productIds'],
    titleLabel: 'Nombre Identificatorio de la Vitrina *',
    titleRequired: true,
  },
  clean: {
    enabled: [],
    titleLabel: 'Línea Principal',
    titleRequired: false,
  },
};

function syncBannerFieldsByLayout() {
  const layout = document.getElementById('bnr-layout')?.value || 'split';
  const rule = LAYOUT_FIELD_RULES[layout] || LAYOUT_FIELD_RULES.vignette;

  const fieldMap = {
    badge: document.getElementById('bnr-badge'),
    title: document.getElementById('bnr-title'),
    highlight: document.getElementById('bnr-highlight'),
    titleRight: document.getElementById('bnr-title-right'),
    highlightRight: document.getElementById('bnr-highlight-right'),
    subtitle: document.getElementById('bnr-subtitle'),
  };

  Object.entries(fieldMap).forEach(([key, inputEl]) => {
    const isEnabled = rule.enabled.includes(key);
    const wrapEl = document.querySelector(`[data-bnr-field-wrap="${key}"]`);

    if (inputEl) {
      inputEl.disabled = !isEnabled;
      if (key === 'title') {
        inputEl.required = Boolean(rule.titleRequired && isEnabled);
      }
    }
    if (wrapEl) {
      wrapEl.hidden = !isEnabled;
      wrapEl.classList.remove('is-disabled-field');
    }
  });

  // Ocultar contenedores de filas vacías según el diseño elegido
  const titleHighlightGroup = document.getElementById('bnr-title-highlight-group');
  if (titleHighlightGroup) {
    titleHighlightGroup.hidden = !rule.enabled.includes('title') && !rule.enabled.includes('highlight');
  }

  const splitRightGroup = document.getElementById('bnr-split-right-group');
  if (splitRightGroup) {
    splitRightGroup.hidden = !rule.enabled.includes('titleRight') && !rule.enabled.includes('highlightRight');
  }

  // Mostrar u ocultar el selector de productos activos para la Opción 4 (showcase)
  const prodPickerEnabled = rule.enabled.includes('productIds');
  const prodWrap = document.querySelector('[data-bnr-field-wrap="productIds"]');
  if (prodWrap) {
    prodWrap.hidden = !prodPickerEnabled;
    prodWrap.classList.remove('is-disabled-field');
    prodWrap.querySelectorAll('input, button').forEach((el) => {
      el.disabled = !prodPickerEnabled;
    });
  }

  const titleLabelText = document.getElementById('bnr-title-label-text');
  if (titleLabelText) {
    titleLabelText.textContent = rule.titleLabel;
  }
}

function updateBannerLivePreview() {
  const stage = document.getElementById('bnr-live-preview-stage');
  const mediaBadge = document.getElementById('bnr-live-media-badge');
  if (!stage) return;

  const layout = document.getElementById('bnr-layout')?.value || 'split';
  const badge = document.getElementById('bnr-badge')?.value.trim() || '';
  const title = document.getElementById('bnr-title')?.value.trim() || 'EL MEJOR';
  const highlight = document.getElementById('bnr-highlight')?.value.trim() || 'ALIADO';
  const titleRight = document.getElementById('bnr-title-right')?.value.trim() || 'PARA TU';
  const highlightRight = document.getElementById('bnr-highlight-right')?.value.trim() || 'EQUIPO';
  const subtitle = document.getElementById('bnr-subtitle')?.value.trim() || '';
  const ctaText = document.getElementById('bnr-cta-text')?.value.trim() || 'CONOCE MÁS AQUÍ';
  const ctaLink = document.getElementById('bnr-cta-link')?.value.trim() || 'catalogo.html';
  const posterRaw = document.getElementById('bnr-poster-url')?.value.trim() || 'uploads/promo-banner-aliado.jpg';
  const videoRaw = document.getElementById('bnr-video-url')?.value.trim() || '';

  const posterUrl = resolveImg(posterRaw);
  const videoUrl = videoRaw ? resolveImg(videoRaw) : '';

  if (mediaBadge) {
    if (videoUrl) {
      mediaBadge.className = 'badge-mini badge-green';
      mediaBadge.textContent = `🎥 Video activo (${videoRaw.split('/').pop()}) + Poster <sr7-poster>`;
    } else {
      mediaBadge.className = 'badge-mini badge-gray';
      mediaBadge.textContent = '🖼️ Poster <sr7-poster> estático';
    }
  }

  const videoHtml = videoUrl
    ? `<video class="wa-sr7-video" autoplay muted loop playsinline poster="${escapeAttr(posterUrl)}">
         <source src="${escapeAttr(videoUrl)}" />
       </video>`
    : '';

  let overlayHtml = '';
  if (layout === 'split') {
    overlayHtml = `
      <div class="wa-promo-split-band">
        <div class="wa-promo-split-side left">
          <span class="wa-promo-line-white">${escapeHtml(title)}</span>
          <span class="wa-promo-line-orange">${escapeHtml(highlight)}</span>
        </div>
        <div class="wa-promo-split-spacer" aria-hidden="true"></div>
        <div class="wa-promo-split-side right">
          <span class="wa-promo-line-white">${escapeHtml(titleRight)}</span>
          <span class="wa-promo-line-orange">${escapeHtml(highlightRight)}</span>
        </div>
      </div>
      <div class="wa-promo-bottom-brand">
        <span class="wa-promo-brand-gam">GAM</span>
        <span class="wa-promo-brand-chile">CHILE</span>
        <span class="wa-promo-brand-flags" aria-hidden="true">
          <i class="flag-y"></i><i class="flag-o"></i><i class="flag-y"></i>
        </span>
      </div>
    `;
  } else if (layout === 'bottom-bar') {
    overlayHtml = `
      <div class="wa-promo-bottom-bar-layout">
        ${badge ? `<span class="wa-promo-top-badge">${escapeHtml(badge)}</span>` : ''}
        <div class="wa-promo-arrow-row">
          <span class="wa-promo-arrow-circle" aria-hidden="true">&#10095;</span>
          <div class="wa-promo-arrow-texts">
            <h2>${escapeHtml(title)} <span>${escapeHtml(highlight)}</span></h2>
            ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
          </div>
        </div>
      </div>
    `;
  } else if (layout === 'showcase') {
    const selectedIds = getSelectedBannerProductIds();
    const activeProds = allProducts.filter((p) => p.active !== false);
    const chosenProds = selectedIds
      .map((id) => activeProds.find((p) => p.id === id))
      .filter(Boolean)
      .slice(0, 6);

    const previewCards =
      chosenProds.length > 0
        ? chosenProds.map((p) => {
            const normCat = normalizeCategoryId(p.category);
            return {
              title: p.name.toUpperCase(),
              subtitle: `DIVISIÓN ${getCategoryLabel(normCat).toUpperCase()}`,
              image: p.image,
            };
          })
        : [
            { title: 'SIN PRODUCTOS SELECCIONADOS', subtitle: 'MARCA HASTA 6 PRODUCTOS ABAJO', image: '/hero-banner.jpg' },
          ];

    const colCount = Math.min(6, Math.max(1, previewCards.length));

    overlayHtml = `
      <div class="wa-sr7-showcase-inner" style="padding: 0.85rem;">
        <div class="wa-showcase-grid bnr-preview-showcase-grid" style="--showcase-cols: ${colCount};">
          ${previewCards
            .map(
              (c) => `
                <div class="wa-showcase-card bnr-preview-showcase-card">
                  <div class="wa-card-head">
                    <h3>${escapeHtml(c.title)}<sup>®</sup></h3>
                    <span>${escapeHtml(c.subtitle)}</span>
                  </div>
                  <div class="wa-card-img">
                    <img src="${escapeAttr(resolveImg(c.image))}" alt="${escapeAttr(c.title)}" />
                  </div>
                </div>
              `
            )
            .join('')}
        </div>
      </div>
    `;
  } else if (layout === 'clean') {
    overlayHtml = '';
  } else {
    overlayHtml = `
      <div class="wa-promo-vignette-layout">
        <div class="wa-promo-vignette-box">
          ${badge ? `<span class="wa-promo-top-badge">${escapeHtml(badge)}</span>` : ''}
          <h2>${escapeHtml(title)} <span>${escapeHtml(highlight)}</span></h2>
          ${subtitle ? `<p>${escapeHtml(subtitle)}</p>` : ''}
        </div>
      </div>
    `;
  }

  stage.innerHTML = `
    <div class="wa-sr7-banner-frame layout-${escapeAttr(layout)} bnr-modal-preview-frame">
      <sr7-poster class="sr7-poster sr7-html5-poster wa-sr7-poster" style="background-image: url(&quot;${escapeAttr(
        posterUrl
      )}&quot;); background-position: 50% 50%; background-repeat: no-repeat; background-size: cover;"></sr7-poster>
      ${videoHtml}
      <div class="wa-sr7-banner-overlay"></div>
      <div class="wa-sr7-banner-content">
        ${overlayHtml}
      </div>
    </div>
    <div class="bnr-preview-cta-bar">
      <span class="wa-btn-orange bnr-preview-cta-btn">${escapeHtml(ctaText)}</span>
      <span class="bnr-preview-cta-url">🔗 Destino: <code>${escapeHtml(ctaLink)}</code></span>
    </div>
  `;
}

function openBannerModal(banner = null) {
  if (!bannerForm || !bannerModal) return;
  bannerForm.reset();
  const titleEl = document.getElementById('banner-modal-title');
  const idInput = document.getElementById('bnr-id');
  const layoutSelect = document.getElementById('bnr-layout');
  const splitGroup = document.getElementById('bnr-split-right-group');

  if (banner) {
    titleEl.textContent = `Editar Propaganda: ${banner.title}`;
    idInput.value = banner.id;
    layoutSelect.value = banner.layout || 'split';
    document.getElementById('bnr-badge').value = banner.badge || '';
    document.getElementById('bnr-title').value = banner.title || '';
    document.getElementById('bnr-highlight').value = banner.highlight || '';
    document.getElementById('bnr-title-right').value = banner.titleRight || '';
    document.getElementById('bnr-highlight-right').value = banner.highlightRight || '';
    document.getElementById('bnr-subtitle').value = banner.subtitle || '';
    document.getElementById('bnr-cta-text').value = banner.ctaText || '';
    document.getElementById('bnr-cta-link').value = banner.ctaLink || 'catalogo.html';
    document.getElementById('bnr-active').checked = banner.active !== false;
    const posterImg = banner.posterImage || banner.poster || '';
    const videoSrc = banner.videoUrl || banner.video || '';
    document.getElementById('bnr-poster-url').value = posterImg;
    document.getElementById('bnr-video-url').value = videoSrc;
    updateBannerPosterPreview(posterImg);
    updateBannerVideoPreview(videoSrc, posterImg);
    renderBannerProductsPicker(Array.isArray(banner.productIds) ? banner.productIds : []);
  } else {
    titleEl.textContent = 'Nueva Propaganda / Banner (<sr7-poster>)';
    idInput.value = '';
    layoutSelect.value = 'split';
    document.getElementById('bnr-badge').value = 'FÁBRICA DIRECTA • GAM CHILE';
    document.getElementById('bnr-title').value = 'EL MEJOR';
    document.getElementById('bnr-highlight').value = 'ALIADO';
    document.getElementById('bnr-title-right').value = 'PARA TU';
    document.getElementById('bnr-highlight-right').value = 'EQUIPO';
    document.getElementById('bnr-cta-text').value = 'EXPLORAR CATÁLOGO';
    document.getElementById('bnr-cta-link').value = 'catalogo.html';
    document.getElementById('bnr-active').checked = true;
    document.getElementById('bnr-poster-url').value = 'uploads/promo-banner-aliado.jpg';
    document.getElementById('bnr-video-url').value = 'uploads/promo-gam-chile.webm';
    updateBannerPosterPreview('uploads/promo-banner-aliado.jpg');
    updateBannerVideoPreview('uploads/promo-gam-chile.webm', 'uploads/promo-banner-aliado.jpg');
    renderBannerProductsPicker([]);
  }

  syncBannerFieldsByLayout();
  updateBannerLivePreview();
  bannerModal.showModal();
}

async function handleBannerSave(e) {
  e.preventDefault();
  syncBannerFieldsByLayout();
  if (!bannerForm.checkValidity()) {
    bannerForm.reportValidity();
    return;
  }

  const id = document.getElementById('bnr-id').value.trim();
  const layoutVal = document.getElementById('bnr-layout').value;
  const rawTitle = document.getElementById('bnr-title').value.trim();
  const posterVal = document.getElementById('bnr-poster-url').value.trim() || 'uploads/promo-banner-aliado.jpg';
  const videoVal = document.getElementById('bnr-video-url').value.trim();
  const selectedProductIds = getSelectedBannerProductIds();

  if (layoutVal === 'showcase' && selectedProductIds.length === 0) {
    alert('Selecciona al menos 1 producto activo para mostrar en la Vitrina.');
    return;
  }

  const payload = {
    layout: layoutVal,
    badge: document.getElementById('bnr-badge').value.trim(),
    title: rawTitle || (layoutVal === 'clean' ? 'Propaganda Limpia (Poster / Video)' : 'Propaganda GAM Chile'),
    highlight: document.getElementById('bnr-highlight').value.trim(),
    titleRight: document.getElementById('bnr-title-right').value.trim(),
    highlightRight: document.getElementById('bnr-highlight-right').value.trim(),
    subtitle: document.getElementById('bnr-subtitle').value.trim(),
    ctaText: document.getElementById('bnr-cta-text').value.trim(),
    ctaLink: document.getElementById('bnr-cta-link').value.trim() || 'catalogo.html',
    active: document.getElementById('bnr-active').checked,
    productIds: selectedProductIds,
    posterImage: posterVal,
    videoUrl: videoVal,
  };

  const saveBtn = document.getElementById('bnr-save-btn');
  saveBtn.disabled = true;

  try {
    if (id) {
      await updateBanner(id, payload);
      showFeedback(`Propaganda "${payload.title}" actualizada.`);
    } else {
      await createBanner(payload);
      showFeedback(`Propaganda "${payload.title}" agregada al carrusel.`);
    }
    bannerModal.close();
    await loadBannersData();
  } catch (err) {
    alert(err.message || 'Error al guardar la propaganda.');
  } finally {
    saveBtn.disabled = false;
  }
}

async function handleBannerDelete(banner) {
  const confirmed = confirm(
    `¿Seguro que deseas eliminar la propaganda "${banner.title} ${banner.highlight || ''}" del carrusel?`
  );
  if (!confirmed) return;

  try {
    await deleteBanner(banner.id);
    showFeedback(`Propaganda "${banner.title}" eliminada.`);
    await loadBannersData();
  } catch (err) {
    alert(err.message || 'No se pudo eliminar la propaganda.');
  }
}

// ==========================================================
// MANTENEDOR DE TEXTOS PRINCIPALES DE LA WEB Y BANNERS DE CATÁLOGO
// ==========================================================
const CATALOG_BANNER_LABELS = {
  all: 'Catálogo General (Todas las Divisiones)',
  corporativa: 'División Corporativa',
  fire: 'División Fire',
  seven: 'División Seven',
  accesorios: 'División Accesorios',
};

async function loadSiteContentData() {
  try {
    const loaded = await fetchSiteContent();
    siteContentDraft = JSON.parse(JSON.stringify(loaded));
    populateSiteContentForm();
  } catch (err) {
    showFeedback(err.message || 'No se pudieron cargar los textos de la web.', 'error');
  }
}

function syncLayoutModeUI(mode) {
  const normalized = mode === 'onepage' ? 'onepage' : 'multipage';
  siteContentDraft.siteLayoutMode = normalized;

  document.querySelectorAll('[data-quick-layout]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-quick-layout') === normalized);
  });

  const publicHomeLink = document.getElementById('admin-public-home-link');
  if (publicHomeLink) {
    publicHomeLink.href = normalized === 'onepage' ? 'onepage.html' : 'index.html';
    publicHomeLink.textContent =
      normalized === 'onepage' ? 'Ver Sitio (One-Page) ↗' : 'Ver Sitio (Multi-Page) ↗';
  }
}

function populateSiteContentForm() {
  const contact = siteContentDraft.contact || DEFAULT_SITE_CONTENT.contact;
  const intro = siteContentDraft.intro || DEFAULT_SITE_CONTENT.intro;
  const emp = siteContentDraft.empresa || DEFAULT_SITE_CONTENT.empresa;

  syncLayoutModeUI(siteContentDraft.siteLayoutMode || 'multipage');

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  setVal('cnt-contact-wa-number', contact.whatsappNumber);
  setVal('cnt-contact-wa-url', contact.whatsappUrl);
  setVal('cnt-contact-fb-name', contact.facebookName);
  setVal('cnt-contact-fb-url', contact.facebookUrl);
  setVal('cnt-contact-ig-handle', contact.instagramHandle);
  setVal('cnt-contact-ig-url', contact.instagramUrl);
  setVal('cnt-contact-email', contact.email);

  setVal('cnt-intro-title-main', intro.titleMain);
  setVal('cnt-intro-title-highlight', intro.titleHighlight);
  setVal('cnt-intro-paragraph', intro.paragraph);

  setVal('cnt-emp-title-main', emp.titleMain);
  setVal('cnt-emp-title-highlight', emp.titleHighlight);
  setVal('cnt-emp-p1', emp.paragraph1);
  setVal('cnt-emp-p2', emp.paragraph2);
  setVal('cnt-emp-p3', emp.paragraph3);
  setVal('cnt-emp-motto', emp.motto);
  setVal('cnt-emp-mision-title', emp.misionTitle);
  setVal('cnt-emp-mision-text', emp.misionText);
  setVal('cnt-emp-vision-title', emp.visionTitle);
  setVal('cnt-emp-vision-text', emp.visionText);

  populateCatalogBannerFields(activeCatBannerKey);
}

function saveCurrentCatalogBannerFieldsToDraft() {
  if (!siteContentDraft.catalogBanners) {
    siteContentDraft.catalogBanners = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT.catalogBanners));
  }
  const current = siteContentDraft.catalogBanners[activeCatBannerKey] || {};
  const badge = document.getElementById('cnt-cat-badge')?.value.trim() || '';
  const titleMain = document.getElementById('cnt-cat-title-main')?.value.trim() || '';
  const titleHighlight = document.getElementById('cnt-cat-title-highlight')?.value.trim() || '';
  const desc = document.getElementById('cnt-cat-desc')?.value.trim() || '';
  const cardDesc = document.getElementById('cnt-cat-card-desc')?.value.trim() || '';
  const pillsRaw = document.getElementById('cnt-cat-pills')?.value || '';
  const bgImage = document.getElementById('cnt-cat-bg-url')?.value.trim() || '';

  const pills = pillsRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  siteContentDraft.catalogBanners[activeCatBannerKey] = {
    ...current,
    badge,
    titleMain,
    titleHighlight,
    desc,
    cardDesc: activeCatBannerKey === 'all' ? current.cardDesc || '' : cardDesc,
    pills,
    bgImage,
  };
}

function populateCatalogBannerFields(key) {
  activeCatBannerKey = key;
  const banner =
    siteContentDraft.catalogBanners?.[key] ||
    DEFAULT_SITE_CONTENT.catalogBanners[key] ||
    DEFAULT_SITE_CONTENT.catalogBanners.all;

  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val ?? '';
  };

  setVal('cnt-cat-badge', banner.badge);
  setVal('cnt-cat-title-main', banner.titleMain);
  setVal('cnt-cat-title-highlight', banner.titleHighlight);
  setVal('cnt-cat-desc', banner.desc);
  setVal('cnt-cat-card-desc', banner.cardDesc || banner.desc || '');
  setVal('cnt-cat-pills', Array.isArray(banner.pills) ? banner.pills.join(', ') : '');
  setVal('cnt-cat-bg-url', banner.bgImage || '');

  const cardDescGroup = document.getElementById('cnt-cat-card-desc-group');
  if (cardDescGroup) {
    cardDescGroup.hidden = key === 'all';
  }

  const labelEl = document.getElementById('cnt-cat-preview-label');
  if (labelEl) {
    labelEl.textContent = CATALOG_BANNER_LABELS[key] || key;
  }

  document.querySelectorAll('#cnt-catalog-banner-tabs [data-cat-banner-tab]').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-cat-banner-tab') === key);
  });

  updateCatalogBannerBgPreview(banner.bgImage || '');
  updateCatalogBannerLivePreview();
}

function updateCatalogBannerBgPreview(url) {
  const preview = document.getElementById('cnt-cat-bg-preview');
  if (!preview) return;
  if (!url) {
    preview.style.backgroundImage = 'none';
    preview.textContent = 'Sin fondo';
  } else {
    preview.style.backgroundImage = `url('${resolveImg(url)}')`;
    preview.textContent = '';
  }
}

function updateCatalogBannerLivePreview() {
  const stage = document.getElementById('cnt-cat-live-preview');
  if (!stage) return;

  const badge = document.getElementById('cnt-cat-badge')?.value.trim() || '';
  const titleMain = document.getElementById('cnt-cat-title-main')?.value.trim() || '';
  const titleHighlight = document.getElementById('cnt-cat-title-highlight')?.value.trim() || '';
  const desc = document.getElementById('cnt-cat-desc')?.value.trim() || '';
  const pillsRaw = document.getElementById('cnt-cat-pills')?.value || '';
  const bgUrl = document.getElementById('cnt-cat-bg-url')?.value.trim() || '/hero-banner.jpg';

  const pills = pillsRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  stage.innerHTML = `
    <div class="division-hero cnt-cat-hero-preview" data-theme="${escapeAttr(activeCatBannerKey)}">
      <div class="division-hero-bg" style="background-image: url('${escapeAttr(resolveImg(bgUrl))}');"></div>
      <div class="division-hero-overlay"></div>
      <div class="division-hero-content" style="position: relative; z-index: 2; padding: 1.4rem 1.6rem;">
        <span class="division-hero-badge">${escapeHtml(badge)}</span>
        <h2 class="division-hero-title" style="font-size: 1.55rem; margin: 0.35rem 0;">
          ${escapeHtml(titleMain)} <span>${escapeHtml(titleHighlight)}</span>
        </h2>
        <p class="division-hero-desc" style="font-size: 0.9rem; margin-bottom: 0.75rem;">${escapeHtml(desc)}</p>
        <div class="division-hero-pills">
          ${pills.map((p) => `<span class="division-pill">${escapeHtml(p)}</span>`).join('')}
        </div>
      </div>
    </div>
  `;
}

function setupSiteContentEditor() {
  const form = document.getElementById('site-content-form');
  const tabsWrap = document.getElementById('cnt-catalog-banner-tabs');
  const bgFile = document.getElementById('cnt-cat-bg-file');
  const bgUrl = document.getElementById('cnt-cat-bg-url');
  const resetBtn = document.getElementById('btn-reset-site-content');

  async function persistSiteLayoutModeChange(nextMode) {
    const normalized = nextMode === 'onepage' ? 'onepage' : 'multipage';
    syncLayoutModeUI(normalized);
    saveCurrentCatalogBannerFieldsToDraft();
    try {
      const saved = await updateSiteContent({
        ...siteContentDraft,
        siteLayoutMode: normalized,
      });
      siteContentDraft = JSON.parse(JSON.stringify(saved));
      syncLayoutModeUI(siteContentDraft.siteLayoutMode);
      showFeedback(
        normalized === 'onepage'
          ? '📜 Formato público cambiado a ONE-PAGE (Una Sola Página) para todos los visitantes.'
          : '📄 Formato público cambiado a MULTI-PAGE (Páginas separadas) para todos los visitantes.'
      );
    } catch (err) {
      alert(err.message || 'No se pudo cambiar el formato de visualización.');
    }
  }

  document.querySelectorAll('[data-quick-layout]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextMode = btn.getAttribute('data-quick-layout') || 'multipage';
      if (nextMode === siteContentDraft.siteLayoutMode) return;
      persistSiteLayoutModeChange(nextMode);
    });
  });

  tabsWrap?.querySelectorAll('[data-cat-banner-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      saveCurrentCatalogBannerFieldsToDraft();
      const nextKey = btn.getAttribute('data-cat-banner-tab') || 'all';
      populateCatalogBannerFields(nextKey);
    });
  });

  [
    'cnt-cat-badge',
    'cnt-cat-title-main',
    'cnt-cat-title-highlight',
    'cnt-cat-desc',
    'cnt-cat-card-desc',
    'cnt-cat-pills',
  ].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', () => {
      saveCurrentCatalogBannerFieldsToDraft();
      updateCatalogBannerLivePreview();
    });
  });

  bgFile?.addEventListener('change', async () => {
    const file = bgFile.files?.[0];
    if (!file) return;
    try {
      const compressedDataUrl = await compressImageFile(file, 1600, 0.86);
      const uploadedUrl = await uploadProductImage(compressedDataUrl);
      if (bgUrl) bgUrl.value = uploadedUrl;
      updateCatalogBannerBgPreview(uploadedUrl);
      saveCurrentCatalogBannerFieldsToDraft();
      updateCatalogBannerLivePreview();
      showFeedback('Imagen de fondo del banner subida correctamente.');
    } catch (err) {
      alert(err.message || 'No se pudo procesar la imagen.');
    } finally {
      bgFile.value = '';
    }
  });

  bgUrl?.addEventListener('input', () => {
    const val = bgUrl.value.trim();
    updateCatalogBannerBgPreview(val);
    saveCurrentCatalogBannerFieldsToDraft();
    updateCatalogBannerLivePreview();
  });

  resetBtn?.addEventListener('click', async () => {
    const ok = confirm(
      '¿Deseas restaurar todos los textos principales y banners de catálogos a sus valores originales por defecto?'
    );
    if (!ok) return;
    siteContentDraft = JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT));
    populateSiteContentForm();
    try {
      await updateSiteContent(siteContentDraft);
      showFeedback('Textos y banners restaurados a los valores originales.');
    } catch (err) {
      alert(err.message || 'Error al restaurar los textos.');
    }
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    saveCurrentCatalogBannerFieldsToDraft();

    const payload = {
      siteLayoutMode: siteContentDraft.siteLayoutMode || 'multipage',
      contact: {
        whatsappNumber: document.getElementById('cnt-contact-wa-number')?.value.trim() || '',
        whatsappUrl: document.getElementById('cnt-contact-wa-url')?.value.trim() || '',
        facebookName: document.getElementById('cnt-contact-fb-name')?.value.trim() || '',
        facebookUrl: document.getElementById('cnt-contact-fb-url')?.value.trim() || '',
        instagramHandle: document.getElementById('cnt-contact-ig-handle')?.value.trim() || '',
        instagramUrl: document.getElementById('cnt-contact-ig-url')?.value.trim() || '',
        email: document.getElementById('cnt-contact-email')?.value.trim() || '',
      },
      intro: {
        titleMain: document.getElementById('cnt-intro-title-main')?.value.trim() || '',
        titleHighlight: document.getElementById('cnt-intro-title-highlight')?.value.trim() || '',
        paragraph: document.getElementById('cnt-intro-paragraph')?.value.trim() || '',
      },
      empresa: {
        titleMain: document.getElementById('cnt-emp-title-main')?.value.trim() || '',
        titleHighlight: document.getElementById('cnt-emp-title-highlight')?.value.trim() || '',
        paragraph1: document.getElementById('cnt-emp-p1')?.value.trim() || '',
        paragraph2: document.getElementById('cnt-emp-p2')?.value.trim() || '',
        paragraph3: document.getElementById('cnt-emp-p3')?.value.trim() || '',
        motto: document.getElementById('cnt-emp-motto')?.value.trim() || '',
        misionTitle: document.getElementById('cnt-emp-mision-title')?.value.trim() || '',
        misionText: document.getElementById('cnt-emp-mision-text')?.value.trim() || '',
        visionTitle: document.getElementById('cnt-emp-vision-title')?.value.trim() || '',
        visionText: document.getElementById('cnt-emp-vision-text')?.value.trim() || '',
      },
      catalogBanners: siteContentDraft.catalogBanners,
    };

    const topBtn = document.getElementById('btn-save-site-content-top');
    const bottomBtn = document.getElementById('btn-save-site-content-bottom');
    if (topBtn) topBtn.disabled = true;
    if (bottomBtn) bottomBtn.disabled = true;

    try {
      const saved = await updateSiteContent(payload);
      siteContentDraft = JSON.parse(JSON.stringify(saved));
      showFeedback('✅ Textos principales y banners de catálogos guardados y publicados en la web.');
    } catch (err) {
      alert(err.message || 'Error al guardar los contenidos de la web.');
    } finally {
      if (topBtn) topBtn.disabled = false;
      if (bottomBtn) bottomBtn.disabled = false;
    }
  });
}

// ==========================================================
// MANTENEDOR DE USUARIOS Y PERFILES DE ACCESO
// ==========================================================
async function loadUsersData() {
  const perms = getUserPermissions(currentUser);
  if (!perms.includes('users')) return;
  try {
    allUsers = await fetchUsers();
    renderUsersTable();
  } catch (err) {
    showFeedback(err.message || 'No se pudieron cargar los usuarios.', 'error');
  }
}

function renderUsersTable() {
  const tbody = document.getElementById('admin-users-tbody');
  if (!tbody) return;
  tbody.replaceChildren();

  const PERM_DEFINITIONS = {
    catalog: { label: '📦 Catálogo', class: 'perm-catalog' },
    banners: { label: '🎬 Propaganda', class: 'perm-banners' },
    content: { label: '📝 Textos Web', class: 'perm-content' },
    users: { label: '👥 Usuarios', class: 'perm-users' },
  };

  allUsers.forEach((u) => {
    const tr = document.createElement('tr');
    let permissionsHtml = '';

    if (u.role === 'admin') {
      permissionsHtml = '<span class="perm-pill perm-admin">🛡️ Administrador (Acceso Total)</span>';
    } else {
      const uPerms = Array.isArray(u.permissions) && u.permissions.length > 0 ? u.permissions : ['catalog'];
      permissionsHtml = `
        <div class="perm-badges-list">
          ${uPerms
            .map((p) => {
              const def = PERM_DEFINITIONS[p] || { label: p, class: '' };
              return `<span class="perm-pill ${def.class}">${escapeHtml(def.label)}</span>`;
            })
            .join('')}
        </div>
      `;
    }

    const statusBadge =
      u.active !== false
        ? '<span class="status-pill active">Activo</span>'
        : '<span class="status-pill inactive">Bloqueado</span>';

    const isSelf = u.id === currentUser?.id;

    tr.innerHTML = `
      <td><strong>${escapeHtml(u.username)}</strong> ${isSelf ? '<span class="badge-mini badge-green">Tú</span>' : ''}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${permissionsHtml}</td>
      <td>${statusBadge}</td>
      <td>
        <div class="admin-row-actions">
          <button type="button" class="btn-action edit" data-edit-usr="${escapeAttr(u.id)}">Editar / Clave</button>
          ${
            !isSelf
              ? `<button type="button" class="btn-action delete" data-del-usr="${escapeAttr(u.id)}">Eliminar</button>`
              : ''
          }
        </div>
      </td>
    `;

    tr.querySelector('[data-edit-usr]')?.addEventListener('click', () => openUserModal(u));
    tr.querySelector('[data-del-usr]')?.addEventListener('click', () => handleUserDelete(u));

    tbody.appendChild(tr);
  });
}

function setupUserAccountTypeHandlers() {
  const radioAdmin = document.getElementById('usr-type-admin');
  const radioCustom = document.getElementById('usr-type-custom');
  const permCheckboxes = document.querySelectorAll('input[name="usr-perm"]');
  const hintEl = document.getElementById('usr-perm-hint');

  function updatePermUI() {
    const isAdmin = radioAdmin?.checked;
    permCheckboxes.forEach((cb) => {
      if (isAdmin) {
        cb.checked = true;
        cb.disabled = true;
        cb.closest('.perm-checkbox-item')?.classList.add('disabled');
      } else {
        cb.disabled = false;
        cb.closest('.perm-checkbox-item')?.classList.remove('disabled');
      }
    });
    if (hintEl) {
      hintEl.hidden = !isAdmin;
    }
  }

  radioAdmin?.addEventListener('change', updatePermUI);
  radioCustom?.addEventListener('change', updatePermUI);
}

function openUserModal(user = null) {
  userForm.reset();
  const titleEl = document.getElementById('user-modal-title');
  const idInput = document.getElementById('usr-id');
  const usernameInput = document.getElementById('usr-username');
  const pwdInput = document.getElementById('usr-password');
  const pwdLabel = document.getElementById('usr-password-label');
  const radioAdmin = document.getElementById('usr-type-admin');
  const radioCustom = document.getElementById('usr-type-custom');
  const permCheckboxes = document.querySelectorAll('input[name="usr-perm"]');
  const hintEl = document.getElementById('usr-perm-hint');

  if (user) {
    titleEl.textContent = `Editar Usuario: ${user.username}`;
    idInput.value = user.id;
    usernameInput.value = user.username;
    usernameInput.disabled = true;
    document.getElementById('usr-name').value = user.name || '';
    document.getElementById('usr-email').value = user.email || '';
    document.getElementById('usr-active').checked = user.active !== false;
    pwdInput.required = false;
    pwdInput.placeholder = 'Dejar en blanco para mantener la actual';
    pwdLabel.textContent = 'Nueva Contraseña (opcional, mín. 8 caracteres)';

    const isAdmin = user.role === 'admin';
    if (isAdmin) {
      if (radioAdmin) radioAdmin.checked = true;
      permCheckboxes.forEach((cb) => {
        cb.checked = true;
        cb.disabled = true;
        cb.closest('.perm-checkbox-item')?.classList.add('disabled');
      });
      if (hintEl) hintEl.hidden = false;
    } else {
      if (radioCustom) radioCustom.checked = true;
      const userPerms = Array.isArray(user.permissions) && user.permissions.length > 0 ? user.permissions : ['catalog'];
      permCheckboxes.forEach((cb) => {
        cb.disabled = false;
        cb.closest('.perm-checkbox-item')?.classList.remove('disabled');
        cb.checked = userPerms.includes(cb.value);
      });
      if (hintEl) hintEl.hidden = true;
    }
  } else {
    titleEl.textContent = 'Crear Nuevo Usuario';
    idInput.value = '';
    usernameInput.disabled = false;
    if (radioCustom) radioCustom.checked = true;
    permCheckboxes.forEach((cb) => {
      cb.disabled = false;
      cb.closest('.perm-checkbox-item')?.classList.remove('disabled');
      cb.checked = cb.value === 'catalog'; // por defecto catálogo seleccionado
    });
    if (hintEl) hintEl.hidden = true;
    document.getElementById('usr-active').checked = true;
    pwdInput.required = true;
    pwdInput.placeholder = 'Mínimo 8 caracteres';
    pwdLabel.textContent = 'Contraseña (mín. 8 caracteres) *';
  }

  userModal.showModal();
}

async function handleUserSave(e) {
  e.preventDefault();
  if (!userForm.checkValidity()) {
    userForm.reportValidity();
    return;
  }

  const id = document.getElementById('usr-id').value.trim();
  const isAdmin = document.getElementById('usr-type-admin')?.checked;
  let permissions = [];

  if (isAdmin) {
    permissions = ['catalog', 'banners', 'content', 'users'];
  } else {
    permissions = Array.from(document.querySelectorAll('input[name="usr-perm"]:checked')).map((cb) => cb.value);
    if (permissions.length === 0) {
      alert('Debes seleccionar al menos 1 perfil de acceso (Catálogo, Propaganda, Textos Web o Usuarios) para este usuario.');
      return;
    }
  }

  const payload = {
    username: document.getElementById('usr-username').value.trim(),
    name: document.getElementById('usr-name').value.trim(),
    email: document.getElementById('usr-email').value.trim(),
    role: isAdmin ? 'admin' : 'custom',
    permissions,
    active: document.getElementById('usr-active').checked,
  };

  const pwd = document.getElementById('usr-password').value;
  if (pwd) {
    payload.password = pwd;
  }

  try {
    if (id) {
      await updateUser(id, payload);
      showFeedback(`Usuario "${payload.username}" actualizado.`);
    } else {
      await createUser(payload);
      showFeedback(`Usuario "${payload.username}" creado exitosamente.`);
    }
    userModal.close();
    await loadUsersData();
  } catch (err) {
    alert(err.message || 'Error al guardar el usuario.');
  }
}

async function handleUserDelete(user) {
  const confirmed = confirm(`¿Seguro que deseas eliminar al usuario "${user.username}" (${user.name})?`);
  if (!confirmed) return;

  try {
    await deleteUser(user.id);
    showFeedback(`Usuario "${user.username}" eliminado.`);
    await loadUsersData();
  } catch (err) {
    alert(err.message || 'No se pudo eliminar el usuario.');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/'/g, '&#39;');
}
