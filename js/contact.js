// Solabliss contact page
(async () => {
  let s;
  try {
    s = await api('api/settings.php');
  } catch (e) {
    // Static fallback for Vercel deployment
    s = {
      address: '24 Midlothian Avenue, Eastlea, Harare',
      phone: '+263 788 684 425',
      email: 'sales@solablisszimbabwe.co.zw',
      whatsapp: '263788684425'
    };
  }
  const tiles = [
    ['📍', 'Visit us', s.address, null],
    ['📞', 'Call us', s.phone, 'tel:' + String(s.phone || '').replace(/\s/g, '')],
    ['✉️', 'Email us', s.email, 'mailto:' + (s.email || '')]
  ];
  $('contactTiles').innerHTML = tiles.map(([icon, label, val, href]) => `
    <${href ? 'a' : 'div'} ${href ? `href="${href}"` : ''} class="flex items-center gap-3 card !p-4 hover:border-sola-500/50 transition">
      <span class="w-9 h-9 rounded-lg grid place-items-center shrink-0" style="background:var(--brand-soft);color:var(--brand)">${icon}</span>
      <span class="min-w-0"><span class="block text-[12px] text-slate-500">${label}</span>
      <span class="block text-sm text-white font-medium truncate">${esc(val || '—')}</span></span>
    </${href ? 'a' : 'div'}>`).join('');
  $('waLink').href = `https://wa.me/${s.whatsapp}?text=${encodeURIComponent('Hi Solabliss, I need help with a solar/renewable energy project.')}`;
})();
