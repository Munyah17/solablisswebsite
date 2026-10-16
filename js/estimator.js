// Solabliss AI estimator page — natural-language load detection
let CATALOG = [];

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
      { id: 18, name: 'CCTV System', watts: 80, surge: 1, category: 'Security', default_hours: 24 },
      { id: 19, name: 'Welding Machine', watts: 3000, surge: 5, category: 'Industrial', default_hours: 1 },
      { id: 20, name: 'Cold Room Compressor', watts: 1500, surge: 3.5, category: 'Industrial', default_hours: 10 },
      { id: 21, name: 'Water Heater / Urn', watts: 2500, surge: 1, category: 'Kitchen', default_hours: 1 },
      { id: 22, name: 'Phone Charging (x5)', watts: 50, surge: 1, category: 'General', default_hours: 3 },
      { id: 23, name: 'Printer / Copier', watts: 400, surge: 2, category: 'Office', default_hours: 1 },
      { id: 24, name: 'Geyser Element (2kW)', watts: 2000, surge: 1, category: 'Heating', default_hours: 2 },
      { id: 25, name: 'Electric Stove (2 plates)', watts: 2000, surge: 1, category: 'Kitchen', default_hours: 1 }
    ];
  }
})();

const AI_MAP = [
  [/fridge|refrigerator/i, 'Fridge (Medium)'], [/freezer|cold room/i, 'Deep Freezer'],
  [/light|led|bulb|lamp/i, 'LED Light (10W)'], [/tv|television|entertain/i, 'TV 42"'],
  [/wi-?fi|router|internet|decoder|dstv/i, 'Decoder / Wi-Fi Router'],
  [/laptop|computer|pc\b/i, 'Laptop'], [/desktop/i, 'Desktop PC'],
  [/washing|washer|laundry/i, 'Washing Machine'], [/iron\b/i, 'Iron'],
  [/microwave/i, 'Microwave'], [/kettle|tea|coffee/i, 'Kettle'],
  [/stove|cooker|oven|cook/i, 'Electric Stove (2 plates)'],
  [/borehole|pump|water pump/i, 'Borehole Pump (1.5HP)'], [/1\.5\s*hp/i, 'Borehole Pump (1.5HP)'], [/0\.75|3\/4\s*hp/i, 'Borehole Pump (0.75HP)'],
  [/geyser|hot water|water heat/i, 'Geyser Element (2kW)'],
  [/air ?con|ac\b|cooling/i, 'Air Conditioner (12000BTU)'],
  [/security light|flood/i, 'Security Lights'], [/gate/i, 'Gate Motor'],
  [/cctv|camera|alarm/i, 'CCTV System'], [/weld/i, 'Welding Machine'],
  [/printer|copier|office/i, 'Printer / Copier'], [/fan/i, 'Ceiling Fan'],
  [/phone|charg/i, 'Phone Charging (x5)'], [/cold room/i, 'Cold Room Compressor'], [/urn/i, 'Water Heater / Urn']
];

async function runAiEstimate() {
  const text = $('aiPrompt').value.trim();
  if (!text) return toast('Describe your needs first');
  const found = [], seen = new Set();
  for (const [re, name] of AI_MAP) {
    if (re.test(text) && !seen.has(name)) { const a = CATALOG.find(x => x.name === name); if (a) { found.push({ name: a.name, watts: a.watts, surge: a.surge, qty: 1, hours: a.default_hours }); seen.add(name); } }
  }
  if (/\d+\s*(light|led|bulb)/i.test(text)) { const m = text.match(/(\d+)\s*(light|led|bulb)/i); const li = found.find(f => f.name === 'LED Light (10W)'); if (li && m) li.qty = +m[1]; }
  if (!found.length) return toast('Could not detect appliances — try listing them (fridge, TV, lights, pump…)');
  const sysType = /off.?grid/i.test(text) ? 'offgrid' : /grid.?tie|bill/i.test(text) ? 'gridtie' : /backup|load.?shed|evening|outage/i.test(text) ? 'backup' : 'hybrid';
  let estimate;
  try {
    const res = await api('api/estimate.php', {
      method: 'POST',
      body: JSON.stringify({ appliances: found, options: { systemType: sysType, propertyType: /office|business|commercial/i.test(text) ? 'Commercial' : /farm|industrial|factory|weld/i.test(text) ? 'Industrial' : 'Domestic' } })
    });
    estimate = res.estimate;
  } catch (e) {
    // Static deployment fallback - show message
    $('aiResult').classList.remove('hidden');
    $('aiResult').innerHTML = `
      <div class="rounded-xl bg-ink-900/60 border border-white/10 p-6">
        <p class="text-slate-300 mb-4">Detected loads: <b class="text-white">${found.map(f => f.name).join(', ')}</b></p>
        <p class="text-slate-400 mb-4">System type: <b class="text-sola-400">${sysType}</b></p>
        <p class="text-sm text-slate-500 mb-4">The AI estimator requires a backend server. For a static deployment, please use the <a href="sizing.html" class="text-sola-400 hover:underline">Sizing Wizard</a> instead.</p>
        <p class="text-xs text-slate-500">Detected ${found.length} appliances with a total daily load of approximately ${Math.round(found.reduce((s, f) => s + f.watts * f.qty * f.hours, 0) / 1000)}kWh.</p>
      </div>
    `;
    $('aiResult').scrollIntoView({ behavior: 'smooth' });
    return;
  }
  lastEstimate = estimate;
  $('aiResult').classList.remove('hidden');
  $('aiResult').innerHTML = `<p class="text-sm text-slate-400 mb-4">Detected loads: <b class="text-slate-200">${found.map(f => f.name).join(', ')}</b> · mode: <b class="text-sola-400">${sysType}</b></p>`;
  const wrap = document.createElement('div');
  $('aiResult').appendChild(wrap);
  renderEstimate(wrap, estimate, true);
  $('aiResult').scrollIntoView({ behavior: 'smooth' });
}
