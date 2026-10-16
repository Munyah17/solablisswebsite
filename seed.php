<?php
// Solabliss - Database Seeding Script for MySQL
// Run this script after importing database.sql to populate initial data

require_once 'config.php';

$pdo = getDB();

// Check if admin user exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE role='admin' LIMIT 1");
$stmt->execute();
if ($stmt->fetch()) {
    echo "Database already seeded. Skipping.\n";
    exit;
}

echo "Seeding database...\n";

// Create admin user
$passwordHash = password_hash('admin123', PASSWORD_DEFAULT);
$stmt = $pdo->prepare("INSERT INTO users (name, email, phone, role, password_hash) VALUES (?, ?, ?, 'admin', ?)");
$stmt->execute(['Solabliss Admin', 'admin@solabliss.com', '+263770000000', $passwordHash]);
echo "✓ Admin user created (admin@solabliss.com / admin123)\n";

// Seed appliances
$appliances = [
    ['LED Light (10W)', 10, 1, 'Lighting', 5],
    ['Ceiling Fan', 75, 1, 'Cooling', 6],
    ['Fridge (Medium)', 150, 2.5, 'Kitchen', 8],
    ['Deep Freezer', 200, 2.5, 'Kitchen', 8],
    ['TV 42"', 120, 1, 'Entertainment', 4],
    ['Decoder / Wi-Fi Router', 25, 1, 'Entertainment', 12],
    ['Laptop', 65, 1, 'Office', 5],
    ['Desktop PC', 250, 1, 'Office', 6],
    ['Washing Machine', 500, 2, 'Laundry', 1],
    ['Iron', 1200, 1, 'Laundry', 0.5],
    ['Microwave', 1000, 1.8, 'Kitchen', 0.3],
    ['Kettle', 1800, 1, 'Kitchen', 0.3],
    ['Electric Stove (2 plates)', 2000, 1, 'Kitchen', 1],
    ['Borehole Pump (0.75HP)', 560, 4, 'Pumping', 1.5],
    ['Borehole Pump (1.5HP)', 1100, 4, 'Pumping', 1.5],
    ['Geyser Element (2kW)', 2000, 1, 'Heating', 2],
    ['Air Conditioner (12000BTU)', 1200, 3, 'Cooling', 5],
    ['Security Lights', 60, 1, 'Lighting', 10],
    ['Gate Motor', 350, 3, 'Security', 0.2],
    ['CCTV System', 80, 1, 'Security', 24],
    ['Welding Machine', 3000, 5, 'Industrial', 1],
    ['Cold Room Compressor', 1500, 3.5, 'Industrial', 10],
    ['Water Heater / Urn', 2500, 1, 'Kitchen', 1],
    ['Phone Charging (x5)', 50, 1, 'General', 3],
    ['Printer / Copier', 400, 2, 'Office', 1]
];

$stmt = $pdo->prepare("INSERT INTO appliances (name, watts, surge, category, default_hours) VALUES (?, ?, ?, ?, ?)");
foreach ($appliances as $a) {
    $stmt->execute($a);
}
echo "✓ " . count($appliances) . " appliances seeded\n";

