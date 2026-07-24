// ── Surtidor Valencia — Dashboard v2 (limpio, funcional) ──────────
'use strict';

const API   = '/api';
const token = localStorage.getItem('sv_token');
const me    = JSON.parse(localStorage.getItem('sv_empleado') || '{}');

// Redirigir si no hay sesión
if (!token) { window.location.href = '/'; }

// ── API helper ──────────────────────────────────────────────────
async function api(path, opts = {}) {
  try {
    const res = await fetch(API + path, {
      ...opts,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(opts.headers || {})
      }
    });
    if (res.status === 401) { localStorage.clear(); window.location.href = '/'; }
    return res.json();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

// ── Usuario info ────────────────────────────────────────────────
document.getElementById('userName').textContent   = me.nombre || 'Usuario';
document.getElementById('userRole').textContent   = me.rol    || '—';
document.getElementById('userAvatar').textContent = (me.nombre || 'U').charAt(0).toUpperCase();

// ── Logout ──────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = '/';
});

// ── Reloj ───────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById('clockDisplay').textContent =
    now.toLocaleDateString('es-VE', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
    + '  •  ' + now.toLocaleTimeString('es-VE');
}
updateClock();
setInterval(updateClock, 1000);

// ── Navegación ──────────────────────────────────────────────────
const TITLES = {
  dashboard:'Dashboard', surtidores:'Surtidores', ventas:'Ventas',
  inventario:'Inventario', alertas:'Alertas', empleados:'Empleados', reportes:'Reportes'
};

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === `page-${page}`));
  const nav = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (nav) nav.classList.add('active');
  document.getElementById('pageTitle').textContent = TITLES[page] || page;
  loadPage(page);
}

document.querySelectorAll('.nav-item[data-page]').forEach(item => {
  item.addEventListener('click', () => navigateTo(item.dataset.page));
});

function getCurrentPage() {
  const active = document.querySelector('.page.active');
  return active ? active.id.replace('page-', '') : 'dashboard';
}

function loadPage(page) {
  const map = {
    dashboard, surtidores: loadSurtidores, ventas: loadVentas,
    inventario: loadInventario, alertas: loadAlertas,
    empleados: loadEmpleados, reportes: initReportes
  };
  if (map[page]) map[page]();
}

// ── Web Speech API ──────────────────────────────────────────────
const CMDS = {
  'dashboard':       () => navigateTo('dashboard'),
  'inicio':          () => navigateTo('dashboard'),
  'ventas':          () => navigateTo('ventas'),
  'registrar venta': () => { navigateTo('ventas'); setTimeout(abrirModalVenta, 300); },
  'surtidores':      () => navigateTo('surtidores'),
  'inventario':      () => navigateTo('inventario'),
  'alertas':         () => navigateTo('alertas'),
  'empleados':       () => navigateTo('empleados'),
  'reportes':        () => navigateTo('reportes'),
  'actualizar':      () => loadPage(getCurrentPage()),
  'cerrar sesión':   () => { localStorage.clear(); window.location.href = '/'; },
};

const micBtn = document.getElementById('micBtn');
function setStatus(txt, show = true) {
  const el = document.getElementById('speechStatus');
  el.textContent = txt;
  el.style.opacity = show ? '1' : '0';
}

if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const rec = new SpeechRec();
  rec.lang = 'es-VE'; rec.continuous = false; rec.interimResults = false;
  let isListening = false;

  rec.onresult = e => {
    const t = e.results[0][0].transcript.toLowerCase().trim();
    setStatus(`"${t}"`);
    const fn = CMDS[t] || Object.entries(CMDS).find(([k]) => t.includes(k))?.[1];
    if (fn) fn(); else setStatus(`No reconocido: "${t}"`);
  };
  rec.onend = () => {
    isListening = false;
    micBtn.classList.remove('mic-btn--active');
    document.getElementById('micIcon').textContent = '🎙️';
    document.getElementById('micLabel').textContent = 'Voz';
    setTimeout(() => setStatus('', false), 3000);
  };
  rec.onerror = e => setStatus(`⚠ Error: ${e.error}`);

  micBtn.addEventListener('click', () => {
    if (isListening) { rec.stop(); }
    else {
      rec.start(); isListening = true;
      micBtn.classList.add('mic-btn--active');
      document.getElementById('micIcon').textContent = '🔴';
      document.getElementById('micLabel').textContent = 'Escuchando...';
      setStatus('Di un comando: "ventas", "alertas", "reportes"...');
    }
  });
} else {
  micBtn.style.opacity = '.4';
  micBtn.title = 'Usa Chrome o Edge para comandos de voz';
}

