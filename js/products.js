// Solabliss products catalog
const $el = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });

let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';

async function loadProducts() {
  try {
    allProducts = await api('api/products.php');
    renderProducts();
  } catch (e) {
    // Static fallback for Vercel deployment
    allProducts = [
      { id: 1, category: 'panel', brand: 'Jinko Solar', model: 'Tiger Neo N-type', spec: '575W N-type Mono', capacity_w: 575, capacity_kwh: 0, price: 172, preferred: true, active: true, warranty_years: 25, efficiency: 22.5 },
      { id: 2, category: 'panel', brand: 'Longi', model: 'Hi-MO 6 LR5-72HPH-555M', spec: '555W Mono PERC', capacity_w: 555, capacity_kwh: 0, price: 178, preferred: false, active: true, warranty_years: 25, efficiency: 21.8 },
      { id: 3, category: 'panel', brand: 'Canadian Solar', model: 'TOPHiKu6', spec: '580W TOPCon', capacity_w: 580, capacity_kwh: 0, price: 185, preferred: false, active: true, warranty_years: 25, efficiency: 22.3 },
      { id: 4, category: 'inverter', brand: 'Growatt', model: 'SPF 5000 ES', spec: '5kVA 48V off-grid/hybrid', capacity_w: 5000, capacity_kwh: 0, price: 650, preferred: true, active: true, warranty_years: 5, efficiency: 95 },
      { id: 5, category: 'inverter', brand: 'Deye', model: 'SUN-8K-SG04LP3', spec: '8kW 48V hybrid', capacity_w: 8000, capacity_kwh: 0, price: 1650, preferred: true, active: true, warranty_years: 5, efficiency: 96 },
      { id: 6, category: 'battery', brand: 'Svolt', model: '5.12kWh', spec: '51.2V 100Ah LiFePO4', capacity_w: 0, capacity_kwh: 5.12, price: 980, preferred: true, active: true, warranty_years: 10 },
      { id: 7, category: 'battery', brand: 'Dyness', model: 'A48100', spec: '4.8kWh 48V rack', capacity_w: 0, capacity_kwh: 4.8, price: 1050, preferred: true, active: true, warranty_years: 10 },
      { id: 8, category: 'battery', brand: 'Pylontech', model: 'US5000', spec: '4.8kWh 48V rack', capacity_w: 0, capacity_kwh: 4.8, price: 1580, preferred: false, active: true, warranty_years: 10 },
      { id: 9, category: 'controller', brand: 'Victron', model: 'SmartSolar MPPT 100/50', spec: '50A MPPT', capacity_w: 0, capacity_kwh: 0, price: 380, preferred: true, active: true, warranty_years: 5 },
      { id: 10, category: 'controller', brand: 'SRNE', model: 'MC48100N15', spec: '100A MPPT', capacity_w: 0, capacity_kwh: 0, price: 260, preferred: false, active: true, warranty_years: 5 }
    ];
    renderProducts();
  }
}

function renderProducts() {
  const filtered = allProducts.filter(p => {
    const matchesCategory = currentCategory === 'all' || p.category === currentCategory;
    const matchesSearch = !searchQuery ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.spec && p.spec.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && p.active;
  });

  if (filtered.length === 0) {
    $el('productsGrid').innerHTML = '<p class="text-slate-500 col-span-full">No products found matching your criteria.</p>';
    return;
  }

  $el('productsGrid').innerHTML = filtered.map(p => {
    let techSpecs = {};
    try { techSpecs = p.tech_specs_json ? JSON.parse(p.tech_specs_json) : {}; } catch { }

    return `
    <div class="card !p-5">
      <div class="flex justify-between items-start mb-3">
        <span class="badge bg-white/10">${p.category}</span>
        ${p.preferred ? '<span class="text-sola-400 text-sm">★ Preferred</span>' : ''}
      </div>
      <h3 class="font-bold text-white text-lg">${esc(p.brand)} ${esc(p.model)}</h3>
      <p class="text-sm text-slate-400 mt-1">${esc(p.spec || '')}</p>
      <div class="mt-4 space-y-2">
        ${p.capacity_w ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Capacity</span><span class="text-white">${p.capacity_w}W</span></div>` : ''}
        ${p.capacity_kwh ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Capacity</span><span class="text-white">${p.capacity_kwh}kWh</span></div>` : ''}
        ${p.warranty_years ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Warranty</span><span class="text-white">${p.warranty_years} years</span></div>` : ''}
        ${p.efficiency ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Efficiency</span><span class="text-white">${p.efficiency}%</span></div>` : ''}
        ${p.dimensions ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Dimensions</span><span class="text-white text-xs">${esc(p.dimensions)}</span></div>` : ''}
        ${p.weight_kg ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Weight</span><span class="text-white">${p.weight_kg}kg</span></div>` : ''}
        ${p.supplier_ref ? `<div class="flex justify-between text-sm"><span class="text-slate-500">SKU</span><span class="text-white text-xs">${esc(p.supplier_ref)}</span></div>` : ''}
        ${p.price_updated_at ? `<div class="flex justify-between text-sm"><span class="text-slate-500">Price updated</span><span class="text-white text-xs">${p.price_updated_at.slice(0, 10)}</span></div>` : ''}
        <div class="flex justify-between text-sm"><span class="text-slate-500">Price</span><span class="text-sola-400 font-semibold">${fmt(p.price)}</span></div>
      </div>
      ${Object.keys(techSpecs).length > 0 ? `
        <div class="mt-4 pt-3 border-t border-white/[0.06]">
          <p class="text-xs text-slate-500 mb-2">Additional specs:</p>
          ${Object.entries(techSpecs).map(([k, v]) => `<div class="flex justify-between text-xs"><span class="text-slate-500">${esc(k)}</span><span class="text-slate-300">${esc(v)}</span></div>`).join('')}
        </div>
      ` : ''}
      <a href="sizing.html" class="btn btn-primary mt-4 block text-center !w-full">Get a quote</a>
    </div>
  `;
  }).join('');
}

// Category filtering
document.querySelectorAll('[data-cat]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-cat]').forEach(b => b.classList.remove('nav-active'));
    btn.classList.add('nav-active');
    currentCategory = btn.dataset.cat;
    renderProducts();
  });
});

// Search functionality
$el('searchInput').addEventListener('input', (e) => {
  searchQuery = e.target.value;
  renderProducts();
});

// Add pretty URL support
if (window.location.pathname === '/products') {
  document.querySelectorAll('a[href="products.html"]').forEach(a => a.href = '/products');
}

// Load products on page load
loadProducts();
