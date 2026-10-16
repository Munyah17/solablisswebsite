// Solabliss admin panel
const $el = id => document.getElementById(id);
const tok = () => localStorage.getItem('sola_admin_token');

// ---------- dark/light mode toggle ----------
const themeSwitch = $el('themeSwitch');
const savedTheme = localStorage.getItem('admin_theme');
if (savedTheme === 'dark') {
  document.body.classList.add('dark-mode');
  themeSwitch.checked = true;
}
themeSwitch.addEventListener('change', () => {
  if (themeSwitch.checked) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('admin_theme', 'dark');
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('admin_theme', 'light');
  }
});
const api = async (p, o = {}) => {
  const r = await fetch(p, { ...o, headers: { 'Content-Type': 'application/json', ...(o.headers || {}) } });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || 'Request failed');
  return d;
};
const fmt = n => '$' + Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
const toast = m => { const t = $el('toast'); t.textContent = m; t.classList.remove('hidden'); setTimeout(() => t.classList.add('hidden'), 2800); };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------- auth ----------
async function login() {
  try {
    const r = await fetch('api/auth.php?action=login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: $el('lEmail').value, password: $el('lPass').value }) });
    const d = await r.json();
    if (!r.ok) throw new Error(d.error);
    if (d.user.role === 'client') throw new Error('Staff account required');
    localStorage.setItem('sola_admin_token', d.token);
    enterShell();
  } catch (e) { $el('loginErr').textContent = e.message; $el('loginErr').classList.remove('hidden'); }
}
function logout() { localStorage.removeItem('sola_admin_token'); location.reload(); }
let COMPANY = {};
function enterShell() {
  $el('loginGate').classList.add('hidden'); $el('adminShell').classList.remove('hidden');
  try { const u = JSON.parse(atob(tok().split('.')[0])); if (u.role === 'admin') $el('navFuture').classList.remove('hidden'); } catch { }
  api('api/admin.php?action=settings').then(s => COMPANY = s).catch(() => { });
  nav('dash');
}
(async () => {
  if (!tok()) return;
  try { const me = await api('api/auth.php?action=me'); if (me.user.role !== 'client') enterShell(); } catch { localStorage.removeItem('sola_admin_token'); }
})();
document.querySelectorAll('[data-nav]').forEach(b => b.onclick = e => { e.preventDefault(); nav(b.dataset.nav); });
document.addEventListener('keydown', e => { if (e.key === 'Enter' && !$el('loginGate').classList.contains('hidden')) login(); });

// ---------- nav ----------
const PAGES = { dash: renderDash, analytics: renderAnalytics, leads: renderLeads, audits: renderAudits, quotes: renderQuotes, invoices: renderInvoices, projects: renderProjects, assessments: renderAssessments, reports: renderReports, finance: renderFinance, netmetering: renderNetMetering, newsletter: renderNewsletter, sms: renderSms, users: renderUsers, appliances: renderAppliances, products: renderProducts, messages: renderMessages, settings: renderSettings, future: renderFuture };
function nav(k) {
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('nav-active', b.dataset.nav === k));
  Promise.resolve(PAGES[k]()).catch(e => {
    console.error('nav', k, e);
    $el('page').innerHTML = `<h1 class="page-h">Couldn't load this page</h1><p class="text-red-400 text-sm">${esc(e.message || e)}</p><p class="text-slate-500 text-sm mt-2">If the server was restarting, click the menu item again.</p>`;
  });
}

// ---------- dashboard ----------
async function renderDash() {
  const s = await api('api/admin.php?action=dashboard');
  const cards = [['Users', s.users, '👥'], ['Projects', s.projects, '🏗️'], ['Quotes', s.quotes, '📄'], ['Pending quotes', s.quotesSent, '⏳'], ['Invoices', s.invoices, '🧾'], ['Outstanding', fmt(s.outstanding), '💸'], ['Revenue collected', fmt(s.revenue), '💰'], ['Audit requests', s.audits, '⚡'], ['New messages', s.messages, '✉️']];
  $el('page').innerHTML = `
    <h1 class="page-h">Dashboard</h1>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      ${cards.map(c => `<div class="stat-card"><span class="text-xl">${c[2]}</span><b>${c[1]}</b><span>${c[0]}</span></div>`).join('')}
    </div>
    <div class="grid lg:grid-cols-2 gap-6 mt-8">
      <div class="card"><h3 class="font-bold text-white mb-3">Recent quotes</h3>
        <table class="table w-full"><thead><tr><th>Ref</th><th>Client</th><th class="text-right">Total</th><th>Status</th></tr></thead>
        <tbody>${s.recentQuotes.map(q => `<tr><td>${q.ref}</td><td>${esc(q.client_name)}</td><td class="text-right">${fmt(q.total)}</td><td>${q.status}</td></tr>`).join('') || '<tr><td colspan="4" class="text-slate-500">None yet</td></tr>'}</tbody></table></div>
      <div class="card"><h3 class="font-bold text-white mb-3">Recent audit requests</h3>
        <table class="table w-full"><thead><tr><th>Name</th><th>Phone</th><th class="text-right">kWh/day</th><th>Status</th></tr></thead>
        <tbody>${s.recentAudits.map(a => `<tr><td>${esc(a.name) || '—'}</td><td>${esc(a.phone) || '—'}</td><td class="text-right">${a.daily_kwh}</td><td>${a.status}</td></tr>`).join('') || '<tr><td colspan="4" class="text-slate-500">None yet</td></tr>'}</tbody></table></div>
    </div>`;
}

