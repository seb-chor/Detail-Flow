/* ═══════════════════════════════════════════════════════════
   CARDETAIL — front-end prototype
   All persistence goes through the DB object. To migrate to a
   real backend later, rewrite only DB (localStorage → API).
   ═══════════════════════════════════════════════════════════ */

/* ── Helpers ── */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 10);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n || 0);
const fmtDate = iso => iso ? new Date(iso + (iso.length === 10 ? 'T00:00' : ''))
  .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ── Data layer (the future API boundary) ── */
const QUICK_PROFILE_THRESHOLD = 3;
const DB = {
  KEY: 'autoglow.v1',
  data: null,
  load() {
    const raw = localStorage.getItem(this.KEY);
    this.data = raw ? JSON.parse(raw) : seed();
    this.data.quickProfiles = this.data.quickProfiles || [];
    this.data.settings = this.data.settings || { businessName: 'My Detail Shop', email: 'shop@mail.com', phone: '555-0100', taxRate: 8 };
    syncQuickProfiles();
    this.save();
  },
  save() { localStorage.setItem(this.KEY, JSON.stringify(this.data)); },
  all(c) { return this.data[c] || []; },
  find(c, id) { return this.data[c]?.find(x => x.id === id); },
  insert(c, item) {
    item.id = uid(); item.createdAt = new Date().toISOString();
    this.data[c].push(item); this.save(); return item;
  },
  update(c, id, patch) { const it = this.find(c, id); if (it) Object.assign(it, patch); this.save(); },
  remove(c, id) { this.data[c] = this.data[c].filter(x => x.id !== id); this.save(); },
};

function seed() {
  const d = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
  const services = [
    { id: 's1', name: 'Express Wash & Wax',   price: 60 },
    { id: 's2', name: 'Interior Deep Clean',  price: 120 },
    { id: 's3', name: 'Full Detail',          price: 220 },
    { id: 's4', name: 'Paint Correction',     price: 450 },
    { id: 's5', name: 'Ceramic Coating',      price: 800 },
    { id: 's6', name: 'Engine Bay Detail',    price: 85 },
  ];
  const customers = [
    { id: 'c1', name: 'Marcus Reed',   phone: '555-0142', email: 'marcus@mail.com',  vehicle: '2022 BMW M4',       notes: 'Prefers weekend slots' },
    { id: 'c2', name: 'Alicia Gomez',  phone: '555-0187', email: 'alicia@mail.com',  vehicle: '2020 Tesla Model 3', notes: '' },
    { id: 'c3', name: 'Tom Becker',    phone: '555-0119', email: 'tom@mail.com',     vehicle: '2018 Ford F-150',   notes: 'Fleet inquiry — follow up' },
    { id: 'c4', name: 'Priya Nair',    phone: '555-0133', email: 'priya@mail.com',   vehicle: '2023 Audi Q5',      notes: '' },
  ];
  const bookings = [
    { id: 'b1', customerId: 'c1', serviceId: 's3', date: d(12), time: '09:00', price: 220, status: 'completed', notes: '', createdAt: new Date().toISOString() },
    { id: 'b2', customerId: 'c1', serviceId: 's2', date: d(8),  time: '13:00', price: 120, status: 'completed', notes: 'Interior detail', createdAt: new Date().toISOString() },
    { id: 'b3', customerId: 'c1', serviceId: 's1', date: d(4),  time: '10:30', price: 60,  status: 'completed', notes: '', createdAt: new Date().toISOString() },
    { id: 'b4', customerId: 'c2', serviceId: 's5', date: d(2),  time: '13:00', price: 800, status: 'scheduled', notes: 'Two-day job', createdAt: new Date().toISOString() },
    { id: 'b5', customerId: 'c3', serviceId: 's2', date: d(0),  time: '10:30', price: 120, status: 'in-progress', notes: '', createdAt: new Date().toISOString() },
    { id: 'b6', customerId: 'c4', serviceId: 's1', date: d(-2), time: '15:00', price: 60,  status: 'completed', notes: '', createdAt: new Date().toISOString() },
  ];
  const invoices = [
    { id: 'i1', number: 'INV-0001', customerId: 'c4', items: [{ serviceId: 's1', name: 'Express Wash & Wax', qty: 1, price: 60 }], taxRate: 8, status: 'paid',  dueDate: d(-2), createdAt: new Date().toISOString() },
    { id: 'i2', number: 'INV-0002', customerId: 'c2', items: [{ serviceId: 's5', name: 'Ceramic Coating', qty: 1, price: 800 }],    taxRate: 8, status: 'sent',  dueDate: d(7),  createdAt: new Date().toISOString() },
    { id: 'i3', number: 'INV-0003', customerId: 'c3', items: [{ serviceId: 's2', name: 'Interior Deep Clean', qty: 1, price: 120 }], taxRate: 8, status: 'draft', dueDate: d(10), createdAt: new Date().toISOString() },
  ];
  const quickProfiles = [{
    id: 'qp1', customerId: 'c1', name: 'Marcus Reed', phone: '555-0142', email: 'marcus@mail.com', vehicle: '2022 BMW M4', notes: 'Prefers weekend slots', preferredServiceId: 's3', preferredLocationId: 'loc-1', preferredTimeWindow: 'weekend', createdAt: new Date().toISOString(),
  }];
  return { services, customers, bookings, invoices, quickProfiles,
    settings: { businessName: 'My Detail Shop', email: 'shop@mail.com', phone: '555-0100', taxRate: 8 } };
}