// Seed projects
$projects = [
    ['12kVA Residential Hybrid System', 'Private Residence', 'Borrowdale, Harare', 'Domestic', 9.9, 'Hybrid solar system with 18x550W panels, 12kVA inverter and 20kWh lithium storage — full home backup including borehole pump and security.', 'Completed', 1, '2025-11-02', 'Harare', 'Borrowdale Residence', 'Grid only, 8-12h daily outages', 'Whole-home backup incl. borehole pump, security and fridge', json_encode([['item' => '550W Mono Panel', 'qty' => 18], ['item' => '12kVA Hybrid Inverter', 'qty' => 1], ['item' => '5.12kWh LiFePO4 Battery', 'qty' => 4], ['item' => 'DB + surge protection', 'qty' => 1]]), 14500, '2025-11-02'],
    ['30kW Commercial Rooftop Array', 'Retail Distribution Centre', 'Msasa, Harare', 'Commercial', 30, 'Grid-tied 30kW system offsetting 60% of daytime load; remote monitoring and net metering consultation.', 'Completed', 1, '2025-08-19', 'Harare', 'Msasa Distribution Centre', 'Grid + 100kVA diesel genset', 'Reduce daytime consumption and genset runtime', json_encode([['item' => '550W Mono Panel', 'qty' => 54], ['item' => '30kW Grid-Tied Inverter', 'qty' => 1], ['item' => 'Remote monitoring', 'qty' => 1]]), 22000, '2025-08-19'],
    ['Borehole Solar Pumping — Farm Estate', 'Agri Client', 'Mazowe', 'Industrial', 7.5, 'Solar-powered 3HP borehole pumping with elevated tank storage, irrigation timers and surge protection.', 'Completed', 1, '2026-01-27', 'Mazowe', 'Farm Estate Borehole', 'Manual borehole, no grid power', 'Reliable irrigation water supply', json_encode([['item' => '3HP Solar Pump', 'qty' => 1], ['item' => '550W Mono Panel', 'qty' => 12], ['item' => 'VSD Pump Controller', 'qty' => 1], ['item' => 'Tank level sensors', 'qty' => 2]]), 6800, '2026-01-27'],
    ['Factory Load Audit & 50kW Design', 'Manufacturing Plant', 'Bulawayo', 'Consulting', 50, 'Full energy audit, load profiling and engineered design for phased 50kW industrial solar rollout.', 'Completed', 0, '2026-03-14', 'Bulawayo', 'Manufacturing Plant', 'Grid + 200kVA genset', 'Energy audit and phased solar design', json_encode([['item' => 'Energy audit & load profiling', 'qty' => 1], ['item' => '50kW system design pack', 'qty' => 1]]), 3500, '2026-03-14'],
    ['Office Block Backup Power Upgrade', 'Corporate Offices', 'CBD, Harare', 'Commercial', 15, 'Inverter + lithium upgrade for server room and critical loads; seamless changeover under 10ms.', 'Completed', 1, '2026-05-30', 'Harare', 'CBD Office Block', 'Ageing UPS units, frequent failures', 'Seamless server-room and critical-load backup', json_encode([['item' => '15kVA Inverter', 'qty' => 1], ['item' => '5kWh Lithium Modules', 'qty' => 5], ['item' => 'ATS <10ms', 'qty' => 1]]), 11800, '2026-05-30'],
    ['5kVA Starter Home System', 'Private Residence', 'Ruwa', 'Domestic', 2.75, 'Entry-level backup: lighting, entertainment, refrigeration and Wi-Fi — expandable design.', 'Completed', 0, '2026-07-11', 'Ruwa', 'Ruwa Residence', 'Grid only', 'Lights, TV, fridge and Wi-Fi backup', json_encode([['item' => '550W Mono Panel', 'qty' => 5], ['item' => '5kVA Hybrid Inverter', 'qty' => 1], ['item' => '5kWh Lithium', 'qty' => 1]]), 3900, '2026-07-11'],
    ['20kW Safari Lodge Hybrid', 'Guest Lodge', 'Victoria Falls', 'Commercial', 20, 'Off-grid lodge power: guest rooms, kitchen and cold storage with generator interlock.', 'Completed', 1, '2025-12-08', 'Victoria Falls', 'Safari Lodge', 'Diesel genset only, high fuel cost', 'Cut diesel usage 80%, quiet nights for guests', json_encode([['item' => '550W Mono Panel', 'qty' => 36], ['item' => '20kVA Hybrid Inverter', 'qty' => 1], ['item' => '10kWh Lithium', 'qty' => 3], ['item' => 'Genset interlock ATS', 'qty' => 1]]), 26500, '2025-12-08'],
    ['School Solar + Computer Lab', 'Private School', 'Mutare', 'Commercial', 8, 'Solar for admin block and 30-seat computer lab with surge-protected circuits.', 'Completed', 0, '2026-02-20', 'Mutare', 'School Campus', 'Grid only, lab unusable during outages', 'Keep computer lab and admin powered all day', json_encode([['item' => '550W Mono Panel', 'qty' => 15], ['item' => '8kVA Hybrid Inverter', 'qty' => 1], ['item' => '5.12kWh LiFePO4', 'qty' => 2]]), 9200, '2026-02-20']
];

$stmt = $pdo->prepare("INSERT INTO projects (title, client, location, category, capacity_kw, description, status, featured, completed_at, town, site_name, existing_setup, client_need, equipment_json, price, install_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($projects as $p) {
    $stmt->execute($p);
}
echo "✓ " . count($projects) . " projects seeded\n";

