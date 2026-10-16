<?php
require_once '../config.php';

header('Content-Type: application/json');

$pdo = getDB();
$method = getMethod();
$input = getJsonInput();
$action = $_GET['action'] ?? '';

// Require authentication for all admin endpoints
$user = getAuthUser();
if (!$user || !in_array($user['role'], ['admin', 'staff'])) {
    errorResponse('Unauthorized', 401);
}

// GET users list
if ($action === 'users' && $method === 'GET') {
    $stmt = $pdo->query("SELECT id, name, email, phone, role, created_at FROM users ORDER BY created_at DESC");
    jsonResponse($stmt->fetchAll());
}

// POST create user
if ($action === 'users' && $method === 'POST') {
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $role = $input['role'] ?? 'client';
    $password = $input['password'] ?? '';
    
    if (empty($name) || empty($email) || empty($password)) {
        errorResponse('Name, email and password required');
    }
    
    $passwordHash = password_hash($password, PASSWORD_DEFAULT);
    $stmt = $pdo->prepare("INSERT INTO users (name, email, phone, role, password_hash) VALUES (?, ?, ?, ?, ?)");
    $stmt->execute([$name, $email, $phone, $role, $passwordHash]);
    
    jsonResponse(['success' => true, 'id' => $pdo->lastInsertId()]);
}

