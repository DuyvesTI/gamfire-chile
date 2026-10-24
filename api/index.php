<?php
/**
 * Gamfire Chile - Backend API para Hostinger / cPanel (PHP 8+)
 * Autenticación JWT (HMAC-SHA256), Hash de contraseñas (PBKDF2-SHA512 / password_hash),
 * Protección contra fuerza bruta, RBAC ('admin' y 'catalogo'), CRUD de Catálogo y Subida de Imágenes.
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store, no-cache, must-revalidate');

$dataDir = __DIR__ . '/data';
$uploadsDir = dirname(__DIR__) . '/uploads';
$productsFile = $dataDir . '/products.json';
$usersFile = $dataDir . '/users.json';
$secretFile = $dataDir . '/.jwt_secret';
$rateFile = $dataDir . '/.rate_limits.json';

if (!is_dir($dataDir)) mkdir($dataDir, 0750, true);
if (!is_dir($uploadsDir)) mkdir($uploadsDir, 0755, true);

// Proteger carpeta data de acceso web directo en Apache/Hostinger
$htaccess = $dataDir . '/.htaccess';
if (!file_exists($htaccess)) {
    file_put_contents($htaccess, "Deny from all\n");
}

if (!file_exists($secretFile)) {
    file_put_contents($secretFile, bin2hex(random_bytes(48)));
}
$jwtSecret = trim(file_get_contents($secretFile));

function hash_pwd(string $password, string $salt): string {
    return hash_pbkdf2('sha512', $password, $salt, 100000, 128, false);
}

// Inicializar usuarios por defecto si no existen
if (!file_exists($usersFile)) {
    $s1 = bin2hex(random_bytes(16));
    $s2 = bin2hex(random_bytes(16));
    $defaultUsers = [
        [
            'id' => 'usr-admin-1',
            'username' => 'admin',
            'name' => 'Administrador General',
            'email' => 'admin@gamfire.cl',
            'role' => 'admin',
            'salt' => $s1,
            'passwordHash' => hash_pwd('Gamfire2026!', $s1),
            'active' => true,
            'createdAt' => gmdate('c')
        ],
        [
            'id' => 'usr-cat-1',
            'username' => 'catalogo',
            'name' => 'Encargado de Catálogo',
            'email' => 'catalogo@gamfire.cl',
            'role' => 'catalogo',
            'salt' => $s2,
            'passwordHash' => hash_pwd('Catalogo2026!', $s2),
            'active' => true,
            'createdAt' => gmdate('c')
        ]
    ];
    file_put_contents($usersFile, json_encode($defaultUsers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

function send_json(int $status, array $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

function b64url_encode(string $data): string {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function b64url_decode(string $data): string {
    return base64_decode(strtr($data, '-_', '+/'));
}

function sign_jwt(array $payload, string $secret): string {
    $header = b64url_encode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
    $payload['exp'] = time() + (8 * 3600);
    $body = b64url_encode(json_encode($payload));
    $sig = b64url_encode(hash_hmac('sha256', "$header.$body", $secret, true));
    return "$header.$body.$sig";
}

function verify_jwt(?string $token, string $secret): ?array {
    if (!$token) return null;
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    [$header, $body, $sig] = $parts;
    $expected = b64url_encode(hash_hmac('sha256', "$header.$body", $secret, true));
    if (!hash_equals($expected, $sig)) return null;
    $data = json_decode(b64url_decode($body), true);
    if (!$data || empty($data['exp']) || $data['exp'] < time()) return null;
    return $data;
}

function get_auth_user(string $usersFile, string $secret): ?array {
    $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (!preg_match('/^Bearer\s+(.+)$/i', $auth, $m)) return null;
    $payload = verify_jwt(trim($m[1]), $secret);
    if (!$payload) return null;
    $users = json_decode(@file_get_contents($usersFile), true) ?: [];
    foreach ($users as $u) {
        if ($u['id'] === ($payload['sub'] ?? '') && ($u['active'] ?? true) !== false) {
            return [
                'id' => $u['id'],
                'username' => $u['username'],
                'name' => $u['name'],
                'email' => $u['email'] ?? '',
                'role' => $u['role']
            ];
        }
    }
    return null;
}

function sanitize_user(array $u): array {
    return [
        'id' => $u['id'],
        'username' => $u['username'],
        'name' => $u['name'],
        'email' => $u['email'] ?? '',
        'role' => $u['role'],
        'active' => ($u['active'] ?? true) !== false,
        'createdAt' => $u['createdAt'] ?? ''
    ];
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^.*/api#', '/api', $uri);
$method = strtoupper($_SERVER['REQUEST_METHOD']);
$body = json_decode(file_get_contents('php://input'), true) ?: [];