// ══════════════════════════════════════════════════════════════
// TOAST
// ══════════════════════════════════════════════════════════════
function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = (type === 'success' ? '✅ ' : '❌ ') + msg;
  t.className = `toast toast--${type}`;
  t.style.display = 'block';
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => { t.style.display = 'none'; }, 3500);
}

// ══════════════════════════════════════════════════════════════
// DASHBOARD PAGE
// ══════════════════════════════════════════════════════════════
async function dashboard() {
  const [resumen, surts, ventas, inv] = await Promise.allSettled([
    api('/ventas/resumen/hoy'),
    api('/surtidores'),
    api('/ventas?limit=8'),
    api('/inventario'),
  ]);

  if (resumen.status === 'fulfilled' && resumen.value.success) {
    let ing = 0, lit = 0, tr = 0;
    resumen.value.data.forEach(r => {
      ing += parseFloat(r.total_ingresos) || 0;
      lit += parseFloat(r.total_litros)   || 0;
      tr  += parseInt(r.total_transacciones) || 0;
    });
    document.getElementById('stat-ingresos').textContent      = `$${ing.toFixed(2)}`;
    document.getElementById('stat-litros').textContent        = `${lit.toFixed(0)} L`;
    document.getElementById('stat-transacciones').textContent = tr;
  }

  if (surts.status === 'fulfilled' && surts.value.success) {
    document.getElementById('stat-surtidores').textContent =
      surts.value.data.filter(s => s.estado === 'activo').length;
  }

  if (ventas.status === 'fulfilled' && ventas.value.success) {
    const tbody = document.getElementById('lastSalesBody');
    tbody.innerHTML = ventas.value.data.length
      ? ventas.value.data.map(v => `
          <tr>
            <td>#${v.surtidor_numero || v.surtidor_id}</td>
            <td>${v.tipo_combustible}</td>
            <td>${parseFloat(v.litros).toFixed(2)} L</td>
            <td><strong>$${parseFloat(v.total).toFixed(2)}</strong></td>
            <td><span class="badge badge--blue">${v.metodo_pago}</span></td>
          </tr>`).join('')
      : '<tr><td colspan="5" style="text-align:center;color:var(--clr-text-muted)">Sin ventas hoy — ¡registra la primera!</td></tr>';
  }

  if (inv.status === 'fulfilled' && inv.value.success) {
    document.getElementById('inventarioResumen').innerHTML =
      inv.value.data.map(i => {
        const pct = Math.min(100, Math.round((i.stock_actual / i.capacidad_maxima) * 100));
        const c = pct < 20 ? 'var(--clr-danger)' : pct < 50 ? 'var(--clr-warning)' : 'var(--clr-success)';
        return `<div style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;font-size:.85rem;margin-bottom:6px">
            <span>${i.tipo_combustible}</span>
            <span style="color:${c}">${parseFloat(i.stock_actual).toLocaleString()} L (${pct}%)</span>
          </div>
          <div style="background:rgba(255,255,255,.08);border-radius:99px;height:8px">
            <div style="width:${pct}%;background:${c};border-radius:99px;height:100%;transition:width .6s"></div>
          </div></div>`;
      }).join('');
  }
  loadAlertasBadge();
}

async function loadAlertasBadge() {
  const data = await api('/alertas/pendientes/count');
  const badge = document.getElementById('alertasBadge');
  if (data.success && data.count > 0) {
    badge.textContent = data.count;
    badge.style.display = 'inline-flex';
  } else {
    badge.style.display = 'none';
  }
}

