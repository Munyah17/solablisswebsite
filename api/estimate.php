<?php
require_once '../config.php';
require_once '../estimator.php';

header('Content-Type: application/json');

$method = getMethod();

// POST - Run estimate
if ($method === 'POST') {
    $input = getJsonInput();
    $appliances = $input['appliances'] ?? [];
    $options = $input['options'] ?? [];
    
    if (empty($appliances)) {
        errorResponse('Appliances data required');
    }
    
    // Calculate estimate using estimator logic
    $estimate = calculateEstimate($appliances, $options);
    
    jsonResponse(['estimate' => $estimate]);
}

errorResponse('Method not allowed', 405);