// 1. POST /api/auth/login
if ($path === '/api/auth/login' && $method === 'POST') {
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $rates = file_exists($rateFile) ? (json_decode(file_get_contents($rateFile), true) ?: []) : [];
    $rec = $rates[$ip] ?? ['count' => 0, 'last' => 0];
    if ($rec['count'] >= 5 && (time() - $rec['last']) < 300) {
        $wait = 300 - (time() - $rec['last']);
        send_json(429, ['error' => "Demasiados intentos fallidos. Intenta en {$wait} segundos."]);
    }

    $id = strtolower(trim($body['username'] ?? ''));
    $pwd = (string)($body['password'] ?? '');
    $users = json_decode(@file_get_contents($usersFile), true) ?: [];
    $found = null;
    foreach ($users as $u) {
        if (($u['active'] ?? true) !== false && (strtolower($u['username']) === $id || strtolower($u['email'] ?? '') === $id)) {
            $found = $u;
            break;
        }
    }

    if (!$found || !hash_equals($found['passwordHash'], hash_pwd($pwd, $found['salt']))) {
        $rates[$ip] = ['count' => $rec['count'] + 1, 'last' => time()];
        file_put_contents($rateFile, json_encode($rates));
        send_json(401, ['error' => 'Usuario o contraseña incorrectos.']);
    }

    unset($rates[$ip]);
    file_put_contents($rateFile, json_encode($rates));
    $token = sign_jwt(['sub' => $found['id'], 'role' => $found['role'], 'username' => $found['username']], $jwtSecret);
    send_json(200, ['token' => $token, 'user' => sanitize_user($found)]);
}

// 2. GET /api/auth/me
if ($path === '/api/auth/me' && $method === 'GET') {
    $user = get_auth_user($usersFile, $jwtSecret);
    if (!$user) send_json(401, ['error' => 'Sesión inválida o expirada.']);
    send_json(200, ['user' => $user]);
}

// 3. /api/products
if ($path === '/api/products' && $method === 'GET') {
    $products = file_exists($productsFile) ? (json_decode(file_get_contents($productsFile), true) ?: []) : [];
    if (($_GET['all'] ?? '') === '1') {
        $user = get_auth_user($usersFile, $jwtSecret);
        if (!$user) send_json(401, ['error' => 'No autorizado.']);
        send_json(200, ['products' => $products]);
    }
    $active = array_values(array_filter($products, fn($p) => ($p['active'] ?? true) !== false));
    send_json(200, ['products' => $active]);
}

if ($path === '/api/products' && $method === 'POST') {
    $user = get_auth_user($usersFile, $jwtSecret);
    if (!$user) send_json(401, ['error' => 'No autenticado.']);
    $products = file_exists($productsFile) ? (json_decode(file_get_contents($productsFile), true) ?: []) : [];
    $body['id'] = $body['id'] ?? ('prod-' . uniqid());
    $products[] = $body;
    file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    send_json(201, ['product' => $body]);
}

