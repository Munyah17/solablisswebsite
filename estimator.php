<?php
// Solabliss — rule-based AI-style solar sizing & costing engine (PHP version)
// Given an appliance audit, produces a full engineered estimate

require_once 'config.php';

const INVERTER_SIZES = [1000, 1500, 2000, 3000, 3500, 5000, 6000, 8000, 10000, 12000, 16000, 20000, 30000, 50000];

function roundUp($value, $step) {
    return ceil($value / $step) * $step;
}

function nextSize($w) {
    foreach (INVERTER_SIZES as $s) {
        if ($s >= $w) return $s;
    }
    return ceil($w / 10000) * 10000;
}

function money($n) {
    return round($n * 100) / 100;
}

// Get all settings from database
function getSettings() {
    $pdo = getDB();
    
    $defaults = [
        'company_name' => 'Solabliss',
        'currency' => 'USD',
        'vat_rate' => '15.5',
        'default_sun_hours' => '5.2',
        'price_panel_per_w' => '0.32',
        'panel_unit_w' => '550',
        'price_battery_kwh' => '280',
        'price_inverter_per_w' => '0.22',
        'price_controller' => '180',
        'price_bos_pct' => '12',
        'price_install_pct' => '15',
        'price_margin_pct' => '10',
        'labour_base' => '150'
    ];
    
    $stmt = $pdo->query("SELECT `key`, value FROM settings");
    $rows = $stmt->fetchAll();
    
    $settings = $defaults;
    foreach ($rows as $row) {
        $settings[$row['key']] = $row['value'];
    }
    
    return $settings;
}

// Get product catalog
function getCatalog() {
    $pdo = getDB();
    try {
        $stmt = $pdo->query("SELECT * FROM products WHERE active = 1");
        return $stmt->fetchAll();
    } catch (Exception $e) {
        return [];
    }
}

// Pick a product from catalog
function pickProduct($cat, $need = []) {
    $catalog = getCatalog();
    $items = [];
    
    foreach ($catalog as $p) {
        if ($p['category'] === $cat) {
            $match = true;
            if (isset($need['minW']) && $p['capacity_w'] < $need['minW']) $match = false;
            if (isset($need['minKwh']) && $p['capacity_kwh'] < $need['minKwh']) $match = false;
            if ($match) $items[] = $p;
        }
    }
    
    if (empty($items)) return null;
    
    // Sort: preferred first, then by price per unit capacity
    usort($items, function($a, $b) {
        if ($b['preferred'] != $a['preferred']) {
            return $b['preferred'] - $a['preferred'];
        }
        $capA = $a['capacity_w'] ?: $a['capacity_kwh'] ?: 1;
        $capB = $b['capacity_w'] ?: $b['capacity_kwh'] ?: 1;
        $pricePerA = $a['price'] / $capA;
        $pricePerB = $b['price'] / $capB;
        if (abs($pricePerA - $pricePerB) > 0.01) {
            return $pricePerA - $pricePerB;
        }
        return $a['price'] - $b['price'];
    });
    
    return $items[0];
}