// ══════════════════════════════════════════════════════════════
// SURTIDORES PAGE
// ══════════════════════════════════════════════════════════════
async function loadSurtidores() {
  const data = await api('/surtidores');
  const grid = document.getElementById('surtidorGrid');
  if (!data.success) { grid.innerHTML = '<p style="color:var(--clr-danger)">Error al cargar surtidores</p>'; return; }
  if (!data.data.length) {
    grid.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p style="font-size:1.5rem">⛽</p><p style="color:var(--clr-text-muted)">No hay surtidores. Crea el primero.</p></div>';
    return;
  }
  grid.innerHTML = data.data.map(s => `
    <div class="surtidor-card surtidor-card--${s.estado}">
      <div class="surtidor-num">#${s.numero}</div>
      <div class="surtidor-tipo">${s.tipo_combustible}</div>
      <div style="margin-top:12px">
        <span class="badge badge--${s.estado==='activo'?'green':s.estado==='inactivo'?'red':'yellow'}">${s.estado}</span>
      </div>
      <div style="margin-top:8px;font-size:.75rem;color:var(--clr-text-muted)">${s.total_ventas||0} ventas hoy</div>
      <div style="margin-top:12px;display:flex;gap:6px">
        <button class="btn btn--sm" onclick="cambiarEstadoSurtidor(${s.id},'${s.estado}')">✏️ Estado</button>
        <button class="btn btn--sm btn--danger" onclick="deleteSurtidor(${s.id})">🗑️</button>
      </div>
    </div>`).join('');
}

async function cambiarEstadoSurtidor(id, actual) {
  const nuevo = prompt(`Estado actual: ${actual}\nNuevo estado (activo / inactivo / mantenimiento):`);
  if (!nuevo || !['activo','inactivo','mantenimiento'].includes(nuevo.trim())) {
    if (nuevo !== null) alert('Estado inválido. Usa: activo, inactivo o mantenimiento');
    return;
  }
  const surt = await api(`/surtidores/${id}`);
  const result = await api(`/surtidores/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...surt.data, estado: nuevo.trim() })
  });
  if (result.success) { showToast('Estado actualizado'); loadSurtidores(); }
  else showToast(result.message || 'Error al actualizar', 'error');
}

async function deleteSurtidor(id) {
  if (!confirm('¿Eliminar este surtidor? Esta acción no se puede deshacer.')) return;
  const result = await api(`/surtidores/${id}`, { method: 'DELETE' });
  if (result.success) { showToast('Surtidor eliminado'); loadSurtidores(); }
  else showToast(result.message || 'Error al eliminar', 'error');
}

// Modal Surtidor
function abrirModalSurtidor() {
  document.getElementById('s_numero').value    = '';
  document.getElementById('s_combustible').value = 'Gasolina 91';
  document.getElementById('s_estado').value    = 'activo';
  document.getElementById('surtidorError').textContent = '';
  document.getElementById('modalSurtidor').style.display = 'flex';
}
function cerrarModalSurtidor() {
  document.getElementById('modalSurtidor').style.display = 'none';
}
async function guardarSurtidor() {
  const numero    = parseInt(document.getElementById('s_numero').value);
  const combustible = document.getElementById('s_combustible').value;
  const estado    = document.getElementById('s_estado').value;
  const errEl     = document.getElementById('surtidorError');

  if (!numero || numero < 1) { errEl.textContent = '⚠ Ingresa un número de surtidor válido.'; return; }
  errEl.textContent = '';

  const result = await api('/surtidores', {
    method: 'POST',
    body: JSON.stringify({ numero, tipo_combustible: combustible, estado })
  });

  if (result.success) {
    cerrarModalSurtidor();
    showToast(`Surtidor #${numero} creado correctamente`);
    loadSurtidores();
  } else {
    errEl.textContent = '❌ ' + (result.message || 'Error al crear surtidor');
  }
}

