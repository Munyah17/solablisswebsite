// Solabliss client portal
(async () => {
  const el = $('portalBody');
  if (!authToken()) {
    el.innerHTML = `<div class="card text-center max-w-md mx-auto">
      <p class="text-slate-300 font-medium mb-2">You're not signed in</p>
      <p class="text-sm text-slate-500 mb-4">Sign in to view your quotations and invoices.</p>
      <button onclick="openAuth()" class="btn btn-primary !px-6 !py-2.5 !text-sm">Sign in</button></div>`;
    return;
  }
  let user = null; try { user = JSON.parse(atob(authToken().split('.')[0])); } catch { }
  try {
    const [quotes, invoices] = await Promise.all([api('/api/my/quotes'), api('/api/my/invoices')]);
    el.innerHTML = `
      <div class="flex items-center justify-between mb-6">
        <p class="text-sm text-slate-400">Signed in as <b class="text-white">${esc(user?.name || '')}</b></p>
        <button onclick="localStorage.removeItem('sola_token');location.reload()" class="btn btn-danger">Sign out</button>
      </div>
      <h4 class="text-[13px] font-medium text-sola-400 mb-3">Quotations</h4>
      <div class="space-y-2">${quotes.length ? quotes.map(q => `
        <div class="card !py-3.5 flex justify-between items-center text-sm">
          <span><b>${q.ref}</b> · ${esc(q.system_type || 'custom')} · <span class="text-slate-500 text-xs">${q.created_at?.slice(0, 10)}</span></span>
          <span class="text-right"><b>${fmt(q.total)}</b> <span class="badge bg-white/10 ml-2">${q.status}</span></span>
        </div>`).join('') : '<p class="text-sm text-slate-500">No quotes yet — try the <a class="text-sola-400" href="sizing.html">sizing tool</a>.</p>'}</div>
      <h4 class="text-[13px] font-medium text-sola-400 mt-8 mb-3">Invoices</h4>
      <div class="space-y-2">${invoices.length ? invoices.map(i => `
        <div class="card !py-3.5 flex justify-between items-center text-sm">
          <span><b>${i.ref}</b> · due ${i.due_date || '—'}</span>
          <span class="text-right"><b>${fmt(i.total - i.paid)}</b> balance <span class="badge ${i.status === 'Paid' ? 'bg-sky-500/20 text-sky-400' : 'bg-sola-500/20 text-sola-400'} ml-2">${i.status}</span></span>
        </div>`).join('') : '<p class="text-sm text-slate-500">No invoices yet.</p>'}</div>`;
  } catch (e) {
    el.innerHTML = `<div class="card text-center max-w-md mx-auto"><p class="text-red-400 text-sm mb-3">${esc(e.message)}</p>
      <button onclick="localStorage.removeItem('sola_token');location.reload()" class="btn btn-ghost">Sign in again</button></div>`;
  }
})();
