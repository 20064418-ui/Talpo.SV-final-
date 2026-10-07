/* eslint-disable */
// Código original de components/planes.html adaptado por tools/port_legacy.py.
// LegacyPage.vue lo ejecuta con: __ready, __listen, __interval, __expose, __talapo.
// Los listeners e intervalos se limpian solos al salir de la página.
var __onload = null;
// Menú móvil: abre/cierra la navegación en pantallas angostas
__ready( () => {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks = document.getElementById("navLinks");

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("active");
    });
  }

  // En móvil, tocar un ítem con submenú despliega su dropdown en vez de navegar
  document.querySelectorAll(".nav-item-dropdown > a").forEach((link) => {
    link.addEventListener("click", (event) => {
      if (window.innerWidth <= 1024) {
        event.preventDefault();
        const dropdown = link.nextElementSibling;
        if (dropdown) dropdown.classList.toggle("show-mobile");
      }
    });
  });
});

/* ======================================================================
   NUEVO: los planes salen de la base de datos (el admin los edita en
   /admin/plans) y cada botón crea una solicitud que el admin da seguimiento.
   Si la migración 20261006000000_plans-sales.sql no se ha ejecutado, la
   página sigue mostrando los planes originales del HTML.
   ====================================================================== */
__ready(async () => {
  const T = __talapo;
  const root = document.querySelector('.lg-planes');
  const grid = root && root.querySelector('.plans-grid');
  if (!grid) return;

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => { const v = Number(n || 0); return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); };
  const TIER = { bronce: ['Bronze', 'fa-medal'], plata: ['Silver', 'fa-medal'], oro: ['Gold', 'fa-crown'] };
  const STATUS = { new: 'Sent — we will contact you soon', contacted: 'We contacted you', confirmed: 'Confirmed', paid: 'Paid ✓', cancelled: 'Cancelled' };

  // Planes originales del HTML (por si la tabla no existe todavía)
  const ORIGINAL_IDS = ['standard', 'premium', 'vip'];
  let plans = [...grid.querySelectorAll('.plan-card')].map((card, i) => ({
    id: ORIGINAL_IDS[i] || `plan-${i}`,
    name: card.querySelector('.plan-name')?.textContent.trim(),
    price: Number((card.querySelector('.plan-price')?.textContent || '0').replace(/[^0-9.]/g, '')),
  }));
  let dbReady = false;
  let requestsOpen = true;

  function renderCards(rows) {
    grid.innerHTML = rows.map((p) => {
      const [tierLabel, tierIcon] = TIER[p.tier] || TIER.bronce;
      return `<article class="plan-card plan-card--${esc(p.tier)}" data-plan="${esc(p.id)}">
        ${p.featured ? '<span class="plan-featured-tag"><i class="fas fa-star"></i> Most popular</span>' : ''}
        <span class="plan-tier-badge"><i class="fas ${tierIcon}"></i> ${tierLabel}</span>
        <h2 class="plan-name">${esc(p.name)}</h2>
        <p class="plan-tagline">${esc(p.tagline)}</p>
        <div class="plan-price-row"><span class="plan-price">${money(p.price)}</span><span class="plan-period">${esc(p.period || '/ trip')}</span></div>
        <ul class="plan-features">${(p.features || []).map((f) => `<li><i class="fas fa-check"></i> ${esc(f)}</li>`).join('')}</ul>
        <a class="btn-plan${p.tier === 'oro' ? ' btn-plan--oro' : ''}" href="#" data-plan="${esc(p.id)}">${esc(p.cta_label || 'Choose ' + p.name)}</a>
      </article>`;
    }).join('');
    grid.style.gridTemplateColumns = rows.length && rows.length < 3 && innerWidth > 992 ? `repeat(${rows.length}, minmax(0, 360px))` : '';
    grid.style.justifyContent = 'center';
  }

  // Los botones originales: se les pone el id del plan
  grid.querySelectorAll('.btn-plan').forEach((b, i) => { b.dataset.plan = plans[i]?.id || ''; });

  if (T && T.online) {
    try {
      const { data, error } = await T.db.from('travel_plans').select('*').eq('active', true).order('sort', { ascending: true });
      if (!error && Array.isArray(data) && data.length) {
        plans = data; dbReady = true; renderCards(data);
      } else if (!error) { dbReady = true; }
    } catch (e) { /* sin migración: se quedan los planes del HTML */ }
    try {
      const { data } = await T.db.from('site_content').select('value').eq('key', 'settings').limit(1);
      if (data && data[0] && data[0].value && data[0].value.plan_requests_open === false) requestsOpen = false;
    } catch (e) { /* sin ajustes: abiertas */ }
  }
  if (!requestsOpen) {
    const note = document.createElement('p');
    note.className = 'plans-closed';
    note.innerHTML = '<i class="fas fa-circle-pause"></i> We are not taking new pass requests right now. <a href="/messages?new=1">Send us a message</a> and we will let you know when they open.';
    grid.parentNode.insertBefore(note, grid);
  }

  /* ---------- Modal de solicitud ---------- */
  const modal = document.createElement('div');
  modal.className = 'plan-modal';
  modal.hidden = true;
  modal.innerHTML = `<div class="plan-modal-card" role="dialog" aria-modal="true" aria-labelledby="planModalTitle">
      <button type="button" class="plan-modal-x" aria-label="Close"><i class="fas fa-times"></i></button>
      <span class="plan-modal-kicker">Request your pass</span>
      <h2 id="planModalTitle"></h2>
      <p class="plan-modal-price"></p>
      <form class="plan-form">
        <div class="plan-form-row">
          <label>Travelers<input name="travelers" type="number" min="1" max="50" value="1" required></label>
          <label>Trip date<input name="trip_date" type="date"></label>
        </div>
        <label>Phone <small>(optional — we answer in your Messages)</small><input name="phone" type="tel" maxlength="30" placeholder="+503 7000 0000"></label>
        <label>Coupon <small>(optional)</small>
          <span class="plan-coupon"><input name="coupon" maxlength="24" autocomplete="off" placeholder="e.g. WELCOME10"><button type="button" class="plan-coupon-btn">Apply</button></span>
          <small class="plan-coupon-msg" aria-live="polite"></small>
        </label>
        <label>Anything we should know? <small>(optional)</small><textarea name="notes" rows="3" maxlength="600" placeholder="Places you want to visit, special needs, budget…"></textarea></label>
        <button type="submit" class="btn-plan">Send request <i class="fas fa-paper-plane"></i></button>
        <p class="plan-form-note"><i class="fas fa-lock"></i> No payment now. A Talapo agent will answer you in <b>Messages</b> on this site.</p>
      </form>
    </div>`;
  root.appendChild(modal);
  const form = modal.querySelector('form');
  let current = null;

  // Mínimo: hoy (no se puede pedir para una fecha pasada)
  const today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  form.trip_date.min = today.toISOString().slice(0, 10);

  let discount = 0;
  const couponMsg = () => modal.querySelector('.plan-coupon-msg');
  function showPrice() {
    const final = current.price * (100 - discount) / 100;
    modal.querySelector('.plan-modal-price').innerHTML = discount
      ? `<s>${money(current.price)}</s> ${money(final)} <span>${esc(current.period || '/ trip')} · per traveler · ${discount}% off</span>`
      : `${money(current.price)} <span>${esc(current.period || '/ trip')} · per traveler</span>`;
  }
  async function checkCoupon() {
    const code = form.coupon.value.trim().toUpperCase();
    discount = 0;
    if (!code) { couponMsg().textContent = ''; showPrice(); return true; }
    const { data, error } = await T.db.rpc('check_coupon', { p_code: code, p_plan: current.id });
    const pct = Array.isArray(data) ? data[0] : data;
    if (error || !pct) { couponMsg().textContent = 'This coupon is not valid.'; couponMsg().className = 'plan-coupon-msg bad'; showPrice(); return false; }
    discount = Number(pct);
    couponMsg().textContent = `Coupon applied: ${discount}% off ✓`; couponMsg().className = 'plan-coupon-msg ok';
    showPrice(); return true;
  }
  function open(plan) {
    current = plan;
    discount = 0; form.coupon.value = ''; couponMsg().textContent = '';
    modal.querySelector('h2').textContent = plan.name;
    showPrice();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(() => form.travelers.focus(), 50);
  }
  function close() { modal.hidden = true; document.body.style.overflow = ''; }

  __listen(grid, 'click', (e) => {
    const btn = e.target.closest('.btn-plan');
    if (!btn) return;
    e.preventDefault();
    if (!T.requireLogin('Sign in to request a travel pass')) return;
    const plan = plans.find((p) => p.id === btn.dataset.plan);
    if (!plan) return;
    if (!dbReady) { T.toast('Plan requests open soon. Please try again later.', 'info'); return; }
    if (!requestsOpen) { T.toast('We are not taking new pass requests right now.', 'info'); return; }
    open(plan);
  });
  __listen(modal, 'click', (e) => {
    if (e.target === modal || e.target.closest('.plan-modal-x')) close();
    if (e.target.closest('.plan-coupon-btn')) checkCoupon();
  });
  __listen(document, 'keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });

  __listen(form, 'submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    try {
      if (form.coupon.value.trim() && !(await checkCoupon())) throw new Error('Remove the coupon or use a valid one');
      const row = {
        plan_id: current.id, plan_name: current.name, price: current.price,
        travelers: Math.min(50, Math.max(1, parseInt(form.travelers.value, 10) || 1)),
        trip_date: form.trip_date.value || null,
        phone: form.phone.value.trim() || null,
        coupon_code: form.coupon.value.trim().toUpperCase() || null,
        notes: form.notes.value.trim() || null,
      };
      const { error } = await T.db.from('plan_requests').insert([row]);
      if (error) throw new Error(error.message);
      close(); form.reset();
      T.toast('Request sent! We will answer you in Messages.');
      loadMine();
    } catch (err) {
      T.toast(err.message || 'Could not send the request', 'error');
    } finally { btn.disabled = false; }
  });

  /* ---------- "Mis solicitudes" debajo de los planes ---------- */
  const mine = document.createElement('section');
  mine.className = 'plan-mine';
  mine.hidden = true;
  root.querySelector('.plans-main')?.appendChild(mine);

  async function loadMine() {
    const u = T.user();
    if (!u || !dbReady) return;
    const { data } = await T.db.from('plan_requests').select('id, plan_name, price, travelers, trip_date, status, created_at')
      .eq('profile_id', u.id).order('created_at', { ascending: false }).limit(10);
    if (!data || !data.length) { mine.hidden = true; return; }
    mine.hidden = false;
    mine.innerHTML = `<h3><i class="fas fa-receipt"></i> My pass requests</h3><ul>${data.map((r) => `
      <li class="st-${esc(r.status)}">
        <div><b>${esc(r.plan_name)}</b><small>${r.travelers} traveler${r.travelers > 1 ? 's' : ''}${r.trip_date ? ' · ' + new Date(r.trip_date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} · ${money(r.price * r.travelers)}</small></div>
        <span class="plan-status">${STATUS[r.status] || esc(r.status)}</span>
        <a class="plan-msg" href="/messages?request=${esc(r.id)}&plan=${encodeURIComponent(r.plan_name)}"><i class="fas fa-comments"></i> Message us</a>
        ${['new', 'contacted'].includes(r.status) ? `<button type="button" class="plan-cancel" data-id="${esc(r.id)}">Cancel</button>` : ''}
      </li>`).join('')}</ul>`;
  }
  __listen(mine, 'click', async (e) => {
    const b = e.target.closest('.plan-cancel');
    if (!b || !confirm('Cancel this request?')) return;
    const { error } = await T.db.from('plan_requests').update({ status: 'cancelled' }).eq('id', b.dataset.id);
    if (error) T.toast(error.message, 'error'); else { T.toast('Request cancelled'); loadMine(); }
  });
  loadMine().catch(() => {});
});

;

if (typeof __onload === "function") __ready(__onload);
