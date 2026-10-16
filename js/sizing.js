// Solabliss sizing wizard — renderEstimate/sendWhatsApp/requestQuote live in app.js
let CATALOG = [], selected = [];

(async () => {
  try {
    CATALOG = await api('api/appliances.php');
  } catch (e) {
    // Static fallback for Vercel deployment
    CATALOG = [
      { id: 1, name: 'LED Light (10W)', watts: 10, surge: 1, category: 'Lighting', default_hours: 5 },
      { id: 2, name: 'Ceiling Fan', watts: 75, surge: 1, category: 'Cooling', default_hours: 6 },
      { id: 3, name: 'Fridge (Medium)', watts: 150, surge: 2.5, category: 'Kitchen', default_hours: 8 },
      { id: 4, name: 'Deep Freezer', watts: 200, surge: 2.5, category: 'Kitchen', default_hours: 8 },
      { id: 5, name: 'TV 42"', watts: 120, surge: 1, category: 'Entertainment', default_hours: 4 },
      { id: 6, name: 'Decoder / Wi-Fi Router', watts: 25, surge: 1, category: 'Entertainment', default_hours: 12 },
      { id: 7, name: 'Laptop', watts: 65, surge: 1, category: 'Office', default_hours: 5 },
      { id: 8, name: 'Desktop PC', watts: 250, surge: 1, category: 'Office', default_hours: 6 },
      { id: 9, name: 'Washing Machine', watts: 500, surge: 2, category: 'Laundry', default_hours: 1 },
      { id: 10, name: 'Iron', watts: 1200, surge: 1, category: 'Laundry', default_hours: 0.5 },
      { id: 11, name: 'Microwave', watts: 1000, surge: 1.8, category: 'Kitchen', default_hours: 0.3 },
      { id: 12, name: 'Kettle', watts: 1800, surge: 1, category: 'Kitchen', default_hours: 0.3 },
      { id: 13, name: 'Borehole Pump (0.75HP)', watts: 560, surge: 4, category: 'Pumping', default_hours: 1.5 },
      { id: 14, name: 'Borehole Pump (1.5HP)', watts: 1100, surge: 4, category: 'Pumping', default_hours: 1.5 },
      { id: 15, name: 'Air Conditioner (12000BTU)', watts: 1200, surge: 3, category: 'Cooling', default_hours: 5 },
      { id: 16, name: 'Security Lights', watts: 60, surge: 1, category: 'Lighting', default_hours: 10 },
      { id: 17, name: 'Gate Motor', watts: 350, surge: 3, category: 'Security', default_hours: 0.2 },
      { id: 18, name: 'CCTV System', watts: 80, surge: 1, category: 'Security', default_hours: 24 }
    ];
  }
  renderCatalog();
  renderSelected();
})();

function renderCatalog() {
  const term = ($('applianceSearch').value || '').toLowerCase();
  $('catalog').innerHTML = CATALOG.filter(a => a.name.toLowerCase().includes(term)).map(a => `
    <div class="flex items-center justify-between text-sm px-3 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-transparent hover:border-white/10 transition">
      <span>${a.name} <span class="text-slate-500 text-xs">· ${a.watts}W · ${a.category}</span></span>
      <button onclick="addAppliance(${a.id})" class="btn btn-ghost">+ add</button>
    </div>`).join('') || '<p class="text-sm text-slate-500">No matches.</p>';
}
function addAppliance(id) {
  const a = CATALOG.find(x => x.id === id);
  const ex = selected.find(x => x.name === a.name);
  if (ex) ex.qty++;
  else selected.push({ name: a.name, watts: a.watts, surge: a.surge, qty: 1, hours: a.default_hours });
  renderSelected();
}
function addCustomAppliance() {
  const name = prompt('Appliance name:'); if (!name) return;
  const watts = parseFloat(prompt('Power rating (watts):', '100')) || 100;
  selected.push({ name, watts, surge: 1, qty: 1, hours: 1, custom: true });
  renderSelected();
}
function setSel(i, k, v) { selected[i][k] = Math.max(0, parseFloat(v) || 0); renderSelected(); }
function delSel(i) { selected.splice(i, 1); renderSelected(); }
function renderSelected() {
  $('selectedEmpty').style.display = selected.length ? 'none' : 'block';
  $('selectedList').innerHTML = selected.map((a, i) => `
    <div class="grid grid-cols-[1fr_56px_68px_52px_22px] items-center gap-1.5 text-sm bg-white/[0.03] rounded-lg px-2.5 py-2">
      <span class="truncate">${a.name} <span class="text-slate-500 text-xs">${a.watts}W</span></span>
      <input type="number" min="1" value="${a.qty}" onchange="setSel(${i},'qty',this.value)" class="input !py-1 !px-2 text-center" title="Qty">
      <input type="number" min="0" step="0.5" value="${a.hours}" onchange="setSel(${i},'hours',this.value)" class="input !py-1 !px-2 text-center" title="Hours/day">
      <span class="text-right text-sola-400 text-xs">${Math.round(a.watts * a.qty * a.hours)}Wh</span>
      <button onclick="delSel(${i})" class="text-slate-500 hover:text-red-400">×</button>
    </div>`).join('');
}

async function runEstimate() {
  if (!selected.length) return toast('Select at least one appliance');
  $('estimateBtn').disabled = true; $('estimateBtn').textContent = 'Analysing loads…';
  try {
    const body = {
      appliances: selected,
      options: {
        systemType: $('optSystem').value, batteryType: $('optBattery').value,
        autonomyDays: +$('optAutonomy').value, sunHours: +$('optSun').value, propertyType: $('optProperty').value
      },
      contact: { name: $('cName').value, email: $('cEmail').value, phone: $('cPhone').value }
    };
    const { estimate } = await api('api/estimate.php', { method: 'POST', body: JSON.stringify(body) });
    lastEstimate = estimate;
    renderEstimate($('estimateResult'), estimate, true);
    $('estimateResult').scrollIntoView({ behavior: 'smooth' });
  } catch (e) {
    // Static deployment fallback - show basic calculation
    const dailyKwh = selected.reduce((s, a) => s + a.watts * a.qty * a.hours, 0) / 1000;
    const peakWatts = selected.reduce((s, a) => s + a.watts * a.surge * a.qty, 0);
    $('estimateResult').innerHTML = `
      <div class="rounded-xl bg-ink-900/60 border border-white/10 p-6">
        <h3 class="font-semibold text-white mb-4">Load Summary (Static Mode)</h3>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="stat-card"><b>${dailyKwh.toFixed(1)}kWh</b><span>Daily consumption</span></div>
          <div class="stat-card"><b>${peakWatts}W</b><span>Peak load</span></div>
        </div>
        <p class="text-sm text-slate-400 mb-4">The sizing wizard requires a backend server for full system recommendations. For static deployment, please <a href="contact.html" class="text-sola-400 hover:underline">contact us</a> for a professional system design.</p>
        <p class="text-xs text-slate-500">Selected ${selected.length} appliances. System type: ${$('optSystem').value}</p>
      </div>
    `;
    $('estimateResult').scrollIntoView({ behavior: 'smooth' });
  }
  $('estimateBtn').disabled = false; $('estimateBtn').textContent = '⚡ Size & estimate my system';
}
