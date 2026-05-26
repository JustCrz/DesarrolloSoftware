/**
 * router.js - Enrutador SPA basado en HTML5 History API
 * Marjorie Store Boutique Premium
 */

import { state, el } from './app.js';
import { apiFetch } from './api.js';

// Mapeo de rutas a archivos de vistas y callbacks onMount
const routes = {
  '/': {
    view: 'landing.html',
    onMount: async () => {
      const { renderBestSellers, renderPromociones } = await import('./ui.js');
      await renderBestSellers();
      renderPromociones();
    }
  },
  '/catalogo': {
    view: 'catalog.html',
    onMount: async () => {
      const { renderCatalog } = await import('./ui.js');
      renderCatalog();
    }
  },
  '/ofertas': {
    view: 'catalog.html',
    onMount: async () => {
      const { showPromocionesPage } = await import('./ui.js');
      showPromocionesPage();
    }
  },
  '/carrito': {
    view: 'cart.html',
    onMount: async () => {
      const { renderCarrito } = await import('./cart.js');
      renderCarrito();
    }
  },
  '/login': {
    view: 'login.html',
    onMount: async () => {
      const msg = el('loginMsg');
      if (msg) msg.textContent = '';
      setupFormAuthEvents();
    }
  },
  '/registro': {
    view: 'register.html',
    onMount: async () => {
      const msg = el('regMsg');
      if (msg) msg.textContent = '';
      setupFormAuthEvents();
    }
  },
  '/perfil': {
    view: 'profile.html',
    requiresAuth: true,
    onMount: async () => {
      const { showUserProfile } = await import('./ui.js');
      showUserProfile();
      setupProfileEvents();
    }
  },
  '/historial': {
    view: 'history.html',
    requiresAuth: true,
    onMount: async () => {
      const { showUserHistory } = await import('./ui.js');
      showUserHistory();
    }
  },
  '/admin': {
    view: 'admin/dashboard.html',
    requiresAuth: true,
    requiredRole: 'admin',
    onMount: async () => {
      const { showAdminSection } = await import('./admin.js');
      // Por defecto carga inventario
      await showAdminSection('inventario');
    }
  }
};

/**
 * Inicializa el enrutador escuchando eventos del navegador
 */
export function initRouter() {
  // Escuchar el botón de "Atrás/Adelante" del navegador
  window.addEventListener('hashchange', () => {
    resolveRoute(window.location.hash.slice(1) || '/');
  });

  // Interceptar todos los clicks del documento para navegación tipo SPA
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-route]');
    if (target) {
      e.preventDefault();
      const path = target.getAttribute('data-route');
      navigateTo(path);
    }
  });

  // Resolver la ruta actual en la carga inicial de la página
  resolveRoute(window.location.pathname);
}

/**
 * Navega a una ruta específica actualizando la URL sin recargar
 * @param {string} path - La ruta interna (Ej: '/catalogo')
 */
export function navigateTo(path) {
  if (window.location.hash.slice(1) !== path) {
    window.location.hash = path;
  }
  resolveRoute(path);
}

/**
 * Resuelve y renderiza la vista correspondiente al path
 * @param {string} path - Ruta actual
 */
async function resolveRoute(path) {
  // Normalizar ruta por si termina en barra inclinada
  let routePath = path;
  if (routePath !== '/' && routePath.endsWith('/')) {
    routePath = routePath.slice(0, -1);
  }

  const route = routes[routePath] || routes['/']; // Fallback a inicio
  const role = state.loggedUser?.role || state.loggedUser?.rol;

  if (route.requiresAuth && !state.loggedUser) {
    navigateTo('/login');
    return;
  }

  if (route.requiredRole && role !== route.requiredRole) {
    navigateTo(role === 'admin' ? '/admin' : '/catalogo');
    return;
  }
  
  // Contenedor principal de la SPA
  const mainContainer = document.querySelector('main') || el('app');
  if (!mainContainer) return;

  try {
    // 1. Mostrar loader simple
    mainContainer.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
    
    // 2. Fetch dinámico del fragmento HTML
    const response = await fetch(`views/${route.view}`);
    if (!response.ok) {
      throw new Error(`No se pudo cargar la vista: ${route.view}`);
    }
    const html = await response.text();
    
    // 3. Renderizar fragmento
    mainContainer.innerHTML = html;
    
    // 4. Ejecutar callback del módulo correspondiente
    if (route.onMount) {
      await route.onMount();
    }
  } catch (error) {
    console.error("Error de enrutamiento:", error);
    mainContainer.innerHTML = `
      <div style="text-align:center; padding:50px; color:white;">
        <h3>Ups, algo salió mal</h3>
        <p>No pudimos cargar esta sección. Inténtalo de nuevo más tarde.</p>
        <button class="btn-hero" onclick="window.location.reload()">Recargar Página</button>
      </div>
    `;
  }
}

/**
 * Vincula dinámicamente eventos a formularios de Auth tras montarse en el DOM
 */
async function setupFormAuthEvents() {
  const { login, register } = await import('./auth.js');
  
  const btnLoginSubmit = document.querySelector('.btn-login');
  if (btnLoginSubmit) {
    const currentRoute = window.location.hash.slice(1) || '/';
    const isRegister = currentRoute === '/registro';
    btnLoginSubmit.addEventListener('click', (e) => {
      e.preventDefault();
      if (isRegister) {
        register();
      } else {
        login();
      }
    });
  }

  const btnCancel = document.querySelectorAll('.secondary');
  btnCancel.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });
  });
}

/**
 * Vincula dinámicamente eventos al formulario de Perfil de Usuario
 */
async function setupProfileEvents() {
  const formPerfil = el('formActualizarPerfil');
  if (formPerfil) {
    formPerfil.addEventListener('submit', async (e) => {
      e.preventDefault();
      // Lógica de actualizar perfil
      const { el: appEl } = await import('./app.js');
      const NombreC = appEl('perfilNombre').value.trim();
      const Telefono = appEl('perfilTelefono').value.trim();
      const Direccion = appEl('perfilDireccion').value.trim();
      
      try {
        const res = await apiFetch('/api/users/update-profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idCliente: state.loggedUser.IdCliente || state.loggedUser.id,
            NombreC,
            Telefono,
            Direccion
          })
        });
        const data = await res.json();
        if (data.ok) {
          state.loggedUser.NombreC = NombreC;
          state.loggedUser.Telefono = Telefono;
          state.loggedUser.Direccion = Direccion;
          localStorage.setItem('user', JSON.stringify(state.loggedUser));
          const { showToast } = await import('./ui.js');
          showToast('Perfil actualizado correctamente');
          navigateTo('/catalogo');
        } else {
          alert('Error: ' + data.message);
        }
      } catch (err) {
        console.error(err);
        alert('Error de conexión al guardar cambios de perfil');
      }
    });
  }
}
