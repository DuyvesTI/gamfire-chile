// Servicio API con soporte para servidor real (Node/PHP) y respaldo cifrado local
// para pruebas estáticas sin servidor (p.ej. GitHub Pages / vista previa estática).
import { DEFAULT_PRODUCTS, DEFAULT_BANNERS, DEFAULT_SITE_CONTENT, normalizeCategoryId } from '../data/defaultCatalog.js';

const TOKEN_KEY = 'gamfire_auth_token';
const LOCAL_PRODUCTS_KEY = 'gamfire_catalog_products_v4';
const LOCAL_BANNERS_KEY = 'gamfire_carousel_banners_v1';
const LOCAL_CONTENT_KEY = 'gamfire_site_content_v1';
const LOCAL_USERS_KEY = 'gamfire_catalog_users_v1';

const RAW_BASE = import.meta.env?.BASE_URL || './';
const BASE_URL = RAW_BASE === './' || RAW_BASE === '.' ? '.' : RAW_BASE.replace(/\/$/, '');
const API_BASE = `${BASE_URL}/api`;

export function getAuthToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthToken(token) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
  }
}

async function sha256Hex(text) {
  const buf = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function ensureLocalUsers() {
  const raw = localStorage.getItem(LOCAL_USERS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      // continuar para regenerar
    }
  }
  const adminSalt = 'gf-salt-admin-2026';
  const catSalt = 'gf-salt-cat-2026';
  const initial = [
    {
      id: 'usr-admin-1',
      username: 'admin',
      name: 'Administrador General',
      email: 'admin@gamfire.cl',
      role: 'admin',
      permissions: ['catalog', 'banners', 'content', 'users'],
      salt: adminSalt,
      passwordHash: await sha256Hex(`${adminSalt}:Gamfire2026!`),
      active: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr-cat-1',
      username: 'catalogo',
      name: 'Encargado de Catálogo',
      email: 'catalogo@gamfire.cl',
      role: 'custom',
      permissions: ['catalog'],
      salt: catSalt,
      passwordHash: await sha256Hex(`${catSalt}:Catalogo2026!`),
      active: true,
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(initial));
  return initial;
}

function getLocalProducts() {
  const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((p) => ({
          ...p,
          category: normalizeCategoryId(p.category),
        }));
      }
    } catch {
      // ignore
    }
  }
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(DEFAULT_PRODUCTS));
  return [...DEFAULT_PRODUCTS];
}

function saveLocalProducts(list) {
  localStorage.setItem(LOCAL_PRODUCTS_KEY, JSON.stringify(list));
}

export function getCachedActiveProducts() {
  const raw = localStorage.getItem(LOCAL_PRODUCTS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter((p) => p.active !== false)
      .map((p) => ({
        ...p,
        category: normalizeCategoryId(p.category),
      }));
  } catch {
    return null;
  }
}

function getLocalBanners() {
  const raw = localStorage.getItem(LOCAL_BANNERS_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // ignore
    }
  }
  localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(DEFAULT_BANNERS));
  return [...DEFAULT_BANNERS];
}

function saveLocalBanners(list) {
  localStorage.setItem(LOCAL_BANNERS_KEY, JSON.stringify(list));
}

export function getCachedActiveBanners() {
  const raw = localStorage.getItem(LOCAL_BANNERS_KEY);
  if (!raw) return [...DEFAULT_BANNERS];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...DEFAULT_BANNERS];
    return parsed.filter((b) => b.active !== false);
  } catch {
    return [...DEFAULT_BANNERS];
  }
}

