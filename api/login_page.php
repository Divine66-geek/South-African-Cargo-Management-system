<?php
// Text and image address for the first page, read from the database.
require __DIR__ . '/db.php';
$p = db()->query('SELECT brand_name, headline, tagline, point_1, point_2, point_3, footer FROM v_login_page')->fetch();
$p['background_url'] = 'api/media.php?kind=background';
json_out($p);