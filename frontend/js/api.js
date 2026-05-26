/**
 * api.js - Cliente HTTP y peticiones fetch centralizadas
 * Marjorie Store Boutique Premium
 */

import { state } from './app.js';

export function getAuthHeaders(extraHeaders = {}) {
  const token = state.authToken || localStorage.getItem('authToken');

  return token
    ? { ...extraHeaders, Authorization: `Bearer ${token}` }
    : extraHeaders;
}

export async function apiFetch(endpoint, options = {}) {
  const headers = getAuthHeaders(options.headers || {});

  return fetch(`${state.API_BASE}${endpoint}`, {
    ...options,
    headers
  });
}

/**
 * Realiza una petición genérica GET y devuelve el JSON correspondiente
 */
export async function get(endpoint) {
  try {
    const response = await apiFetch(endpoint);
    return await response.json();
  } catch (error) {
    console.error(`Error en GET ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Realiza una petición genérica POST y devuelve el JSON correspondiente
 */
export async function post(endpoint, body) {
  try {
    const response = await apiFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (error) {
    console.error(`Error en POST ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Realiza una petición genérica PUT y devuelve el JSON correspondiente
 */
export async function put(endpoint, body) {
  try {
    const response = await apiFetch(endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return await response.json();
  } catch (error) {
    console.error(`Error en PUT ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Realiza una petición genérica DELETE y devuelve el JSON correspondiente
 */
export async function del(endpoint) {
  try {
    const response = await apiFetch(endpoint, {
      method: 'DELETE'
    });
    return await response.json();
  } catch (error) {
    console.error(`Error en DELETE ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Carga la lista global de productos desde la base de datos
 */
export async function cargarProductos() {
  try {
    const data = await get('/api/products');
    if (data.ok) {
      state.productos = data.products;
    } else {
      state.productos = data; // Fallback legacy
    }
    console.log("Productos cargados exitosamente:", state.productos);
  } catch (error) {
    console.error("Error al cargar productos:", error);
  }
}

/**
 * Carga el producto estrella (el más vendido)
 */
export async function cargarMasVendido() {
  try {
    const data = await get('/api/reports/top-product');
    return data;
  } catch (error) {
    console.error("Error al cargar producto estrella:", error);
  }
}
