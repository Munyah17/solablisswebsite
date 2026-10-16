// Solabliss projects page — towns → sites → detail (helpers from app.js)
let PROJECTS = [];

(async () => {
  try {
    PROJECTS = await api('api/projects.php');
  } catch (e) {
    // Static fallback for Vercel deployment
    PROJECTS = [
      { id: 1, title: '12kVA Residential Hybrid System', client: 'Private Residence', location: 'Borrowdale, Harare', category: 'Domestic', capacity_kw: 9.9, description: 'Hybrid solar system with 18x550W panels, 12kVA inverter and 20kWh lithium storage — full home backup including borehole pump and security.', status: 'Completed', featured: 1, completed_at: '2025-11-02', town: 'Harare', site_name: 'Borrowdale Residence', existing_setup: 'Grid only, 8-12h daily outages', client_need: 'Whole-home backup incl. borehole pump, security and fridge', equipment_json: '[{"item":"550W Mono Panel","qty":18},{"item":"12kVA Hybrid Inverter","qty":1},{"item":"5.12kWh LiFePO4 Battery","qty":4},{"item":"DB + surge protection","qty":1}]', price: 14500, install_date: '2025-11-02' },
      { id: 2, title: '30kW Commercial Rooftop Array', client: 'Retail Distribution Centre', location: 'Msasa, Harare', category: 'Commercial', capacity_kw: 30, description: 'Grid-tied 30kW system offsetting 60% of daytime load; remote monitoring and net metering consultation.', status: 'Completed', featured: 1, completed_at: '2025-08-19', town: 'Harare', site_name: 'Msasa Distribution Centre', existing_setup: 'Grid + 100kVA diesel genset', client_need: 'Reduce daytime consumption and genset runtime', equipment_json: '[{"item":"550W Mono Panel","qty":54},{"item":"30kW Grid-Tied Inverter","qty":1},{"item":"Remote monitoring","qty":1}]', price: 22000, install_date: '2025-08-19' },
      { id: 3, title: 'Borehole Solar Pumping — Farm Estate', client: 'Agri Client', location: 'Mazowe', category: 'Industrial', capacity_kw: 7.5, description: 'Solar-powered 3HP borehole pumping with elevated tank storage, irrigation timers and surge protection.', status: 'Completed', featured: 1, completed_at: '2026-01-27', town: 'Mazowe', site_name: 'Farm Estate Borehole', existing_setup: 'Manual borehole, no grid power', client_need: 'Reliable irrigation water supply', equipment_json: '[{"item":"3HP Solar Pump","qty":1},{"item":"550W Mono Panel","qty":12},{"item":"VSD Pump Controller","qty":1},{"item":"Tank level sensors","qty":2}]', price: 6800, install_date: '2026-01-27' },
      { id: 4, title: 'Factory Load Audit & 50kW Design', client: 'Manufacturing Plant', location: 'Bulawayo', category: 'Consulting', capacity_kw: 50, description: 'Full energy audit, load profiling and engineered design for phased 50kW industrial solar rollout.', status: 'Completed', featured: 0, completed_at: '2026-03-14', town: 'Bulawayo', site_name: 'Manufacturing Plant', existing_setup: 'Grid + 200kVA genset', client_need: 'Energy audit and phased solar design', equipment_json: '[{"item":"Energy audit & load profiling","qty":1},{"item":"50kW system design pack","qty":1}]', price: 3500, install_date: '2026-03-14' },
      { id: 5, title: 'Office Block Backup Power Upgrade', client: 'Corporate Offices', location: 'CBD, Harare', category: 'Commercial', capacity_kw: 15, description: 'Inverter + lithium upgrade for server room and critical loads; seamless changeover under 10ms.', status: 'Completed', featured: 1, completed_at: '2026-05-30', town: 'Harare', site_name: 'CBD Office Block', existing_setup: 'Ageing UPS units, frequent failures', client_need: 'Seamless server-room and critical-load backup', equipment_json: '[{"item":"15kVA Inverter","qty":1},{"item":"5kWh Lithium Modules","qty":5},{"item":"ATS <10ms","qty":1}]', price: 11800, install_date: '2026-05-30' },
      { id: 6, title: '5kVA Starter Home System', client: 'Private Residence', location: 'Ruwa', category: 'Domestic', capacity_kw: 2.75, description: 'Entry-level backup: lighting, entertainment, refrigeration and Wi-Fi — expandable design.', status: 'Completed', featured: 0, completed_at: '2026-07-11', town: 'Ruwa', site_name: 'Ruwa Residence', existing_setup: 'Grid only', client_need: 'Lights, TV, fridge and Wi-Fi backup', equipment_json: '[{"item":"550W Mono Panel","qty":5},{"item":"5kVA Hybrid Inverter","qty":1},{"item":"5kWh Lithium","qty":1}]', price: 3900, install_date: '2026-07-11' },
      { id: 7, title: '20kW Safari Lodge Hybrid', client: 'Guest Lodge', location: 'Victoria Falls', category: 'Commercial', capacity_kw: 20, description: 'Off-grid lodge power: guest rooms, kitchen and cold storage with generator interlock.', status: 'Completed', featured: 1, completed_at: '2025-12-08', town: 'Victoria Falls', site_name: 'Safari Lodge', existing_setup: 'Diesel genset only, high fuel cost', client_need: 'Cut diesel usage 80%, quiet nights for guests', equipment_json: '[{"item":"550W Mono Panel","qty":36},{"item":"20kVA Hybrid Inverter","qty":1},{"item":"10kWh Lithium","qty":3},{"item":"Genset interlock ATS","qty":1}]', price: 26500, install_date: '2025-12-08' },
      { id: 8, title: 'School Solar + Computer Lab', client: 'Private School', location: 'Mutare', category: 'Commercial', capacity_kw: 8, description: 'Solar for admin block and 30-seat computer lab with surge-protected circuits.', status: 'Completed', featured: 0, completed_at: '2026-02-20', town: 'Mutare', site_name: 'School Campus', existing_setup: 'Grid only, lab unusable during outages', client_need: 'Keep computer lab and admin powered all day', equipment_json: '[{"item":"550W Mono Panel","qty":15},{"item":"8kVA Hybrid Inverter","qty":1},{"item":"5.12kWh LiFePO4","qty":2}]', price: 9200, install_date: '2026-02-20' }
    ];
  }
  renderTowns();
})();