// Main estimate function
function calculateEstimate($appliances, $opts = []) {
    $S = getSettings();
    
    $sunHours = floatval($opts['sunHours'] ?? $S['default_sun_hours'] ?? 5);
    $autonomyDays = intval($opts['autonomyDays'] ?? ($opts['systemType'] === 'offgrid' ? 2 : 1));
    $batteryType = $opts['batteryType'] ?? 'lithium';
    $DoD = $batteryType === 'lithium' ? 0.9 : 0.5;
    $invEff = 0.92;
    $sysEff = 0.78;
    
    $dailyWh = 0;
    $peakW = 0;
    $peakSurgeW = 0;
    $auditRows = [];
    
    foreach ($appliances ?? [] as $a) {
        $watts = floatval($a['watts'] ?? 0);
        $qty = max(1, intval($a['qty'] ?? 1));
        $hours = floatval($a['hours'] ?? 0);
        $surge = floatval($a['surge'] ?? 1);
        
        $wh = $watts * $qty * $hours;
        $dailyWh += $wh;
        $peakW += $watts * $qty;
        $peakSurgeW += $watts * $qty * $surge;
        
        $auditRows[] = [
            'name' => $a['name'],
            'watts' => $watts,
            'qty' => $qty,
            'hours' => $hours,
            'wh' => round($wh)
        ];
    }
    
    $dailyKwh = money($dailyWh / 1000);
    
    // Diversity factor
    $diversity = $peakW > 5000 ? 0.6 : 0.7;
    $designLoad = max($peakW * $diversity, $peakSurgeW * 0.8);
    $inverterW = nextSize(max($designLoad * 1.25, 800));
    $inverterKva = $inverterW / 1000;
    
    // Battery sizing
    $needsBattery = ($opts['systemType'] ?? 'hybrid') !== 'gridtie';
    $usableDailyWh = $needsBattery ? $dailyWh * (($opts['systemType'] ?? 'hybrid') === 'backup' ? 0.6 : 1) : 0;
    $batteryKwh = $needsBattery ? money(max(roundUp($usableDailyWh * $autonomyDays / $DoD / $invEff, 500) / 1000, 2.56)) : 0;
    $bankVoltage = $inverterW <= 1500 ? 12 : ($inverterW <= 5000 ? 24 : 48);
    
    // Solar array sizing
    $systemType = $opts['systemType'] ?? 'hybrid';
    $arrayW = $systemType === 'backup'
        ? roundUp(max($dailyWh * 0.5 / ($sunHours * $sysEff), 800), 100)
        : roundUp($dailyWh / ($sunHours * $sysEff), 100);
    
    // Product selection
    $panelProd = pickProduct('panel');
    $panelW = $panelProd ? $panelProd['capacity_w'] : floatval($S['panel_unit_w'] ?? 550);
    $panelCount = max(2, ceil($arrayW / $panelW));
    $actualArrayW = $panelCount * $panelW;
    $controllerA = ceil(($actualArrayW / $bankVoltage) * 1.25);
    
    $invProd = pickProduct('inverter', ['minW' => $inverterW]);
    $battProd = ($needsBattery && $batteryType === 'lithium') ? pickProduct('battery') : null;
    $battQty = $battProd ? max(1, ceil($batteryKwh / $battProd['capacity_kwh'])) : 0;
    if ($battProd) $batteryKwh = money($battQty * $battProd['capacity_kwh']);
    
    $usesController = $systemType !== 'offgrid' && $systemType !== 'hybrid';
    $ctrlProd = $usesController ? pickProduct('controller') : null;
    
    // Pricing
    $panelUnit = $panelProd ? $panelProd['price'] : $panelW * floatval($S['price_panel_per_w']);
    $hardware = [
        'panels' => $panelCount * $panelUnit,
        'inverter' => $invProd ? $invProd['price'] : $inverterW * floatval($S['price_inverter_per_w']),
        'battery' => $battProd ? $battQty * $battProd['price'] : $batteryKwh * floatval($S['price_battery_kwh']),
        'controller' => $usesController ? ($ctrlProd ? $ctrlProd['price'] : floatval($S['price_controller'])) : 0
    ];
    
    $hardwareSub = $hardware['panels'] + $hardware['inverter'] + $hardware['battery'] + $hardware['controller'];
    $bos = $hardwareSub * floatval($S['price_bos_pct']) / 100;
    $install = $hardwareSub * floatval($S['price_install_pct']) / 100 + floatval($S['labour_base']);
    $margin = ($hardwareSub + $bos + $install) * floatval($S['price_margin_pct']) / 100;
    $subtotal = $hardwareSub + $bos + $install + $margin;
    $vatRate = floatval($S['vat_rate'] ?? 0);
    $vat = $subtotal * $vatRate / 100;
    $total = $subtotal + $vat;
    
    // Build items list
    $items = [];
    $items[] = [
        'item' => $panelProd
            ? "{$panelProd['brand']} {$panelProd['model']} — " . ($panelProd['spec'] ?? $panelW . 'W') . " (x{$panelCount}, " . number_format($actualArrayW / 1000, 1) . "kW array)"
            : "{$panelW}W Mono Solar Panels (x{$panelCount}) — " . number_format($actualArrayW / 1000, 1) . "kW array",
        'qty' => $panelCount,
        'unit_price' => money($panelUnit),
        'total' => money($hardware['panels'])
    ];
    
    $items[] = [
        'item' => $invProd
            ? "{$invProd['brand']} {$invProd['model']} — " . ($invProd['spec'] ?? $inverterKva . 'kVA') . " ({$bankVoltage}V system)"
            : "{$inverterKva}kVA " . ($systemType === 'gridtie' ? 'Grid-Tied' : 'Hybrid') . " Inverter ({$bankVoltage}V)",
        'qty' => 1,
        'unit_price' => money($hardware['inverter']),
        'total' => money($hardware['inverter'])
    ];
    
    if ($needsBattery) {
        $items[] = $battProd
            ? [
                'item' => "{$battProd['brand']} {$battProd['model']} — " . ($battProd['spec'] ?? $battProd['capacity_kwh'] . 'kWh') . " (x{$battQty} = {$batteryKwh}kWh bank)",
                'qty' => $battQty,
                'unit_price' => money($battProd['price']),
                'total' => money($hardware['battery'])
            ]
            : [
                'item' => ($batteryType === 'lithium' ? 'LiFePO4 Lithium' : 'Deep-Cycle Gel') . " Battery Bank — {$batteryKwh}kWh",
                'qty' => 1,
                'unit_price' => money($hardware['battery']),
                'total' => money($hardware['battery'])
            ];
    }
    
    if ($hardware['controller']) {
        $items[] = $ctrlProd
            ? [
                'item' => "{$ctrlProd['brand']} {$ctrlProd['model']} — " . ($ctrlProd['spec'] ?? 'MPPT') . " (sized {$controllerA}A)",
                'qty' => 1,
                'unit_price' => money($ctrlProd['price']),
                'total' => money($hardware['controller'])
            ]
            : [
                'item' => "MPPT Charge Controller {$controllerA}A",
                'qty' => 1,
                'unit_price' => money($hardware['controller']),
                'total' => money($hardware['controller'])
            ];
    }
    
    $items[] = [
        'item' => 'Balance of System (mounting, cabling, breakers, surge protection)',
        'qty' => 1,
        'unit_price' => money($bos),
        'total' => money($bos)
    ];
    
    $items[] = [
        'item' => 'Engineering, Installation & Commissioning',
        'qty' => 1,
        'unit_price' => money($install),
        'total' => money($install)
    ];
    
    $items[] = [
        'item' => 'Project Management & Support Margin',
        'qty' => 1,
        'unit_price' => money($margin),
        'total' => money($margin)
    ];
    
    // Package classification
    if ($inverterKva <= 2) $pkg = 'Essential Home Backup';
    elseif ($inverterKva <= 5) $pkg = 'Comfort Home System';
    elseif ($inverterKva <= 12) $pkg = 'Premium Whole-Home';
    elseif ($inverterKva <= 30) $pkg = 'Commercial Power';
    else $pkg = 'Industrial Scale';
    
    // Rationale
    $rationaleParts = [
        "Audited " . count($auditRows) . " appliance types totalling {$dailyKwh}kWh/day and " . number_format($peakW / 1000, 1) . "kW connected load.",
        "Applied " . round($diversity * 100) . "% diversity factor → " . number_format($designLoad / 1000, 1) . "kW design load; sized a {$inverterKva}kVA inverter with 25% headroom for surges" . ($peakSurgeW > $peakW * 1.2 ? ' (motor/compressor start-up detected)' : '') . ".",
        $needsBattery ? "Storage: {$batteryKwh}kWh {$batteryType} bank at {$bankVoltage}V gives ~{$autonomyDays} day" . ($autonomyDays > 1 ? 's' : '') . " autonomy at " . round($DoD * 100) . "% depth-of-discharge." : 'Grid-tied configuration — no storage specified; export/load-offset optimised.',
        "Array: {$panelCount} x {$panelW}W (" . number_format($actualArrayW / 1000, 1) . "kWp) sized on {$sunHours} peak-sun-hours and " . round($sysEff * 100) . "% system efficiency.",
        "Recommended package class: {$pkg}.",
        "Selected equipment: " . implode(', ', array_filter([$panelProd, $invProd, $battProd, $ctrlProd], function($p) { return $p !== null; })) ?: 'rate-based (no catalog match)'
    ];
    
    $rationale = implode(' ', $rationaleParts);
    
    return [
        'dailyKwh' => $dailyKwh,
        'peakW' => round($peakW),
        'designLoad' => round($designLoad),
        'inverterW' => $inverterW,
        'inverterKva' => $inverterKva,
        'bankVoltage' => $bankVoltage,
        'batteryKwh' => $batteryKwh,
        'batteryType' => $batteryType,
        'autonomyDays' => $autonomyDays,
        'panelCount' => $panelCount,
        'panelW' => $panelW,
        'arrayW' => $actualArrayW,
        'controllerA' => $controllerA,
        'sunHours' => $sunHours,
        'systemType' => $systemType,
        'package' => $pkg,
        'items' => $items,
        'subtotal' => money($subtotal),
        'vatRate' => $vatRate,
        'vat' => money($vat),
        'total' => money($total),
        'currency' => $S['currency'] ?? 'USD',
        'auditRows' => $auditRows,
        'rationale' => $rationale
    ];
}