async function tryApiFetch(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('STATIC_HOST_FALLBACK');
  }

  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || `Error HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// ==========================================================
// AUTENTICACIÓN
// ==========================================================
export async function login(username, password) {
  try {
    const data = await tryApiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setAuthToken(data.token);
    return data.user;
  } catch (err) {
    if (err.message !== 'STATIC_HOST_FALLBACK' && err.name !== 'TypeError') {
      throw err;
    }
    // Respaldo criptográfico WebCrypto cuando se abre en un host puramente estático
    const users = await ensureLocalUsers();
    const id = String(username || '').trim().toLowerCase();
    const user = users.find(
      (u) =>
        u.active !== false &&
        (u.username.toLowerCase() === id || (u.email && u.email.toLowerCase() === id))
    );
    if (!user) throw new Error('Usuario o contraseña incorrectos.');
    const computed = await sha256Hex(`${user.salt}:${password}`);
    if (computed !== user.passwordHash) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    const localToken = btoa(
      JSON.stringify({ sub: user.id, role: user.role, exp: Date.now() + 8 * 3600 * 1000 })
    );
    setAuthToken(`local.${localToken}`);
    return {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}

export async function getCurrentUser() {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const data = await tryApiFetch('/auth/me');
    return data.user;
  } catch (err) {
    if (token.startsWith('local.')) {
      try {
        const payload = JSON.parse(atob(token.slice(6)));
        if (payload.exp < Date.now()) {
          setAuthToken('');
          return null;
        }
        const users = await ensureLocalUsers();
        const found = users.find((u) => u.id === payload.sub && u.active !== false);
        if (!found) return null;
        return {
          id: found.id,
          username: found.username,
          name: found.name,
          email: found.email,
          role: found.role,
          permissions: found.role === 'admin'
            ? ['catalog', 'banners', 'content', 'users']
            : (Array.isArray(found.permissions) && found.permissions.length > 0 ? found.permissions : ['catalog']),
        };
      } catch {
        setAuthToken('');
        return null;
      }
    }
    setAuthToken('');
    return null;
  }
}

export function logout() {
  setAuthToken('');
}

// ==========================================================
// CATÁLOGO DE PRODUCTOS
// ==========================================================
export async function fetchProducts({ includeInactive = false } = {}) {
  try {
    const query = includeInactive ? '?all=1' : '';
    const data = await tryApiFetch(`/products${query}`);
    if (Array.isArray(data.products)) {
      saveLocalProducts(data.products);
      return data.products;
    }
  } catch {
    // Fallback a almacenamiento local o catálogo por defecto
  }
  const local = getLocalProducts();
  return includeInactive ? local : local.filter((p) => p.active !== false);
}

export async function createProduct(productData) {
  try {
    const data = await tryApiFetch('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
    return data.product;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalProducts();
    const newProd = {
      ...productData,
      id: `prod-${Date.now().toString(36)}`,
      updatedAt: new Date().toISOString(),
    };
    list.push(newProd);
    saveLocalProducts(list);
    return newProd;
  }
}

export async function updateProduct(id, productData) {
  try {
    const data = await tryApiFetch(`/products/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
    return data.product;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalProducts();
    const idx = list.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Producto no encontrado.');
    const updated = { ...list[idx], ...productData, id, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    saveLocalProducts(list);
    return updated;
  }
}

export async function deleteProduct(id) {
  try {
    await tryApiFetch(`/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalProducts().filter((p) => p.id !== id);
    saveLocalProducts(list);
    return true;
  }
}

export async function uploadProductImage(dataUrl) {
  try {
    const data = await tryApiFetch('/upload', {
      method: 'POST',
      body: JSON.stringify({ dataUrl }),
    });
    return data.url;
  } catch (err) {
    if (err.status) throw err;
    // En modo estático devolvemos el dataUrl comprimido directamente
    return dataUrl;
  }
}

// ==========================================================
// BANNERS / PROPAGANDA DEL CARRUSEL PRINCIPAL
// ==========================================================
export async function fetchBanners({ includeInactive = false } = {}) {
  try {
    const query = includeInactive ? '?all=1' : '';
    const data = await tryApiFetch(`/banners${query}`);
    if (Array.isArray(data.banners)) {
      if (!includeInactive) {
        saveLocalBanners(data.banners);
      }
      return data.banners;
    }
  } catch {
    // Fallback a almacenamiento local o banners por defecto
  }
  const local = getLocalBanners();
  return includeInactive ? local : local.filter((b) => b.active !== false);
}

export async function createBanner(bannerData) {
  try {
    const data = await tryApiFetch('/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData),
    });
    return data.banner;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalBanners();
    const newBanner = {
      ...bannerData,
      id: `banner-${Date.now().toString(36)}`,
      updatedAt: new Date().toISOString(),
    };
    list.push(newBanner);
    saveLocalBanners(list);
    return newBanner;
  }
}

export async function updateBanner(id, bannerData) {
  try {
    const data = await tryApiFetch(`/banners/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(bannerData),
    });
    return data.banner;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalBanners();
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Banner no encontrado.');
    const updated = { ...list[idx], ...bannerData, id, updatedAt: new Date().toISOString() };
    list[idx] = updated;
    saveLocalBanners(list);
    return updated;
  }
}

