<?php
// Generate bcrypt hash for griezmann17
$password = 'griezmann17';
$hash = password_hash($password, PASSWORD_DEFAULT);
echo "Password: $password\n";
echo "Bcrypt Hash: $hash\n";
echo "\nSQL Query (UPDATE existing user):\n";
echo "UPDATE users SET password_hash = '$hash' WHERE email = 'admin@demo.com';\n";
echo "\nOR (DELETE and INSERT):\n";
echo "DELETE FROM users WHERE email = 'admin@demo.com';\n";
echo "INSERT INTO users (name, email, phone, role, password_hash, created_at) \n";
echo "VALUES ('Admin', 'admin@demo.com', NULL, 'admin', '$hash', NOW());\n";
