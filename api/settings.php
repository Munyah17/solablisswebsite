<?php
require_once '../config.php';

header('Content-Type: application/json');

$pdo = getDB();
$method = getMethod();

// Default settings
$defaults = [
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

// GET all settings
if ($method === 'GET') {
    $stmt = $pdo->query("SELECT `key`, value FROM settings");
    $rows = $stmt->fetchAll();
    
    $settings = $defaults;
    foreach ($rows as $row) {
        $settings[$row['key']] = $row['value'];
    }
    
    jsonResponse($settings);
}

errorResponse('Method not allowed', 405);
