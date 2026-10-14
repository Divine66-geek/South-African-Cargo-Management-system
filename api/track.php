<?php
require __DIR__ . '/db.php';

$code = strtoupper(trim($_GET['code'] ?? ''));
$st = db()->prepare('SELECT tracking_code, goods_description, origin, destination, container_number, status
                     FROM v_public_tracking WHERE tracking_code = ?');
$st->execute([$code]);
$shipment = $st->fetch();
if (!$shipment) {
    json_out(['error' => 'We could not find that code. Check it and try again.'], 404);
}

$up = db()->prepare('SELECT cu.message, cu.created_at
                     FROM client_updates cu JOIN shipments s ON s.id = cu.shipment_id
                     WHERE s.tracking_code = ? ORDER BY cu.created_at DESC');
$up->execute([$code]);
$shipment['updates'] = $up->fetchAll();
json_out($shipment);