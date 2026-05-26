/**
 * auth.js - Lógica de autenticación, control de accesos y sesiones
 * Marjorie Store Boutique Premium
 */

import { state, el } from './app.js';
import { navigateTo } from './router.js';
import { get, post } from './api.js';

/**
 * Realiza el inicio de sesión del usuario
 */
export async function login() {
  const correoInput = el('loginUser');
  const passInput = el('loginPass');
  const msgEl = el('loginMsg');

  if (!correoInput || !passInput || !msgEl) return;

  const correo = correoInput.value.trim().toLowerCase();
  const contraseña = passInput.value;

  if (!correo || !contraseña) {
    msgEl.textContent = 'Por favor, llena todos los campos';
    return;
  }

  try {
    const data = await post('/api/auth/login', { correo, contraseña });
    console.log("Respuesta login:", data);

    if (data.ok) {
      state.loggedUser = data.user;
      state.authToken = data.token;
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('authToken', data.token);
      afterLogin({ redirect: true });
    } else {
      msgEl.textContent = data.message;
    }
  } catch (err) {
    msgEl.textContent = 'Error de conexión';
    console.error(err);
  }
}

/**
 * Acciones posteriores a un inicio de sesión exitoso o restauración de sesión
 */
export async function afterLogin(options = {}) {
  const { redirect = true } = options;
  const loginMsg = el('loginMsg');
  if (loginMsg) loginMsg.textContent = '';

  // Actualizar UI de la barra de navegación
  const authButtons = el('authButtons');
  const btnLogout = el('btnLogout');
  const notifContainer = el('notifContainer');
  const btnCart = el('btnCart');
  const btnHistorial = el('btnHistorial');
  const btnPerfil = el('btnPerfil');
  const btnAdminPanel = el('btnAdminPanel');

  if (authButtons) authButtons.classList.add('hidden');
  if (btnLogout) btnLogout.classList.remove('hidden');
  if (notifContainer) notifContainer.classList.remove('hidden');

  // Registrar el listener de logout si aún no se ha hecho
  if (btnLogout && !btnLogout.dataset.listenerBound) {
    btnLogout.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
    btnLogout.dataset.listenerBound = 'true';
  }

  // Cargar notificaciones del usuario
  const { cargarNotificaciones } = await import('./ui.js');
  cargarNotificaciones();

  // Redirigir según el rol
  const role = state.loggedUser.role || state.loggedUser.rol;
  if (role === 'admin') {
    if (btnCart) btnCart.classList.add('hidden');
    if (btnHistorial) btnHistorial.classList.add('hidden');
    if (btnPerfil) btnPerfil.classList.add('hidden');
    if (btnAdminPanel) btnAdminPanel.classList.remove('hidden');
    
    if (redirect) navigateTo('/admin');
  } else {
    if (btnCart) btnCart.classList.remove('hidden');
    if (btnHistorial) btnHistorial.classList.remove('hidden');
    if (btnPerfil) btnPerfil.classList.remove('hidden');
    if (btnAdminPanel) btnAdminPanel.classList.add('hidden');
    
    if (redirect) navigateTo('/catalogo');
  }
}

/**
 * Cierra la sesión activa del usuario
 */
export function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
  state.loggedUser = null;
  state.authToken = null;

  // Esconder botones de la sesión y restablecer barra de navegación
  const btnCart = el('btnCart');
  const btnLogout = el('btnLogout');
  const btnHistorial = el('btnHistorial');
  const btnPerfil = el('btnPerfil');
  const notifContainer = el('notifContainer');
  const authButtons = el('authButtons');
  const btnAdminPanel = el('btnAdminPanel');

  if (btnCart) btnCart.classList.add('hidden');
  if (btnLogout) btnLogout.classList.add('hidden');
  if (btnHistorial) btnHistorial.classList.add('hidden');
  if (btnPerfil) btnPerfil.classList.add('hidden');
  if (btnAdminPanel) btnAdminPanel.classList.add('hidden');
  if (notifContainer) notifContainer.classList.add('hidden');
  if (authButtons) authButtons.classList.remove('hidden');

  // Redirigir a la landing page de inicio
  navigateTo('/');
}

/**
 * Registra un nuevo usuario en el sistema
 */
export async function register() {
  const regUser = el('regUser');
  const regEmail = el('regEmail');
  const regPass = el('regPass');
  const regMsg = el('regMsg');

  if (!regUser || !regEmail || !regPass || !regMsg) return;

  const NombreC = regUser.value.trim();
  const Correo = regEmail.value.trim();
  const Contraseña = regPass.value;

  if (!NombreC || !Correo || Contraseña.length < 6) {
    regMsg.textContent = 'Datos incompletos o contraseña muy corta';
    regMsg.style.color = 'orange';
    return;
  }

  const Telefono = el('regTelefono')?.value || '';
  const Direccion = el('regDireccion')?.value || '';

  try {
    const data = await post('/api/users/register', {
      NombreC,
      Correo,
      Contraseña,
      Telefono,
      Direccion
    });
    console.log("Respuesta servidor registro:", data);

    if (data.ok) {
      regMsg.style.color = 'green';
      regMsg.textContent = 'Registrado con éxito';
      setTimeout(() => {
        navigateTo('/login');
      }, 1500);
    } else {
      regMsg.style.color = 'red';
      regMsg.textContent = data.message;
    }
  } catch (err) {
    regMsg.textContent = 'Error de conexión';
  }
}

/**
 * Restaura la sesión guardada desde localStorage en la carga inicial de la página
 */
export async function restoreSession() {
  const savedToken = localStorage.getItem('authToken');
  if (!savedToken) return;

  try {
    state.authToken = savedToken;
    const data = await get('/api/auth/me');

    if (!data.ok) {
      logout();
      return;
    }

    state.loggedUser = data.user;
    localStorage.setItem('user', JSON.stringify(data.user));
    console.log("Sesión recuperada:", state.loggedUser);
    await afterLogin({ redirect: false });
  } catch (e) {
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    state.loggedUser = null;
    state.authToken = null;
  }
}