export async function deleteBanner(id) {
  try {
    await tryApiFetch(`/banners/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    if (err.status) throw err;
    const list = getLocalBanners().filter((b) => b.id !== id);
    saveLocalBanners(list);
    return true;
  }
}

// ==========================================================
// TEXTOS PRINCIPALES DE LA WEB Y BANNERS DE CATÁLOGO
// ==========================================================
function mergeSiteContentWithDefaults(raw = {}) {
  const siteLayoutMode = raw?.siteLayoutMode === 'onepage' ? 'onepage' : 'multipage';
  const contact = {
    ...DEFAULT_SITE_CONTENT.contact,
    ...(raw?.contact || {}),
  };
  const intro = {
    ...DEFAULT_SITE_CONTENT.intro,
    ...(raw?.intro || {}),
  };
  const empresa = {
    ...DEFAULT_SITE_CONTENT.empresa,
    ...(raw?.empresa || {}),
  };
  const catalogBanners = {};
  ['all', 'corporativa', 'fire', 'seven', 'accesorios'].forEach((key) => {
    const def = DEFAULT_SITE_CONTENT.catalogBanners[key];
    const src = raw?.catalogBanners?.[key] || {};
    const pills = Array.isArray(src.pills)
      ? src.pills
      : typeof src.pills === 'string'
        ? src.pills.split(',').map((s) => s.trim()).filter(Boolean)
        : [...def.pills];
    catalogBanners[key] = {
      ...def,
      ...src,
      pills,
    };
  });
  return { siteLayoutMode, contact, intro, empresa, catalogBanners };
}

export function getCachedSiteContent() {
  const raw = localStorage.getItem(LOCAL_CONTENT_KEY);
  if (!raw) return mergeSiteContentWithDefaults(DEFAULT_SITE_CONTENT);
  try {
    return mergeSiteContentWithDefaults(JSON.parse(raw));
  } catch {
    return mergeSiteContentWithDefaults(DEFAULT_SITE_CONTENT);
  }
}

function saveLocalSiteContent(content) {
  localStorage.setItem(LOCAL_CONTENT_KEY, JSON.stringify(content));
}

export async function fetchSiteContent() {
  try {
    const data = await tryApiFetch('/content');
    if (data && data.content && typeof data.content === 'object') {
      const merged = mergeSiteContentWithDefaults(data.content);
      saveLocalSiteContent(merged);
      return merged;
    }
  } catch {
    // Fallback a almacenamiento local o textos por defecto
  }
  return getCachedSiteContent();
}

export async function updateSiteContent(contentData) {
  const mergedPayload = mergeSiteContentWithDefaults(contentData);
  try {
    const data = await tryApiFetch('/content', {
      method: 'PUT',
      body: JSON.stringify(mergedPayload),
    });
    const saved = mergeSiteContentWithDefaults(data.content || mergedPayload);
    saveLocalSiteContent(saved);
    return saved;
  } catch (err) {
    if (err.status) throw err;
    saveLocalSiteContent(mergedPayload);
    return mergedPayload;
  }
}

// ==========================================================
// GESTIÓN DE USUARIOS (Solo Rol 'admin')
// ==========================================================
export async function fetchUsers() {
  try {
    const data = await tryApiFetch('/users');
    return data.users;
  } catch (err) {
    if (err.status) throw err;
    const users = await ensureLocalUsers();
    return users.map(({ salt, passwordHash, ...rest }) => rest);
  }
}

export async function createUser(userData) {
  try {
    const data = await tryApiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return data.user;
  } catch (err) {
    if (err.status) throw err;
    const users = await ensureLocalUsers();
    const username = String(userData.username || '').trim().toLowerCase();
    if (users.some((u) => u.username.toLowerCase() === username)) {
      throw new Error('Ese nombre de usuario ya existe.');
    }
    const salt = `gf-salt-${Date.now().toString(36)}`;
    const role = userData.role === 'admin' ? 'admin' : 'custom';
    let permissions = [];
    if (role === 'admin') {
      permissions = ['catalog', 'banners', 'content', 'users'];
    } else if (Array.isArray(userData.permissions)) {
      permissions = userData.permissions.filter((p) => ['catalog', 'banners', 'content', 'users'].includes(p));
      if (permissions.length === 0) permissions = ['catalog'];
    } else {
      permissions = ['catalog'];
    }

    const newU = {
      id: `usr-${Date.now().toString(36)}`,
      username,
      name: userData.name,
      email: userData.email || '',
      role,
      permissions,
      salt,
      passwordHash: await sha256Hex(`${salt}:${userData.password}`),
      active: true,
      createdAt: new Date().toISOString(),
    };
    users.push(newU);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    const { salt: _s, passwordHash: _p, ...clean } = newU;
    return clean;
  }
}

export async function updateUser(id, userData) {
  try {
    const data = await tryApiFetch(`/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
    return data.user;
  } catch (err) {
    if (err.status) throw err;
    const users = await ensureLocalUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Usuario no encontrado.');
    const target = users[idx];
    target.name = userData.name || target.name;
    target.email = userData.email ?? target.email;
    if (userData.role) {
      target.role = userData.role === 'admin' ? 'admin' : 'custom';
      if (target.role === 'admin') {
        target.permissions = ['catalog', 'banners', 'content', 'users'];
      }
    }
    if (Array.isArray(userData.permissions) && target.role !== 'admin') {
      const perms = userData.permissions.filter((p) => ['catalog', 'banners', 'content', 'users'].includes(p));
      target.permissions = perms.length > 0 ? perms : ['catalog'];
    }
    if (userData.active !== undefined) target.active = Boolean(userData.active);
    if (userData.password) {
      const salt = `gf-salt-${Date.now().toString(36)}`;
      target.salt = salt;
      target.passwordHash = await sha256Hex(`${salt}:${userData.password}`);
    }
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    const { salt: _s, passwordHash: _p, ...clean } = target;
    return clean;
  }
}

export async function deleteUser(id) {
  try {
    await tryApiFetch(`/users/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (err) {
    if (err.status) throw err;
    const users = (await ensureLocalUsers()).filter((u) => u.id !== id);
    localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
    return true;
  }
}