if (preg_match('#^/api/products/([^/]+)$#', $path, $m)) {
    $user = get_auth_user($usersFile, $jwtSecret);
    if (!$user) send_json(401, ['error' => 'No autenticado.']);
    $prodId = urldecode($m[1]);
    $products = file_exists($productsFile) ? (json_decode(file_get_contents($productsFile), true) ?: []) : [];
    $idx = -1;
    foreach ($products as $i => $p) {
        if (($p['id'] ?? '') === $prodId) { $idx = $i; break; }
    }
    if ($idx === -1) send_json(404, ['error' => 'Producto no encontrado.']);

    if ($method === 'PUT') {
        $body['id'] = $prodId;
        $products[$idx] = $body;
        file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        send_json(200, ['product' => $body]);
    }
    if ($method === 'DELETE') {
        array_splice($products, $idx, 1);
        file_put_contents($productsFile, json_encode($products, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        send_json(200, ['ok' => true]);
    }
}

// 4. POST /api/upload
if ($path === '/api/upload' && $method === 'POST') {
    $user = get_auth_user($usersFile, $jwtSecret);
    if (!$user) send_json(401, ['error' => 'No autenticado.']);
    $dataUrl = (string)($body['dataUrl'] ?? '');
    if (!preg_match('/^data:image\/(png|jpeg|jpg|webp|gif);base64,(.+)$/i', $dataUrl, $m)) {
        send_json(400, ['error' => 'Formato de imagen inválido.']);
    }
    $ext = strtolower($m[1]) === 'jpeg' ? 'jpg' : strtolower($m[1]);
    $bin = base64_decode($m[2]);
    if (strlen($bin) > 4 * 1024 * 1024) send_json(400, ['error' => 'Imagen supera 4MB.']);
    $filename = 'prod-' . time() . '-' . bin2hex(random_bytes(4)) . '.' . $ext;
    file_put_contents($uploadsDir . '/' . $filename, $bin);
    send_json(201, ['url' => 'uploads/' . $filename]);
}

// 5. /api/users (Solo rol 'admin')
if ($path === '/api/users' || preg_match('#^/api/users/([^/]+)$#', $path, $m)) {
    $currentUser = get_auth_user($usersFile, $jwtSecret);
    if (!$currentUser) send_json(401, ['error' => 'No autenticado.']);
    if ($currentUser['role'] !== 'admin') send_json(403, ['error' => 'Se requiere rol Administrador.']);

    $users = json_decode(@file_get_contents($usersFile), true) ?: [];

    if ($path === '/api/users' && $method === 'GET') {
        send_json(200, ['users' => array_map('sanitize_user', $users)]);
    }

    if ($path === '/api/users' && $method === 'POST') {
        $username = strtolower(trim($body['username'] ?? ''));
        $name = trim($body['name'] ?? '');
        $email = strtolower(trim($body['email'] ?? ''));
        $role = ($body['role'] ?? '') === 'admin' ? 'admin' : 'catalogo';
        $pwd = (string)($body['password'] ?? '');

        if (strlen($username) < 3) send_json(400, ['error' => 'Usuario mínimo 3 caracteres.']);
        if (!$name) send_json(400, ['error' => 'Nombre obligatorio.']);
        if (strlen($pwd) < 8) send_json(400, ['error' => 'Contraseña mínimo 8 caracteres.']);
        foreach ($users as $u) {
            if (strtolower($u['username']) === $username) send_json(409, ['error' => 'El usuario ya existe.']);
        }
        $salt = bin2hex(random_bytes(16));
        $newU = [
            'id' => 'usr-' . uniqid(),
            'username' => $username,
            'name' => $name,
            'email' => $email,
            'role' => $role,
            'salt' => $salt,
            'passwordHash' => hash_pwd($pwd, $salt),
            'active' => true,
            'createdAt' => gmdate('c')
        ];
        $users[] = $newU;
        file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        send_json(201, ['user' => sanitize_user($newU)]);
    }

    if (!empty($m[1])) {
        $targetId = urldecode($m[1]);
        $idx = -1;
        foreach ($users as $i => $u) {
            if ($u['id'] === $targetId) { $idx = $i; break; }
        }
        if ($idx === -1) send_json(404, ['error' => 'Usuario no encontrado.']);

        if ($method === 'PUT') {
            $users[$idx]['name'] = trim($body['name'] ?? $users[$idx]['name']);
            $users[$idx]['email'] = strtolower(trim($body['email'] ?? ($users[$idx]['email'] ?? '')));
            if (!empty($body['role'])) $users[$idx]['role'] = $body['role'] === 'admin' ? 'admin' : 'catalogo';
            if (isset($body['active'])) $users[$idx]['active'] = (bool)$body['active'];
            if (!empty($body['password'])) {
                if (strlen($body['password']) < 8) send_json(400, ['error' => 'Contraseña mínimo 8 caracteres.']);
                $salt = bin2hex(random_bytes(16));
                $users[$idx]['salt'] = $salt;
                $users[$idx]['passwordHash'] = hash_pwd($body['password'], $salt);
            }
            file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            send_json(200, ['user' => sanitize_user($users[$idx])]);
        }

        if ($method === 'DELETE') {
            if ($targetId === $currentUser['id']) send_json(400, ['error' => 'No puedes eliminar tu propio usuario.']);
            array_splice($users, $idx, 1);
            file_put_contents($usersFile, json_encode($users, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            send_json(200, ['ok' => true]);
        }
    }
}

send_json(404, ['error' => 'Endpoint no encontrado.']);
