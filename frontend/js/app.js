/**
 * app.js - Punto de entrada principal e inicialización de la SPA
 * Marjorie Store Boutique Premium
 */

import { initRouter, navigateTo } from './router.js';
import { restoreSession } from './auth.js';
import { cargarProductos, cargarMasVendido } from './api.js';
import { renderBestSellers } from './ui.js';

// Estado global mutable de la aplicación (centralizado)
export const state = {
  productos: [],
  proveedores: [],
  ventas: [],
  carrito: [],
  loggedUser: null,
  authToken: null,
  mapaAdmin: null,
  marcadorAdmin: null,
  estadosLogistica: {
    "1": "Pagado",
    "2": "Preparando",
    "3": "En Camino",
    "4": "Entregado"
  },
  //API_BASE: 'https://desarrollosoftware.onrender.com' <- PRODUCCIÓN
  API_BASE: 'http://localhost:3000',
  // Clave pública de Stripe para el frontend (test)
  stripe: typeof Stripe !== 'undefined' ? Stripe('pk_test_51T9FMCAuz5OrtKFT0wnEX0niDHjIfkaXG6FnIER897RI9Xg30mYG14QJHc4S8B8DBu2UgQnpnwTjhxJqPyuMu9mO00yFEC18Tn') : null
};

// Utilidad simple para obtener elementos DOM
export const el = id => document.getElementById(id);

/**
 * Inicialización principal de la aplicación
 */
export async function init() {
  console.log("Iniciando aplicación Marjorie Store...");
  
  // 1. Recuperar y validar sesion antes de resolver rutas protegidas
  await restoreSession();

  // 2. Inicializar el enrutador
  initRouter();
  
  // 3. Cargar datos iniciales desde el servidor
  await cargarProductos();
  await cargarMasVendido();
  
  // 4. Renderizar productos destacados en la landing
  await renderBestSellers();
  
  // 5. Configurar manejadores globales de eventos para la navegación (Navbar)
  setupNavigationEvents();
}

/**
 * Configura los event listeners para navegación dinámica (reemplaza inline onclicks)
 */
function setupNavigationEvents() {
  // Enlace / Botón de Inicio
  const btnInicio = el('btnInicio');
  if (btnInicio) {
    btnInicio.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/');
    });
  }

  const btnAdminPanel = el('btnAdminPanel');
  if (btnAdminPanel) {
    btnAdminPanel.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/admin');
    });
  }

  // Enlace / Botón de Catálogo
  const btnCatalogos = document.querySelectorAll('.nav-link');
  btnCatalogos.forEach(btn => {
    if (btn.textContent.trim().toLowerCase() === 'catálogo') {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        navigateTo('/catalogo');
      });
    }
  });

  // Enlace de Ofertas
  const btnOfertas = document.querySelector('.nav-ofertas');
  if (btnOfertas) {
    btnOfertas.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/ofertas');
    });
  }

  // Botón de Carrito
  const btnCart = el('btnCart');
  if (btnCart) {
    btnCart.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/carrito');
    });
  }

  // Botón de Perfil
  const btnPerfil = el('btnPerfil');
  if (btnPerfil) {
    btnPerfil.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/perfil');
    });
  }

  // Botón de Historial (Mis Pedidos)
  const btnHistorial = el('btnHistorial');
  if (btnHistorial) {
    btnHistorial.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/historial');
    });
  }

  // Botón de Iniciar Sesión en Navbar
  const btnNavLogin = el('btnNavLogin');
  if (btnNavLogin) {
    btnNavLogin.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/login');
    });
  }

  // Botón de Registrarse en Navbar
  const btnNavRegister = el('btnNavRegister');
  if (btnNavRegister) {
    btnNavRegister.addEventListener('click', (e) => {
      e.preventDefault();
      navigateTo('/registro');
    });
  }

  // Notificaciones Campana Trigger
  const btnCampana = el('btnCampana') || el('imgCampana');
  if (btnCampana) {
    btnCampana.addEventListener('click', async (e) => {
      e.preventDefault();
      const { toggleNotiBox } = await import('./ui.js');
      toggleNotiBox();
    });
  }

  // Botón de Cerrar dropdown de Notificaciones
  const btnCloseNoti = el('btnCloseNoti');
  if (btnCloseNoti) {
    btnCloseNoti.addEventListener('click', async (e) => {
      e.preventDefault();
      const { toggleNotiBox } = await import('./ui.js');
      toggleNotiBox();
    });
  }
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);
