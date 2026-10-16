<?php
// Solabliss - Database Configuration for cPanel/MySQL
// Update these values with your actual database credentials

define('DB_HOST', 'localhost');
define('DB_NAME', 'solabliss_db');
define('DB_USER', 'your_db_username');
define('DB_PASS', 'your_db_password');
define('DB_CHARSET', 'utf8mb4');

// Secret key for JWT tokens (generate a random string)
define('JWT_SECRET', 'your-secret-key-change-this-in-production');

// Site configuration
// For root domain: define('SITE_URL', 'https://yourdomain.com');
// For subdirectory: define('SITE_URL', 'https://yourdomain.com/solablisszimbabwe.co.zw');
define('SITE_URL', 'https://yourdomain.com/solablisszimbabwe.co.zw');
define('UPLOAD_DIR', __DIR__ . '/public/img/uploads');

// Create database connection
function getDB() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ];
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            die("Database connection failed: " . $e->getMessage());
        }
    }
    
    return $pdo;
}

// JSON response helper
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Error response helper
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['error' => $message], $statusCode);
}

// Get request method
function getMethod() {
    return $_SERVER['REQUEST_METHOD'];
}

// Get JSON input
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Get authenticated user from session
function getAuthUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    $pdo = getDB();
    $stmt = $pdo->prepare("SELECT id, name, email, role FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}

// Check if user is admin
function isAdmin() {
    $user = getAuthUser();
    return $user && $user['role'] === 'admin';
}

// Check if user is staff or admin
function isStaff() {
    $user = getAuthUser();
    return $user && in_array($user['role'], ['admin', 'staff']);
}

// Start session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