const normalizeLookup = value => String(value ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
const getCustomerCompletedCount = customerId => DB.all('bookings').filter(b => b.customerId === customerId && b.status === 'completed').length;
const getQuickProfileForCustomer = customerId => DB.all('quickProfiles').find(p => p.customerId === customerId && !p.deletedAt);

function syncQuickProfiles() {
  DB.data.quickProfiles = (DB.data.quickProfiles || []).filter(p => !p.deletedAt);

  for (const customer of DB.all('customers')) {
    const count = getCustomerCompletedCount(customer.id);
    const existing = getQuickProfileForCustomer(customer.id);

    if (count >= QUICK_PROFILE_THRESHOLD) {
      const mostRecentCompleted = DB.all('bookings')
        .filter(b => b.customerId === customer.id && b.status === 'completed')
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

      const profile = {
        customerId: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        vehicle: customer.vehicle,
        notes: customer.notes,
        preferredServiceId: mostRecentCompleted?.serviceId || null,
        preferredLocationId: null,
        preferredTimeWindow: 'weekend',
      };

      if (existing) Object.assign(existing, profile, { updatedAt: new Date().toISOString() });
      else DB.data.quickProfiles.push({ id: uid(), ...profile, createdAt: new Date().toISOString() });
    }
  }
}

function triggerQuickProfileIfNeeded(customerId) {
  const count = getCustomerCompletedCount(customerId);
  if (count < QUICK_PROFILE_THRESHOLD) return false;
  const customer = DB.find('customers', customerId);
  if (!customer) return false;
  const existing = getQuickProfileForCustomer(customerId);
  const mostRecentCompleted = DB.all('bookings')
    .filter(b => b.customerId === customerId && b.status === 'completed')
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];

  if (existing) {
    Object.assign(existing, {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      vehicle: customer.vehicle,
      notes: customer.notes,
      preferredServiceId: mostRecentCompleted?.serviceId || existing.preferredServiceId,
      preferredLocationId: existing.preferredLocationId || null,
      preferredTimeWindow: existing.preferredTimeWindow || 'weekend',
      updatedAt: new Date().toISOString(),
    });
    DB.save();
    return true;
  }

  DB.data.quickProfiles.push({
    id: uid(),
    customerId: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    vehicle: customer.vehicle,
    notes: customer.notes,
    preferredServiceId: mostRecentCompleted?.serviceId || null,
    preferredLocationId: null,
    preferredTimeWindow: 'weekend',
    createdAt: new Date().toISOString(),
  });
  DB.save();
  return true;
}

