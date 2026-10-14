<?php
require __DIR__ . '/db.php';
session_start();

$in    = json_decode(file_get_contents('php://input'), true) ?? [];
$email = strtolower(trim($in['email'] ?? ''));
$pass  = $in['password'] ?? '';

$st = db()->prepare('SELECT id, role, name, password_hash, is_active, failed_logins, locked_until
                     FROM users WHERE email = ?');
$st->execute([$email]);
$u = $st->fetch();

if (!$u) {
    json_out(['error' => 'No account found for that email. Create an account if you are a new client.'], 401);
}
if (!$u['is_active']) {
    json_out(['error' => 'This account is deactivated. Contact SCA.'], 403);
}
if ($u['locked_until'] && strtotime($u['locked_until']) > time()) {
    json_out(['error' => 'Too many failed attempts. Try again in a few minutes.'], 429);
}
if (!password_verify($pass, $u['password_hash'])) {
    $fails = $u['failed_logins'] + 1;
    $lock  = $fails >= 5 ? date('Y-m-d H:i:s', time() + 15 * 60) : null;
    db()->prepare('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?')
        ->execute([$fails >= 5 ? 0 : $fails, $lock, $u['id']]);
    db()->prepare('INSERT INTO audit_log (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)')
        ->execute([$u['id'], 'failed_login', $_SERVER['REMOTE_ADDR'] ?? null, 'Wrong password']);
    json_out(['error' => 'Invalid password. Check it and try again.'], 401);
}

db()->prepare('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?')
    ->execute([$u['id']]);
db()->prepare('INSERT INTO audit_log (user_id, action, ip_address, details) VALUES (?, ?, ?, ?)')
    ->execute([$u['id'], 'login', $_SERVER['REMOTE_ADDR'] ?? null, 'Signed in']);

session_regenerate_id(true);
$_SESSION['user'] = ['id' => (int)$u['id'], 'role' => $u['role'], 'name' => $u['name']];
json_out(['ok' => true, 'role' => $u['role'], 'name' => $u['name']]);