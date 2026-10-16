<?php
require_once '../config.php';

header('Content-Type: application/json');

$pdo = getDB();
$method = getMethod();

// GET all projects
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM projects ORDER BY completed_at DESC, created_at DESC");
    $projects = $stmt->fetchAll();
    
    // Parse JSON fields
    foreach ($projects as &$p) {
        $p['equipment_json'] = json_decode($p['equipment_json'] ?? '[]', true);
    }
    
    jsonResponse($projects);
}

errorResponse('Method not allowed', 405);
