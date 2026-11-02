// Plugin Vite con Backend API real en Node.js (sin dependencias externas)
// Soporta autenticación con PBKDF2-SHA512 + HMAC-SHA256 JWT, Rate-Limiting contra fuerza bruta,
// RBAC (Roles 'admin' y 'catalogo'), CRUD de productos y subida de imágenes.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_PRODUCTS, DEFAULT_BANNERS, DEFAULT_SITE_CONTENT } from '../src/data/defaultCatalog.js';

const DATA_DIR = path.resolve(process.cwd(), 'server-data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const BANNERS_FILE = path.join(DATA_DIR, 'banners.json');
const CONTENT_FILE = path.join(DATA_DIR, 'site-content.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_FILE = path.join(DATA_DIR, '.jwt_secret');
const UPLOADS_DIR = path.resolve(process.cwd(), 'public', 'uploads');

// Rate limiter en memoria por IP (protección fuerza bruta)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 5 * 60 * 1000; // 5 minutos

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

  if (!fs.existsSync(SECRET_FILE)) {
    fs.writeFileSync(SECRET_FILE, crypto.randomBytes(48).toString('hex'), { mode: 0o600 });
  }

  if (!fs.existsSync(PRODUCTS_FILE)) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(DEFAULT_PRODUCTS, null, 2), 'utf-8');
  }

  if (!fs.existsSync(BANNERS_FILE)) {
    fs.writeFileSync(BANNERS_FILE, JSON.stringify(DEFAULT_BANNERS, null, 2), 'utf-8');
  }

  if (!fs.existsSync(CONTENT_FILE)) {
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(DEFAULT_SITE_CONTENT, null, 2), 'utf-8');
  }

  if (!fs.existsSync(USERS_FILE)) {
    const adminSalt = crypto.randomBytes(16).toString('hex');
    const catSalt = crypto.randomBytes(16).toString('hex');
    const initialUsers = [
      {
        id: 'usr-admin-1',
        username: 'admin',
        name: 'Administrador General',
        email: 'admin@gamfire.cl',
        role: 'admin',
        salt: adminSalt,
        passwordHash: hashPassword('Gamfire2026!', adminSalt),
        active: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'usr-cat-1',
        username: 'catalogo',
        name: 'Encargado de Catálogo',
        email: 'catalogo@gamfire.cl',
        role: 'catalogo',
        salt: catSalt,
        passwordHash: hashPassword('Catalogo2026!', catSalt),
        active: true,
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(USERS_FILE, JSON.stringify(initialUsers, null, 2), 'utf-8');
  }
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(String(password), String(salt), 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(password, salt, expectedHash) {
  const hash = hashPassword(password, salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(expectedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getSecret() {
  ensureStorage();
  return fs.readFileSync(SECRET_FILE, 'utf-8').trim();
}

function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 8 * 3600; // 8 horas
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(`${header}.${body}`)
    .digest('base64url');

  const sigBuf = Buffer.from(signature);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function readJson(file, fallback = []) {
  ensureStorage();
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(file, data) {
  ensureStorage();
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

function parseBody(req, maxBytes = 18 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('Payload demasiado grande (máx 18MB)'));
        req.destroy();
        return;
      }
      raw += chunk.toString('utf-8');
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('JSON inválido'));
      }
    });
    req.on('error', reject);
  });
}

function getAuthUser(req) {
  const auth = req.headers['authorization'] || '';
  const match = auth.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;
  const payload = verifyToken(match[1]);
  if (!payload) return null;

  const users = readJson(USERS_FILE, []);
  const user = users.find((u) => u.id === payload.sub && u.active !== false);
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    permissions: user.role === 'admin'
      ? ['catalog', 'banners', 'content', 'users']
      : (Array.isArray(user.permissions) && user.permissions.length > 0 ? user.permissions : ['catalog']),
  };
}

function sanitizeUser(u) {
  const role = u.role === 'admin' ? 'admin' : (u.role || 'catalogo');
  let permissions = [];
  if (role === 'admin') {
    permissions = ['catalog', 'banners', 'content', 'users'];
  } else if (Array.isArray(u.permissions)) {
    permissions = u.permissions.filter((p) => ['catalog', 'banners', 'content', 'users'].includes(p));
    if (permissions.length === 0) permissions = ['catalog'];
  } else {
    permissions = ['catalog'];
  }

  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role,
    permissions,
    active: u.active !== false,
    createdAt: u.createdAt,
  };
}