// Seed products
$products = [
    ['panel', 'Longi', 'Hi-MO 6 LR5-72HPH-555M', '555W Mono PERC', 555, 0, 178, 0],
    ['panel', 'Jinko Solar', 'Tiger Neo N-type', '575W N-type Mono', 575, 0, 172, 1],
    ['panel', 'Canadian Solar', 'TOPHiKu6', '580W TOPCon', 580, 0, 185, 0],
    ['panel', 'JA Solar', 'DeepBlue 4.0', '550W Mono PERC', 550, 0, 158, 0],
    ['inverter', 'Growatt', 'SPF 5000 ES', '5kVA 48V off-grid/hybrid', 5000, 0, 650, 1],
    ['inverter', 'Deye', 'SUN-8K-SG04LP3', '8kW 48V hybrid', 8000, 0, 1650, 1],
    ['battery', 'Svolt', '5.12kWh', '51.2V 100Ah LiFePO4', 0, 5.12, 980, 1],
    ['battery', 'Dyness', 'A48100', '4.8kWh 48V rack', 0, 4.8, 1050, 1],
    ['battery', 'Pylontech', 'US5000', '4.8kWh 48V rack', 0, 4.8, 1580, 0],
    ['controller', 'Victron', 'SmartSolar MPPT 100/50', '50A MPPT', 0, 0, 380, 1]
];

$stmt = $pdo->prepare("INSERT INTO products (category, brand, model, spec, capacity_w, capacity_kwh, price, preferred) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($products as $p) {
    $stmt->execute($p);
}
echo "✓ " . count($products) . " products seeded\n";

// Seed default settings
$settings = [
    'company_name' => 'Solabliss',
    'legal_name' => 'Solabliss Zimbabwe Pvt Ltd',
    'tagline' => 'Engineered Renewable Energy Solutions',
    'email' => 'sales@solablisszimbabwe.co.zw',
    'phone' => '+263 788 684 425',
    'phone_alt' => '+263779200260',
    'whatsapp' => '263788684425',
    'address' => '24 Midlothian Avenue, Eastlea, Harare',
    'tax_reg' => '2001833427 : 24919A0212025',
    'currency' => 'USD',
    'vat_rate' => '15.5',
    'quote_validity_days' => '5',
    'payment_terms' => "Preferably we accept once off payment but not limited to installments after a deposit.\nWe don't do Cash ON Delivery services.",
    'quote_note' => 'Please note that all quotations from Solabliss are valid for 5 days from the day of issuance in that period we wish to hear from you for confirmation and way forward. Our combo packages comes with a workmanship warranty of 12 months and after sale support of a lifetime.',
    'price_panel_per_w' => '0.32',
    'panel_unit_w' => '550',
    'price_battery_kwh' => '280',
    'price_inverter_per_w' => '0.22',
    'price_controller' => '180',
    'price_bos_pct' => '12',
    'price_install_pct' => '15',
    'price_margin_pct' => '10',
    'default_sun_hours' => '5.2',
    'labour_base' => '150'
];

$stmt = $pdo->prepare("INSERT INTO settings (`key`, value) VALUES (?, ?)");
foreach ($settings as $key => $value) {
    $stmt->execute([$key, $value]);
}
echo "✓ " . count($settings) . " settings seeded\n";

// Seed sample leads
$leads = [
    ['T. Mukono', '0772 111 222', 'tmukono@example.com', '12 Greendale Ave, Harare', 'new installation', 'website', 1],
    ['Chisipite School', '0242 555 010', 'admin@chisipite.example', 'Chisipite, Harare', 'consulting', 'referral', 1],
    ['Farm Co-op Rusape', '0778 900 300', '', 'Rusape', 'sizing', 'sizing wizard', 1]
];

$stmt = $pdo->prepare("INSERT INTO leads (name, phone, email, address, need, source, subscribed, status) VALUES (?, ?, ?, ?, ?, ?, ?, 'New')");
foreach ($leads as $l) {
    $stmt->execute($l);
}
echo "✓ " . count($leads) . " leads seeded\n";

// Seed net metering data
$netMetering = [
    ['Msasa Distribution Centre', 'Retail Distribution Centre', '2026-08', 12400, 3890, 0.14, 0.10, 'First full month of export metering'],
    ['Msasa Distribution Centre', 'Retail Distribution Centre', '2026-09', 11820, 4120, 0.14, 0.10, ''],
    ['CBD Office Block', 'Corporate Offices', '2026-09', 3100, 640, 0.14, 0.10, 'Weekend export only']
];

$stmt = $pdo->prepare("INSERT INTO net_metering (site_name, client, period, imported_kwh, exported_kwh, rate_import, rate_export, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
foreach ($netMetering as $nm) {
    $stmt->execute($nm);
}
echo "✓ " . count($netMetering) . " net metering records seeded\n";

echo "\nDatabase seeding complete!\n";
