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
  fetchUsers,
  createUser,
  updateUser,
  deleteUser,
} from './services/api.js';
import {
  KIDS_SIZES,
  ADULT_SIZES,
  getCategoryLabel,
  formatCLP,
} from './data/defaultCatalog.js';

let currentUser = null;
let allProducts = [];
let allUsers = [];

const loginView = document.getElementById('admin-login-view');
const dashboardView = document.getElementById('admin-dashboard-view');
const loginForm = document.getElementById('admin-login-form');
const loginAlert = document.getElementById('login-alert');
const userBadge = document.getElementById('admin-user-badge');
const logoutBtn = document.getElementById('admin-logout-btn');
const feedbackBanner = document.getElementById('dashboard-feedback');

const tabBtnCatalog = document.getElementById('tab-btn-catalog');
const tabBtnUsers = document.getElementById('tab-btn-users');
const tabPanelCatalog = document.getElementById('tab-panel-catalog');
const tabPanelUsers = document.getElementById('tab-panel-users');

const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const userModal = document.getElementById('user-modal');
const userForm = document.getElementById('user-form');

initAdminApp();

async function initAdminApp() {
  setupPasswordToggle();
  setupTabs();
  setupModalClosers();
  renderSizeCheckboxes();
  setupSizePresetButtons();
  setupImageUploader();

  loginForm?.addEventListener('submit', handleLoginSubmit);
  logoutBtn?.addEventListener('click', handleLogout);

  document.getElementById('btn-new-product')?.addEventListener('click', () => openProductModal());
  document.getElementById('admin-product-search')?.addEventListener('input', renderProductsTable);
  productForm?.addEventListener('submit', handleProductSave);

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

async function enterDashboard(user) {
  currentUser = user;
  loginView.hidden = true;
  dashboardView.hidden = false;

  const roleName = user.role === 'admin' ? 'Administrador' : 'Catálogo';
  userBadge.textContent = `👤 ${user.name} (${roleName})`;
  userBadge.hidden = false;
  logoutBtn.hidden = false;

  // Control de acceso basado en rol (RBAC)
  const isAdmin = user.role === 'admin';
  tabBtnUsers.hidden = !isAdmin;
  if (!isAdmin) {
    switchTab('catalog');
  }

  await loadCatalogData();
  if (isAdmin) {
    await loadUsersData();
  }
}

function setupTabs() {
  const tabs = [tabBtnCatalog, tabBtnUsers];
  tabs.forEach((btn) => {
    btn?.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      if (target === 'users' && currentUser?.role !== 'admin') return;
      switchTab(target);
    });
  });
}

