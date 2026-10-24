// Plugin Vite con Backend API real en Node.js (sin dependencias externas)
// Soporta autenticación con PBKDF2-SHA512 + HMAC-SHA256 JWT, Rate-Limiting contra fuerza bruta,
// RBAC (Roles 'admin' y 'catalogo'), CRUD de productos y subida de imágenes.
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { DEFAULT_PRODUCTS } from '../src/data/defaultCatalog.js';

const DATA_DIR = path.resolve(process.cwd(), 'server-data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
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

function parseBody(req, maxBytes = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytes = 0;
    req.on('data', (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        reject(new Error('Payload demasiado grande (máx 6MB)'));
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
  };
}

function sanitizeUser(u) {
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    role: u.role,
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
  const category = ['proteccion', 'ropa', 'herramientas', 'accesorios'].includes(input.category)
    ? input.category
    : 'proteccion';

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

      // 4. POST /api/products (Crear producto - roles: admin, catalogo)
      if (pathname === '/api/products' && method === 'POST') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });

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

      // 6. POST /api/upload (Subir foto en base64 al servidor)
      if (pathname === '/api/upload' && method === 'POST') {
        const user = getAuthUser(req);
        if (!user) return sendJson(res, 401, { error: 'No autenticado.' });

        const body = await parseBody(req);
        const dataUrl = String(body.dataUrl || '');
        const match = dataUrl.match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i);
        if (!match) {
          return sendJson(res, 400, { error: 'Formato de imagen no válido (use PNG, JPG o WEBP).' });
        }

        const ext = match[1].toLowerCase() === 'jpeg' ? 'jpg' : match[1].toLowerCase();
        const buffer = Buffer.from(match[2], 'base64');
        if (buffer.length > 4 * 1024 * 1024) {
          return sendJson(res, 400, { error: 'La imagen supera el tamaño máximo de 4MB.' });
        }

        const filename = `prod-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
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
          const role = body.role === 'admin' ? 'admin' : 'catalogo';
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
          const nextRole = body.role === 'admin' ? 'admin' : body.role === 'catalogo' ? 'catalogo' : target.role;
          const nextActive = body.active !== undefined ? Boolean(body.active) : target.active !== false;

          if (target.role === 'admin' && (nextRole !== 'admin' || !nextActive)) {
            const activeAdmins = users.filter((u) => u.role === 'admin' && u.active !== false && u.id !== target.id);
            if (activeAdmins.length === 0) {
              return sendJson(res, 400, {
                error: 'No puedes quitar el rol o desactivar al único Administrador activo.',
              });
            }
          }

          target.name = String(body.name || target.name).trim();
          target.email = String(body.email ?? target.email).trim().toLowerCase();
          target.role = nextRole;
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