// ══════════════════════════════════════════════════════════════
// VENTAS PAGE
// ══════════════════════════════════════════════════════════════
async function loadVentas() {
  const data  = await api('/ventas');
  const tbody = document.getElementById('ventasBody');
  if (!data.success) { tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--clr-danger)">Error al cargar</td></tr>'; return; }
  tbody.innerHTML = data.data.length
    ? data.data.map((v, i) => `
        <tr>
          <td>${i+1}</td>
          <td>${new Date(v.fecha).toLocaleString('es-VE')}</td>
          <td>#${v.surtidor_numero || v.surtidor_id}</td>
          <td>${v.empleado_nombre || '—'}</td>
          <td>${v.tipo_combustible}</td>
          <td>${parseFloat(v.litros).toFixed(3)} L</td>
          <td>$${parseFloat(v.precio_unitario).toFixed(4)}</td>
          <td><strong>$${parseFloat(v.total).toFixed(2)}</strong></td>
          <td><span class="badge badge--blue">${v.metodo_pago}</span></td>
        </tr>`).join('')
    : '<tr><td colspan="9" style="text-align:center;color:var(--clr-text-muted)">Sin registros — registra tu primera venta</td></tr>';
}

// Modal Venta
async function abrirModalVenta() {
  const data = await api('/surtidores');
  const sel  = document.getElementById('v_surtidor');
  sel.innerHTML = '<option value="">— Seleccionar surtidor —</option>';

  if (data.success && data.data.length) {
    data.data.filter(s => s.estado === 'activo').forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = `#${s.numero} — ${s.tipo_combustible}`;
      opt.dataset.combustible = s.tipo_combustible;
      sel.appendChild(opt);
    });
  } else {
    showToast('No hay surtidores activos. Crea uno primero.', 'error');
  }

  sel.onchange = () => {
    const opt = sel.selectedOptions[0];
    if (opt && opt.dataset.combustible)
      document.getElementById('v_combustible').value = opt.dataset.combustible;
    calcularTotalModal();
  };

  document.getElementById('v_litros').value  = '';
  document.getElementById('v_precio').value  = '';
  document.getElementById('v_total').textContent = '$0.00';
  document.getElementById('ventaError').textContent = '';
  const radio = document.querySelector('input[name="v_metodo"][value="efectivo"]');
  if (radio) radio.checked = true;
  document.getElementById('modalVenta').style.display = 'flex';
  setTimeout(() => document.getElementById('v_litros').focus(), 100);
}

function cerrarModalVenta() {
  document.getElementById('modalVenta').style.display = 'none';
}

function calcularTotalModal() {
  const l = parseFloat(document.getElementById('v_litros').value) || 0;
  const p = parseFloat(document.getElementById('v_precio').value) || 0;
  document.getElementById('v_total').textContent = `$${(l * p).toFixed(2)}`;
}

async function guardarVenta() {
  const surtidor_id      = document.getElementById('v_surtidor').value;
  const tipo_combustible = document.getElementById('v_combustible').value;
  const litros           = document.getElementById('v_litros').value;
  const precio_unitario  = document.getElementById('v_precio').value;
  const checked          = document.querySelector('input[name="v_metodo"]:checked');
  const metodo_pago      = checked ? checked.value : 'efectivo';
  const errEl            = document.getElementById('ventaError');

  errEl.textContent = '';
  if (!surtidor_id)              { errEl.textContent = '⚠ Selecciona un surtidor.'; return; }
  if (!litros || parseFloat(litros) <= 0)    { errEl.textContent = '⚠ Ingresa los litros.'; return; }
  if (!precio_unitario || parseFloat(precio_unitario) <= 0) { errEl.textContent = '⚠ Ingresa el precio.'; return; }

  const btn = document.getElementById('btnGuardarVenta');
  btn.textContent = '⏳ Registrando...';
  btn.disabled = true;

  const result = await api('/ventas', {
    method: 'POST',
    body: JSON.stringify({ surtidor_id: parseInt(surtidor_id), tipo_combustible, litros: parseFloat(litros), precio_unitario: parseFloat(precio_unitario), metodo_pago })
  });

  btn.textContent = '✓ Registrar Venta';
  btn.disabled = false;

  if (result.success) {
    cerrarModalVenta();
    const total = parseFloat(result.data?.total || 0).toFixed(2);
    showToast(`Venta registrada por $${total} ✅`);
    if (getCurrentPage() === 'ventas') loadVentas();
    dashboard();
  } else {
    errEl.textContent = '❌ ' + (result.message || 'Error al registrar');
  }
}