function switchTab(tabName) {
  const isCatalog = tabName === 'catalog';
  tabBtnCatalog.classList.toggle('active', isCatalog);
  tabBtnCatalog.setAttribute('aria-selected', String(isCatalog));
  tabBtnUsers.classList.toggle('active', !isCatalog);
  tabBtnUsers.setAttribute('aria-selected', String(!isCatalog));

  tabPanelCatalog.hidden = !isCatalog;
  tabPanelUsers.hidden = isCatalog;
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
  renderProductsTable();
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

function renderProductsTable() {
  const tbody = document.getElementById('admin-products-tbody');
  const countEl = document.getElementById('admin-product-count');
  const query = (document.getElementById('admin-product-search')?.value || '').trim().toLowerCase();

  const filtered = allProducts.filter((p) => {
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      getCategoryLabel(p.category).toLowerCase().includes(query) ||
      (p.description || '').toLowerCase().includes(query)
    );
  });

  if (countEl) countEl.textContent = String(allProducts.length);
  tbody.replaceChildren();

  if (filtered.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="7" class="text-center" style="padding: 2rem; color: #666;">No se encontraron productos.</td>`;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach((p) => {
    const tr = document.createElement('tr');
    if (p.active === false) tr.classList.add('row-inactive');

    const normalStr = formatCLP(p.normalPrice) || '—';
    const offerStr = formatCLP(p.offerPrice) || '—';
    const priceVisibility = p.showPrice
      ? '<span class="badge-mini badge-green">Público</span>'
      : '<span class="badge-mini badge-gray">Solo cotización</span>';

    const colorsStr =
      Array.isArray(p.colors) && p.colors.length > 0 ? p.colors.join(', ') : '<span class="muted">Sin especificar</span>';
    const sizesStr =
      Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes.join(', ') : '<span class="muted">Talla única / N/A</span>';

    const statusBadges = [
      p.active !== false
        ? '<span class="status-pill active">Activo</span>'
        : '<span class="status-pill inactive">Oculto</span>',
      p.featured ? '<span class="status-pill featured">⭐ Destacado</span>' : '',
    ]
      .filter(Boolean)
      .join(' ');

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
      <td><span class="category">${escapeHtml(getCategoryLabel(p.category))}</span></td>
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
      <td><div class="status-stack">${statusBadges}</div></td>
      <td>
        <div class="admin-row-actions">
          <button type="button" class="btn-action edit" data-edit-prod="${escapeAttr(p.id)}">Editar</button>
          <button type="button" class="btn-action delete" data-del-prod="${escapeAttr(p.id)}">Eliminar</button>
        </div>
      </td>
    `;

    tr.querySelector('[data-edit-prod]')?.addEventListener('click', () => openProductModal(p));
    tr.querySelector('[data-del-prod]')?.addEventListener('click', () => handleProductDelete(p));

    tbody.appendChild(tr);
  });
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
    document.getElementById('prod-category').value = product.category || 'proteccion';
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
    document.getElementById('prod-min-qty').value = '1';
    document.getElementById('prod-show-price').checked = true;
    document.getElementById('prod-featured').checked = false;
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
// MANTENEDOR DE USUARIOS (SOLO PERFIL ADMIN)
// ==========================================================
async function loadUsersData() {
  if (currentUser?.role !== 'admin') return;
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

  allUsers.forEach((u) => {
    const tr = document.createElement('tr');
    const roleBadge =
      u.role === 'admin'
        ? '<span class="role-badge admin">🛡️ Administrador (Total)</span>'
        : '<span class="role-badge catalogo">📦 Catálogo (Solo productos)</span>';

    const statusBadge =
      u.active !== false
        ? '<span class="status-pill active">Activo</span>'
        : '<span class="status-pill inactive">Bloqueado</span>';

    const isSelf = u.id === currentUser?.id;

    tr.innerHTML = `
      <td><strong>${escapeHtml(u.username)}</strong> ${isSelf ? '<span class="badge-mini badge-green">Tú</span>' : ''}</td>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${roleBadge}</td>
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

function openUserModal(user = null) {
  userForm.reset();
  const titleEl = document.getElementById('user-modal-title');
  const idInput = document.getElementById('usr-id');
  const usernameInput = document.getElementById('usr-username');
  const pwdInput = document.getElementById('usr-password');
  const pwdLabel = document.getElementById('usr-password-label');

  if (user) {
    titleEl.textContent = `Editar Usuario: ${user.username}`;
    idInput.value = user.id;
    usernameInput.value = user.username;
    usernameInput.disabled = true;
    document.getElementById('usr-name').value = user.name || '';
    document.getElementById('usr-email').value = user.email || '';
    document.getElementById('usr-role').value = user.role || 'catalogo';
    document.getElementById('usr-active').checked = user.active !== false;
    pwdInput.required = false;
    pwdInput.placeholder = 'Dejar en blanco para mantener la actual';
    pwdLabel.textContent = 'Nueva Contraseña (opcional, mín. 8 caracteres)';
  } else {
    titleEl.textContent = 'Crear Nuevo Usuario';
    idInput.value = '';
    usernameInput.disabled = false;
    document.getElementById('usr-role').value = 'catalogo';
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
  const payload = {
    username: document.getElementById('usr-username').value.trim(),
    name: document.getElementById('usr-name').value.trim(),
    email: document.getElementById('usr-email').value.trim(),
    role: document.getElementById('usr-role').value,
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