const catIcon = { Domestic: '🏠', Commercial: '🏢', Industrial: '🏭', Consulting: '📐' };
const catBadge = { Domestic: 'bg-sola-500/15 text-sola-400', Commercial: 'bg-sky-500/15 text-sky-400', Industrial: 'bg-purple-500/15 text-purple-400', Consulting: 'bg-blue-500/15 text-blue-400' };
const projImg = p => p.image || `img/proj-${(p.category || 'commercial').toLowerCase()}.jpg`;

function renderTowns() {
  $('crumbs').innerHTML = '<span class="text-sola-400 font-semibold">All towns</span>';
  $('sitesView').classList.add('hidden');
  $('townsView').classList.remove('hidden');
  const towns = {};
  for (const p of PROJECTS) {
    const t = p.town || 'Other';
    if (!towns[t]) towns[t] = { count: 0, kw: 0, value: 0, first: p };
    towns[t].count++; towns[t].kw += p.capacity_kw || 0; towns[t].value += p.price || 0;
  }
  $('townsView').innerHTML = Object.entries(towns).sort((a, b) => b[1].count - a[1].count).map(([town, s]) => `
    <button onclick="renderTown('${esc(town)}')" class="card !p-0 overflow-hidden text-left relative group">
      <img src="${projImg(s.first)}" alt="" class="absolute inset-0 w-full h-full object-cover opacity-[0.18] group-hover:opacity-[0.28] transition" loading="lazy">
      <div class="relative p-5">
        <div class="flex items-center justify-between mb-3">
          <span class="text-2xl">📍</span>
          <span class="badge bg-sola-500/15 text-sola-400">${s.count} site${s.count > 1 ? 's' : ''}</span>
        </div>
        <h3 class="font-semibold text-white text-lg group-hover:text-sola-400 transition">${esc(town)}</h3>
        <p class="text-xs text-slate-400 mt-1">${s.kw ? s.kw.toFixed(1) + 'kW installed' : ''}${s.value ? ' · ' + fmt(s.value) + ' delivered' : ''}</p>
        <p class="mt-4 text-[13px] font-medium text-sola-400">View sites →</p>
      </div>
    </button>`).join('');
}

