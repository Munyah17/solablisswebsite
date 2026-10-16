<?php
require_once '../config.php';

header('Content-Type: application/json');

$input = getJsonInput();
$action = $_GET['action'] ?? '';

// Login
if ($action === 'login') {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        errorResponse('Email and password are required');
    }
    
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT id, name, email, phone, role, password_hash FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user || !password_verify($password, $user['password_hash'])) {
        errorResponse('Invalid email or password');
    }
    
    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_role'] = $user['role'];
    
    // Generate simple token (session-based)
    $token = base64_encode(json_encode([
        'id' => $user['id'],
        'name' => $user['name'],
        'role' => $user['role'],
        'exp' => time() + (7 * 24 * 60 * 60) // 7 days
    ]));
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'role' => $user['role']
        ]
    ]);
}

// Register
if ($action === 'register') {
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $password = $input['password'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        errorResponse('Name, email and password are required');
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        errorResponse('Invalid email address');
    }
    
    if (strlen($password) < 6) {
        errorResponse('Password must be at least 6 characters');
    }
    
    $pdo = getDB();
    
    // Check if email exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        errorResponse('Email already registered');
    }
    
    // Create user
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, role, password_hash) VALUES (?, ?, ?, 'client', ?)");
    $stmt->execute([$name, $email, $phone, $passwordHash]);
    
    $userId = $pdo->lastInsertId();
    
    // Set session
    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $name;
    $_SESSION['user_role'] = 'client';
    
    $token = base64_encode(json_encode([
        'id' => $userId,
        'name' => $name,
        'role' => 'client',
        'exp' => time() + (7 * 24 * 60 * 60)
    ]));
    
    jsonResponse([
        'token' => $token,
        'user' => [
            'id' => $userId,
            'name' => $name,
            'email' => $email,
            'role' => 'client'
        ]
    ]);
}

// Logout
if ($action === 'logout') {
    session_destroy();
    jsonResponse(['success' => true]);
}

// Get current user
if ($action === 'me') {
    $user = getAuthUser();
    if (!$user) {
        errorResponse('Not authenticated', 401);
    }
    jsonResponse(['user' => $user]);
}

errorResponse('Invalid action');
