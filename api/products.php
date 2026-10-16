<?php
require_once '../config.php';

header('Content-Type: application/json');

$pdo = getDB();
$method = getMethod();

// GET all products
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM products WHERE active = 1 ORDER BY preferred DESC, category, brand");
    $products = $stmt->fetchAll();
    jsonResponse($products);
}

errorResponse('Method not allowed', 405);
