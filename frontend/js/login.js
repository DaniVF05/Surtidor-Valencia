// ── Surtidor Valencia — Login Script ─────────────────────────────
const form          = document.getElementById('loginForm');
const emailInput    = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginBtn      = document.getElementById('loginBtn');
const loginError    = document.getElementById('loginError');
const togglePwd     = document.getElementById('togglePassword');

// Toggle password visibility
togglePwd.addEventListener('click', () => {
  const isText = passwordInput.type === 'text';
  passwordInput.type = isText ? 'password' : 'text';
  togglePwd.textContent = isText ? '👁' : '🙈';
});

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showError('Por favor complete todos los campos.');
    return;
  }

  setLoading(true);
  hideError();

  try {
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok || !data.success) {
      showError(data.message || 'Credenciales incorrectas. Intente nuevamente.');
      return;
    }

    // Guardar token y redirigir
    localStorage.setItem('sv_token',    data.token);
    localStorage.setItem('sv_empleado', JSON.stringify(data.empleado));
    window.location.href = '/dashboard.html';

  } catch (_) {
    showError('Error de conexión. Verifique el servidor.');
  } finally {
    setLoading(false);
  }
});

function showError(msg) {
  loginError.textContent = msg;
  loginError.hidden = false;
}
function hideError() { loginError.hidden = true; }

function setLoading(on) {
  loginBtn.disabled = on;
  loginBtn.querySelector('.btn__text').hidden   = on;
  loginBtn.querySelector('.btn__spinner').hidden = !on;
}

// Redirigir si ya está autenticado
if (localStorage.getItem('sv_token')) {
  window.location.href = '/dashboard.html';
}
