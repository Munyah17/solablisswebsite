// Solabliss — shared frontend core (loaded by every public page)
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const api = async (path, opts = {}) => {
  const r = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
};
const authToken = () => localStorage.getItem('sola_token');
const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const toast = m => { const t = $('toast'); if (!t) return alert(m); t.textContent = m; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 3000); };

let SETTINGS = {}, lastEstimate = null;

const SERVICES = [
  ['⚡', 'Consulting & Advisory', 'Energy audits, feasibility studies, load profiling, tender support and independent design review for renewable projects of any scale.'],
  ['📐', 'Design & System Sizing', 'Engineered designs — array layout, battery autonomy, cable sizing, protection coordination — documented and simulation-backed.'],
  ['🔧', 'Installations & Upgrades', 'Domestic, commercial and industrial solar installations, hybrid upgrades, battery retrofits and system expansions.'],
  ['🏭', 'Industrial & Commercial', 'Three-phase systems, peak-shaving, power factor and demand management, generator integration and monitoring.'],
  ['📄', 'Contracting & Tendering', 'Turnkey EPC delivery: bills of quantities, procurement, project management, commissioning and handover documentation.'],
  ['🛠️', 'Service & Maintenance', 'Preventative maintenance plans, fault finding, inverter repairs, performance monitoring and warranty support.']
];

// ---------- session tracking ----------
// (function track() {
//   try {
//     let sess = sessionStorage.getItem('sola_sess');
//     if (!sess) { sess = crypto.randomUUID(); sessionStorage.setItem('sola_sess', sess); }
//     fetch('api/track.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session: sess, path: location.pathname, referrer: document.referrer }) });
//   } catch { }
// })();