// ══════════════════════════════════════════════════════════════
// INVENTARIO PAGE
// ══════════════════════════════════════════════════════════════
async function loadInventario() {
  const data = await api('/inventario');
  const grid = document.getElementById('inventarioGrid');
  if (!data.success) { grid.innerHTML = '<p style="color:var(--clr-danger)">Error</p>'; return; }
  grid.innerHTML = data.data.map(inv => {
    const pct = Math.min(100, Math.round((inv.stock_actual / inv.capacidad_maxima) * 100));
    const c = pct < 20 ? 'var(--clr-danger)' : pct < 50 ? 'var(--clr-warning)' : 'var(--clr-success)';
    const icon = { 'Gasolina 91':'🔴', 'Gasolina 95':'🟡', 'Gasoil':'🔵', 'GLP':'🟢' }[inv.tipo_combustible] || '⛽';
    return `<div class="stat-card">
      <div class="stat-icon" style="font-size:1.4rem">${icon}</div>
      <div style="flex:1">
        <div class="stat-value" style="font-size:1.2rem">${parseFloat(inv.stock_actual).toLocaleString()} L</div>
        <div class="stat-label">${inv.tipo_combustible}</div>
        <div style="margin-top:10px;background:rgba(255,255,255,.08);border-radius:99px;height:8px">
          <div style="width:${pct}%;background:${c};border-radius:99px;height:100%;transition:width .8s"></div>
        </div>
        <div style="font-size:.75rem;color:${c};margin-top:4px">${pct}% — Mín: ${parseFloat(inv.stock_minimo).toLocaleString()} L</div>
      </div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════════════
// ALERTAS PAGE
// ══════════════════════════════════════════════════════════════
const ALERTA_ICONS = { stock_bajo:'🛢️', venta_alta:'💰', mantenimiento:'🔧', sistema:'⚙️' };

async function loadAlertas() {
  const estado = document.getElementById('filtroEstadoAlerta')?.value || '';
  const tipo   = document.getElementById('filtroTipoAlerta')?.value   || '';
  let qs = new URLSearchParams();
  if (estado) qs.set('estado', estado);
  if (tipo)   qs.set('tipo', tipo);
  const data = await api('/alertas?' + qs.toString());
  const cont = document.getElementById('alertasContainer');
  if (!data.success) { cont.innerHTML = '<p style="color:var(--clr-danger)">Error al cargar alertas</p>'; return; }
  if (!data.data.length) {
    cont.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p style="font-size:1.5rem">✅</p><p style="color:var(--clr-text-muted)">No hay alertas con esos filtros</p></div>';
    return;
  }
  cont.innerHTML = '<div class="alertas-list">' + data.data.map(a => `
    <div class="alerta-item alerta-item--${a.tipo}">
      <div class="alerta-icon">${ALERTA_ICONS[a.tipo] || '🔔'}</div>
      <div class="alerta-body">
        <div class="alerta-mensaje">${a.mensaje}</div>
        <div class="alerta-meta">Surtidor #${a.surtidor_id || '?'} · ${new Date(a.fecha).toLocaleString('es-VE')} · <span class="badge badge--${a.estado==='pendiente'?'red':a.estado==='revisada'?'yellow':'green'}">${a.estado}</span></div>
      </div>
      <div class="alerta-actions">
        ${a.estado==='pendiente' ? `<button class="btn btn--sm" onclick="resolverAlerta(${a.id},'revisada')">👁 Revisar</button>` : ''}
        ${a.estado!=='resuelta'  ? `<button class="btn btn--sm btn--success" onclick="resolverAlerta(${a.id},'resuelta')">✓ Resolver</button>` : ''}
      </div>
    </div>`).join('') + '</div>';
}

async function resolverAlerta(id, estado) {
  const result = await api(`/alertas/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ estado })
  });
  if (result.success) { showToast('Alerta actualizada'); loadAlertas(); loadAlertasBadge(); }
  else showToast(result.message || 'Error', 'error');
}

