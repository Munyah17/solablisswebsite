<?php
require_once '../config.php';

header('Content-Type: application/json');

$pdo = getDB();
$method = getMethod();

// GET all appliances
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM appliances ORDER BY category, name");
    $appliances = $stmt->fetchAll();
    jsonResponse($appliances);
}

errorResponse('Method not allowed', 405);