function renderTown(town) {
  const sites = PROJECTS.filter(p => (p.town || 'Other') === town);
  $('crumbs').innerHTML = `<button onclick="renderTowns()" class="text-sola-400 hover:text-sola-300 font-semibold">All towns</button> <span class="mx-2">›</span> <span class="text-white font-semibold">${esc(town)}</span>`;
  $('townsView').classList.add('hidden');
  $('sitesView').classList.remove('hidden');
  $('sitesView').innerHTML = sites.map(p => `
    <div onclick="viewSite(${p.id})" class="proj !p-0 overflow-hidden text-left hover:border-sola-500/60 cursor-pointer">
      <div class="relative">
        <img src="${projImg(p)}" alt="${esc(p.site_name || p.title)}" class="w-full h-36 object-cover" loading="lazy">
        <span class="badge absolute top-3 left-3" style="background:rgba(11,11,13,.72)">${catIcon[p.category] || '⚡'} ${p.category}</span>
        ${p.capacity_kw ? `<span class="absolute top-3 right-3 text-sola-400 font-semibold text-[13px] px-2 py-0.5 rounded" style="background:rgba(11,11,13,.72)">${p.capacity_kw}kW</span>` : ''}
      </div>
      <div class="p-5 flex flex-col flex-1">
        <h3 class="font-semibold text-white">${esc(p.site_name || p.title)}</h3>
        <p class="text-xs text-slate-500 mt-1">${esc(p.client || '')} · ${esc(p.location || '')}</p>
        <p class="text-sm text-slate-400 mt-3 flex-1 line-clamp-3">${esc(p.client_need || p.description || '')}</p>
        <div class="flex items-center justify-between mt-4 text-xs text-slate-500">
          <span>${p.install_date || p.completed_at?.slice(0, 10) || ''}</span>
          ${p.price ? `<span class="text-sola-400 font-semibold">${fmt(p.price)}</span>` : ''}
        </div>
        <button onclick="event.stopPropagation();viewSite(${p.id})" class="btn btn-primary mt-4 w-full !py-2">View site →</button>
      </div>
    </div>`).join('');
}

function viewSite(id) {
  const p = PROJECTS.find(x => x.id === id);
  if (!p) return;
  let equipment = [];
  try { equipment = JSON.parse(p.equipment_json || '[]'); } catch { }
  $('dTitle').textContent = p.site_name || p.title;
  $('dMeta').textContent = `${p.client || ''} · ${p.location || ''} · ${p.category}${p.capacity_kw ? ' · ' + p.capacity_kw + 'kW' : ''}`;
  $('dBody').innerHTML = `
    <img src="${projImg(p)}" alt="" class="w-full h-48 object-cover rounded-lg border border-white/[0.08] mb-5">
    <div class="grid md:grid-cols-2 gap-4 mb-5">
      <div class="rounded-xl bg-ink-900/60 border border-white/10 p-4">
        <p class="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">What the client had</p>
        <p class="text-sm text-slate-300">${esc(p.existing_setup || 'Not recorded')}</p>
      </div>
      <div class="rounded-xl bg-ink-900/60 border border-white/10 p-4">
        <p class="text-xs uppercase tracking-widest text-slate-500 font-bold mb-2">What they needed</p>
        <p class="text-sm text-slate-300">${esc(p.client_need || p.description || 'Not recorded')}</p>
      </div>
    </div>
    <div class="rounded-xl bg-ink-900/60 border border-white/10 p-4 mb-5">
      <p class="text-xs uppercase tracking-widest text-sola-400 font-bold mb-3">What Solabliss installed</p>
      ${p.description ? `<p class="text-sm text-slate-400 mb-3">${esc(p.description)}</p>` : ''}
      ${equipment.length ? `<table class="table w-full"><tbody>${equipment.map(e => `<tr><td>${esc(e.item)}</td><td class="text-right font-semibold">×${e.qty}</td></tr>`).join('')}</tbody></table>` : '<p class="text-sm text-slate-500">Equipment list not recorded.</p>'}
    </div>
    <div class="grid grid-cols-3 gap-3">
      <div class="stat-card"><b>${p.price ? fmt(p.price) : '—'}</b><span>Project value</span></div>
      <div class="stat-card"><b>${p.install_date || p.completed_at?.slice(0, 10) || '—'}</b><span>Completed</span></div>
      <div class="stat-card"><b>${p.status}</b><span>Status</span></div>
    </div>
    <a href="sizing.html" class="mt-6 inline-block btn btn-primary !px-6 !py-2.5 !text-sm">Get a system like this →</a>`;
  siteModal.classList.remove('hidden');
}