// ---------- shell injection (nav + footer + auth modal + toast) ----------
const NAV_LINKS = [
  ['index.html', 'Home'], ['services.html', 'Services'], ['projects.html', 'Projects'],
  ['products.html', 'Products'], ['sizing.html', 'System Sizing']
];
document.addEventListener('DOMContentLoaded', async () => {
  SETTINGS = await api('api/settings.php').catch(() => ({}));
  const here = location.pathname.split('/').pop() || 'index.html';
  document.body.insertAdjacentHTML('afterbegin', `
  <nav class="fixed w-full z-50 border-b border-white/[0.08]" style="background:rgba(11,11,13,.82);backdrop-filter:blur(12px)">
    <div class="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
      <a href="index.html" class="flex items-center gap-2 font-semibold text-[15px] tracking-tight text-white">
        <img src="img/logo.jpg" alt="" width="28" height="28" style="width:28px;height:28px;border-radius:6px;object-fit:cover">
        Solabliss
      </a>
      <div class="hidden md:flex items-center gap-6">
        ${NAV_LINKS.map(([h, l]) => `<a href="${h}" class="nav-a ${here === h ? 'active' : ''}">${l}</a>`).join('')}
      </div>
      <div class="flex items-center gap-3">
        <button id="navAuthBtn" onclick="openAuth()" class="text-[13px] font-medium px-3.5 py-1.5 rounded-md border border-white/10 text-slate-300 hover:border-sola-500/60 hover:text-sola-400 transition">Sign in</button>
        <a href="sizing.html" class="hidden sm:block text-[13px] font-semibold px-3.5 py-1.5 rounded-md transition" style="background:#FC6D05;color:#0B1B4A">Get a quote</a>
      </div>
    </div>
    <div class="md:hidden flex gap-4 px-5 pb-3 overflow-x-auto">
      ${NAV_LINKS.map(([h, l]) => `<a href="${h}" class="nav-a whitespace-nowrap ${here === h ? 'active' : ''}">${l}</a>`).join('')}
    </div>
  </nav>`);
  document.body.insertAdjacentHTML('beforeend', `
  <footer class="border-t border-white/[0.08] mt-12">
    <div class="max-w-6xl mx-auto px-5 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
      <div>
        <a href="index.html" class="flex items-center gap-2 font-semibold text-[15px] text-white">
          <img src="img/logo.jpg" alt="" width="28" height="28" style="width:28px;height:28px;border-radius:6px;object-fit:cover">
          Solabliss
        </a>
        <p class="mt-4 text-[13px] text-slate-500 leading-relaxed">${SETTINGS.tagline || 'Engineered renewable energy systems — domestic, commercial and industrial.'}</p>
        <p class="mt-4 text-[13px] text-slate-500 leading-relaxed">${SETTINGS.address || ''}<br>${SETTINGS.phone || ''}</p>
      </div>
      <div>
        <p class="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-4">Site</p>
        <ul class="space-y-2.5 text-[13px] text-slate-500">
          ${NAV_LINKS.slice(0, 5).map(([h, l]) => `<li><a href="${h}" class="hover:text-sola-400 transition">${l}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <p class="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-4">Services</p>
        <ul class="space-y-2.5 text-[13px] text-slate-500">
          <li><a href="services.html" class="hover:text-sola-400 transition">Consulting & advisory</a></li>
          <li><a href="sizing.html" class="hover:text-sola-400 transition">Design & system sizing</a></li>
          <li><a href="services.html" class="hover:text-sola-400 transition">Installations & upgrades</a></li>
          <li><a href="services.html" class="hover:text-sola-400 transition">Contracting & tendering</a></li>
          <li><a href="services.html" class="hover:text-sola-400 transition">Service & maintenance</a></li>
        </ul>
      </div>
      <div>
        <p class="text-[12px] font-medium text-slate-400 uppercase tracking-wider mb-4">Get started</p>
        <ul class="space-y-2.5 text-[13px] text-slate-500">
          <li><a href="sizing.html" class="hover:text-sola-400 transition">Free energy audit</a></li>
          <li><a href="estimator.html" class="hover:text-sola-400 transition">Instant AI estimate</a></li>
          <li><a href="contact.html" class="hover:text-sola-400 transition">Talk to an engineer</a></li>
          <li><a class="hover:text-sola-400 transition" target="_blank" href="https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent('Hi Solabliss, I need help with a solar project.')}">WhatsApp us</a></li>
        </ul>
      </div>
    </div>
    <div class="border-t border-white/[0.08]">
      <div class="max-w-6xl mx-auto px-5 py-5 flex flex-wrap items-center justify-between gap-3 text-[12px] text-slate-600">
        <p>© ${new Date().getFullYear()} ${SETTINGS.company_name || 'Solabliss'}. All rights reserved. Developed and Powered By Global Space Web.</p>
        <p>Engineered renewable energy — Zimbabwe.</p>
      </div>
    </div>
  </footer>
  <div id="authModal" class="hidden fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm grid place-items-center p-4">
    <div class="card w-full max-w-sm">
      <div class="flex justify-between items-center mb-5">
        <h3 class="font-semibold text-lg text-white" id="authTitle">Sign in</h3>
        <button onclick="authModal.classList.add('hidden')" class="text-slate-400 hover:text-white text-2xl leading-none">×</button>
      </div>
      <div id="regFields" class="hidden space-y-3">
        <input id="aName" placeholder="Full name" class="input">
        <input id="aPhone" placeholder="Phone" class="input">
      </div>
      <input id="aEmail" placeholder="Email" class="input mb-3">
      <input id="aPassword" type="password" placeholder="Password" class="input">
      <button onclick="submitAuth()" id="authSubmit" class="btn-primary btn mt-4 w-full !py-2.5 !text-sm">Sign in</button>
      <p class="mt-4 text-[13px] text-slate-500 text-center">
        <span id="authToggleText">No account?</span>
        <button onclick="toggleAuthMode()" class="text-sola-400 font-medium" id="authToggleBtn">Create one</button>
      </p>
      <p id="authError" class="mt-2 text-[13px] text-red-400 hidden text-center"></p>
    </div>
  </div>
  <div id="toast" class="hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] px-4 py-2.5 rounded-lg text-sm font-medium shadow-2xl text-center" style="background:#FC6D05;color:#0B1B4A;max-width:calc(100vw-2.5rem)"></div>`);
  refreshNavAuth();
  document.getElementById('aPassword')?.addEventListener('keydown', e => { if (e.key === 'Enter') submitAuth(); });
});

// ---------- auth ----------
let authMode = 'login';
function openAuth() {
  if (authToken()) { location.href = 'portal.html'; return; }
  $('authModal').classList.remove('hidden');
}
function toggleAuthMode() {
  authMode = authMode === 'login' ? 'register' : 'login';
  const reg = authMode === 'register';
  $('regFields').classList.toggle('hidden', !reg);
  $('authTitle').textContent = reg ? 'Create account' : 'Sign in';
  $('authSubmit').textContent = reg ? 'Register' : 'Sign in';
  $('authToggleText').textContent = reg ? 'Have an account?' : 'No account?';
  $('authToggleBtn').textContent = reg ? 'Sign in' : 'Create one';
}
async function submitAuth() {
  $('authError').classList.add('hidden');
  try {
    const body = authMode === 'login'
      ? { email: $('aEmail').value, password: $('aPassword').value }
      : { name: $('aName').value, phone: $('aPhone').value, email: $('aEmail').value, password: $('aPassword').value };
    const r = await api('api/auth.php?action=' + authMode, { method: 'POST', body: JSON.stringify(body) });
    localStorage.setItem('sola_token', r.token);
    $('authModal').classList.add('hidden');
    refreshNavAuth(); toast(`Welcome, ${r.user.name}`);
    if (r.user.role !== 'client') location.href = 'admin.html';
    else if (location.pathname.endsWith('portal.html')) location.reload();
  } catch (e) { const el = $('authError'); el.textContent = e.message; el.classList.remove('hidden'); }
}
function refreshNavAuth() {
  const t = authToken();
  let u = null; try { u = t ? JSON.parse(atob(t.split('.')[0])) : null } catch { }
  const b = $('navAuthBtn');
  if (b) b.textContent = u ? `👤 ${u.name.split(' ')[0]}` : 'Sign in';
}

// ---------- shared: estimate rendering ----------
function renderEstimate(el, e, actions) {
  el.classList.remove('hidden');
  el.innerHTML = `
  <div class="card">
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div><h3 class="font-semibold text-xl text-white">Your engineered estimate</h3>
      <p class="text-sola-400 text-sm font-medium mt-0.5">${e.package} · ${e.systemType}</p></div>
      <div class="text-right"><p class="text-2xl font-semibold text-white">${fmt(e.total)}</p><p class="text-xs text-slate-500">incl. VAT ${e.vatRate}%</p></div>
    </div>
    <div class="rounded-lg border border-sola-500/25 p-4 mb-6" style="background:rgba(252,109,5,.08)">
      <p class="text-[11px] font-medium text-sola-400 mb-1.5">💬 What this means for you</p>
      <p class="text-[13px] text-slate-200 leading-relaxed">${plainSummary(e)}</p>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      <div class="stat-card"><b>${e.dailyKwh}kWh</b><span>power you'd use per day</span></div>
      <div class="stat-card"><b>${e.inverterKva}kVA</b><span>the system's 'engine'</span></div>
      <div class="stat-card"><b>${e.batteryKwh || '—'}kWh</b><span>stored power for outages</span></div>
      <div class="stat-card"><b>${e.panelCount} panels</b><span>on your roof (${(e.arrayW / 1000).toFixed(1)}kW)</span></div>
      <div class="stat-card"><b>${e.autonomyDays}d</b><span>backup without sun</span></div>
    </div>
    <div class="rounded-lg border border-white/[0.08] p-4 mb-6" style="background:#101013">
      <p class="text-[11px] font-medium text-sola-400 mb-2">🔧 For the technically curious</p>
      <p class="text-[13px] text-slate-300 leading-relaxed">${e.rationale}</p>
    </div>
    <table class="table w-full">
      <thead><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Unit</th><th class="text-right">Total</th></tr></thead>
      <tbody>${e.items.map(i => `<tr><td>${i.item}</td><td class="text-right">${i.qty}</td><td class="text-right">${fmt(i.unit_price)}</td><td class="text-right font-medium">${fmt(i.total)}</td></tr>`).join('')}</tbody>
      <tfoot>
        <tr><td colspan="3" class="text-right text-slate-400 pt-3">Subtotal</td><td class="text-right pt-3">${fmt(e.subtotal)}</td></tr>
        <tr><td colspan="3" class="text-right text-slate-400">VAT ${e.vatRate}%</td><td class="text-right">${fmt(e.vat)}</td></tr>
        <tr><td colspan="3" class="text-right font-semibold text-white">Total</td><td class="text-right font-semibold text-sola-400 text-lg">${fmt(e.total)}</td></tr>
      </tfoot>
    </table>
    ${actions ? `<div class="mt-6 flex flex-wrap gap-3">
      <button onclick="sendWhatsApp()" class="btn btn-primary !px-5 !py-2.5 !text-sm">📲 Send via WhatsApp</button>
      <button onclick="requestQuote()" class="btn btn-ghost !px-5 !py-2.5 !text-sm">📄 Request formal quote</button>
      <button onclick="window.print()" class="btn btn-ghost !px-5 !py-2.5 !text-sm">🖨 Print / PDF</button>
    </div>` : ''}
  </div>`;
}

function plainSummary(e) {
  const parts = [];
  parts.push(`Your appliances need about <b>${e.dailyKwh}kWh</b> of power per day — this system is designed to supply that comfortably.`);
  if (e.batteryKwh) {
    const hrs = Math.round(e.batteryKwh / Math.max(e.dailyKwh / 24, 0.05));
    parts.push(`The batteries store <b>${e.batteryKwh}kWh</b> — roughly <b>${hrs > 48 ? '2+ days' : hrs + ' hours'}</b> of normal use when the grid or sun is down.`);
  }
  parts.push(`<b>${e.panelCount} solar panels</b> charge the system during daylight, and a <b>${e.inverterKva}kVA</b> unit converts it all into normal plug power for your appliances.`);
  parts.push('An engineer will confirm final equipment choices and exact fit after a site visit — this is a reliable ballpark, not a guess.');
  return parts.join(' ');
}

function sendWhatsApp() {
  if (!lastEstimate) return;
  const e = lastEstimate;
  const lines = [
    `*SOLABLISS — System Estimate*`,
    `Package: ${e.package} (${e.systemType})`, ``,
    `• Daily need: ${e.dailyKwh}kWh`,
    `• Inverter: ${e.inverterKva}kVA (${e.bankVoltage}V)`,
    e.batteryKwh ? `• Battery: ${e.batteryKwh}kWh ${e.batteryType}` : null,
    `• Array: ${e.panelCount}×${e.panelW}W = ${(e.arrayW / 1000).toFixed(1)}kWp`, ``,
    `*Total: ${fmt(e.total)} incl VAT*`, ``,
    `Full breakdown & formal quotation available — reply to confirm.`,
    `— ${SETTINGS.company_name} · ${SETTINGS.phone}`
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/${SETTINGS.whatsapp}?text=${encodeURIComponent(lines)}`, '_blank');
}

// ---------- formal quote request modal ----------
function requestQuote() {
  let m = $('quoteModal');
  if (!m) {
    document.body.insertAdjacentHTML('beforeend', `
    <div id="quoteModal" class="fixed inset-0 z-[80] flex items-center justify-center p-4" style="background:rgba(0,0,0,.72);backdrop-filter:blur(4px)">
      <div class="card w-full max-w-md !p-6 relative" style="border-color:rgba(252,109,5,.35)">
        <button onclick="closeQuoteModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white text-xl leading-none">×</button>
        <h3 class="text-lg font-semibold text-white">📄 Request a formal quotation</h3>
        <p class="text-[13px] text-slate-400 mt-1 mb-4">An engineer will review your estimate and send a signed quotation. No obligation.</p>
        <div id="qModalBody"></div>
      </div>
    </div>`);
    m = $('quoteModal');
  }
  const e = lastEstimate;
  $('qModalBody').innerHTML = `
    ${e ? `<div class="rounded-lg border border-sola-500/30 bg-sola-500/10 px-3 py-2 text-[13px] text-sola-400 mb-4">
      Attached estimate: <b>${e.package}</b> · ${e.inverterKva}kVA${e.batteryKwh ? ' · ' + e.batteryKwh + 'kWh' : ''} · ${fmt(e.total)} incl VAT</div>` : ''}
    <label class="lbl">Your name *</label>
    <input id="qmName" class="input mb-2" value="${esc($('cName')?.value || '')}" placeholder="e.g. T. Mukono">
    <div class="grid sm:grid-cols-2 gap-2">
      <div><label class="lbl">Phone / WhatsApp *</label><input id="qmPhone" class="input" value="${esc($('cPhone')?.value || '')}" placeholder="+263…"></div>
      <div><label class="lbl">Email</label><input id="qmEmail" type="email" class="input" value="${esc($('cEmail')?.value || '')}" placeholder="you@email.com"></div>
    </div>
    <label class="lbl">Site address <span class="normal-case text-slate-500">(where the system will go)</span></label>
    <input id="qmAddr" class="input mb-2" placeholder="Suburb, town">
    <label class="lbl">Anything we should know? <span class="normal-case text-slate-500">(optional)</span></label>
    <textarea id="qmNotes" class="input" rows="2" placeholder="e.g. borehole pump, 3-phase supply, existing system…"></textarea>
    <button onclick="submitQuoteRequest()" id="qmSubmit" class="btn btn-primary mt-4 w-full !py-3 !text-sm">Send request →</button>
    <p class="text-[11px] text-slate-500 mt-3 text-center">We reply fastest on WhatsApp — ${esc(SETTINGS.phone || '')}</p>`;
  setTimeout(() => $('qmName')?.focus(), 50);
}
function closeQuoteModal() { $('quoteModal')?.classList.add('hidden'); }
async function submitQuoteRequest() {
  const name = $('qmName').value.trim(), phone = $('qmPhone').value.trim(), email = $('qmEmail').value.trim();
  if (!name) return toast('Please enter your name');
  if (!phone) return toast('Please enter a phone or WhatsApp number');
  const extras = [$('qmAddr').value.trim() && `Site: ${$('qmAddr').value.trim()}`, $('qmNotes').value.trim()].filter(Boolean).join(' | ');
  $('qmSubmit').disabled = true; $('qmSubmit').textContent = 'Sending…';
  try {
    const u = authToken() ? JSON.parse(atob(authToken().split('.')[0])) : null;
    const r = await api('api/admin.php?action=quotes', {
      method: 'POST',
      body: JSON.stringify({
        client: { name, email, phone, id: u?.id },
        estimate: lastEstimate || undefined,
        items: lastEstimate ? undefined : [{ item: `Formal quotation request — ${name}`, qty: 1, unit_price: 0, total: 0 }],
        notes: `Requested via website${extras ? ' — ' + extras : ''}`
      })
    });
    $('qModalBody').innerHTML = `<div class="text-center py-6">
      <div class="text-4xl mb-3">✅</div>
      <h4 class="text-white font-semibold">Request received!</h4>
      <p class="text-[13px] text-slate-400 mt-2">Quote reference <b class="text-sola-400">${r.ref}</b>.<br>Our engineers will contact you shortly on <b>${esc(phone)}</b>.</p>
      <button onclick="closeQuoteModal()" class="btn btn-primary mt-5 !px-6">Done</button></div>`;
  } catch (e) {
    toast(e.message);
    $('qmSubmit').disabled = false; $('qmSubmit').textContent = 'Send request →';
  }
}

// ---------- shared: lead & contact helpers ----------
async function submitLead() {
  const body = {
    name: $('leadName').value, phone: $('leadPhone').value, email: $('leadEmail').value,
    address: $('leadAddress').value, need: $('leadNeed').value, source: 'lead form', subscribed: $('leadSub').checked
  };
  try {
    await api('api/admin.php?action=leads', { method: 'POST', body: JSON.stringify(body) });
    $('leadStatus').classList.remove('hidden');
    ['leadName', 'leadPhone', 'leadEmail', 'leadAddress'].forEach(i => $(i).value = '');
  } catch (e) { toast(e.message); }
}
async function sendMessage() {
  try {
    await api('api/admin.php?action=messages', { method: 'POST', body: JSON.stringify({ name: $('mName').value, email: $('mEmail').value, phone: $('mPhone').value, subject: '', body: $('mBody').value }) });
    $('mStatus').classList.remove('hidden'); ['mName', 'mEmail', 'mPhone', 'mBody'].forEach(i => $(i).value = '');
  } catch (e) { toast(e.message); }
}

// Page-specific code lives in home.js, services.js, sizing.js, estimator.js, contact.js, portal.js, projects.js