/* ── Lookups & totals ── */
const custName = id => DB.find('customers', id)?.name ?? '—';
const svcName  = id => DB.find('services', id)?.name ?? '—';
const invoiceSubtotal = inv => inv.items.reduce((s, i) => s + i.qty * i.price, 0);
const invoiceTotal = inv => invoiceSubtotal(inv) * (1 + (inv.taxRate || 0) / 100);
const nextInvoiceNumber = () => {
  const max = DB.all('invoices').reduce((m, i) => Math.max(m, parseInt(i.number.slice(4)) || 0), 0);
  return `INV-${String(max + 1).padStart(4, '0')}`;
};
const BOOKING_STATUSES = ['scheduled', 'in-progress', 'completed', 'cancelled'];
const badge = st => `<span class="badge ${st}">${st}</span>`;

const customerOptions = sel => DB.all('customers').map(c =>
  `<option value="${c.id}" ${c.id === sel ? 'selected' : ''}>${esc(c.name)}</option>`).join('');
const serviceOptions = sel => DB.all('services').map(s =>
  `<option value="${s.id}" data-price="${s.price}" ${s.id === sel ? 'selected' : ''}>${esc(s.name)} — ${money(s.price)}</option>`).join('');

/* ═══════════ VIEWS ═══════════ */
const Views = {
  /* ── Dashboard ── */
  dashboard() {
    const now = new Date(), m = now.getMonth(), y = now.getFullYear();
    const inMonth = d => d.getMonth() === m && d.getFullYear() === y;
    const paid = DB.all('invoices').filter(i => i.status === 'paid');
    const done = DB.all('bookings').filter(b => b.status === 'completed');
    // Revenue = paid invoices + completed bookings
    const revenue = paid.filter(i => inMonth(new Date(i.createdAt))).reduce((s, i) => s + invoiceTotal(i), 0)
      + done.filter(b => inMonth(new Date(b.date + 'T00:00'))).reduce((s, b) => s + b.price, 0);
    const totalRevenue = paid.reduce((s, i) => s + invoiceTotal(i), 0)
      + done.reduce((s, b) => s + b.price, 0);
    const outstanding = DB.all('invoices').filter(i => i.status === 'sent')
      .reduce((s, i) => s + invoiceTotal(i), 0);
    const upcoming = DB.all('bookings')
      .filter(b => b.date >= todayISO() && ['scheduled', 'in-progress'].includes(b.status))
      .sort((a, b) => a.date.localeCompare(b.date));

    return `
      <div class="stat-grid">
        <div class="stat-card"><div class="label">Revenue (this month)</div><div class="value gold">${money(revenue)}</div></div>
        <div class="stat-card"><div class="label">Upcoming jobs</div><div class="value">${upcoming.length}</div></div>
        <div class="stat-card"><div class="label">Customers</div><div class="value">${DB.all('customers').length}</div></div>
        <div class="stat-card"><div class="label">Total Revenue</div><div class="value gold">${money(totalRevenue)}</div></div>
      </div>
      <div class="card">
        <h2>Upcoming bookings</h2>
        ${upcoming.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th>Status</th></tr></thead>
          <tbody>${upcoming.slice(0, 6).map(b => `<tr>
            <td>${fmtDate(b.date)}</td><td>${b.time}</td>
            <td>${esc(custName(b.customerId))}</td><td>${esc(svcName(b.serviceId))}</td>
            <td>${badge(b.status)}</td></tr>`).join('')}</tbody></table></div>`
        : '<p class="empty">No upcoming bookings.</p>'}
      </div>
      <div class="card">
        <h2>Recent invoices</h2>
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>${DB.all('invoices').slice(-5).reverse().map(i => `<tr>
            <td>${i.number}</td><td>${esc(custName(i.customerId))}</td>
            <td>${money(invoiceTotal(i))}</td><td>${badge(i.status)}</td></tr>`).join('')}</tbody>
        </table></div>
      </div>`;
  },

  /* ── Bookings ── */
  bookings() {
    const rows = DB.all('bookings').slice().sort((a, b) => a.date.localeCompare(b.date));
    return `
      <div class="card">
        <h2>All bookings</h2>
        ${rows.length ? `<div class="table-wrap"><table>
          <thead><tr><th>Date</th><th>Time</th><th>Customer</th><th>Service</th><th>Price</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows.map(b => `<tr>
            <td>${fmtDate(b.date)}</td><td>${b.time}</td>
            <td>${esc(custName(b.customerId))}</td><td>${esc(svcName(b.serviceId))}</td>
            <td>${money(b.price)}</td>
            <td><select data-change="booking-status" data-id="${b.id}">
              ${BOOKING_STATUSES.map(s => `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}
            </select></td>
            <td class="row-actions">
              <button class="icon-btn" data-action="edit-booking" data-id="${b.id}">✎</button>
              <button class="icon-btn" data-action="delete-booking" data-id="${b.id}">🗑</button>
            </td></tr>`).join('')}</tbody></table></div>`
        : '<p class="empty">No bookings yet — create your first one.</p>'}
      </div>`;
  },

  /* ── Customers ── */
  customers() {
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:14px">
          <h2 style="margin:0">Customers</h2>
          <div style="display:flex;gap:10px">
            <input class="search-input" placeholder="Search…" data-input="customer-search" />
            <button class="btn primary small" data-action="new-customer">+ Add customer</button>
          </div>
        </div>
        <div class="table-wrap"><table id="customers-table">
          <thead><tr><th>Name</th><th>Contact</th><th>Vehicle</th><th>Jobs</th><th>Status</th><th>Lifetime value</th><th></th></tr></thead>
          <tbody>${DB.all('customers').map(c => {
            const jobs = DB.all('bookings').filter(b => b.customerId === c.id).length;
            const completed = getCustomerCompletedCount(c.id);
            const quickProfile = getQuickProfileForCustomer(c.id);
            const status = quickProfile ? '<span class="badge quick">Quick</span>' : completed >= 2 ? '<span class="badge repeat">Repeat</span>' : '<span class="badge draft">New</span>';
            const ltv = DB.all('invoices').filter(i => i.customerId === c.id && i.status === 'paid')
              .reduce((s, i) => s + invoiceTotal(i), 0);
            return `<tr>
              <td><strong>${esc(c.name)}</strong></td>
              <td>${esc(c.phone)}<br><span style="color:var(--muted);font-size:12px">${esc(c.email)}</span></td>
              <td>${esc(c.vehicle)}</td><td>${jobs}</td><td>${status}</td><td>${money(ltv)}</td>
              <td class="row-actions">
                ${quickProfile ? `<button class="icon-btn" data-action="remove-quick-profile" data-id="${c.id}" title="Remove saved quick profile">⎋</button>` : ''}
                <button class="icon-btn" data-action="edit-customer" data-id="${c.id}">✎</button>
                <button class="icon-btn" data-action="delete-customer" data-id="${c.id}">🗑</button>
              </td></tr>`;
          }).join('')}</tbody></table></div>
      </div>`;
  },

  /* ── Invoices ── */
  invoices() {
    const rows = DB.all('invoices').slice().reverse();
    return `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h2 style="margin:0">Quotes & invoices</h2>
          <button class="btn primary small" data-action="new-invoice">+ New invoice</button>
        </div>
        ${rows.length ? `<div class="table-wrap"><table>
          <thead><tr><th>#</th><th>Customer</th><th>Due</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows.map(i => `<tr>
            <td>${i.number}</td><td>${esc(custName(i.customerId))}</td>
            <td>${fmtDate(i.dueDate)}</td><td>${money(invoiceTotal(i))}</td><td>${badge(i.status)}</td>
            <td class="row-actions">
              <button class="icon-btn" data-action="view-invoice" data-id="${i.id}">👁</button>
              ${i.status === 'draft' ? `<button class="btn ghost small" data-action="send-invoice" data-id="${i.id}">Send</button>` : ''}
              ${i.status === 'sent'  ? `<button class="btn ghost small" data-action="pay-invoice" data-id="${i.id}">Mark paid</button>` : ''}
              <button class="icon-btn" data-action="delete-invoice" data-id="${i.id}">🗑</button>
            </td></tr>`).join('')}</tbody></table></div>`
        : '<p class="empty">No invoices yet.</p>'}
      </div>`;
  },

  /* ── Settings ── */
  settings() {
    const s = DB.data.settings;
    return `
      <div class="card">
        <h2>Business profile</h2>
        <form data-form="settings" style="max-width:420px">
          <label>Business name<input name="businessName" value="${esc(s.businessName)}" required /></label>
          <div class="grid-2">
            <label>Email<input name="email" type="email" value="${esc(s.email)}" /></label>
            <label>Phone<input name="phone" value="${esc(s.phone)}" /></label>
          </div>
          <label>Tax rate (%)<input name="taxRate" type="number" step="0.1" min="0" value="${s.taxRate}" /></label>
          <button class="btn primary">Save settings</button>
        </form>
      </div>
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
          <h2 style="margin:0">Service catalog</h2>
          <button class="btn primary small" data-action="new-service">+ Add service</button>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Service</th><th>Price</th><th></th></tr></thead>
          <tbody>${DB.all('services').map(sv => `<tr>
            <td>${esc(sv.name)}</td><td>${money(sv.price)}</td>
            <td class="row-actions">
              <button class="icon-btn" data-action="edit-service" data-id="${sv.id}">✎</button>
              <button class="icon-btn" data-action="delete-service" data-id="${sv.id}">🗑</button>
            </td></tr>`).join('')}</tbody></table></div>
      </div>`;
  },
};

const TITLES = { dashboard: 'Dashboard', bookings: 'Bookings', customers: 'Customers', invoices: 'Invoices', settings: 'Settings' };
let currentView = 'dashboard';

function render() {
  $('#view-root').innerHTML = Views[currentView]();
  $('#page-title').textContent = TITLES[currentView];
  $$('.nav-link').forEach(a => a.classList.toggle('active', a.dataset.nav === currentView));
  $('#biz-chip').textContent = DB.data.settings.businessName;
}

/* ═══════════ MODAL & TOAST ═══════════ */
function openModal(title, body, { submitLabel = 'Save', onSubmit, onOpen } = {}) {
  $('#modal-root').innerHTML = `
    <div class="modal-backdrop" data-close>
      <div class="modal">
        <div class="modal-head"><h3>${title}</h3><button class="icon-btn" data-close>✕</button></div>
        <form id="modal-form">${body}</form>
        <div class="modal-foot">
          <button class="btn ghost" data-close>Cancel</button>
          <button class="btn primary" form="modal-form">${submitLabel}</button>
        </div>
      </div>
    </div>`;
  const modal = $('.modal');
  $('#modal-form').addEventListener('submit', e => {
    e.preventDefault();
    if (onSubmit(new FormData(e.target)) !== false) closeModal();
  });
  onOpen?.(modal);
}
const closeModal = () => { $('#modal-root').innerHTML = ''; };

function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  $('#toast-root').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, 2600);
}

/* ═══════════ FORM BUILDERS ═══════════ */
function bookingForm(b = {}) {
  const profile = b.customerId ? getQuickProfileForCustomer(b.customerId) : null;
  return `
    <label>Customer<select name="customerId" required>${customerOptions(b.customerId)}</select></label>
    <div class="inline-note ${profile ? 'info' : 'muted'}" data-quick-profile-note>
      ${profile ? `Quick profile ready for ${esc(profile.name)} — saved details can be reused.` : 'No saved profile yet — first-time booking stays clean.'}
    </div>
    <label>Service<select name="serviceId" required>${serviceOptions(b.serviceId)}</select></label>
    <div class="grid-2">
      <label>Date<input type="date" name="date" value="${b.date ?? todayISO()}" required /></label>
      <label>Time<input type="time" name="time" value="${b.time ?? '09:00'}" required /></label>
    </div>
    <div class="grid-2">
      <label>Price ($)<input type="number" name="price" step="0.01" min="0" value="${b.price ?? ''}" required /></label>
      <label>Status<select name="status">${BOOKING_STATUSES.map(s =>
        `<option ${s === b.status ? 'selected' : ''}>${s}</option>`).join('')}</select></label>
    </div>
    <label>Notes<textarea name="notes" rows="2">${esc(b.notes ?? '')}</textarea></label>`;
}
const readBooking = fd => ({
  customerId: fd.get('customerId'), serviceId: fd.get('serviceId'),
  date: fd.get('date'), time: fd.get('time'),
  price: parseFloat(fd.get('price')) || 0,
  status: fd.get('status'), notes: (fd.get('notes') || '').trim(),
});
const wireServicePrice = root => {
  const sel = root.querySelector('[name=serviceId]'), price = root.querySelector('[name=price]');
  if (sel && price) {
    sel.addEventListener('change', () =>
      price.value = sel.selectedOptions[0]?.dataset.price ?? '');
  }

  const customerSelect = root.querySelector('[name=customerId]');
  const note = root.querySelector('[data-quick-profile-note]');
  if (customerSelect && note) {
    const refreshNote = () => {
      const profile = getQuickProfileForCustomer(customerSelect.value);
      note.textContent = profile
        ? `Quick profile ready for ${profile.name} — saved details can be reused.`
        : 'No saved profile yet — first-time booking stays clean.';
      note.classList.toggle('info', !!profile);
      note.classList.toggle('muted', !profile);
    };
    customerSelect.addEventListener('change', refreshNote);
    refreshNote();
  }
};

function customerForm(c = {}) {
  return `
    <label>Full name<input name="name" value="${esc(c.name ?? '')}" required /></label>
    <div class="grid-2">
      <label>Phone<input name="phone" value="${esc(c.phone ?? '')}" /></label>
      <label>Email<input type="email" name="email" value="${esc(c.email ?? '')}" /></label>
    </div>
    <label>Vehicle<input name="vehicle" value="${esc(c.vehicle ?? '')}" placeholder="Year Make Model" /></label>
    <label>Notes<textarea name="notes" rows="2">${esc(c.notes ?? '')}</textarea></label>`;
}
const readCustomer = fd => ({
  name: fd.get('name').trim(), phone: fd.get('phone').trim(),
  email: fd.get('email').trim(), vehicle: fd.get('vehicle').trim(), notes: (fd.get('notes') || '').trim(),
});

function serviceForm(s = {}) {
  return `
    <label>Service name<input name="name" value="${esc(s.name ?? '')}" required /></label>
    <label>Price ($)<input name="price" type="number" step="0.01" min="0" value="${s.price ?? ''}" required /></label>`;
}

const lineRow = () => `
  <div class="line-row">
    <select class="li-service">${serviceOptions()}</select>
    <input class="li-qty" type="number" min="1" value="1" />
    <input class="li-price" type="number" step="0.01" min="0" placeholder="0.00" />
    <button type="button" class="icon-btn li-remove">✕</button>
  </div>`;

function openInvoiceModal() {
  openModal('New invoice', `
      <label>Customer<select name="customerId" required>${customerOptions()}</select></label>
      <label style="margin-bottom:6px">Line items</label>
      <div id="line-items">${lineRow()}</div>
      <button type="button" class="btn ghost small" id="add-line">+ Add line</button>
      <div style="height:14px"></div>
      <label>Due date<input type="date" name="dueDate" value="${todayISO()}" required /></label>`,
    {
      submitLabel: 'Create invoice',
      onOpen(root) {
        const items = $('#line-items', root);
        $('#add-line', root).addEventListener('click', () => items.insertAdjacentHTML('beforeend', lineRow()));
        items.addEventListener('click', e => {
          if (e.target.classList.contains('li-remove') && $$('.line-row', items).length > 1)
            e.target.closest('.line-row').remove();
        });
        items.addEventListener('change', e => {
          if (e.target.classList.contains('li-service'))
            e.target.closest('.line-row').querySelector('.li-price').value =
              e.target.selectedOptions[0]?.dataset.price ?? '';
        });
      },
      onSubmit(fd) {
        const items = $$('.line-row').map(r => {
          const s = $('.li-service', r);
          return { serviceId: s.value, name: s.selectedOptions[0].textContent.split(' — ')[0],
            qty: Math.max(1, parseInt($('.li-qty', r).value) || 1),
            price: parseFloat($('.li-price', r).value) || 0 };
        }).filter(i => i.serviceId);
        if (!items.length) { toast('Add at least one line item'); return false; }
        DB.insert('invoices', { number: nextInvoiceNumber(), customerId: fd.get('customerId'),
          items, taxRate: DB.data.settings.taxRate, status: 'draft', dueDate: fd.get('dueDate') });
        toast('Invoice created'); render();
      },
    });
}

/* ═══════════ ACTIONS (delegated) ═══════════ */
const actions = {
  'new-booking': () => openModal('New booking', bookingForm(), {
    onOpen: wireServicePrice,
    onSubmit(fd) {
      const booking = readBooking(fd);
      DB.insert('bookings', booking);
      triggerQuickProfileIfNeeded(booking.customerId);
      toast('Booking created');
      render();
    },
  }),
  'edit-booking': el => {
    const b = DB.find('bookings', el.dataset.id); if (!b) return;
    openModal('Edit booking', bookingForm(b), {
      onOpen: wireServicePrice,
      onSubmit(fd) { DB.update('bookings', b.id, readBooking(fd)); triggerQuickProfileIfNeeded(b.customerId); toast('Booking updated'); render(); },
    });
  },
  'delete-booking': el => {
    if (confirm('Delete this booking?')) { DB.remove('bookings', el.dataset.id); toast('Booking deleted'); render(); }
  },
  'new-customer': () => openModal('Add customer', customerForm(), {
    onSubmit(fd) { DB.insert('customers', readCustomer(fd)); toast('Customer added'); render(); },
  }),
  'edit-customer': el => {
    const c = DB.find('customers', el.dataset.id); if (!c) return;
    openModal('Edit customer', customerForm(c), {
      onSubmit(fd) { DB.update('customers', c.id, readCustomer(fd)); triggerQuickProfileIfNeeded(c.id); toast('Customer updated'); render(); },
    });
  },
  'delete-customer': el => {
    if (confirm('Delete this customer? Their bookings and invoices will remain.')) {
      DB.remove('customers', el.dataset.id); toast('Customer deleted'); render();
    }
  },
  'remove-quick-profile': el => {
    const customerId = el.dataset.id;
    const profile = getQuickProfileForCustomer(customerId);
    if (!profile) return;
    profile.deletedAt = new Date().toISOString();
    DB.save();
    toast('Saved quick profile removed');
    render();
  },
  'new-invoice': openInvoiceModal,
  'view-invoice': el => {
    const i = DB.find('invoices', el.dataset.id); if (!i) return;
    const sub = invoiceSubtotal(i), tax = sub * (i.taxRate || 0) / 100;
    openModal(`${i.number} — ${custName(i.customerId)}`, `
      <table class="invoice-lines"><tbody>
        ${i.items.map(it => `<tr><td>${esc(it.name)} × ${it.qty}</td>
          <td style="text-align:right">${money(it.qty * it.price)}</td></tr>`).join('')}
      </tbody></table>
      <div class="invoice-totals">
        <div><span>Subtotal</span><span>${money(sub)}</span></div>
        <div><span>Tax (${i.taxRate}%)</span><span>${money(tax)}</span></div>
        <div class="grand"><span>Total</span><span>${money(sub + tax)}</span></div>
      </div>
      <p style="margin-top:14px">Status: ${badge(i.status)} &nbsp; Due: ${fmtDate(i.dueDate)}</p>`,
      { submitLabel: 'Close', onSubmit: () => {} });
  },
  'send-invoice': el => { DB.update('invoices', el.dataset.id, { status: 'sent' }); toast('Invoice sent'); render(); },
  'pay-invoice':  el => { DB.update('invoices', el.dataset.id, { status: 'paid' }); toast('Invoice marked paid'); render(); },
  'delete-invoice': el => {
    if (confirm('Delete this invoice?')) { DB.remove('invoices', el.dataset.id); toast('Invoice deleted'); render(); }
  },
  'new-service': () => openModal('Add service', serviceForm(), {
    onSubmit(fd) {
      DB.insert('services', { name: fd.get('name').trim(), price: parseFloat(fd.get('price')) || 0 });
      toast('Service added'); render();
    },
  }),
  'edit-service': el => {
    const s = DB.find('services', el.dataset.id); if (!s) return;
    openModal('Edit service', serviceForm(s), {
      onSubmit(fd) {
        DB.update('services', s.id, { name: fd.get('name').trim(), price: parseFloat(fd.get('price')) || 0 });
        toast('Service updated'); render();
      },
    });
  },
  'delete-service': el => {
    if (confirm('Delete this service?')) { DB.remove('services', el.dataset.id); toast('Service deleted'); render(); }
  },
  'logout': () => openModal('Log out', '<p class="modal-message">Are you sure you want to log out?</p>', {
    submitLabel: 'Log out',
    onSubmit() {
      localStorage.removeItem('detailflow.session');
      location.reload();
      return false;
    },
  }),
};

const changes = {
  'booking-status': el => {
    const booking = DB.find('bookings', el.dataset.id);
    if (!booking) return;

    const oldStatus = booking.status;
    booking.status = el.value;
    DB.save();

    if (el.value === 'completed' && oldStatus !== 'completed') {
      triggerQuickProfileIfNeeded(booking.customerId);
    }

    toast(el.value === 'completed' ? '✓ Job completed — added to revenue' : 'Status updated');
    render();
  },
};

const forms = {
  'settings': fd => {
    Object.assign(DB.data.settings, {
      businessName: fd.get('businessName').trim(), email: fd.get('email').trim(),
      phone: fd.get('phone').trim(), taxRate: parseFloat(fd.get('taxRate')) || 0,
    });
    DB.save(); toast('Settings saved'); render();
  },
};

/* ═══════════ GLOBAL EVENT WIRING ═══════════ */
document.addEventListener('click', e => {
  const nav = e.target.closest('[data-nav]');
  if (nav) { currentView = nav.dataset.nav; render(); return; }
  if (e.target.matches('[data-close]') && !e.target.closest('.modal') || e.target.matches('.icon-btn[data-close], .btn[data-close]')) {
    closeModal(); return;
  }
  const act = e.target.closest('[data-action]');
  if (act) actions[act.dataset.action]?.(act);
});
document.addEventListener('change', e => {
  const el = e.target.closest('[data-change]');
  if (el) changes[el.dataset.change]?.(el);
});
document.addEventListener('input', e => {
  if (e.target.dataset.input === 'customer-search') {
    const q = e.target.value.toLowerCase();
    $$('#customers-table tbody tr').forEach(tr =>
      tr.style.display = tr.textContent.toLowerCase().includes(q) ? '' : 'none');
  }
});
document.addEventListener('submit', e => {
  const f = e.target.closest('form[data-form]');
  if (f) { e.preventDefault(); forms[f.dataset.form]?.(new FormData(f), f); }
});

/* ═══════════ INIT ═══════════ */
DB.load();
$('#login-form').addEventListener('submit', e => {
  e.preventDefault();
  localStorage.setItem('detailflow.session', '1');
  $('#auth-gate').classList.add('hidden');
  $('#app').classList.remove('hidden');
  render();
});
if (localStorage.getItem('detailflow.session')) {
  $('#auth-gate').classList.add('hidden');
  $('#app').classList.remove('hidden');
  render();
}
