// ── Surtidor Valencia — Dashboard Script ─────────────────────────
const API   = '/api';
const token = localStorage.getItem('sv_token');
const me    = JSON.parse(localStorage.getItem('sv_empleado') || '{}');

// Redirect to login if not authenticated
if (!token) window.location.href = '/';

// ── User Info ────────────────────────────────────────────────────
document.getElementById('userName').textContent   = me.nombre || 'Usuario';
document.getElementById('userRole').textContent   = me.rol    || '—';
document.getElementById('userAvatar').textContent = (me.nombre || 'U').charAt(0).toUpperCase();

// ── Logout ───────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

// ── Clock ────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clockDisplay').textContent =
    now.toLocaleDateString('es-VE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })
    + '  •  ' + now.toLocaleTimeString('es-VE');
}
updateClock();
setInterval(updateClock, 1000);

// ── Navigation ───────────────────────────────────────────────────
const navItems = document.querySelectorAll('.nav-item[data-page]');
const pages    = document.querySelectorAll('.page');
const titles   = {
  dashboard:'Dashboard', surtidores:'Surtidores', ventas:'Ventas',
  inventario:'Inventario', empleados:'Empleados', reportes:'Reportes'
};

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    pages.forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
    document.getElementById('pageTitle').textContent = titles[page] || page;
    loadPage(page);
  });
});

// ── API helper ───────────────────────────────────────────────────
async function api(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(opts.headers || {}) }
  });
  if (res.status === 401) { localStorage.clear(); window.location.href = '/'; }
  return res.json();
}

// ── Page loaders ─────────────────────────────────────────────────
function loadPage(page) {
  const loaders = { dashboard: loadDashboard, surtidores: loadSurtidores, ventas: loadVentas,
                    inventario: loadInventario, empleados: loadEmpleados };
  if (loaders[page]) loaders[page]();
}