// ---------- audits ----------
async function renderAudits() {
  const list = await api('api/admin.php?action=audits');
  $el('page').innerHTML = `<h1 class="page-h">Energy Audit Requests</h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[720px]">
    <thead><tr><th>When</th><th>Client</th><th>Contact</th><th class="text-right">kWh/day</th><th class="text-right">Est. total</th><th>Status</th><th></th></tr></thead>
    <tbody>${list.map(a => `<tr>
      <td class="text-slate-400">${a.created_at?.slice(0, 10)}</td>
      <td>${esc(a.name) || '—'}<br><span class="text-xs text-slate-500">${a.property_type || ''}</span></td>
      <td class="text-xs">${esc(a.phone)}<br>${esc(a.email)}</td>
      <td class="text-right">${a.daily_kwh}</td>
      <td class="text-right font-semibold">${a.estimate ? fmt(a.estimate.total) : '—'}</td>
      <td><select onchange="api('api/admin.php?action=audits/${a.id}',{method:'PUT',body:JSON.stringify({status:this.value})}).then(()=>toast('Updated'))" class="input !w-auto !py-1 text-xs">
        ${['New', 'Contacted', 'Quoted', 'Won', 'Lost'].map(s => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      <td class="text-right"><button class="btn btn-ghost" onclick='viewAudit(${JSON.stringify(a.id)})'>view</button></td>
    </tr>`).join('') || '<tr><td colspan="7" class="text-slate-500">No audit requests yet.</td></tr>'}</tbody></table></div>`;
  window._audits = list;
}
async function viewAudit(id) {
  const a = window._audits.find(x => x.id === id); if (!a) return;
  $el('modalTitle').textContent = `Audit #${a.id} — ${a.name || 'Anonymous'}`;
  $el('modalBody').innerHTML = `
    <p class="text-sm text-slate-400 mb-4">${a.property_type || ''} · ${esc(a.phone)} · ${esc(a.email)} · ${a.created_at}</p>
    <h4 class="font-semibold text-sola-400 text-sm mb-2">Loads</h4>
    <table class="table w-full mb-5"><tbody>${(a.appliances || []).map(x => `<tr><td>${esc(x.name)}</td><td class="text-right">${x.watts}W × ${x.qty} × ${x.hours}h</td></tr>`).join('')}</tbody></table>
    ${a.estimate ? `<h4 class="font-semibold text-sola-400 text-sm mb-2">Estimate — ${fmt(a.estimate.total)}</h4>
    <p class="text-sm text-slate-300 mb-3">${a.estimate.rationale}</p>
    <table class="table w-full"><tbody>${a.estimate.items.map(i => `<tr><td>${esc(i.item)}</td><td class="text-right">${fmt(i.total)}</td></tr>`).join('')}</tbody></table>
    <button class="btn btn-primary mt-4" onclick='makeQuoteFromAudit(${a.id})'>Convert to quotation</button>` : ''}`;
  modal.classList.remove('hidden');
}
function makeQuoteFromAudit(id) {
  const a = window._audits.find(x => x.id === id); if (!a?.estimate) return;
  modal.classList.add('hidden');
  docEditor('quote', { name: a.name || '', email: a.email, phone: a.phone, systemType: a.estimate.systemType, items: a.estimate.items, notes: `From audit #${a.id}` });
}

// ---------- quotes ----------
async function renderQuotes() {
  const list = await api('api/admin.php?action=quotes');
  window._quotes = list;
  const st = ['Draft', 'Sent', 'Accepted', 'Rejected', 'Invoiced'];
  $el('page').innerHTML = `<h1 class="page-h">Quotations <button class="btn btn-primary ml-3" onclick="docEditor('quote')">+ New quote</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[720px]">
    <thead><tr><th>Ref</th><th>Client</th><th>Type</th><th class="text-right">Total</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>${list.map(q => `<tr>
      <td class="font-semibold">${q.ref}</td>
      <td>${esc(q.client_name)}<br><span class="text-xs text-slate-500">${esc(q.client_phone)} ${esc(q.client_email)}</span></td>
      <td>${q.system_type || '—'}</td>
      <td class="text-right font-semibold">${fmt(q.total)}</td>
      <td><select onchange="updQuote(${q.id},{status:this.value})" class="input !w-auto !py-1 text-xs">${st.map(s => `<option ${q.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      <td class="text-slate-400 text-xs">${q.created_at?.slice(0, 10)}</td>
      <td class="text-right whitespace-nowrap">
        <button class="btn btn-ghost" onclick="viewQuote(${q.id})">view</button>
        <button class="btn btn-ghost" onclick="editQuote(${q.id})" title="Edit before sending">edit</button>
        ${q.status !== 'Invoiced' ? `<button class="btn btn-ghost" onclick="quoteToInvoice(${q.id})" title="Convert to invoice">→inv</button>` : ''}
        <button class="btn btn-danger" onclick="delQuote(${q.id})">×</button>
      </td></tr>`).join('') || '<tr><td colspan="7" class="text-slate-500">No quotes yet.</td></tr>'}</tbody></table></div>`;
}
async function updQuote(id, patch) { await api(`api/admin.php?action=quotes/${id}`, { method: 'PUT', body: JSON.stringify(patch) }); toast('Updated'); }
async function delQuote(id) { if (!confirm('Delete this quote?')) return; await api(`api/admin.php?action=quotes/${id}`, { method: 'DELETE' }); toast('Deleted'); renderQuotes(); }
async function quoteToInvoice(id) {
  const due = prompt('Due date (YYYY-MM-DD, optional):', '');
  const r = await api(`api/admin.php?action=quotes/${id}/invoice`, { method: 'POST', body: JSON.stringify({ due_date: due || null }) });
  toast(`Invoice ${r.ref} created`); renderQuotes();
}
async function viewQuote(id) {
  const q = window._quotes.find(x => x.id === id);
  const items = await api(`api/admin.php?action=quotes/${id}/items`);
  $el('modalTitle').textContent = `${q.ref} — ${q.client_name}`;
  $el('modalBody').innerHTML = `
    <p class="text-sm text-slate-400 mb-4">${esc(q.client_email)} · ${esc(q.client_phone)} · ${q.system_type || ''} · status <b>${q.status}</b></p>
    ${q.estimate?.rationale ? `<p class="text-sm text-slate-400 italic mb-4">🧠 ${q.estimate.rationale}</p>` : ''}
    <table class="table w-full"><thead><tr><th>Item</th><th class="text-right">Qty</th><th class="text-right">Unit</th><th class="text-right">Total</th></tr></thead>
    <tbody>${items.map(i => `<tr><td>${esc(i.item)}</td><td class="text-right">${i.qty}</td><td class="text-right">${fmt(i.unit_price)}</td><td class="text-right">${fmt(i.total)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3" class="text-right pt-3">Subtotal</td><td class="text-right pt-3">${fmt(q.subtotal)}</td></tr>
    <tr><td colspan="3" class="text-right">VAT</td><td class="text-right">${fmt(q.vat)}</td></tr>
    <tr><td colspan="3" class="text-right font-bold">Total</td><td class="text-right font-bold text-sola-400">${fmt(q.total)}</td></tr></tfoot></table>
    <label class="lbl mt-4">Internal notes</label>
    <textarea id="qNotes" class="input" rows="2">${esc(q.notes || '')}</textarea>
    <div class="flex gap-2 mt-3">
    <button class="btn btn-primary" onclick="editQuote(${q.id})" title="Edit line items & client details before sending">✏️ Edit quotation</button>
    <button class="btn btn-ghost" onclick="updQuote(${q.id},{notes:qNotes.value})">Save notes</button>
    <button class="btn btn-ghost" onclick="printQuote(${q.id})">🖨 Print / PDF</button></div>`;
  modal.classList.remove('hidden');
}
// ---------- unified document builder (quotation / invoice) ----------
async function docEditor(kind, pre) {
  kind = kind || 'quote'; pre = pre || {};
  if (!window._clients) { try { window._clients = await api('api/admin.php?action=users'); } catch { window._clients = []; } }
  window._docKind = kind;
  window._docId = pre.id || null;
  window._docItems = (pre.items || []).map(i => ({ item: i.item || '', qty: i.qty || 1, unit_price: i.unit_price || 0 }));
  if (!window._docItems.length) window._docItems.push({ item: '', qty: 1, unit_price: 0 });
  $el('modalTitle').textContent = kind === 'invoice' ? 'New invoice' : (pre.id ? 'Edit quotation' : 'New quotation');
  const vat = Number(COMPANY.vat_rate) || 0;
  const isInv = kind === 'invoice';
  $el('modalBody').innerHTML = `
    <div class="grid sm:grid-cols-3 gap-3">
      <input id="dName" list="clientList" placeholder="Client name *" class="input" value="${esc(pre.name || '')}" onchange="fillClient(this.value)">
      <input id="dEmail" placeholder="Email" class="input" value="${esc(pre.email || '')}">
      <input id="dPhone" placeholder="Phone" class="input" value="${esc(pre.phone || '')}">
      <datalist id="clientList">${window._clients.map(u => `<option value="${esc(u.name)}">`).join('')}</datalist>
    </div>
    <div class="grid sm:grid-cols-3 gap-3 mt-3 mb-5">
      ${isInv
        ? `<input id="dDue" type="date" class="input" title="Due date" value="${pre.due_date || ''}">`
        : `<input id="dSys" placeholder="System type (e.g. Hybrid 5kVA)" class="input" value="${esc(pre.systemType || '')}">
           <select id="dStatus" class="input"><option ${pre.status === 'Draft' ? 'selected' : ''}>Draft</option><option ${pre.status !== 'Draft' ? 'selected' : ''}>Sent</option></select>`}
    </div>
    <p class="text-[11px] font-medium text-slate-500 mb-2" style="letter-spacing:.08em">LINE ITEMS</p>
    <div id="dItems"></div>
    <button class="btn btn-ghost mt-1" onclick="addDocItem()">+ line item</button>
    <div class="mt-4 rounded-lg border border-white/[0.08] p-4" style="background:#101013">
      <div class="flex justify-between text-[13px]"><span class="text-slate-400">Subtotal</span><b id="dSub">$0</b></div>
      <div class="flex justify-between text-[13px] mt-1"><span class="text-slate-400">VAT ${vat}%</span><b id="dVat">$0</b></div>
      <div class="flex justify-between mt-2 pt-2 border-t border-white/[0.08] text-[15px]"><span class="font-medium text-slate-300">Total</span><b id="dTot" class="text-sola-400">$0</b></div>
    </div>
    <label class="lbl">Notes${isInv ? ' (bank details, payment instructions…)' : ''}</label>
    <textarea id="dNotes" rows="2" class="input">${esc(pre.notes || '')}</textarea>
    <button class="btn btn-primary mt-4 block !w-full !py-3" onclick="saveDoc()">${isInv ? '🧾 Create invoice' : (pre.id ? '� Save quotation changes' : '�📄 Create quotation')}</button>`;
  renderDocItems();
  modal.classList.remove('hidden');
}
function fillClient(name) {
  const u = (window._clients || []).find(x => (x.name || '').toLowerCase() === String(name).toLowerCase());
  if (u) { if (!dEmail.value) dEmail.value = u.email || ''; if (!dPhone.value) dPhone.value = u.phone || ''; }
}
function addDocItem() { window._docItems.push({ item: '', qty: 1, unit_price: 0 }); renderDocItems(); }
function renderDocItems() {
  $el('dItems').innerHTML = window._docItems.map((it, i) => `
    <div class="grid grid-cols-[1fr_64px_110px_80px_24px] items-center gap-2 mb-2">
      <input placeholder="Description" class="input !py-2" value="${esc(it.item)}" onchange="_docItems[${i}].item=this.value">
      <input type="number" min="0" placeholder="Qty" class="input !py-2 !px-2 text-center" value="${it.qty}" onchange="_docItems[${i}].qty=+this.value;recalcDoc()">
      <input type="number" min="0" step="0.01" placeholder="Unit price" class="input !py-2 !px-2" value="${it.unit_price}" onchange="_docItems[${i}].unit_price=+this.value;recalcDoc()">
      <span class="text-right text-sm text-slate-300">${fmt(it.qty * it.unit_price)}</span>
      <button class="text-slate-500 hover:text-red-400 text-lg leading-none" onclick="_docItems.splice(${i},1);renderDocItems()">×</button>
    </div>`).join('');
  recalcDoc();
}
function recalcDoc() {
  const sub = window._docItems.reduce((s, i) => s + (i.qty || 0) * (i.unit_price || 0), 0);
  const vat = Number(COMPANY.vat_rate) || 0;
  $el('dSub').textContent = fmt(sub);
  $el('dVat').textContent = fmt(sub * vat / 100);
  $el('dTot').textContent = fmt(sub * (1 + vat / 100));
}
async function saveDoc() {
  const kind = window._docKind;
  const items = window._docItems.filter(i => i.item).map(i => ({ ...i, total: i.qty * i.unit_price }));
  if (!dName.value.trim() || !items.length) return toast('Client name + at least one item required');
  const client = { name: dName.value.trim(), email: dEmail.value, phone: dPhone.value };
  if (kind === 'invoice') {
    const r = await api('api/admin.php?action=invoices', { method: 'POST', body: JSON.stringify({ client, items, due_date: $el('dDue')?.value || null, notes: dNotes.value }) });
    toast(`Invoice ${r.ref} created`); modal.classList.add('hidden'); renderInvoices();
  } else if (window._docId) {
    await api(`api/admin.php?action=quotes/${window._docId}`, { method: 'PUT', body: JSON.stringify({ client_name: client.name, client_email: client.email, client_phone: client.phone, items, systemType: $el('dSys')?.value || '', status: $el('dStatus')?.value || 'Draft', notes: dNotes.value }) });
    toast('Quotation updated'); window._docId = null; modal.classList.add('hidden'); renderQuotes();
  } else {
    const r = await api('/api/quotes', { method: 'POST', body: JSON.stringify({ client, items, systemType: $el('dSys')?.value || '', status: $el('dStatus')?.value || 'Sent', notes: dNotes.value }) });
    toast(`Quote ${r.ref} created`); modal.classList.add('hidden'); renderQuotes();
  }
}

// ---------- invoices ----------
async function renderInvoices() {
  const list = await api('api/admin.php?action=invoices');
  window._invoices = list;
  $el('page').innerHTML = `<h1 class="page-h">Invoices <button class="btn btn-primary ml-3" onclick="docEditor('invoice')">+ Create invoice</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[720px]">
    <thead><tr><th>Ref</th><th>Client</th><th class="text-right">Total</th><th class="text-right">Paid</th><th class="text-right">Balance</th><th>Status</th><th>Due</th><th></th></tr></thead>
    <tbody>${list.map(i => `<tr>
      <td class="font-semibold">${i.ref}</td><td>${esc(i.client_name)}</td>
      <td class="text-right">${fmt(i.total)}</td><td class="text-right">${fmt(i.paid)}</td>
      <td class="text-right font-semibold ${i.total - i.paid > 0 ? 'text-sola-400' : 'text-sky-400'}">${fmt(i.total - i.paid)}</td>
      <td><span class="badge ${i.status === 'Paid' ? 'bg-sky-500/20 text-sky-400' : i.status === 'Part-Paid' ? 'bg-sola-500/20 text-sola-400' : 'bg-white/10'}">${i.status}</span></td>
      <td class="text-xs text-slate-400">${i.due_date || '—'}</td>
      <td class="text-right whitespace-nowrap">
        <button class="btn btn-ghost" onclick="viewInvoice(${i.id})">view</button>
        ${i.status !== 'Paid' ? `<button class="btn btn-primary" onclick="addPayment(${i.id})">+payment</button>` : ''}
        <button class="btn btn-danger" onclick="delInvoice(${i.id})">×</button>
      </td></tr>`).join('') || '<tr><td colspan="8" class="text-slate-500">No invoices yet — convert a quote.</td></tr>'}</tbody></table></div>`;
}
function viewInvoice(id) {
  const i = window._invoices.find(x => x.id === id);
  $el('modalTitle').textContent = `${i.ref} — ${i.client_name}`;
  $el('modalBody').innerHTML = `
    <table class="table w-full mb-4"><tbody>${i.items.map(x => `<tr><td>${esc(x.item)}</td><td class="text-right">${x.qty} × ${fmt(x.unit_price)}</td><td class="text-right">${fmt(x.total)}</td></tr>`).join('')}
    <tr><td colspan="2" class="text-right font-bold">Total</td><td class="text-right font-bold text-sola-400">${fmt(i.total)}</td></tr></tbody></table>
    <h4 class="font-semibold text-sola-400 text-sm mb-2">Payments</h4>
    ${i.payments.length ? i.payments.map(p => `<p class="text-sm text-slate-300">• ${fmt(p.amount)} — ${p.method} ${p.note ? '· ' + esc(p.note) : ''} · ${p.created_at.slice(0, 10)}</p>`).join('') : '<p class="text-sm text-slate-500">None recorded.</p>'}
    <label class="lbl mt-4">Notes (bank details, payment terms…)</label>
    <textarea id="iNotes" class="input" rows="2">${esc(i.notes || '')}</textarea>
    <div class="flex gap-2 mt-3">
    <button class="btn btn-primary" onclick="api('api/admin.php?action=invoices/${i.id}',{method:'PUT',body:JSON.stringify({notes:iNotes.value})}).then(()=>toast('Notes saved'))">Save notes</button>
    <button class="btn btn-ghost" onclick="printInvoice(${i.id})">🖨 Print / PDF</button></div>`;
  modal.classList.remove('hidden');
}
async function addPayment(id) {
  const i = window._invoices.find(x => x.id === id);
  const amt = parseFloat(prompt(`Amount received (balance ${fmt(i.total - i.paid)}):`));
  if (!amt) return;
  const method = prompt('Method (cash/ecocash/bank):', 'bank') || 'bank';
  await api(`api/admin.php?action=invoices/${id}/payments`, { method: 'POST', body: JSON.stringify({ amount: amt, method }) });
  toast('Payment recorded'); renderInvoices();
}
async function delInvoice(id) { if (!confirm('Delete invoice?')) return; await api(`api/admin.php?action=invoices/${id}`, { method: 'DELETE' }); renderInvoices(); }

// ---------- projects ----------
async function renderProjects() {
  const list = await api('api/projects.php');
  window._projects = list;
  $el('page').innerHTML = `<h1 class="page-h">Projects / Jobs Done <button class="btn btn-primary ml-3" onclick="projectEditor()">+ Add project</button></h1>
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4">${list.map(p => `
      <div class="card !p-0 overflow-hidden">
        <img src="${esc(p.image || 'img/proj-' + (p.category || 'commercial').toLowerCase() + '.jpg')}" alt="" loading="lazy"
             class="w-full h-40 object-cover" style="border-radius:.5rem .5rem 0 0"
             onerror="this.onerror=null;this.src='img/panel-array.jpg'">
        <div class="p-5">
        <div class="flex justify-between items-start mb-2">
          <span class="badge bg-white/10">${p.category}</span>
          <span class="text-sola-400 font-bold text-sm">${p.capacity_kw || ''}kW</span>
        </div>
        <h3 class="font-bold text-white">${esc(p.title)}</h3>
        <p class="text-xs text-slate-500 mt-1">${esc(p.client)} · ${esc(p.location)} · ${p.completed_at?.slice(0, 10) || ''}</p>
        <p class="text-sm text-slate-400 mt-2 line-clamp-3">${esc(p.description)}</p>
        <div class="flex gap-2 mt-4">
          <button class="btn btn-ghost" onclick="projectEditor(${p.id})">edit</button>
          <button class="btn btn-danger" onclick="delProject(${p.id})">delete</button>
        </div>
        </div>
      </div>`).join('')}</div>`;
}
function projectEditor(id) {
  const p = id ? window._projects.find(x => x.id === id) : {};
  let eq = [];
  try { eq = JSON.parse(p.equipment_json || '[]'); } catch { }
  window._peq = eq;
  $el('modalTitle').textContent = id ? 'Edit project' : 'New project';
  $el('modalBody').innerHTML = `
    <div class="grid sm:grid-cols-2 gap-3">
      <input id="pTitle" placeholder="Title *" class="input sm:col-span-2" value="${esc(p.title)}">
      <input id="pTown" placeholder="Town / City" class="input" value="${esc(p.town)}">
      <input id="pSite" placeholder="Site name (e.g. Borrowdale Residence)" class="input" value="${esc(p.site_name)}">
      <input id="pClient" placeholder="Client" class="input" value="${esc(p.client)}">
      <input id="pLoc" placeholder="Location / suburb" class="input" value="${esc(p.location)}">
      <select id="pCat" class="input">${['Domestic', 'Commercial', 'Industrial', 'Consulting'].map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
      <input id="pKw" type="number" step="0.1" placeholder="Capacity (kW)" class="input" value="${p.capacity_kw || ''}">
      <input id="pPrice" type="number" step="0.01" placeholder="Project value (USD)" class="input" value="${p.price || ''}">
      <input id="pInstall" type="date" title="Install date" class="input" value="${(p.install_date || p.completed_at || '').slice(0, 10)}">
      <input id="pExisting" placeholder="What the client had (existing setup)" class="input sm:col-span-2" value="${esc(p.existing_setup)}">
      <input id="pNeed" placeholder="What the client needed" class="input sm:col-span-2" value="${esc(p.client_need)}">
      <div class="sm:col-span-2">
        <label class="lbl !mt-0">Site photo</label>
        <div class="flex items-center gap-4 flex-wrap">
          <img id="pImgPrev" src="${p.image || 'img/proj-' + String(p.category || 'commercial').toLowerCase() + '.jpg'}" alt="" class="w-28 h-20 object-cover rounded-lg border border-white/10">
          <div class="flex-1 min-w-[180px]">
            <input type="file" id="pImgFile" accept="image/*" class="input !py-2 text-xs file:mr-3 file:rounded file:border-0 file:bg-sola-500 file:text-ink-900 file:font-semibold file:px-3 file:py-1.5 cursor-pointer" onchange="uploadProjectImg(this)">
            <p class="text-[11px] text-slate-500 mt-1.5">JPG/PNG/WEBP — auto-resized. Blank path = category default photo.</p>
            <input id="pImage" placeholder="img/uploads/…" class="input mt-2 !py-1.5 !text-xs" value="${esc(p.image)}">
          </div>
        </div>
      </div>
      <label class="flex items-center gap-2 text-sm"><input id="pFeat" type="checkbox" ${p.featured ? 'checked' : ''} class="accent-sola-500"> Featured on homepage</label>
      <textarea id="pDesc" placeholder="Description" rows="3" class="input sm:col-span-2">${esc(p.description)}</textarea>
    </div>
    <h4 class="font-semibold text-sola-400 text-sm mt-5 mb-2">Equipment installed</h4>
    <div id="peqList"></div>
    <button class="btn btn-ghost mt-1" onclick="addPeq()">+ equipment line</button>
    <button class="btn btn-primary mt-4 block" onclick="saveProject(${id || 'null'})">Save</button>`;
  renderPeq();
  modal.classList.remove('hidden');
}
function renderPeq() {
  $el('peqList').innerHTML = window._peq.map((e, i) => `
    <div class="grid grid-cols-[1fr_90px_30px] gap-2 mb-2">
      <input class="input" placeholder="Equipment item" value="${esc(e.item)}" onchange="_peq[${i}].item=this.value">
      <input type="number" class="input" value="${e.qty}" onchange="_peq[${i}].qty=+this.value">
      <button class="text-slate-500 hover:text-red-400" onclick="_peq.splice(${i},1);renderPeq()">×</button>
    </div>`).join('');
}
function addPeq() { window._peq.push({ item: '', qty: 1 }); renderPeq(); }

async function uploadProjectImg(input) {
  const file = input.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1400, sc = Math.min(1, MAX / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(img.src);
        res(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = rej;
      img.src = URL.createObjectURL(file);
    });
    toast('Uploading…');
    const r = await api('/api/admin/upload', { method: 'POST', body: JSON.stringify({ data: dataUrl }) });
    pImage.value = r.path; pImgPrev.src = r.path;
    toast('Photo uploaded');
  } catch (e) { toast(e.message || 'Upload failed'); }
  input.value = '';
}
async function saveProject(id) {
  const body = {
    title: pTitle.value, client: pClient.value, location: pLoc.value, category: pCat.value,
    capacity_kw: +pKw.value || 0, description: pDesc.value, featured: pFeat.checked,
    completed_at: pInstall.value || null, status: 'Completed',
    town: pTown.value, site_name: pSite.value, existing_setup: pExisting.value, client_need: pNeed.value,
    equipment: window._peq.filter(e => e.item), price: +pPrice.value || 0, install_date: pInstall.value || null, image: pImage.value
  };
  if (!body.title) return toast('Title required');
  await api('api/admin.php?action=projects' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderProjects();
}
async function delProject(id) { if (!confirm('Delete project?')) return; await api(`api/admin.php?action=projects/${id}`, { method: 'DELETE' }); renderProjects(); }

// ---------- users ----------
async function renderUsers() {
  const list = await api('api/admin.php?action=users');
  window._users = list;
  $el('page').innerHTML = `<h1 class="page-h">User Management <button class="btn btn-primary ml-3" onclick="userEditor()">+ Add user</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[640px]">
    <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Joined</th><th></th></tr></thead>
    <tbody>${list.map(u => `<tr>
      <td class="font-semibold">${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.phone) || '—'}</td>
      <td><span class="badge ${u.role === 'admin' ? 'bg-sola-500/20 text-sola-400' : u.role === 'staff' ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10'}">${u.role}</span></td>
      <td class="text-xs text-slate-400">${u.created_at?.slice(0, 10)}</td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-ghost" onclick="userEditor(${u.id})">edit</button>
      <button class="btn btn-danger" onclick="delUser(${u.id})">×</button></td></tr>`).join('')}</tbody></table></div>`;
}
function userEditor(id) {
  const u = id ? window._users.find(x => x.id === id) : {};
  $el('modalTitle').textContent = id ? 'Edit user' : 'New user';
  $el('modalBody').innerHTML = `
    <div class="grid sm:grid-cols-2 gap-3">
      <input id="uName" placeholder="Name *" class="input" value="${esc(u.name)}">
      <input id="uEmail" placeholder="Email *" class="input" value="${esc(u.email)}">
      <input id="uPhone" placeholder="Phone" class="input" value="${esc(u.phone)}">
      <select id="uRole" class="input">${['client', 'staff', 'admin'].map(r => `<option ${u.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
      <input id="uPass" type="password" placeholder="${id ? 'New password (blank = keep)' : 'Password *'}" class="input sm:col-span-2">
    </div>
    <button class="btn btn-primary mt-4" onclick="saveUser(${id || 'null'})">Save</button>`;
  modal.classList.remove('hidden');
}
async function saveUser(id) {
  const body = { name: uName.value, email: uEmail.value, phone: uPhone.value, role: uRole.value, password: uPass.value || undefined };
  try {
    await api('api/admin.php?action=users' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
    toast('Saved'); modal.classList.add('hidden'); renderUsers();
  } catch (e) { toast(e.message); }
}
async function delUser(id) { if (!confirm('Delete user?')) return; try { await api(`api/admin.php?action=users/${id}`, { method: 'DELETE' }); renderUsers(); } catch (e) { toast(e.message); } }

// ---------- appliances db ----------
async function renderAppliances() {
  const list = await api('api/appliances.php');
  window._apps = list;
  $el('page').innerHTML = `<h1 class="page-h">Appliance Load Database <button class="btn btn-primary ml-3" onclick="appEditor()">+ Add</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[560px]">
    <thead><tr><th>Appliance</th><th class="text-right">Watts</th><th class="text-right">Surge ×</th><th>Category</th><th class="text-right">Default hrs</th><th></th></tr></thead>
    <tbody>${list.map(a => `<tr><td>${esc(a.name)}</td><td class="text-right">${a.watts}</td><td class="text-right">${a.surge}</td><td>${a.category}</td><td class="text-right">${a.default_hours}</td>
    <td class="text-right whitespace-nowrap"><button class="btn btn-ghost" onclick="appEditor(${a.id})">edit</button><button class="btn btn-danger" onclick="delApp(${a.id})">×</button></td></tr>`).join('')}</tbody></table></div>`;
}
function appEditor(id) {
  const a = id ? window._apps.find(x => x.id === id) : {};
  $el('modalTitle').textContent = id ? 'Edit appliance' : 'New appliance';
  $el('modalBody').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">
    <input id="apName" placeholder="Name *" class="input" value="${esc(a.name)}">
    <input id="apWatts" type="number" placeholder="Watts *" class="input" value="${a.watts || ''}">
    <input id="apSurge" type="number" step="0.1" placeholder="Surge multiplier" class="input" value="${a.surge || 1}">
    <input id="apCat" placeholder="Category" class="input" value="${esc(a.category) || 'General'}">
    <input id="apHrs" type="number" step="0.5" placeholder="Default hrs/day" class="input" value="${a.default_hours || 1}">
  </div><button class="btn btn-primary mt-4" onclick="saveApp(${id || 'null'})">Save</button>`;
  modal.classList.remove('hidden');
}
async function saveApp(id) {
  const body = { name: apName.value, watts: +apWatts.value, surge: +apSurge.value || 1, category: apCat.value, default_hours: +apHrs.value || 1 };
  await api('api/admin.php?action=appliances' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderAppliances();
}
async function delApp(id) { if (!confirm('Delete?')) return; await api(`api/admin.php?action=appliances/${id}`, { method: 'DELETE' }); renderAppliances(); }

// ---------- products catalog (feeds estimator & auto-quotes) ----------
const PROD_CATS = ['panel', 'inverter', 'battery', 'controller', 'other'];
async function renderProducts() {
  const list = await api('api/admin.php?action=products');
  window._prods = list;
  $el('page').innerHTML = `<h1 class="page-h">Products Catalog <button class="btn btn-primary ml-3" onclick="productEditor()">+ Add product</button></h1>
    <p class="text-sm text-slate-500 mb-4">Drives the AI estimator & auto-quotations — brand-aware line items and pricing. <b>★</b> marks preferred picks; the estimator selects those first, then best value per W/kWh. All fields are manually editable for monthly supplier price updates.</p>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[900px]">
    <thead><tr><th>Category</th><th>Brand</th><th>Model</th><th>Spec</th><th class="text-right">Capacity</th><th class="text-right">Price</th><th class="text-right">Warranty</th><th class="text-center">★</th><th class="text-center">Active</th><th></th></tr></thead>
    <tbody>${list.map(p => `<tr class="${p.active ? '' : 'opacity-40'}">
      <td><span class="badge bg-white/10">${p.category}</span></td>
      <td class="font-medium">${esc(p.brand)}</td>
      <td>${esc(p.model)}</td>
      <td class="text-xs text-slate-500">${esc(p.spec)}</td>
      <td class="text-right whitespace-nowrap">${p.capacity_w ? p.capacity_w + 'W' : p.capacity_kwh ? p.capacity_kwh + 'kWh' : '—'}</td>
      <td class="text-right font-medium">${fmt(p.price)}</td>
      <td class="text-right text-xs">${p.warranty_years ? p.warranty_years + 'yr' : '—'}</td>
      <td class="text-center"><button class="btn btn-ghost !px-2" title="Preferred pick" onclick="togglePreferred(${p.id})">${p.preferred ? '★' : '☆'}</button></td>
      <td class="text-center"><input type="checkbox" ${p.active ? 'checked' : ''} onchange="toggleActive(${p.id},this.checked)"></td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-ghost" onclick="productEditor(${p.id})">edit</button><button class="btn btn-danger" onclick="delProduct(${p.id})">×</button></td></tr>`).join('')}</tbody></table></div>`;
}
function productEditor(id) {
  const p = id ? window._prods.find(x => x.id === id) : { category: 'inverter' };
  let techSpecs = {};
  try { techSpecs = p.tech_specs_json ? JSON.parse(p.tech_specs_json) : {}; } catch { }
  window._techSpecs = techSpecs;
  $el('modalTitle').textContent = id ? 'Edit product' : 'New product';
  $el('modalBody').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">
    <select id="prCat" class="input">${PROD_CATS.map(c => `<option ${p.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    <input id="prBrand" placeholder="Brand * (e.g. Deye)" class="input" value="${esc(p.brand)}">
    <input id="prModel" placeholder="Model * (e.g. SUN-8K-SG04LP3)" class="input" value="${esc(p.model)}">
    <input id="prSpec" placeholder="Spec (e.g. 8kW 48V hybrid)" class="input" value="${esc(p.spec)}">
    <input id="prW" type="number" placeholder="Capacity W (panels / inverters)" class="input" value="${p.capacity_w || ''}">
    <input id="prKwh" type="number" step="0.01" placeholder="Capacity kWh (batteries)" class="input" value="${p.capacity_kwh || ''}">
    <input id="prPrice" type="number" step="0.01" placeholder="Price USD *" class="input" value="${p.price || ''}">
    <input id="prWarranty" type="number" step="0.5" placeholder="Warranty (years)" class="input" value="${p.warranty_years || ''}">
    <input id="prEff" type="number" step="0.1" placeholder="Efficiency %" class="input" value="${p.efficiency || ''}">
    <input id="prDim" placeholder="Dimensions (e.g. 1755x1098x35mm)" class="input" value="${esc(p.dimensions)}">
    <input id="prWeight" type="number" step="0.1" placeholder="Weight (kg)" class="input" value="${p.weight_kg || ''}">
    <input id="prSupplier" placeholder="Supplier reference/SKU" class="input" value="${esc(p.supplier_ref)}">
    <input id="prPriceUpdated" type="date" class="input" value="${p.price_updated_at ? p.price_updated_at.slice(0, 10) : ''}">
    <label class="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" id="prPref" ${p.preferred ? 'checked' : ''}> ★ preferred pick (estimator selects first)</label>
    <label class="flex items-center gap-2 text-sm col-span-2"><input type="checkbox" id="prActive" ${p.active !== 0 ? 'checked' : ''}> Active (visible in catalog)</label>
  </div>
  <h4 class="font-semibold text-sola-400 text-sm mt-5 mb-2">Additional Technical Specs</h4>
  <div id="techSpecsList"></div>
  <button class="btn btn-ghost mt-1" onclick="addTechSpec()">+ add spec line</button>
  <button class="btn btn-primary mt-4 block" onclick="saveProduct(${id || 'null'})">Save</button>`;
  renderTechSpecs();
  modal.classList.remove('hidden');
}
async function saveProduct(id) {
  const body = {
    category: prCat.value,
    brand: prBrand.value.trim(),
    model: prModel.value.trim(),
    spec: prSpec.value.trim(),
    capacity_w: +prW.value || 0,
    capacity_kwh: +prKwh.value || 0,
    price: +prPrice.value || 0,
    warranty_years: +prWarranty.value || 0,
    efficiency: +prEff.value || 0,
    dimensions: prDim.value.trim(),
    weight_kg: +prWeight.value || 0,
    supplier_ref: prSupplier.value.trim(),
    price_updated_at: prPriceUpdated.value || null,
    preferred: prPref.checked ? 1 : 0,
    active: prActive.checked ? 1 : 0,
    tech_specs_json: JSON.stringify(window._techSpecs || {})
  };
  if (!body.brand || !body.model) return toast('Brand and model required');
  await api('api/admin.php?action=products' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderProducts();
}

function renderTechSpecs() {
  const specs = Object.entries(window._techSpecs || {});
  $el('techSpecsList').innerHTML = specs.map(([key, val], i) => `
    <div class="grid grid-cols-[1fr_1fr_30px] gap-2 mb-2">
      <input class="input" placeholder="Spec name (e.g. Voltage)" value="${esc(key)}" onchange="updateTechSpecKey(${i}, this.value)">
      <input class="input" placeholder="Value (e.g. 48V)" value="${esc(val)}" onchange="updateTechSpecValue(${i}, this.value)">
      <button class="text-slate-500 hover:text-red-400" onclick="removeTechSpec(${i})">×</button>
    </div>`).join('');
}
function addTechSpec() {
  const keys = Object.keys(window._techSpecs);
  window._techSpecs[`spec_${keys.length + 1}`] = '';
  renderTechSpecs();
}
function updateTechSpecKey(index, newKey) {
  const keys = Object.keys(window._techSpecs);
  const oldKey = keys[index];
  if (oldKey && newKey && oldKey !== newKey) {
    window._techSpecs[newKey] = window._techSpecs[oldKey];
    delete window._techSpecs[oldKey];
  }
}
function updateTechSpecValue(index, newValue) {
  const keys = Object.keys(window._techSpecs);
  window._techSpecs[keys[index]] = newValue;
}
function removeTechSpec(index) {
  const keys = Object.keys(window._techSpecs);
  delete window._techSpecs[keys[index]];
  renderTechSpecs();
}
async function togglePreferred(id) {
  const p = window._prods.find(x => x.id === id);
  await api(`api/admin.php?action=products/${id}`, { method: 'PUT', body: JSON.stringify({ ...p, preferred: p.preferred ? 0 : 1 }) });
  renderProducts();
}
async function toggleActive(id, on) {
  const p = window._prods.find(x => x.id === id);
  await api(`api/admin.php?action=products/${id}`, { method: 'PUT', body: JSON.stringify({ ...p, active: on ? 1 : 0 }) });
  toast(on ? 'Activated' : 'Deactivated');
}
async function delProduct(id) { if (!confirm('Delete product?')) return; await api(`api/admin.php?action=products/${id}`, { method: 'DELETE' }); renderProducts(); }

// ---------- messages ----------
async function renderMessages() {
  const list = await api('api/admin.php?action=messages');
  $el('page').innerHTML = `<h1 class="page-h">Contact Messages</h1>
    <div class="space-y-3">${list.map(m => `
      <div class="card !p-4 ${m.status === 'New' ? 'border-sola-500/40' : ''}">
        <div class="flex justify-between items-start">
          <div><b class="text-white">${esc(m.name)}</b> <span class="text-xs text-slate-500">${esc(m.email)} ${esc(m.phone)} · ${m.created_at}</span></div>
          ${m.status === 'New' ? `<button class="btn btn-ghost" onclick="api('api/admin.php?action=messages/${m.id}',{method:'PUT',body:JSON.stringify({status:'Read'})}).then(renderMessages)">mark read</button>` : ''}
        </div>
        <p class="text-sm text-slate-300 mt-2">${esc(m.body)}</p>
      </div>`).join('') || '<p class="text-slate-500">No messages.</p>'}</div>`;
}

// ---------- settings ----------
async function renderSettings() {
  const s = await api('api/admin.php?action=settings');
  const groups = {
    'Company': ['company_name', 'legal_name', 'tagline', 'email', 'phone', 'phone_alt', 'whatsapp', 'address', 'tax_reg', 'currency'],
    'Documents': ['quote_validity_days', 'payment_terms', 'quote_note'],
    'Financial': ['vat_rate', 'price_margin_pct', 'labour_base'],
    'Component pricing': ['price_panel_per_w', 'panel_unit_w', 'price_battery_kwh', 'price_inverter_per_w', 'price_controller', 'price_bos_pct', 'price_install_pct'],
    'Engineering defaults': ['default_sun_hours'],
    'Integrations': ['sms_gateway_url', 'sms_gateway_key']
  };
  $el('page').innerHTML = `<h1 class="page-h">Settings & Pricing Engine</h1>
    <div class="grid lg:grid-cols-2 gap-6">${Object.entries(groups).map(([g, keys]) => `
      <div class="card"><h3 class="font-bold text-white mb-4">${g}</h3>
        ${keys.map(k => {
          const label = `<label class="lbl">${k.replace(/_/g, ' ')}</label>`;
          return (k === 'payment_terms' || k === 'quote_note')
            ? `${label}<textarea id="set_${k}" rows="3" class="input">${esc(s[k])}</textarea>`
            : `${label}<input id="set_${k}" class="input" value="${esc(s[k])}">`;
        }).join('')}
      </div>`).join('')}
      <div class="card"><h3 class="font-bold text-white mb-1">Company signature</h3>
        <p class="text-xs text-slate-500 mb-3">Your signature (PNG, transparent background looks best) — printed above the "Prepared by" line on quotations &amp; invoices.</p>
        <div class="rounded-lg border border-dashed border-white/15 p-4 flex items-center gap-4" style="background:#fff">
          <img id="sigPreview" src="${s.signature_png ? '/' + esc(s.signature_png) : ''}" style="height:56px;${s.signature_png ? '' : 'display:none'}" class="object-contain">
          <input type="file" id="sigFile" accept="image/png" class="text-xs text-slate-700" onchange="uploadSignature(this)">
        </div>
        <input type="hidden" id="set_signature_png" value="${esc(s.signature_png || '')}">
      </div></div>
    <button class="btn btn-primary mt-6 !px-8 !py-3" onclick="saveSettings()">Save all settings</button>`;
}
async function saveSettings() {
  const body = {};
  document.querySelectorAll('[id^="set_"]').forEach(i => body[i.id.slice(4)] = i.value);
  await api('api/admin.php?action=settings', { method: 'PUT', body: JSON.stringify(body) });
  COMPANY = body;
  toast('Settings saved — estimator now uses new pricing');
}
function uploadSignature(input) {
  const file = input?.files?.[0];
  if (!file) return;
  if (!/png/i.test(file.type || '') && !file.name.toLowerCase().endsWith('.png')) return toast('Please upload a PNG image');
  const rd = new FileReader();
  rd.onload = async () => {
    try {
      const r = await api('/api/admin/upload', { method: 'POST', body: JSON.stringify({ data: rd.result }) });
      const img = $el('sigPreview');
      img.src = '/' + r.path; img.style.display = '';
      $el('set_signature_png').value = r.path;
      await saveSettings();
      toast('Signature saved — will appear on quotations & invoices');
    } catch (e) { toast(e.message); }
  };
  rd.readAsDataURL(file);
}

// ---------- shared: printable documents & CSV export ----------
const PRINT_CSS = `body{font-family:'Segoe UI',Arial,sans-serif;color:#1c1c1c;max-width:800px;margin:0 auto;padding:28px 36px;font-size:12.5px;line-height:1.45}
.top{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}
.logo{width:78px;height:78px;object-fit:cover;border-radius:6px;flex:none}
.co h1{margin:0 0 2px;font-size:18px;color:#0B1B4A}
.co p{margin:1px 0;font-size:11.5px;color:#333}
.doc-kind{font-size:28px;font-weight:700;color:#FC6D05;letter-spacing:-.4px;text-align:right;line-height:1}
.rule{height:3px;margin:12px 0 16px;background:linear-gradient(90deg,#FC6D05 0 46%,#1236B0 46% 100%);-webkit-print-color-adjust:exact;print-color-adjust:exact}
.parties{display:flex;justify-content:space-between;gap:24px;margin-bottom:14px}
.kicker{font-size:11px;font-weight:700;letter-spacing:.06em;color:#1236B0;text-transform:uppercase}
.to-name{font-size:16px;font-weight:700;color:#0B1B4A;margin-top:3px}
.to-detail{color:#333;margin-top:2px}
.to-contact{color:#555;font-size:11.5px;margin-top:4px}
.party-meta{text-align:right;font-size:12.5px}
.party-meta div{margin:2px 0}
.party-meta span{color:#555}
.party-meta b{color:#0B1B4A}
table.items{width:100%;border-collapse:collapse;margin-top:6px}
table.items th{background:#0B1B4A;color:#fff;text-align:left;padding:8px 10px;font-size:11px;font-weight:600;-webkit-print-color-adjust:exact;print-color-adjust:exact}
table.items td{padding:7px 10px;border-bottom:1px solid #eee;vertical-align:top}
table.items tbody tr:nth-child(even){background:#fff6ef;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.settle{display:flex;justify-content:space-between;align-items:flex-start;gap:28px;margin-top:16px}
.pay{flex:1;max-width:420px}
.pay h3{margin:0 0 6px;font-size:12px;letter-spacing:.04em;text-transform:uppercase;color:#1236B0}
.pay p{margin:0;color:#222}
.sum{width:250px;border-collapse:collapse}
.sum td{padding:3px 0;border:none}
.sum .due td{font-size:15px;font-weight:700;color:#FC6D05;border-top:2px solid #FC6D05;padding-top:8px}
.sum tr{background:transparent !important}
.note{margin-top:28px;border-top:1px solid #e4e4e4;padding-top:12px}
.note h3{margin:0 0 6px;color:#0B1B4A;font-size:14px}
.note p{margin:0;color:#333}
h2{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#0B1B4A;margin:26px 0 8px;border-left:4px solid #FC6D05;padding-left:9px}
.meta{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:22px}
.box{background:#fff8f3;border:1px solid #f3e0d2;border-radius:8px;padding:12px 14px}
.box .k{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#1236B0;margin-bottom:6px}
.box.accent{border-left:4px solid #FC6D05}
table{width:100%;border-collapse:collapse}
thead th{background:#0B1B4A;color:#fff;text-align:left;padding:9px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.08em;-webkit-print-color-adjust:exact;print-color-adjust:exact}
thead th.r,.r{text-align:right}
td{padding:8px 10px;border-bottom:1px solid #eee;vertical-align:top}
tbody tr:nth-child(even){background:#fff6ef;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.tot{font-weight:700}
.big{font-size:20px;color:#FC6D05}
.terms p{margin:4px 0;font-size:12px;color:#333}
.sign{margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:48px}
.sign div{border-top:1.5px solid #0B1B4A;padding-top:7px;font-size:11px;color:#555}
.sig{height:52px;display:block;margin:8px 0 0}
.foot{margin-top:28px;border-top:1px solid #eee;padding-top:8px;font-size:10px;color:#999;text-align:center}
@media print{body{padding:0;margin:0}}`;
function docDate(value) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(String(value).trim().length <= 10 ? String(value).trim().slice(0, 10) + 'T00:00:00' : String(value).trim().replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
}
function plusDays(value, days) {
  const base = String(value || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
  const d = new Date(base + 'T00:00:00');
  d.setDate(d.getDate() + Number(days || 0));
  return docDate(d);
}
const docFmt = n => '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
function docQty(n) {
  const x = Number(n);
  if (!Number.isFinite(x)) return '';
  return String(Math.round(x * 1000) / 1000);
}
function companyIdentity() {
  const legal = COMPANY.legal_name || 'Solabliss Zimbabwe Pvt Ltd';
  const phones = [COMPANY.phone, COMPANY.phone_alt].filter(Boolean).join(', ');
  return `<div class="co">
    <h1>${esc(legal)}</h1>
    ${COMPANY.tax_reg ? `<p>Tax Reg No. ${esc(COMPANY.tax_reg)}</p>` : ''}
    ${phones ? `<p>${esc(phones)}</p>` : ''}
    ${COMPANY.email ? `<p>${esc(COMPANY.email)}</p>` : ''}
    ${COMPANY.address ? `<p>${esc(COMPANY.address)}</p>` : ''}
  </div>`;
}
function coHeader(title, ref) {
  return `<div class="top"><img class="logo" src="/img/logo.jpg" alt="">${companyIdentity()}<div class="doc-kind">${esc(title)}${ref ? `<div style="font-size:14px;color:#0B1B4A;margin-top:4px">${esc(ref)}</div>` : ''}</div></div><div class="rule"></div>`;
}
function coSignature() {
  return COMPANY.signature_png ? `<img class="sig" src="/${esc(COMPANY.signature_png)}" alt="signature">` : '';
}
function printDoc(title, bodyHtml) {
  const w = window.open('', '_blank', 'width=900,height=700');
  w.document.write(`<!DOCTYPE html><html><head><title>${esc(title)}</title><meta charset="utf-8"><style>${PRINT_CSS}</style></head><body>${bodyHtml}<div class="foot">Generated ${new Date().toLocaleString()} — ${esc(COMPANY.company_name || 'Solabliss')}</div><script>window.onload=function(){window.print()}<\/script></body></html>`);
  w.document.close();
}
function exportCSV(name, rows) {
  const csv = rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
  a.download = name + '.csv'; a.click(); URL.revokeObjectURL(a.href);
}

// ---------- quotation / invoice print documents ----------
function lineTable(items) {
  return `<table class="items"><thead><tr><th>Item</th><th class="r">Quantity</th><th class="r">Price</th><th class="r">Amount</th></tr></thead>
    <tbody>${items.map(i => `<tr><td>${esc(i.item)}</td><td class="r">${docQty(i.qty)}</td><td class="r">${docFmt(i.unit_price)}</td><td class="r">${docFmt(i.total)}</td></tr>`).join('')}</tbody></table>`;
}
function moneyBlock(rows) {
  return `<table class="sum">${rows.map(([k, v]) => `<tr class="${k === 'Amount Due' ? 'due' : ''}"><td>${k}</td><td class="r">${v}</td></tr>`).join('')}</table>`;
}
function payBlock() {
  const terms = COMPANY.payment_terms || "Preferably we accept once off payment but not limited to installments after a deposit.\nWe don't do Cash ON Delivery services.";
  return `<div class="pay"><h3>Payment Instruction</h3><p>${esc(terms).replace(/\n/g, '<br>')}</p></div>`;
}
function noteBlock(extra) {
  const note = COMPANY.quote_note || 'Please note that all quotations from Solabliss are valid for 5 days from the day of issuance in that period we wish to hear from you for confirmation and way forward. Our combo packages comes with a workmanship warranty of 12 months and after sale support of a lifetime.';
  return `<div class="note"><h3>Note</h3><p>${esc(note)}</p>${extra ? `<div style="margin-top:10px">${extra}</div>` : ''}${coSignature()}</div>`;
}
function commercialDoc({ title, kind, kicker, number, toName, toDetail, contact, date, due, items, subtotal, vat, total, paid, extra }) {
  const rows = [['Subtotal', docFmt(subtotal)]];
  if (Number(vat)) rows.push(['VAT', docFmt(vat)]);
  rows.push(['Total', docFmt(total)]);
  if (paid != null) rows.push(['Paid', docFmt(paid)]);
  rows.push(['Amount Due', docFmt(paid == null ? total : Number(total) - Number(paid))]);
  printDoc(title, `<div class="top"><img class="logo" src="/img/logo.jpg" alt="">${companyIdentity()}<div class="doc-kind">${esc(kind)}</div></div>
    <div class="rule"></div>
    <div class="parties">
      <div><div class="kicker">${esc(kicker)}</div><div class="to-name">${esc(toName || '')}</div>
        ${toDetail ? `<div class="to-detail">${esc(toDetail)}</div>` : ''}
        ${contact ? `<div class="to-contact">${contact}</div>` : ''}</div>
      <div class="party-meta"><div><span>${esc(kind)} #</span> <b>${esc(number || '')}</b></div>
        <div><span>Date</span> <b>${esc(date)}</b></div>
        <div><span>Due date</span> <b>${esc(due || '')}</b></div></div>
    </div>
    ${lineTable(items || [])}
    <div class="settle">${payBlock()}${moneyBlock(rows)}</div>
    ${noteBlock(extra)}`);
}
async function printQuote(id) {
  const qq = window._quotes.find(x => x.id === id);
  const items = await api(`api/admin.php?action=quotes/${id}/items`);
  const contact = [qq.client_email, qq.client_phone].filter(Boolean).map(esc).join('<br>');
  commercialDoc({
    title: `Quotation ${qq.ref}`,
    kind: 'Quotation',
    kicker: 'Solabliss quotation to',
    number: qq.ref,
    toName: qq.client_name,
    toDetail: qq.system_type || '',
    contact,
    date: docDate(qq.created_at),
    due: plusDays(qq.created_at, COMPANY.quote_validity_days || 5),
    items,
    subtotal: qq.subtotal,
    vat: qq.vat,
    total: qq.total,
    extra: qq.notes ? esc(qq.notes).replace(/\n/g, '<br>') : ''
  });
}
async function printInvoice(id) {
  const i = window._invoices.find(x => x.id === id);
  const contact = [i.client_email, i.client_phone].filter(Boolean).map(esc).join('<br>');
  const history = i.payments?.length
    ? `<table class="items" style="margin-top:14px"><thead><tr><th>Date</th><th>Method</th><th>Note</th><th class="r">Amount</th></tr></thead><tbody>${i.payments.map(p => `<tr><td>${docDate(p.created_at)}</td><td>${esc(p.method || '')}</td><td>${esc(p.note || '')}</td><td class="r">${docFmt(p.amount)}</td></tr>`).join('')}</tbody></table>`
    : '';
  commercialDoc({
    title: `Invoice ${i.ref}`,
    kind: 'Invoice',
    kicker: 'Solabliss invoice to',
    number: i.ref,
    toName: i.client_name,
    toDetail: i.status ? `Status: ${i.status}` : '',
    contact,
    date: docDate(i.created_at),
    due: i.due_date ? docDate(i.due_date) : 'On receipt',
    items: i.items || [],
    subtotal: i.subtotal,
    vat: i.vat,
    total: i.total,
    paid: i.paid,
    extra: `${i.notes ? `<p>${esc(i.notes).replace(/\n/g, '<br>')}</p>` : ''}${history}`
  });
}

// ---------- visitor analytics ----------
async function renderAnalytics() {
  const a = await api('api/admin.php?action=analytics');
  const max = Math.max(1, ...a.byDay.map(d => d.views));
  $el('page').innerHTML = `<h1 class="page-h">Visitor Analytics</h1>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <div class="stat-card"><b>${a.totalViews}</b><span>Total page views</span></div>
      <div class="stat-card"><b>${a.uniqueVisitors}</b><span>Unique visitors</span></div>
      <div class="stat-card"><b>${a.todayViews}</b><span>Views today</span></div>
      <div class="stat-card"><b>${a.topPages[0]?.path || '—'}</b><span>Top page</span></div>
    </div>
    <div class="card mb-6"><h3 class="font-bold text-white mb-4">Views — last ${a.byDay.length} days</h3>
      <div class="flex items-end gap-1 h-40">${a.byDay.map(d => `<div class="flex-1 flex flex-col items-center gap-1"><div class="w-full bg-sola-500/70 rounded-t" style="height:${Math.max(4, d.views / max * 100)}%" title="${d.views} views / ${d.uniques} uniques"></div><span class="text-[9px] text-slate-500 -rotate-45 origin-top-left whitespace-nowrap">${d.d.slice(5)}</span></div>`).join('') || '<p class="text-slate-500">No traffic yet.</p>'}</div></div>
    <div class="grid lg:grid-cols-3 gap-6">
      <div class="card"><h3 class="font-bold text-white mb-3">Top pages</h3>${a.topPages.map(p => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5"><span>${esc(p.path)}</span><b>${p.c}</b></div>`).join('') || '<p class="text-slate-500 text-sm">—</p>'}</div>
      <div class="card"><h3 class="font-bold text-white mb-3">Referrers</h3>${a.topReferrers.map(r => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5 gap-2"><span class="truncate">${esc(r.referrer)}</span><b>${r.c}</b></div>`).join('') || '<p class="text-slate-500 text-sm">No external referrers yet.</p>'}</div>
      <div class="card"><h3 class="font-bold text-white mb-3">Recent hits</h3>${a.recent.map(r => `<div class="text-xs py-1.5 border-t border-white/5"><span class="text-sola-400">${esc(r.path)}</span> <span class="text-slate-500">${esc(r.ip)} · ${r.created_at?.slice(5, 16)}</span></div>`).join('')}</div>
    </div>`;
}

// ---------- leads ----------
async function renderLeads() {
  const list = await api('api/admin.php?action=leads');
  window._leads = list;
  const needs = ['new installation', 'maintenance', 'contracting', 'consulting', 'sizing', 'general inquiry'];
  const stats = ['New', 'Contacted', 'Qualified', 'Quoted', 'Won', 'Lost'];
  $el('page').innerHTML = `<h1 class="page-h">Lead Generation <button class="btn btn-primary ml-3" onclick="leadEditor()">+ Add lead</button>
    <button class="btn btn-ghost ml-2" onclick="exportCSV('leads',[['Name','Phone','Email','Address','Need','Source','Status','Subscribed','Date'],..._leads.map(l=>[l.name,l.phone,l.email,l.address,l.need,l.source,l.status,l.subscribed?'yes':'no',l.created_at])])">⬇ CSV</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[860px]">
    <thead><tr><th>Lead</th><th>Phone</th><th>Email</th><th>Address</th><th>Need</th><th>Source</th><th>Sub</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>${list.map(l => `<tr>
      <td class="font-semibold">${esc(l.name)}</td><td>${esc(l.phone)}</td><td class="text-xs">${esc(l.email)}</td><td class="text-xs">${esc(l.address)}</td>
      <td><span class="badge bg-sola-500/15 text-sola-400">${l.need}</span></td><td class="text-xs text-slate-500">${l.source}</td>
      <td>${l.subscribed ? '✓' : '—'}</td>
      <td><select onchange="api('api/admin.php?action=leads/${l.id}',{method:'PUT',body:JSON.stringify({status:this.value})})" class="input !w-auto !py-1 text-xs">${stats.map(s => `<option ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
      <td class="text-xs text-slate-500">${l.created_at?.slice(0, 10)}</td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-ghost" onclick="leadEditor(${l.id})">edit</button><button class="btn btn-danger" onclick="delLead(${l.id})">×</button></td></tr>`).join('') || '<tr><td colspan="10" class="text-slate-500">No leads yet.</td></tr>'}</tbody></table></div>`;
}
function leadEditor(id) {
  const l = id ? window._leads.find(x => x.id === id) : {};
  const needs = ['new installation', 'maintenance', 'contracting', 'consulting', 'sizing', 'general inquiry'];
  $el('modalTitle').textContent = id ? 'Edit lead' : 'New lead';
  $el('modalBody').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">
    <input id="ldName" placeholder="Name" class="input" value="${esc(l.name)}">
    <input id="ldPhone" placeholder="Phone" class="input" value="${esc(l.phone)}">
    <input id="ldEmail" placeholder="Email" class="input" value="${esc(l.email)}">
    <input id="ldAddr" placeholder="Home / site address" class="input" value="${esc(l.address)}">
    <select id="ldNeed" class="input">${needs.map(n => `<option ${l.need === n ? 'selected' : ''}>${n}</option>`).join('')}</select>
    <select id="ldStatus" class="input">${['New', 'Contacted', 'Qualified', 'Quoted', 'Won', 'Lost'].map(s => `<option ${l.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <label class="flex items-center gap-2 text-sm sm:col-span-2"><input id="ldSub" type="checkbox" ${l.subscribed !== 0 ? 'checked' : ''} class="accent-sola-500"> Subscribed to newsletter</label>
  </div><button class="btn btn-primary mt-4" onclick="saveLead(${id || 'null'})">Save</button>`;
  modal.classList.remove('hidden');
}
async function saveLead(id) {
  const body = { name: ldName.value, phone: ldPhone.value, email: ldEmail.value, address: ldAddr.value, need: ldNeed.value, status: ldStatus.value, subscribed: ldSub.checked, source: 'manual' };
  await api('api/admin.php?action=leads' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderLeads();
}
async function delLead(id) { if (!confirm('Delete lead?')) return; await api(`api/admin.php?action=leads/${id}`, { method: 'DELETE' }); renderLeads(); }

// ---------- newsletter ----------
async function renderNewsletter() {
  const [list, audience] = await Promise.all([api('api/admin.php?action=newsletters'), api('api/admin.php?action=newsletters/audience')]);
  $el('page').innerHTML = `<h1 class="page-h">Newsletter Blast</h1>
    <div class="grid lg:grid-cols-2 gap-6">
      <div class="card">
        <h3 class="font-bold text-white mb-4">Compose blast</h3>
        <p class="text-sm text-slate-400 mb-3">Audience: <b class="text-sola-400">${audience.length}</b> subscribed email${audience.length === 1 ? '' : 's'}</p>
{{ ... }
        <input id="nlSubject" placeholder="Subject" class="input mb-3">
        <textarea id="nlBody" rows="8" placeholder="Newsletter body…" class="input"></textarea>
        <select id="nlAudience" class="input mt-3"><option value="subscribed">Subscribed leads only</option><option value="all">All leads with email</option></select>
        <button class="btn btn-primary mt-4 !px-6 !py-2.5" onclick="sendNewsletter()">📣 Send blast</button>
        <p class="text-xs text-slate-500 mt-3">Blasts are logged with their recipient list. Connect an SMTP/mail provider to deliver real emails.</p>
      </div>
      <div class="card"><h3 class="font-bold text-white mb-3">History</h3>
        ${list.map(n => `<div class="py-3 border-t border-white/5"><b class="text-white">${esc(n.subject)}</b>
          <p class="text-xs text-slate-500">${n.sent_count} recipient${n.sent_count === 1 ? '' : 's'} · ${n.audience} · ${n.created_at}</p>
          <p class="text-sm text-slate-400 mt-1 line-clamp-3">${esc(n.body)}</p></div>`).join('') || '<p class="text-slate-500 text-sm">No blasts sent yet.</p>'}</div>
    </div>`;
}
async function sendNewsletter() {
  if (!nlSubject.value || !nlBody.value) return toast('Subject and body required');
  const r = await api('api/admin.php?action=newsletters', { method: 'POST', body: JSON.stringify({ subject: nlSubject.value, body: nlBody.value, audience: nlAudience.value }) });
  toast(`Blast logged to ${r.sent_count} recipients`); renderNewsletter();
}

// ---------- SMS alerts ----------
async function renderSms() {
  const list = await api('api/admin.php?action=sms');
  $el('page').innerHTML = `<h1 class="page-h">SMS Alerts</h1>
    <div class="grid lg:grid-cols-3 gap-6">
      <div class="card">
        <h3 class="font-bold text-white mb-4">Send SMS</h3>
        <input id="smsPhone" placeholder="Phone e.g. +26377…" class="input mb-3">
        <textarea id="smsMsg" rows="4" placeholder="Message" class="input"></textarea>
        <button class="btn btn-primary mt-3" onclick="sendSms()">Send</button>
        <p class="text-xs text-slate-500 mt-3">Configure <b>sms_gateway_url</b> & <b>sms_gateway_key</b> in Settings → Integrations for live delivery; otherwise messages queue here.</p>
        <h4 class="font-semibold text-sola-400 text-sm mt-5 mb-2">Quick blast to leads</h4>
        <button class="btn btn-ghost" onclick="smsBlast()">SMS all subscribed leads</button>
      </div>
      <div class="card lg:col-span-2"><h3 class="font-bold text-white mb-3">SMS log</h3>
        <table class="table w-full"><thead><tr><th>To</th><th>Message</th><th>Status</th><th>Time</th></tr></thead>
        <tbody>${list.map(s => `<tr><td>${esc(s.phone)}</td><td class="text-xs">${esc(s.message)}</td><td class="text-xs">${esc(s.status)}</td><td class="text-xs text-slate-500">${s.created_at}</td></tr>`).join('') || '<tr><td colspan="4" class="text-slate-500">No SMS sent.</td></tr>'}</tbody></table></div>
    </div>`;
}
async function sendSms() {
  if (!smsPhone.value || !smsMsg.value) return toast('Phone and message required');
  const r = await api('api/admin.php?action=sms', { method: 'POST', body: JSON.stringify({ phone: smsPhone.value, message: smsMsg.value }) });
  toast(r.status); renderSms();
}
async function smsBlast() {
  const msg = prompt('Message to all subscribed leads:', 'Solabliss: ');
  if (!msg) return;
  const leads = await api('api/admin.php?action=leads');
  const phones = [...new Set(leads.filter(l => l.subscribed && l.phone).map(l => l.phone))];
  for (const phone of phones) await api('api/admin.php?action=sms', { method: 'POST', body: JSON.stringify({ phone, message: msg }) });
  toast(`Queued ${phones.length} SMS`); renderSms();
}

// ---------- net metering ----------
async function renderNetMetering() {
  const { rows, totals } = await api('api/admin.php?action=netmetering');
  window._nm = rows;
  $el('page').innerHTML = `<h1 class="page-h">Net Metering <button class="btn btn-primary ml-3" onclick="nmEditor()">+ Add reading</button>
    <button class="btn btn-ghost ml-2" onclick="exportCSV('net-metering',[['Site','Client','Period','Imported kWh','Exported kWh','Import rate','Export rate','Net value','Notes'],..._nm.map(m=>[m.site_name,m.client,m.period,m.imported_kwh,m.exported_kwh,m.rate_import,m.rate_export,(m.exported_kwh*m.rate_export-m.imported_kwh*m.rate_import).toFixed(2),m.notes])])">⬇ CSV</button></h1>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="stat-card"><b>${totals.imported.toLocaleString()}kWh</b><span>Imported</span></div>
      <div class="stat-card"><b>${totals.exported.toLocaleString()}kWh</b><span>Exported</span></div>
      <div class="stat-card"><b>${(totals.exported - totals.imported).toLocaleString()}kWh</b><span>Net energy</span></div>
      <div class="stat-card"><b>${fmt(totals.netValue)}</b><span>Net value</span></div>
    </div>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[720px]">
    <thead><tr><th>Site</th><th>Client</th><th>Period</th><th class="text-right">Imported</th><th class="text-right">Exported</th><th class="text-right">Net kWh</th><th class="text-right">Net value</th><th></th></tr></thead>
    <tbody>${rows.map(m => `<tr>
      <td>${esc(m.site_name)}</td><td>${esc(m.client)}</td><td>${m.period}</td>
      <td class="text-right">${m.imported_kwh.toLocaleString()}</td><td class="text-right">${m.exported_kwh.toLocaleString()}</td>
      <td class="text-right ${m.exported_kwh > m.imported_kwh ? 'text-sky-400' : 'text-slate-300'}">${(m.exported_kwh - m.imported_kwh).toLocaleString()}</td>
      <td class="text-right font-semibold">${fmt(m.exported_kwh * m.rate_export - m.imported_kwh * m.rate_import)}</td>
      <td class="text-right whitespace-nowrap"><button class="btn btn-ghost" onclick="nmEditor(${m.id})">edit</button><button class="btn btn-danger" onclick="delNm(${m.id})">×</button></td></tr>`).join('') || '<tr><td colspan="8" class="text-slate-500">No readings yet.</td></tr>'}</tbody></table></div>`;
}
function nmEditor(id) {
  const m = id ? window._nm.find(x => x.id === id) : {};
  $el('modalTitle').textContent = id ? 'Edit meter reading' : 'New meter reading';
  $el('modalBody').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">
    <input id="nmSite" placeholder="Site name *" class="input" value="${esc(m.site_name)}">
    <input id="nmClient" placeholder="Client" class="input" value="${esc(m.client)}">
    <input id="nmPeriod" type="month" class="input" value="${m.period || ''}">
    <div></div>
    <input id="nmImp" type="number" placeholder="Imported kWh" class="input" value="${m.imported_kwh ?? ''}">
    <input id="nmExp" type="number" placeholder="Exported kWh" class="input" value="${m.exported_kwh ?? ''}">
    <input id="nmRi" type="number" step="0.01" placeholder="Import rate $/kWh" class="input" value="${m.rate_import ?? 0.12}">
    <input id="nmRe" type="number" step="0.01" placeholder="Export rate $/kWh" class="input" value="${m.rate_export ?? 0.09}">
    <input id="nmNotes" placeholder="Notes" class="input sm:col-span-2" value="${esc(m.notes)}">
  </div><button class="btn btn-primary mt-4" onclick="saveNm(${id || 'null'})">Save</button>`;
  modal.classList.remove('hidden');
}
async function saveNm(id) {
  const body = { site_name: nmSite.value, client: nmClient.value, period: nmPeriod.value, imported_kwh: +nmImp.value || 0, exported_kwh: +nmExp.value || 0, rate_import: +nmRi.value || 0, rate_export: +nmRe.value || 0, notes: nmNotes.value };
  await api('api/admin.php?action=netmetering' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderNetMetering();
}
async function delNm(id) { if (!confirm('Delete reading?')) return; await api(`api/admin.php?action=netmetering/${id}`, { method: 'DELETE' }); renderNetMetering(); }

// ---------- job assessments ----------
async function renderAssessments() {
  const list = await api('api/admin.php?action=assessments');
  window._assess = list;
  $el('page').innerHTML = `<h1 class="page-h">Job Assessments <button class="btn btn-primary ml-3" onclick="assessEditor()">+ New assessment</button></h1>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[720px]">
    <thead><tr><th>Client</th><th>Site</th><th>Roof / Phase</th><th>Assessor</th><th>Status</th><th>Date</th><th></th></tr></thead>
    <tbody>${list.map(a => `<tr>
      <td class="font-semibold">${esc(a.client)}<br><span class="text-xs font-normal text-slate-500">${esc(a.phone)}</span></td>
      <td class="text-xs">${esc(a.address)}</td><td class="text-xs">${esc(a.roof_type)} ${a.roof_area ? '· ' + a.roof_area + 'm²' : ''}<br>${a.phase}-phase</td>
      <td class="text-xs">${esc(a.assessor)}</td><td><span class="badge ${a.status === 'Completed' ? 'bg-sky-500/20 text-sky-400' : 'bg-white/10'}">${a.status}</span></td>
      <td class="text-xs text-slate-500">${a.created_at?.slice(0, 10)}</td>
      <td class="text-right whitespace-nowrap">
        <button class="btn btn-ghost" onclick="assessReport(${a.id})">📋 report</button>
        <button class="btn btn-ghost" onclick="assessEditor(${a.id})">edit</button>
        <button class="btn btn-danger" onclick="delAssess(${a.id})">×</button></td></tr>`).join('') || '<tr><td colspan="7" class="text-slate-500">No assessments yet.</td></tr>'}</tbody></table></div>`;
}
function assessEditor(id) {
  const a = id ? window._assess.find(x => x.id === id) : {};
  $el('modalTitle').textContent = id ? 'Edit assessment' : 'New site assessment';
  $el('modalBody').innerHTML = `<div class="grid sm:grid-cols-2 gap-3">
    <input id="asClient" placeholder="Client *" class="input" value="${esc(a.client)}">
    <input id="asPhone" placeholder="Phone" class="input" value="${esc(a.phone)}">
    <input id="asAddr" placeholder="Site address" class="input sm:col-span-2" value="${esc(a.address)}">
    <select id="asRoof" class="input">${['IBR sheet', 'Tile', 'Flat concrete', 'Thatch', 'Ground mount', 'Other'].map(r => `<option ${a.roof_type === r ? 'selected' : ''}>${r}</option>`).join('')}</select>
    <input id="asArea" type="number" placeholder="Usable roof area (m²)" class="input" value="${a.roof_area || ''}">
    <select id="asShade" class="input">${['None', 'Light (morning/evening)', 'Moderate', 'Heavy'].map(s => `<option ${a.shading === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
    <select id="asPhase" class="input"><option value="single" ${a.phase === 'single' ? 'selected' : ''}>Single-phase</option><option value="three" ${a.phase === 'three' ? 'selected' : ''}>Three-phase</option></select>
    <input id="asExist" placeholder="Existing system / supply" class="input sm:col-span-2" value="${esc(a.existing_system)}">
    <input id="asAccess" placeholder="Access & mounting notes" class="input sm:col-span-2" value="${esc(a.access_notes)}">
    <textarea id="asFind" rows="3" placeholder="Findings (load profile, DB condition, cable runs…)" class="input sm:col-span-2">${esc(a.findings)}</textarea>
    <textarea id="asRec" rows="3" placeholder="Recommendation" class="input sm:col-span-2">${esc(a.recommendation)}</textarea>
    <input id="asAssessor" placeholder="Assessor" class="input" value="${esc(a.assessor)}">
    <select id="asStatus" class="input">${['Draft', 'Completed', 'Quoted'].map(s => `<option ${a.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
  </div><button class="btn btn-primary mt-4" onclick="saveAssess(${id || 'null'})">Save</button>`;
  modal.classList.remove('hidden');
}
async function saveAssess(id) {
  const body = { client: asClient.value, phone: asPhone.value, address: asAddr.value, roof_type: asRoof.value, roof_area: asArea.value, shading: asShade.value, phase: asPhase.value, existing_system: asExist.value, access_notes: asAccess.value, findings: asFind.value, recommendation: asRec.value, assessor: asAssessor.value, status: asStatus.value };
  await api('api/admin.php?action=assessments' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) });
  toast('Saved'); modal.classList.add('hidden'); renderAssessments();
}
async function delAssess(id) { if (!confirm('Delete assessment?')) return; await api(`api/admin.php?action=assessments/${id}`, { method: 'DELETE' }); renderAssessments(); }
function assessReport(id) {
  const a = window._assess.find(x => x.id === id);
  printDoc(`Site Assessment — ${a.client}`, `${coHeader('SITE ASSESSMENT REPORT', 'JA-' + String(a.id).padStart(4, '0'))}
    <div class="meta"><div class="box"><div class="k">Client</div><b>${esc(a.client)}</b><br>${esc(a.phone || '')}</div>
    <div class="box"><div class="k">Site</div>${esc(a.address || '')}<br>Assessed: ${a.created_at?.slice(0, 10)} · by ${esc(a.assessor || '')}</div></div>
    <h2>Site conditions</h2><table><tbody>
      <tr><td style="width:35%"><b>Roof type</b></td><td>${esc(a.roof_type)}</td></tr>
      <tr><td><b>Usable roof area</b></td><td>${a.roof_area ? a.roof_area + ' m²' : '—'}</td></tr>
      <tr><td><b>Shading</b></td><td>${esc(a.shading)}</td></tr>
      <tr><td><b>Supply phase</b></td><td>${a.phase}-phase</td></tr>
      <tr><td><b>Existing system</b></td><td>${esc(a.existing_system || 'None recorded')}</td></tr>
      <tr><td><b>Access / mounting</b></td><td>${esc(a.access_notes || '—')}</td></tr></tbody></table>
    <h2>Findings</h2><p>${esc(a.findings || '—').replace(/\n/g, '<br>')}</p>
    <h2>Recommendation</h2><p>${esc(a.recommendation || '—').replace(/\n/g, '<br>')}</p>
    <div class="sign"><div>Assessor — Solabliss Zimbabwe Pvt Ltd</div><div>Client acknowledgement</div></div>`);
}

// ---------- job reports ----------
async function renderReports() {
  const jobs = await api('api/projects.php');
  window._jobs = jobs;
  $el('page').innerHTML = `<h1 class="page-h">Job Report Generator</h1>
    <p class="text-slate-400 text-sm mb-6 -mt-4">Generate a printable completion report for any recorded job — site history, scope, equipment and commercials included.</p>
    <div class="card overflow-x-auto"><table class="table w-full min-w-[680px]">
    <thead><tr><th>Site / Job</th><th>Town</th><th>Client</th><th class="text-right">Value</th><th>Completed</th><th></th></tr></thead>
    <tbody>${jobs.map(j => `<tr>
      <td class="font-semibold">${esc(j.site_name || j.title)}</td><td>${esc(j.town)}</td><td>${esc(j.client)}</td>
      <td class="text-right">${j.price ? fmt(j.price) : '—'}</td><td class="text-xs text-slate-500">${j.install_date || j.completed_at?.slice(0, 10) || '—'}</td>
      <td class="text-right"><button class="btn btn-primary" onclick="jobReport(${j.id})">📋 Generate report</button></td></tr>`).join('')}</tbody></table></div>`;
}
function jobReport(id) {
  const p = window._jobs.find(x => x.id === id); if (!p) return;
  let eq = []; try { eq = JSON.parse(p.equipment_json || '[]'); } catch { }
  printDoc(`Job Report — ${p.site_name || p.title}`, `${coHeader('JOB COMPLETION REPORT', 'JR-' + String(p.id).padStart(4, '0'))}
    <div class="meta"><div class="box"><div class="k">Site</div><b>${esc(p.site_name || p.title)}</b><br>${esc(p.location || '')}, ${esc(p.town || '')}</div>
    <div class="box"><div class="k">Client & dates</div>${esc(p.client || '')}<br>Completed: ${p.install_date || p.completed_at?.slice(0, 10) || '—'}</div></div>
    <h2>Existing setup (before)</h2><p>${esc(p.existing_setup || 'Not recorded')}</p>
    <h2>Client requirement</h2><p>${esc(p.client_need || 'Not recorded')}</p>
    <h2>Scope delivered</h2><p>${esc(p.description || '')}</p>
    ${eq.length ? `<table><thead><tr><th>Equipment installed</th><th class="r">Qty</th></tr></thead><tbody>${eq.map(e => `<tr><td>${esc(e.item)}</td><td class="r">${e.qty}</td></tr>`).join('')}</tbody></table>` : ''}
    <h2>Commercials</h2><table><tbody>
      <tr><td><b>System capacity</b></td><td class="r">${p.capacity_kw || '—'} kW</td></tr>
      <tr><td><b>Contract value</b></td><td class="r tot big">${p.price ? fmt(p.price) : '—'}</td></tr>
      <tr><td><b>Category</b></td><td class="r">${p.category}</td></tr></tbody></table>
    <h2>Declaration</h2><p>The system described above was installed, tested and commissioned to specification. Warranties and handover documentation were provided to the client.</p>
    <div class="sign"><div>Lead engineer — Solabliss</div><div>Client acceptance (name, signature, date)</div></div>`);
}

// ---------- financial & job records ----------
async function renderFinance() {
  const f = await api('api/admin.php?action=finance');
  window._fin = f;
  $el('page').innerHTML = `<h1 class="page-h">Financial & Job Records
    <button class="btn btn-ghost ml-3" onclick="exportCSV('job-records',[['Job','Site','Town','Client','Value','Completed','Status'],..._fin.jobs.map(j=>[j.title,j.site_name,j.town,j.client,j.price,j.install_date,j.status])])">⬇ Jobs CSV</button>
    <button class="btn btn-ghost ml-2" onclick="exportCSV('payments',[['Invoice','Amount','Method','Note','Date'],..._fin.recentPayments.map(p=>[p.inv_ref,p.amount,p.method,p.note,p.created_at])])">⬇ Payments CSV</button></h1>
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
      <div class="stat-card"><b>${fmt(f.totals.quoted)}</b><span>Total quoted</span></div>
      <div class="stat-card"><b>${fmt(f.totals.invoiced)}</b><span>Total invoiced</span></div>
      <div class="stat-card"><b>${fmt(f.totals.collected)}</b><span>Collected</span></div>
      <div class="stat-card"><b>${fmt(f.totals.outstanding)}</b><span>Outstanding</span></div>
      <div class="stat-card"><b>${fmt(f.totals.jobValue)}</b><span>Job records value</span></div>
    </div>
    <div class="grid lg:grid-cols-3 gap-6 mb-8">
      <div class="card"><h3 class="font-bold text-white mb-3">Payments by month</h3>
        ${f.paymentsByMonth.map(m => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5"><span>${m.m}</span><b>${fmt(m.total)}</b></div>`).join('') || '<p class="text-slate-500 text-sm">No payments yet.</p>'}</div>
      <div class="card"><h3 class="font-bold text-white mb-3">Job value by month</h3>
        ${f.jobValueByMonth.map(m => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5"><span>${m.m} (${m.jobs} job${m.jobs > 1 ? 's' : ''})</span><b>${fmt(m.total)}</b></div>`).join('') || '<p class="text-slate-500 text-sm">No dated jobs.</p>'}</div>
      <div class="card"><h3 class="font-bold text-white mb-3">Pipeline</h3>
        ${f.quotesByStatus.map(s => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5"><span>Quotes · ${s.status} (${s.c})</span><b>${fmt(s.total)}</b></div>`).join('')}
        ${f.invoicesByStatus.map(s => `<div class="flex justify-between text-sm py-1.5 border-t border-white/5"><span>Invoices · ${s.status} (${s.c})</span><b>${fmt(s.total)}</b></div>`).join('')}
      </div>
    </div>
    <div class="grid lg:grid-cols-2 gap-6">
      <div class="card"><h3 class="font-bold text-white mb-3">Recent payments</h3>
        <table class="table w-full"><tbody>${f.recentPayments.map(p => `<tr><td>${p.inv_ref}</td><td class="text-right">${fmt(p.amount)}</td><td>${p.method}</td><td class="text-xs text-slate-500">${p.created_at?.slice(0, 10)}</td></tr>`).join('') || '<tr><td class="text-slate-500">None.</td></tr>'}</tbody></table></div>
      <div class="card"><h3 class="font-bold text-white mb-3">Job records</h3>
        <table class="table w-full"><tbody>${f.jobs.map(j => `<tr><td>${esc(j.site_name || j.title)}<br><span class="text-xs text-slate-500">${esc(j.town)} · ${esc(j.client)}</span></td><td class="text-right">${j.price ? fmt(j.price) : '—'}</td><td class="text-xs text-slate-500">${j.install_date || '—'}</td></tr>`).join('')}</tbody></table></div>
    </div>`;
}

// ---------- future energy (admin only) ----------
async function renderFuture() {
  let f;
  try { f = await api('/api/admin/future'); } catch (e) { $el('page').innerHTML = `<h1 class="page-h">Future Energy</h1><p class="text-red-400">${esc(e.message)} — admin role required.</p>`; return; }
  const icons = { energy_sharing: '🔁', community_banks: '🏘️', microgrids: '🕸️', energy_exports: '⚡', efficiency: '📉' };
  $el('page').innerHTML = `<h1 class="page-h">Future Energy — Vision Board <span class="badge bg-purple-500/20 text-purple-300 ml-3">admin only · not live</span></h1>
    <p class="text-slate-400 text-sm -mt-4 mb-8 max-w-2xl">The long-term roadmap for Solabliss. These capabilities are not yet operational — this space is where we design and plan them.</p>
    <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
      ${f.pillars.map(p => `<div class="card border-purple-500/30">
        <div class="text-2xl mb-3">${icons[p.key] || '🔮'}</div>
        <h3 class="font-bold text-white mb-2">${p.title}</h3>
        <p class="text-sm text-slate-400">${p.desc}</p>
        <p class="text-[11px] text-purple-300/70 mt-4 uppercase tracking-widest">roadmap · planning</p></div>`).join('')}
    </div>
    <div class="card max-w-xl">
      <label class="flex items-center gap-3 text-sm"><input id="futureToggle" type="checkbox" ${f.enabled ? 'checked' : ''} class="accent-purple-500" onchange="api('api/admin.php?action=future',{method:'PUT',body:JSON.stringify({enabled:this.checked})}).then(()=>toast('Future features flag '+(this.checked?'enabled':'disabled')))"> Enable future-features flag (setting)</label>
      <p class="text-xs text-slate-500 mt-2">When enabled, downstream features can check <code>future_features</code> in settings.</p>
    </div>`;
}