function sanitizeProduct(input, existingId = null) {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('El nombre del producto es obligatorio.');

  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const id = existingId || String(input.id || '').trim() || `${slug}-${Date.now().toString(36)}`;
  const allowedCategories = ['corporativa', 'fire', 'seven', 'accesorios', 'proteccion', 'ropa', 'herramientas'];
  const rawCat = allowedCategories.includes(input.category) ? input.category : 'fire';
  const category = rawCat === 'ropa' ? 'corporativa' : (rawCat === 'proteccion' || rawCat === 'herramientas') ? 'fire' : rawCat;

  const normalPrice =
    input.normalPrice !== null && input.normalPrice !== '' && Number(input.normalPrice) > 0
      ? Math.round(Number(input.normalPrice))
      : null;
  const offerPrice =
    input.offerPrice !== null && input.offerPrice !== '' && Number(input.offerPrice) > 0
      ? Math.round(Number(input.offerPrice))
      : null;

  const colors = Array.isArray(input.colors)
    ? input.colors.map((c) => String(c).trim()).filter(Boolean)
    : String(input.colors || '')
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

  const sizes = Array.isArray(input.sizes)
    ? input.sizes.map((s) => String(s).trim()).filter(Boolean)
    : [];

  const minOrderQty = Math.max(1, parseInt(input.minOrderQty, 10) || 1);

  return {
    id,
    name,
    category,
    description: String(input.description || '').trim(),
    image: String(input.image || '').trim(),
    normalPrice,
    offerPrice,
    showPrice: Boolean(input.showPrice),
    colors,
    sizes,
    minOrderQty,
    featured: Boolean(input.featured),
    active: input.active !== false,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeBanner(input, existingId = null) {
  const title = String(input.title || '').trim();
  const layoutAllowed = ['split', 'vignette', 'bottom-bar', 'showcase', 'clean'];
  const layout = layoutAllowed.includes(input.layout) ? input.layout : 'vignette';
  if (!title && layout !== 'clean') {
    throw new Error('El título del banner publicitario es obligatorio.');
  }

  const slug = (title || 'banner')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const id = existingId || String(input.id || '').trim() || `banner-${slug}-${Date.now().toString(36)}`;

  const productIds = Array.isArray(input.productIds)
    ? input.productIds.map((item) => String(item).trim()).filter(Boolean).slice(0, 6)
    : [];

  return {
    id,
    title,
    highlight: String(input.highlight || '').trim(),
    titleRight: String(input.titleRight || '').trim(),
    highlightRight: String(input.highlightRight || '').trim(),
    badge: String(input.badge || '').trim(),
    subtitle: String(input.subtitle || '').trim(),
    layout,
    productIds,
    posterImage: String(input.posterImage || input.poster || '').trim(),
    videoUrl: String(input.videoUrl || input.video || '').trim(),
    ctaText: String(input.ctaText || 'CONOCE MÁS AQUÍ').trim(),
    ctaLink: String(input.ctaLink || 'catalogo.html').trim(),
    active: input.active !== false,
    updatedAt: new Date().toISOString(),
  };
}

function sanitizeSiteContent(input = {}) {
  const siteLayoutMode = input.siteLayoutMode === 'onepage' ? 'onepage' : 'multipage';
  const rawContact = input.contact || {};
  const rawIntro = input.intro || {};
  const rawEmpresa = input.empresa || {};
  const rawCatBanners = input.catalogBanners || {};

  const contact = {
    whatsappNumber: String(rawContact.whatsappNumber ?? DEFAULT_SITE_CONTENT.contact.whatsappNumber).trim(),
    whatsappUrl: String(rawContact.whatsappUrl ?? DEFAULT_SITE_CONTENT.contact.whatsappUrl).trim(),
    facebookName: String(rawContact.facebookName ?? DEFAULT_SITE_CONTENT.contact.facebookName).trim(),
    facebookUrl: String(rawContact.facebookUrl ?? DEFAULT_SITE_CONTENT.contact.facebookUrl).trim(),
    instagramHandle: String(rawContact.instagramHandle ?? DEFAULT_SITE_CONTENT.contact.instagramHandle).trim(),
    instagramUrl: String(rawContact.instagramUrl ?? DEFAULT_SITE_CONTENT.contact.instagramUrl).trim(),
    email: String(rawContact.email ?? DEFAULT_SITE_CONTENT.contact.email).trim(),
  };

  const intro = {
    titleMain: String(rawIntro.titleMain ?? DEFAULT_SITE_CONTENT.intro.titleMain).trim(),
    titleHighlight: String(rawIntro.titleHighlight ?? DEFAULT_SITE_CONTENT.intro.titleHighlight).trim(),
    paragraph: String(rawIntro.paragraph ?? DEFAULT_SITE_CONTENT.intro.paragraph).trim(),
  };

  const empresa = {
    titleMain: String(rawEmpresa.titleMain ?? DEFAULT_SITE_CONTENT.empresa.titleMain).trim(),
    titleHighlight: String(rawEmpresa.titleHighlight ?? DEFAULT_SITE_CONTENT.empresa.titleHighlight).trim(),
    paragraph1: String(rawEmpresa.paragraph1 ?? DEFAULT_SITE_CONTENT.empresa.paragraph1).trim(),
    paragraph2: String(rawEmpresa.paragraph2 ?? DEFAULT_SITE_CONTENT.empresa.paragraph2).trim(),
    paragraph3: String(rawEmpresa.paragraph3 ?? DEFAULT_SITE_CONTENT.empresa.paragraph3).trim(),
    motto: String(rawEmpresa.motto ?? DEFAULT_SITE_CONTENT.empresa.motto).trim(),
    misionTitle: String(rawEmpresa.misionTitle ?? DEFAULT_SITE_CONTENT.empresa.misionTitle).trim(),
    misionText: String(rawEmpresa.misionText ?? DEFAULT_SITE_CONTENT.empresa.misionText).trim(),
    visionTitle: String(rawEmpresa.visionTitle ?? DEFAULT_SITE_CONTENT.empresa.visionTitle).trim(),
    visionText: String(rawEmpresa.visionText ?? DEFAULT_SITE_CONTENT.empresa.visionText).trim(),
  };

  const bannerKeys = ['all', 'corporativa', 'fire', 'seven', 'accesorios'];
  const catalogBanners = {};
  bannerKeys.forEach((key) => {
    const def = DEFAULT_SITE_CONTENT.catalogBanners[key];
    const src = rawCatBanners[key] || {};
    const pills = Array.isArray(src.pills)
      ? src.pills.map((p) => String(p).trim()).filter(Boolean)
      : typeof src.pills === 'string'
        ? src.pills.split(',').map((p) => p.trim()).filter(Boolean)
        : [...def.pills];
    catalogBanners[key] = {
      badge: String(src.badge ?? def.badge).trim(),
      titleMain: String(src.titleMain ?? def.titleMain).trim(),
      titleHighlight: String(src.titleHighlight ?? def.titleHighlight).trim(),
      desc: String(src.desc ?? def.desc).trim(),
      cardDesc: String(src.cardDesc ?? def.cardDesc ?? def.desc).trim(),
      pills,
      bgImage: String(src.bgImage ?? def.bgImage).trim() || def.bgImage,
    };
  });

  return {
    siteLayoutMode,
    contact,
    intro,
    empresa,
    catalogBanners,
    updatedAt: new Date().toISOString(),
  };
}

export function apiServerPlugin() {
  ensureStorage();

  const handleApi = async (req, res, next) => {
    const urlObj = new URL(req.url, 'http://localhost');
    // Normalizar prefijo base '/gamfire-chile-web/api' o '/api'
    const pathname = urlObj.pathname.replace(/^\/gamfire-chile-web/, '');

    if (!pathname.startsWith('/api/')) {
      return next();
    }

    const method = req.method.toUpperCase();
    const clientIp = req.socket?.remoteAddress || 'local';

    try {
      // 1. POST /api/auth/login
      if (pathname === '/api/auth/login' && method === 'POST') {
        const record = loginAttempts.get(clientIp);
        if (record && record.count >= MAX_ATTEMPTS && Date.now() - record.last < LOCK_TIME_MS) {
          const waitSec = Math.ceil((LOCK_TIME_MS - (Date.now() - record.last)) / 1000);
          return sendJson(res, 429, {
            error: `Demasiados intentos fallidos. Intenta nuevamente en ${waitSec} segundos.`,
          });
        }

        const body = await parseBody(req);
        const identifier = String(body.username || '').trim().toLowerCase();
        const password = String(body.password || '');

        const users = readJson(USERS_FILE, []);
        const user = users.find(
          (u) =>
            u.active !== false &&
            (u.username.toLowerCase() === identifier || (u.email && u.email.toLowerCase() === identifier))
        );

        if (!user || !verifyPassword(password, user.salt, user.passwordHash)) {
          const prev = loginAttempts.get(clientIp) || { count: 0, last: 0 };
          loginAttempts.set(clientIp, { count: prev.count + 1, last: Date.now() });
          return sendJson(res, 401, { error: 'Usuario o contraseña incorrectos.' });
        }

        loginAttempts.delete(clientIp);
        const token = signToken({ sub: user.id, role: user.role, username: user.username });
        return sendJson(res, 200, {
          token,
          user: sanitizeUser(user),
        });
      }

      // 2. GET /api/auth/me
      if (pathname === '/api/auth/me' && method === 'GET') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'Sesión inválida o expirada.' });
        return sendJson(res, 200, { user });
      }

      // 3. GET /api/products (Público devuelve activos; autenticado con ?all=1 devuelve todos)
      if (pathname === '/api/products' && method === 'GET') {
        const products = readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
        const showAll = urlObj.searchParams.get('all') === '1';
        if (showAll) {
          const user = getAuthUser(req);
          if (!user) return sendJson(res, 401, { error: 'No autorizado.' });
          return sendJson(res, 200, { products });
        }
        return sendJson(res, 200, { products: products.filter((p) => p.active !== false) });
      }

      // 4. POST /api/products (Crear producto)
      if (pathname === '/api/products' && method === 'POST') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });
        if (user.role !== 'admin' && !user.permissions.includes('catalog')) {
          return sendJson(res, 403, { error: 'No tienes permiso para gestionar Catálogo.' });
        }

        const body = await parseBody(req);
        const products = readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
        const newProduct = sanitizeProduct(body);
        products.push(newProduct);
        writeJson(PRODUCTS_FILE, products);
        return sendJson(res, 201, { product: newProduct });
      }

      // 5. PUT / DELETE /api/products/:id
      if (pathname.startsWith('/api/products/')) {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });
        if (user.role !== 'admin' && !user.permissions.includes('catalog')) {
          return sendJson(res, 403, { error: 'No tienes permiso para gestionar Catálogo.' });
        }

        const prodId = decodeURIComponent(pathname.replace('/api/products/', ''));
        const products = readJson(PRODUCTS_FILE, DEFAULT_PRODUCTS);
        const idx = products.findIndex((p) => p.id === prodId);
        if (idx === -1) return sendJson(res, 404, { error: 'Producto no encontrado.' });

        if (method === 'PUT') {
          const body = await parseBody(req);
          const updated = sanitizeProduct(body, prodId);
          products[idx] = updated;
          writeJson(PRODUCTS_FILE, products);
          return sendJson(res, 200, { product: updated });
        }

        if (method === 'DELETE') {
          products.splice(idx, 1);
          writeJson(PRODUCTS_FILE, products);
          return sendJson(res, 200, { ok: true });
        }
      }

      // 5B. GET / POST / PUT / DELETE /api/banners (Banners / Propaganda del Carrusel)
      if (pathname === '/api/banners' && method === 'GET') {
        const banners = readJson(BANNERS_FILE, DEFAULT_BANNERS);
        const showAll = urlObj.searchParams.get('all') === '1';
        if (showAll) {
          const user = getAuthUser(req);
          if (!user) return sendJson(res, 401, { error: 'No autorizado.' });
          return sendJson(res, 200, { banners });
        }
        return sendJson(res, 200, { banners: banners.filter((b) => b.active !== false) });
      }

      if (pathname === '/api/banners' && method === 'POST') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });
        if (user.role !== 'admin' && !user.permissions.includes('banners')) {
          return sendJson(res, 403, { error: 'No tienes permiso para gestionar Propaganda / Banners.' });
        }

        const body = await parseBody(req);
        const banners = readJson(BANNERS_FILE, DEFAULT_BANNERS);
        const newBanner = sanitizeBanner(body);
        banners.push(newBanner);
        writeJson(BANNERS_FILE, banners);
        return sendJson(res, 201, { banner: newBanner });
      }

      if (pathname.startsWith('/api/banners/')) {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });
        if (user.role !== 'admin' && !user.permissions.includes('banners')) {
          return sendJson(res, 403, { error: 'No tienes permiso para gestionar Propaganda / Banners.' });
        }

        const bannerId = decodeURIComponent(pathname.replace('/api/banners/', ''));
        const banners = readJson(BANNERS_FILE, DEFAULT_BANNERS);
        const idx = banners.findIndex((b) => b.id === bannerId);
        if (idx === -1) return sendJson(res, 404, { error: 'Banner no encontrado.' });

        if (method === 'PUT') {
          const body = await parseBody(req);
          const updated = sanitizeBanner(body, bannerId);
          banners[idx] = updated;
          writeJson(BANNERS_FILE, banners);
          return sendJson(res, 200, { banner: updated });
        }

        if (method === 'DELETE') {
          banners.splice(idx, 1);
          writeJson(BANNERS_FILE, banners);
          return sendJson(res, 200, { ok: true });
        }
      }

      // 5C. GET / PUT /api/content (Textos principales de la web y Banners de Catálogo)
      if (pathname === '/api/content' && method === 'GET') {
        const content = readJson(CONTENT_FILE, DEFAULT_SITE_CONTENT);
        return sendJson(res, 200, { content: sanitizeSiteContent(content) });
      }

      if (pathname === '/api/content' && method === 'PUT') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });
        if (user.role !== 'admin' && !user.permissions.includes('content')) {
          return sendJson(res, 403, { error: 'No tienes permiso para gestionar Textos y Banners Web.' });
        }

        const body = await parseBody(req);
        const updated = sanitizeSiteContent(body);
        writeJson(CONTENT_FILE, updated);
        return sendJson(res, 200, { content: updated });
      }

      // 6. POST /api/upload (Subir foto o video corto en base64 al servidor)
      if (pathname === '/api/upload' && method === 'POST') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });

        const body = await parseBody(req);
        const dataUrl = String(body.dataUrl || '');
        const match = dataUrl.match(/^data:(image\/(png|jpeg|jpg|webp|gif)|video\/(mp4|webm));base64,(.+)$/i);
        if (!match) {
          return sendJson(res, 400, { error: 'Formato no válido (use PNG, JPG, WEBP, MP4 o WEBM).' });
        }

        const rawExt = (match[2] || match[3] || 'jpg').toLowerCase();
        const ext = rawExt === 'jpeg' ? 'jpg' : rawExt;
        const buffer = Buffer.from(match[4], 'base64');
        const maxLimit = match[3] ? 14 * 1024 * 1024 : 5 * 1024 * 1024;
        if (buffer.length > maxLimit) {
          return sendJson(res, 400, { error: 'El archivo supera el tamaño máximo permitido.' });
        }

        const prefix = match[3] ? 'video' : 'media';
        const filename = `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
        fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
        return sendJson(res, 201, { url: `uploads/${filename}` });
      }

      // 7. /api/users (Solo rol 'admin')
      if (pathname === '/api/users' || pathname.startsWith('/api/users/')) {
        const currentUser = getAuthUser(req);
        if (!currentUser) return sendJson(res, 401, { error: 'No autenticado.' });
        if (currentUser.role !== 'admin') {
          return sendJson(res, 403, { error: 'Acceso denegado: se requiere perfil Administrador.' });
        }

        const users = readJson(USERS_FILE, []);

        if (pathname === '/api/users' && method === 'GET') {
          return sendJson(res, 200, { users: users.map(sanitizeUser) });
        }

        if (pathname === '/api/users' && method === 'POST') {
          const body = await parseBody(req);
          const username = String(body.username || '').trim().toLowerCase();
          const name = String(body.name || '').trim();
          const email = String(body.email || '').trim().toLowerCase();
          const role = body.role === 'admin' ? 'admin' : 'custom';
          let permissions = [];
          if (role === 'admin') {
            permissions = ['catalog', 'banners', 'content', 'users'];
          } else if (Array.isArray(body.permissions)) {
            permissions = body.permissions.filter((p) => ['catalog', 'banners', 'content', 'users'].includes(p));
            if (permissions.length === 0) permissions = ['catalog'];
          } else {
            permissions = ['catalog'];
          }
          const password = String(body.password || '');

          if (!username || username.length < 3) {
            return sendJson(res, 400, { error: 'El nombre de usuario debe tener al menos 3 caracteres.' });
          }
          if (!name) {
            return sendJson(res, 400, { error: 'El nombre completo es obligatorio.' });
          }
          if (password.length < 8) {
            return sendJson(res, 400, { error: 'La contraseña debe tener al menos 8 caracteres.' });
          }
          if (users.some((u) => u.username.toLowerCase() === username)) {
            return sendJson(res, 409, { error: 'Ese nombre de usuario ya existe.' });
          }

          const salt = crypto.randomBytes(16).toString('hex');
          const newUser = {
            id: `usr-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
            username,
            name,
            email,
            role,
            permissions,
            salt,
            passwordHash: hashPassword(password, salt),
            active: true,
            createdAt: new Date().toISOString(),
          };

          users.push(newUser);
          writeJson(USERS_FILE, users);
          return sendJson(res, 201, { user: sanitizeUser(newUser) });
        }

        const targetId = decodeURIComponent(pathname.replace('/api/users/', ''));
        const idx = users.findIndex((u) => u.id === targetId);
        if (idx === -1) return sendJson(res, 404, { error: 'Usuario no encontrado.' });

        if (method === 'PUT') {
          const body = await parseBody(req);
          const target = users[idx];

          // Evitar dejar el sistema sin ningún administrador activo
          const nextRole = body.role === 'admin' ? 'admin' : (body.role ? 'custom' : target.role);
          const nextActive = body.active !== undefined ? Boolean(body.active) : target.active !== false;

          if (target.role === 'admin' && (nextRole !== 'admin' || !nextActive)) {
            const activeAdmins = users.filter((u) => u.role === 'admin' && u.active !== false && u.id !== target.id);
            if (activeAdmins.length === 0) {
              return sendJson(res, 400, {
                error: 'No puedes quitar el rol o desactivar al único Administrador activo.',
              });
            }
          }

          let nextPermissions = target.permissions || ['catalog'];
          if (nextRole === 'admin') {
            nextPermissions = ['catalog', 'banners', 'content', 'users'];
          } else if (Array.isArray(body.permissions)) {
            nextPermissions = body.permissions.filter((p) => ['catalog', 'banners', 'content', 'users'].includes(p));
            if (nextPermissions.length === 0) nextPermissions = ['catalog'];
          }

          target.name = String(body.name || target.name).trim();
          target.email = String(body.email ?? target.email).trim().toLowerCase();
          target.role = nextRole;
          target.permissions = nextPermissions;
          target.active = nextActive;

          if (body.password && String(body.password).length > 0) {
            if (String(body.password).length < 8) {
              return sendJson(res, 400, { error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
            }
            target.salt = crypto.randomBytes(16).toString('hex');
            target.passwordHash = hashPassword(String(body.password), target.salt);
          }

          writeJson(USERS_FILE, users);
          return sendJson(res, 200, { user: sanitizeUser(target) });
        }

        if (method === 'DELETE') {
          if (targetId === currentUser.id) {
            return sendJson(res, 400, { error: 'No puedes eliminar tu propio usuario en sesión.' });
          }
          const target = users[idx];
          if (target.role === 'admin') {
            const otherAdmins = users.filter((u) => u.role === 'admin' && u.active !== false && u.id !== target.id);
            if (otherAdmins.length === 0) {
              return sendJson(res, 400, { error: 'No puedes eliminar al único Administrador activo.' });
            }
          }
          users.splice(idx, 1);
          writeJson(USERS_FILE, users);
          return sendJson(res, 200, { ok: true });
        }
      }

      return sendJson(res, 404, { error: 'Ruta API no encontrada.' });
    } catch (err) {
      return sendJson(res, 400, { error: err.message || 'Error procesando la solicitud.' });
    }
  };

  return {
    name: 'gamfire-api-server',
    configureServer(server) {
      server.middlewares.use(handleApi);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleApi);
    },
  };
}