// PUT update user
if (preg_match('#^users/(\d+)$#', $action, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $role = $input['role'] ?? 'client';
    
    if ($id == $user['id']) {
        errorResponse('Cannot edit yourself');
    }
    
    $stmt = $pdo->prepare("UPDATE users SET name=?, email=?, phone=?, role=? WHERE id=?");
    $stmt->execute([$name, $email, $phone, $role, $id]);
    
    jsonResponse(['success' => true]);
}

// DELETE user
if (preg_match('#^users/(\d+)$#', $action, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    
    if ($id == $user['id']) {
        errorResponse('Cannot delete yourself');
    }
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id=?");
    $stmt->execute([$id]);
    
    jsonResponse(['success' => true]);
}

// GET quotes
if ($action === 'quotes' && $method === 'GET') {
    $stmt = $pdo->query("SELECT q.*, qi.* FROM quotes q LEFT JOIN quote_items qi ON q.id = qi.quote_id ORDER BY q.created_at DESC");
    $quotes = [];
    while ($row = $stmt->fetch()) {
        $qid = $row['id'];
        if (!isset($quotes[$qid])) {
            $quotes[$qid] = [
                'id' => $row['id'],
                'ref' => $row['ref'],
                'client_name' => $row['client_name'],
                'client_email' => $row['client_email'],
                'client_phone' => $row['client_phone'],
                'system_type' => $row['system_type'],
                'subtotal' => $row['subtotal'],
                'vat' => $row['vat'],
                'total' => $row['total'],
                'status' => $row['status'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'items' => []
            ];
        }
        if ($row['item']) {
            $quotes[$qid]['items'][] = [
                'item' => $row['item'],
                'qty' => $row['qty'],
                'unit_price' => $row['unit_price'],
                'total' => $row['total']
            ];
        }
    }
    jsonResponse(array_values($quotes));
}

// POST create quote
if ($action === 'quotes' && $method === 'POST') {
    $clientName = $input['client_name'] ?? '';
    $clientEmail = $input['client_email'] ?? '';
    $clientPhone = $input['client_phone'] ?? '';
    $systemType = $input['system_type'] ?? '';
    $estimateJson = json_encode($input['estimate'] ?? []);
    $items = $input['items'] ?? [];
    $notes = $input['notes'] ?? '';
    
    if (empty($clientName)) {
        errorResponse('Client name required');
    }
    
    $subtotal = array_sum(array_column($items, 'total'));
    $pdo->beginTransaction();
    
    $ref = 'QT-' . str_pad($pdo->query("SELECT COUNT(*) FROM quotes")->fetchColumn() + 1, 5, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO quotes (ref, client_name, client_email, client_phone, system_type, estimate_json, subtotal, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?, 'Draft', ?)");
    $stmt->execute([$ref, $clientName, $clientEmail, $clientPhone, $systemType, $estimateJson, $subtotal, $notes]);
    
    $quoteId = $pdo->lastInsertId();
    
    foreach ($items as $item) {
        $istmt = $pdo->prepare("INSERT INTO quote_items (quote_id, item, qty, unit_price, total) VALUES (?, ?, ?, ?, ?)");
        $istmt->execute([$quoteId, $item['item'], $item['qty'], $item['unit_price'], $item['total']]);
    }
    
    $pdo->commit();
    jsonResponse(['success' => true, 'id' => $quoteId, 'ref' => $ref]);
}

// GET invoices
if ($action === 'invoices' && $method === 'GET') {
    $stmt = $pdo->query("SELECT i.*, ii.* FROM invoices i LEFT JOIN invoice_items ii ON i.id = ii.invoice_id ORDER BY i.created_at DESC");
    $invoices = [];
    while ($row = $stmt->fetch()) {
        $iid = $row['id'];
        if (!isset($invoices[$iid])) {
            $invoices[$iid] = [
                'id' => $row['id'],
                'ref' => $row['ref'],
                'client_name' => $row['client_name'],
                'client_email' => $row['client_email'],
                'client_phone' => $row['client_phone'],
                'subtotal' => $row['subtotal'],
                'vat' => $row['vat'],
                'total' => $row['total'],
                'paid' => $row['paid'],
                'status' => $row['status'],
                'due_date' => $row['due_date'],
                'notes' => $row['notes'],
                'created_at' => $row['created_at'],
                'items' => []
            ];
        }
        if ($row['item']) {
            $invoices[$iid]['items'][] = [
                'item' => $row['item'],
                'qty' => $row['qty'],
                'unit_price' => $row['unit_price'],
                'total' => $row['total']
            ];
        }
    }
    jsonResponse(array_values($invoices));
}

// POST create invoice
if ($action === 'invoices' && $method === 'POST') {
    $clientName = $input['client_name'] ?? '';
    $clientEmail = $input['client_email'] ?? '';
    $clientPhone = $input['client_phone'] ?? '';
    $items = $input['items'] ?? [];
    $dueDate = $input['due_date'] ?? null;
    $notes = $input['notes'] ?? '';
    
    if (empty($clientName)) {
        errorResponse('Client name required');
    }
    
    $subtotal = array_sum(array_column($items, 'total'));
    $pdo->beginTransaction();
    
    $ref = 'INV-' . str_pad($pdo->query("SELECT COUNT(*) FROM invoices")->fetchColumn() + 1, 5, '0', STR_PAD_LEFT);
    
    $stmt = $pdo->prepare("INSERT INTO invoices (ref, client_name, client_email, client_phone, subtotal, status, due_date, notes) VALUES (?, ?, ?, ?, ?, 'Unpaid', ?, ?)");
    $stmt->execute([$ref, $clientName, $clientEmail, $clientPhone, $subtotal, $dueDate, $notes]);
    
    $invoiceId = $pdo->lastInsertId();
    
    foreach ($items as $item) {
        $istmt = $pdo->prepare("INSERT INTO invoice_items (invoice_id, item, qty, unit_price, total) VALUES (?, ?, ?, ?, ?)");
        $istmt->execute([$invoiceId, $item['item'], $item['qty'], $item['unit_price'], $item['total']]);
    }
    
    $pdo->commit();
    jsonResponse(['success' => true, 'id' => $invoiceId, 'ref' => $ref]);
}

// POST add payment
if (preg_match('#^invoices/(\d+)/payment#', $action, $matches) && $method === 'POST') {
    $invoiceId = $matches[1];
    $amount = $input['amount'] ?? 0;
    $method = $input['method'] ?? '';
    $note = $input['note'] ?? '';
    
    if ($amount <= 0) {
        errorResponse('Invalid amount');
    }
    
    $pdo->beginTransaction();
    
    $istmt = $pdo->prepare("INSERT INTO payments (invoice_id, amount, method, note) VALUES (?, ?, ?, ?)");
    $istmt->execute([$invoiceId, $amount, $method, $note]);
    
    // Update invoice paid amount and status
    $ustmt = $pdo->prepare("UPDATE invoices SET paid = paid + ?, status = CASE WHEN paid + ? >= total THEN 'Paid' WHEN paid + ? > 0 THEN 'Part-Paid' ELSE 'Unpaid' END WHERE id = ?");
    $ustmt->execute([$amount, $amount, $amount, $invoiceId]);
    
    $pdo->commit();
    jsonResponse(['success' => true]);
}

// GET leads
if ($action === 'leads' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM leads ORDER BY created_at DESC");
    jsonResponse($stmt->fetchAll());
}

// POST create lead
if ($action === 'leads' && $method === 'POST') {
    $name = $input['name'] ?? '';
    $phone = $input['phone'] ?? '';
    $email = $input['email'] ?? '';
    $address = $input['address'] ?? '';
    $need = $input['need'] ?? 'general inquiry';
    $source = $input['source'] ?? 'website';
    $subscribed = $input['subscribed'] ?? 1;
    
    $stmt = $pdo->prepare("INSERT INTO leads (name, phone, email, address, need, source, subscribed, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'New')");
    $stmt->execute([$name, $phone, $email, $address, $need, $source, $subscribed ? 1 : 0]);
    
    jsonResponse(['success' => true]);
}

// PUT update lead status
if (preg_match('#^leads/(\d+)$#', $action, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $status = $input['status'] ?? 'New';
    
    $stmt = $pdo->prepare("UPDATE leads SET status=? WHERE id=?");
    $stmt->execute([$status, $id]);
    
    jsonResponse(['success' => true]);
}

// GET messages
if ($action === 'messages' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM messages ORDER BY created_at DESC");
    jsonResponse($stmt->fetchAll());
}

// POST create message
if ($action === 'messages' && $method === 'POST') {
    $name = $input['name'] ?? '';
    $email = $input['email'] ?? '';
    $phone = $input['phone'] ?? '';
    $subject = $input['subject'] ?? '';
    $body = $input['body'] ?? '';
    
    $stmt = $pdo->prepare("INSERT INTO messages (name, email, phone, subject, body, status) VALUES (?, ?, ?, ?, ?, 'New')");
    $stmt->execute([$name, $email, $phone, $subject, $body]);
    
    jsonResponse(['success' => true]);
}

// PUT update message status
if (preg_match('#^messages/(\d+)$#', $action, $matches) && $method === 'PUT') {
    $id = $matches[1];
    $status = $input['status'] ?? 'New';
    
    $stmt = $pdo->prepare("UPDATE messages SET status=? WHERE id=?");
    $stmt->execute([$status, $id]);
    
    jsonResponse(['success' => true]);
}

// GET projects (admin view with all fields)
if ($action === 'projects' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM projects ORDER BY completed_at DESC, created_at DESC");
    $projects = $stmt->fetchAll();
    
    foreach ($projects as &$p) {
        $p['equipment_json'] = json_decode($p['equipment_json'] ?? '[]', true);
    }
    
    jsonResponse($projects);
}

// POST create/update project
if ($action === 'projects' && $method === 'POST') {
    $id = $input['id'] ?? null;
    $data = [
        'title' => $input['title'] ?? '',
        'client' => $input['client'] ?? '',
        'location' => $input['location'] ?? '',
        'category' => $input['category'] ?? 'Commercial',
        'capacity_kw' => $input['capacity_kw'] ?? null,
        'description' => $input['description'] ?? '',
        'status' => $input['status'] ?? 'Completed',
        'featured' => $input['featured'] ?? 0,
        'completed_at' => $input['completed_at'] ?? null,
        'town' => $input['town'] ?? '',
        'site_name' => $input['site_name'] ?? '',
        'existing_setup' => $input['existing_setup'] ?? '',
        'client_need' => $input['client_need'] ?? '',
        'equipment_json' => json_encode($input['equipment'] ?? []),
        'price' => $input['price'] ?? 0,
        'install_date' => $input['install_date'] ?? null
    ];
    
    if ($id) {
        $sql = "UPDATE projects SET title=?, client=?, location=?, category=?, capacity_kw=?, description=?, status=?, featured=?, completed_at=?, town=?, site_name=?, existing_setup=?, client_need=?, equipment_json=?, price=?, install_date=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([...array_values($data), $id]);
    } else {
        $sql = "INSERT INTO projects (title, client, location, category, capacity_kw, description, status, featured, completed_at, town, site_name, existing_setup, client_need, equipment_json, price, install_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));
    }
    
    jsonResponse(['success' => true]);
}

// DELETE project
if (preg_match('#^projects/(\d+)$#', $action, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id=?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}

// GET appliances (admin view)
if ($action === 'appliances' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM appliances ORDER BY category, name");
    jsonResponse($stmt->fetchAll());
}

// POST create/update appliance
if ($action === 'appliances' && $method === 'POST') {
    $id = $input['id'] ?? null;
    $name = $input['name'] ?? '';
    $watts = $input['watts'] ?? 0;
    $surge = $input['surge'] ?? 1;
    $category = $input['category'] ?? 'General';
    $defaultHours = $input['default_hours'] ?? 1;
    
    if ($id) {
        $stmt = $pdo->prepare("UPDATE appliances SET name=?, watts=?, surge=?, category=?, default_hours=? WHERE id=?");
        $stmt->execute([$name, $watts, $surge, $category, $defaultHours, $id]);
    } else {
        $stmt = $pdo->prepare("INSERT INTO appliances (name, watts, surge, category, default_hours) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$name, $watts, $surge, $category, $defaultHours]);
    }
    
    jsonResponse(['success' => true]);
}

// DELETE appliance
if (preg_match('#^appliances/(\d+)$#', $action, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM appliances WHERE id=?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}

// GET products (admin view with inactive)
if ($action === 'products' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY category, brand");
    $products = $stmt->fetchAll();
    
    foreach ($products as &$p) {
        $p['tech_specs_json'] = json_decode($p['tech_specs_json'] ?? '[]', true);
    }
    
    jsonResponse($products);
}

// POST create/update product
if ($action === 'products' && $method === 'POST') {
    $id = $input['id'] ?? null;
    $data = [
        'category' => $input['category'] ?? 'other',
        'brand' => $input['brand'] ?? '',
        'model' => $input['model'] ?? '',
        'spec' => $input['spec'] ?? '',
        'capacity_w' => $input['capacity_w'] ?? 0,
        'capacity_kwh' => $input['capacity_kwh'] ?? 0,
        'price' => $input['price'] ?? 0,
        'preferred' => $input['preferred'] ?? 0,
        'active' => $input['active'] ?? 1,
        'warranty_years' => $input['warranty_years'] ?? 0,
        'efficiency' => $input['efficiency'] ?? 0,
        'dimensions' => $input['dimensions'] ?? '',
        'weight_kg' => $input['weight_kg'] ?? 0,
        'tech_specs_json' => json_encode($input['tech_specs'] ?? []),
        'supplier_ref' => $input['supplier_ref'] ?? '',
        'price_updated_at' => $input['price_updated_at'] ?? null
    ];
    
    if ($id) {
        $sql = "UPDATE products SET category=?, brand=?, model=?, spec=?, capacity_w=?, capacity_kwh=?, price=?, preferred=?, active=?, warranty_years=?, efficiency=?, dimensions=?, weight_kg=?, tech_specs_json=?, supplier_ref=?, price_updated_at=? WHERE id=?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([...array_values($data), $id]);
    } else {
        $sql = "INSERT INTO products (category, brand, model, spec, capacity_w, capacity_kwh, price, preferred, active, warranty_years, efficiency, dimensions, weight_kg, tech_specs_json, supplier_ref, price_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute(array_values($data));
    }
    
    jsonResponse(['success' => true]);
}

// DELETE product
if (preg_match('#^products/(\d+)$#', $action, $matches) && $method === 'DELETE') {
    $id = $matches[1];
    $stmt = $pdo->prepare("DELETE FROM products WHERE id=?");
    $stmt->execute([$id]);
    jsonResponse(['success' => true]);
}

// GET settings (admin view with all)
if ($action === 'settings' && $method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM settings ORDER BY `key`");
    jsonResponse($stmt->fetchAll());
}

// PUT update setting
if ($action === 'settings' && $method === 'PUT') {
    $key = $input['key'] ?? '';
    $value = $input['value'] ?? '';
    
    $stmt = $pdo->prepare("INSERT INTO settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value=?");
    $stmt->execute([$key, $value, $value]);
    
    jsonResponse(['success' => true]);
}

// GET dashboard stats
if ($action === 'dashboard' && $method === 'GET') {
    $stats = [
        'users' => $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn(),
        'projects' => $pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn(),
        'quotes' => $pdo->query("SELECT COUNT(*) FROM quotes")->fetchColumn(),
        'invoices' => $pdo->query("SELECT COUNT(*) FROM invoices")->fetchColumn(),
        'revenue' => $pdo->query("SELECT SUM(total) FROM invoices WHERE status='Paid'")->fetchColumn() ?: 0,
        'leads' => $pdo->query("SELECT COUNT(*) FROM leads WHERE status='New'")->fetchColumn(),
        'messages' => $pdo->query("SELECT COUNT(*) FROM messages WHERE status='New'")->fetchColumn()
    ];
    jsonResponse($stats);
}

errorResponse('Invalid action');