// Dashboard
async function loadDashboard() {
  const [resumen, surtidores, ventas, inventario] = await Promise.allSettled([
    api('/ventas/resumen/hoy'),
    api('/surtidores'),
    api('/ventas?limit=5'),
    api('/inventario'),
  ]);

  // Stats
  if (resumen.status === 'fulfilled' && resumen.value.success) {
    let ingresos = 0, litros = 0, trans = 0;
    resumen.value.data.forEach(r => {
      ingresos += parseFloat(r.total_ingresos) || 0;
      litros   += parseFloat(r.total_litros)   || 0;
      trans    += parseInt(r.total_transacciones) || 0;
    });
    document.getElementById('stat-ingresos').textContent     = `$${ingresos.toLocaleString('es-VE', {minimumFractionDigits:2})}`;
    document.getElementById('stat-litros').textContent       = `${litros.toLocaleString('es-VE')} L`;
    document.getElementById('stat-transacciones').textContent = trans;
  }

  if (surtidores.status === 'fulfilled' && surtidores.value.success) {
    const activos = surtidores.value.data.filter(s => s.estado === 'activo').length;
    document.getElementById('stat-surtidores').textContent = activos;
  }

  // Last sales
  if (ventas.status === 'fulfilled' && ventas.value.success) {
    const tbody = document.getElementById('lastSalesBody');
    tbody.innerHTML = ventas.value.data.slice(0,8).map(v => `
      <tr>
        <td>#${v.surtidor_numero}</td>
        <td>${v.tipo_combustible}</td>
        <td>${parseFloat(v.litros).toFixed(2)} L</td>
        <td>$${parseFloat(v.total).toFixed(2)}</td>
        <td><span class="badge badge--blue">${v.metodo_pago}</span></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--clr-text-muted)">Sin ventas hoy</td></tr>';
  }

  // Inventario summary
  if (inventario.status === 'fulfilled' && inventario.value.success) {
    const cont = document.getElementById('inventarioResumen');
    cont.innerHTML = inventario.value.data.map(inv => {
      const pct = Math.round((inv.stock_actual / inv.capacidad_maxima) * 100);
      const color = pct < 20 ? 'var(--clr-danger)' : pct < 50 ? 'var(--clr-warning)' : 'var(--clr-success)';
      return `
        <div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px">
            <span>${inv.tipo_combustible}</span>
            <span style="color:${color}">${parseFloat(inv.stock_actual).toLocaleString()} L (${pct}%)</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:99px;height:8px">
            <div style="width:${pct}%;background:${color};border-radius:99px;height:100%;transition:width .6s"></div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// Surtidores
async function loadSurtidores() {
  const data = await api('/surtidores');
  const grid = document.getElementById('surtidorGrid');
  if (!data.success) { grid.innerHTML = '<p style="color:var(--clr-danger)">Error al cargar</p>'; return; }
  grid.innerHTML = data.data.map(s => `
    <div class="surtidor-card surtidor-card--${s.estado}">
      <div class="surtidor-num">#${s.numero}</div>
      <div class="surtidor-tipo">${s.tipo_combustible}</div>
      <div style="margin-top:12px">
        <span class="badge badge--${s.estado==='activo'?'green':s.estado==='inactivo'?'red':'yellow'}">
          ${s.estado}
        </span>
      </div>
      <div style="margin-top:8px;font-size:.75rem;color:var(--clr-text-muted)">${s.total_ventas || 0} ventas hoy</div>
    </div>
  `).join('');
}

// Ventas
async function loadVentas() {
  const data = await api('/ventas');
  const tbody = document.getElementById('ventasBody');
  if (!data.success) { tbody.innerHTML = '<tr><td colspan="9">Error</td></tr>'; return; }
  tbody.innerHTML = data.data.map((v, i) => `
    <tr>
      <td>${i+1}</td>
      <td>${new Date(v.fecha).toLocaleString('es-VE')}</td>
      <td>#${v.surtidor_numero}</td>
      <td>${v.empleado_nombre}</td>
      <td>${v.tipo_combustible}</td>
      <td>${parseFloat(v.litros).toFixed(2)} L</td>
      <td>$${parseFloat(v.precio_unitario).toFixed(4)}</td>
      <td><strong>$${parseFloat(v.total).toFixed(2)}</strong></td>
      <td><span class="badge badge--blue">${v.metodo_pago}</span></td>
    </tr>
  `).join('') || '<tr><td colspan="9" style="text-align:center;color:var(--clr-text-muted)">Sin registros</td></tr>';
}

// Inventario
async function loadInventario() {
  const data = await api('/inventario');
  const grid = document.getElementById('inventarioGrid');
  if (!data.success) { grid.innerHTML = '<p style="color:var(--clr-danger)">Error</p>'; return; }
  const colors = ['amber','blue','green','purple'];
  grid.innerHTML = data.data.map((inv, i) => {
    const pct = Math.round((inv.stock_actual / inv.capacidad_maxima) * 100);
    const alerta = inv.stock_actual <= inv.stock_minimo;
    return `
      <div class="stat-card" style="${alerta ? 'border-color:rgba(239,68,68,.4)' : ''}">
        <div class="stat-icon stat-icon--${colors[i % colors.length]}">🛢</div>
        <div style="flex:1">
          <div class="stat-value">${parseFloat(inv.stock_actual).toLocaleString()} L</div>
          <div class="stat-label">${inv.tipo_combustible}</div>
          <div style="margin-top:8px;background:rgba(255,255,255,.08);border-radius:99px;height:6px">
            <div style="width:${pct}%;background:${pct<20?'var(--clr-danger)':pct<50?'var(--clr-warning)':'var(--clr-success)'};border-radius:99px;height:100%"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:.72rem;color:var(--clr-text-muted);margin-top:4px">
            <span>Mín: ${parseFloat(inv.stock_minimo).toLocaleString()} L</span>
            <span>Cap: ${parseFloat(inv.capacidad_maxima).toLocaleString()} L</span>
          </div>
          ${alerta ? '<div class="badge badge--red" style="margin-top:8px">⚠ Stock Bajo</div>' : ''}
        </div>
      </div>
    `;
  }).join('');
}

// Empleados
async function loadEmpleados() {
  const data = await api('/empleados');
  const tbody = document.getElementById('empleadosBody');
  if (!data.success) { tbody.innerHTML = '<tr><td colspan="4">Error</td></tr>'; return; }
  tbody.innerHTML = data.data.map(e => `
    <tr>
      <td>${e.nombre}</td>
      <td>${e.email}</td>
      <td><span class="badge badge--${e.rol==='admin'?'red':e.rol==='supervisor'?'yellow':'blue'}">${e.rol}</span></td>
      <td><span class="badge badge--${e.activo?'green':'red'}">${e.activo?'Activo':'Inactivo'}</span></td>
    </tr>
  `).join('');
}

// ── Initial load ─────────────────────────────────────────────────
loadDashboard();