// ══════════════════════════════════════════════════════════════
// EMPLEADOS PAGE
// ══════════════════════════════════════════════════════════════
async function loadEmpleados() {
  const data  = await api('/empleados');
  const tbody = document.getElementById('empleadosBody');
  if (!data.success) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:var(--clr-danger)">Error al cargar</td></tr>';
    return;
  }
  tbody.innerHTML = data.data.map(e => `
    <tr>
      <td>${e.nombre}</td>
      <td style="font-size:.82rem;color:var(--clr-text-muted)">${e.email}</td>
      <td><span class="badge badge--${e.rol==='admin'?'amber':e.rol==='supervisor'?'blue':'green'}">${e.rol}</span></td>
      <td><span class="badge badge--${e.activo?'green':'red'}">${e.activo?'Activo':'Inactivo'}</span></td>
      <td>
        <button class="btn btn--sm btn--danger" onclick="toggleEmpleado(${e.id},${!e.activo})">${e.activo?'🚫 Desactivar':'✅ Activar'}</button>
      </td>
    </tr>`).join('');
}

async function toggleEmpleado(id, activo) {
  const emp = (await api('/empleados')).data?.find(e => e.id === id);
  if (!emp) return;
  const result = await api(`/empleados/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ ...emp, activo })
  });
  if (result.success) { showToast('Estado del empleado actualizado'); loadEmpleados(); }
  else showToast(result.message || 'Error', 'error');
}

// Modal Empleado
function abrirModalEmpleado() {
  document.getElementById('e_nombre').value   = '';
  document.getElementById('e_email').value    = '';
  document.getElementById('e_password').value = '';
  document.getElementById('e_rol').value      = 'operador';
  document.getElementById('empleadoError').textContent = '';
  document.getElementById('modalEmpleado').style.display = 'flex';
  setTimeout(() => document.getElementById('e_nombre').focus(), 100);
}

function cerrarModalEmpleado() {
  document.getElementById('modalEmpleado').style.display = 'none';
}

async function guardarEmpleado() {
  const nombre   = document.getElementById('e_nombre').value.trim();
  const email    = document.getElementById('e_email').value.trim();
  const password = document.getElementById('e_password').value;
  const rol      = document.getElementById('e_rol').value;
  const errEl    = document.getElementById('empleadoError');

  errEl.textContent = '';
  if (!nombre)            { errEl.textContent = '⚠ Ingresa el nombre.'; return; }
  if (!email)             { errEl.textContent = '⚠ Ingresa el email.'; return; }
  if (password.length < 6) { errEl.textContent = '⚠ La contraseña debe tener al menos 6 caracteres.'; return; }

  const result = await api('/empleados', {
    method: 'POST',
    body: JSON.stringify({ nombre, email, password, rol })
  });

  if (result.success) {
    cerrarModalEmpleado();
    showToast(`Empleado "${nombre}" creado. Email: ${email}`);
    loadEmpleados();
  } else {
    errEl.textContent = '❌ ' + (result.message || 'Error al crear empleado');
  }
}

// ══════════════════════════════════════════════════════════════
// REPORTES PAGE
// ══════════════════════════════════════════════════════════════
let _reporteData = null;

function initReportes() {
  const input = document.getElementById('reporteFecha');
  if (!input.value) input.value = new Date().toISOString().split('T')[0];
}

async function generarReporte() {
  const fecha = document.getElementById('reporteFecha').value;
  if (!fecha) { showToast('Selecciona una fecha', 'error'); return; }
  const cont = document.getElementById('reporteContainer');
  cont.innerHTML = '<div class="card" style="text-align:center;padding:40px"><p style="font-size:2rem">⏳</p><p>Generando reporte...</p></div>';

  const data = await api(`/reportes/diario?fecha=${fecha}`);
  if (!data.success) {
    cont.innerHTML = '<div class="card" style="text-align:center;padding:40px;color:var(--clr-danger)">Error al generar reporte</div>';
    return;
  }
  _reporteData = data;
  const r = data.resumen || {};
  cont.innerHTML = `
    <div class="stats-grid" style="margin-bottom:24px">
      <div class="stat-card"><div class="stat-icon stat-icon--amber">💰</div><div><div class="stat-value">$${parseFloat(r.total_ingresos||0).toFixed(2)}</div><div class="stat-label">Ingresos del Día</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--blue">⛽</div><div><div class="stat-value">${parseFloat(r.total_litros||0).toFixed(0)} L</div><div class="stat-label">Total Litros</div></div></div>
      <div class="stat-card"><div class="stat-icon stat-icon--green">✅</div><div><div class="stat-value">${r.total_transacciones||0}</div><div class="stat-label">Transacciones</div></div></div>
    </div>
    <div class="grid-2">
      <div class="card">
        <div class="card__title" style="margin-bottom:16px">📊 Por Combustible</div>
        ${(data.por_combustible||[]).map(c => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--clr-border)">
            <span>${c.tipo_combustible}</span>
            <span style="color:var(--clr-primary);font-weight:700">$${parseFloat(c.ingresos).toFixed(2)} · ${parseFloat(c.litros).toFixed(0)} L</span>
          </div>`).join('') || '<p style="color:var(--clr-text-muted)">Sin datos</p>'}
      </div>
      <div class="card">
        <div class="card__title" style="margin-bottom:16px">💳 Por Método de Pago</div>
        ${(data.por_metodo||[]).map(m => `
          <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--clr-border)">
            <span>${m.metodo_pago}</span>
            <span style="color:var(--clr-success);font-weight:700">$${parseFloat(m.total).toFixed(2)} (${m.count} tx)</span>
          </div>`).join('') || '<p style="color:var(--clr-text-muted)">Sin datos</p>'}
      </div>
    </div>`;
}

function exportarReporte() {
  if (!_reporteData) { showToast('Genera un reporte primero', 'error'); return; }
  const blob = new Blob([JSON.stringify(_reporteData, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `reporte-${document.getElementById('reporteFecha').value}.json`;
  a.click();
  showToast('Reporte exportado');
}

// ══════════════════════════════════════════════════════════════
// REABASTECIMIENTO DE INVENTARIO
// ══════════════════════════════════════════════════════════════
function abrirModalReabastecer() {
  document.getElementById('r_combustible').value = 'Gasolina 91';
  document.getElementById('r_cantidad').value = '';
  document.getElementById('reabastecerError').textContent = '';
  document.getElementById('modalReabastecer').style.display = 'flex';
  setTimeout(() => document.getElementById('r_cantidad').focus(), 100);
}

function cerrarModalReabastecer() {
  document.getElementById('modalReabastecer').style.display = 'none';
}

async function guardarReabastecimiento() {
  const tipo_combustible = document.getElementById('r_combustible').value;
  const cantidad = parseFloat(document.getElementById('r_cantidad').value);
  const errEl = document.getElementById('reabastecerError');

  errEl.textContent = '';
  if (!cantidad || cantidad <= 0) {
    errEl.textContent = '⚠ Ingresa una cantidad válida de litros.';
    return;
  }

  const btn = document.getElementById('btnGuardarReabastecer');
  btn.textContent = '⏳ Registrando...';
  btn.disabled = true;

  const result = await api('/inventario/reabastecimiento', {
    method: 'POST',
    body: JSON.stringify({ tipo_combustible, cantidad })
  });

  btn.textContent = '✓ Registrar Ingreso';
  btn.disabled = false;

  if (result.success) {
    cerrarModalReabastecer();
    showToast(`Se ingresaron ${cantidad} L de ${tipo_combustible} ✅`);
    // Recargar las vistas para ver el nuevo stock
    if (getCurrentPage() === 'inventario') loadInventario();
    dashboard(); 
  } else {
    errEl.textContent = '❌ ' + (result.message || 'Error al registrar reabastecimiento');
  }
}

// Cerrar modales con Escape o al hacer clic fuera
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    cerrarModalVenta();
    cerrarModalSurtidor();
    cerrarModalEmpleado();
    cerrarModalReabastecer();
  }
});

document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) {
      cerrarModalVenta();
      cerrarModalSurtidor();
      cerrarModalEmpleado();
      cerrarModalReabastecer();
    }
  });
});

// ── Carga inicial ────────────────────────────────────────────
dashboard();
setInterval(loadAlertasBadge, 30000);