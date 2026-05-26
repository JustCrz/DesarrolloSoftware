/**
 * cart.js - Gestión de Carrito de compras y pasarela de pago Stripe
 * Marjorie Store Boutique Premium
 */

import { state, el } from './app.js';
import { navigateTo } from './router.js';
import { apiFetch } from './api.js';

/**
 * Renderiza los elementos del carrito en el DOM
 */
export function renderCarrito() {
  const container = el('cartContents');
  const totalDisplay = el('totalDisplay');
  const btnPagar = el('btnPagar');

  if (!container) return;

  container.innerHTML = '';

  if (state.carrito.length === 0) {
    container.innerHTML = '<p style="text-align:center; padding:20px; color: white;">Tu carrito está vacío.</p>';
    if (totalDisplay) totalDisplay.innerText = '$0.00';
    if (btnPagar) btnPagar.classList.add('hidden');
    return;
  }

  let total = 0;

  state.carrito.forEach((item, index) => {
    const precioUnitario = item.EnPromocion === 1 ? item.PrecioOferta : item.Precio;
    const subtotal = precioUnitario * item.Cantidad;
    total += subtotal;
    const nombreImg = item.Imagen ? item.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlImg = `${state.API_BASE}/uploads/${nombreImg}`;

    const div = document.createElement('div');
    div.className = 'cart-item-container';
    div.style = 'margin-bottom: 15px; background: rgba(0,0,0,0.2); padding: 15px; border-radius: 10px; border: 1px solid #222;';

    div.innerHTML = `
      <div class="producto-item" style="display: flex; align-items: center; gap: 15px; color: white;">
          <img src="${urlImg}" alt="${item.Nombre}" 
               style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
               onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
          <div style="flex: 1;">
              <h3 style="margin: 0; font-size: 1.1rem; color: white;">${item.Nombre}</h3>
              <p style="margin: 5px 0; color: #aaa;">$${precioUnitario} x ${item.Cantidad}</p>
              
              <div style="display: flex; align-items: center; gap: 10px; margin-top: 5px;">
                <button class="btn-qty-minus" style="padding: 2px 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px; cursor: pointer;">-</button>
                <span class="qty-display" style="font-weight: bold; color: white;">${item.Cantidad}</span>
                <button class="btn-qty-plus" style="padding: 2px 8px; background: #222; color: white; border: 1px solid #444; border-radius: 4px; cursor: pointer;">+</button>
                
                <button class="btn-eliminar-item" style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem; margin-left: 15px;">
                    Eliminar
                </button>
              </div>
          </div>
          <div style="text-align: right; font-weight: bold; font-size: 1.1rem; color: var(--accent);">
              $${subtotal.toFixed(2)}
          </div>
      </div>
    `;

    // Event handlers dinámicos sin onclick inline
    div.querySelector('.btn-eliminar-item').addEventListener('click', () => {
      eliminarDelCarrito(index);
    });

    div.querySelector('.btn-qty-minus').addEventListener('click', () => {
      updateCantidad(index, item.Cantidad - 1);
    });

    div.querySelector('.btn-qty-plus').addEventListener('click', () => {
      updateCantidad(index, item.Cantidad + 1);
    });

    container.appendChild(div);
  });

  if (totalDisplay) totalDisplay.innerText = `$${total.toFixed(2)}`;
  
  if (btnPagar) {
    btnPagar.classList.remove('hidden');
    // Registrar listener del pago si no se ha hecho
    if (!btnPagar.dataset.listenerBound) {
      btnPagar.addEventListener('click', (e) => {
        e.preventDefault();
        finalizarCompra();
      });
      btnPagar.dataset.listenerBound = 'true';
    }
  }
}

/**
 * Agrega un producto al carrito
 */
export async function addToCart(id, cantidad = 1) {
  if (!state.loggedUser) { 
    alert('Debes iniciar sesión para comprar'); 
    navigateTo('/login');
    return; 
  }
  
  const p = state.productos.find(x => x.IdProducto === id);
  if (!p) return;

  if (p.Stock < cantidad) { 
    alert('Stock insuficiente para esta cantidad'); 
    return; 
  }

  const item = state.carrito.find(i => i.IdProducto === id);
  if (item) {
    if (p.Stock < item.Cantidad + cantidad) {
      alert('Stock insuficiente en tienda');
      return;
    }
    item.Cantidad += cantidad;
  } else {
    state.carrito.push({ ...p, Cantidad: cantidad });
  }

  p.Stock -= cantidad;
  
  // Actualizar contador del carrito en header
  updateCartBadge();
  
  const { showToast } = await import('./ui.js');
  showToast(`${p.Nombre} agregado (${cantidad})`);
}

/**
 * Agrega un producto al carrito desde la ventana modal de producto
 */
export async function addToCartFromModal(id) {
  const tallaSelect = el('modalTalla');
  const cantInput = el('modalCantidad');
  
  if (!cantInput) return;

  const cantidad = parseInt(cantInput.value) || 1;
  const talla = tallaSelect ? tallaSelect.value : 'M';

  const { cerrarModal } = await import('./ui.js');
  
  await addToCart(id, cantidad);
  cerrarModal();
}

/**
 * Actualiza la cantidad de un artículo en el carrito
 */
export function updateCantidad(index, nuevaCantidad) {
  nuevaCantidad = parseInt(nuevaCantidad);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;

  const item = state.carrito[index];
  const producto = state.productos.find(p => p.IdProducto === item.IdProducto);
  const diff = nuevaCantidad - item.Cantidad;

  if (diff > 0 && producto.Stock < diff) {
    alert('No hay suficiente stock en inventario');
    renderCarrito();
    return;
  }

  item.Cantidad = nuevaCantidad;
  producto.Stock -= diff;

  updateCartBadge();
  renderCarrito();
}

/**
 * Elimina un producto del carrito y devuelve su stock al inventario local
 */
export function eliminarDelCarrito(index) {
  const item = state.carrito[index];
  const producto = state.productos.find(p => p.IdProducto === item.IdProducto);
  if (producto) {
    producto.Stock += item.Cantidad;
  }
  state.carrito.splice(index, 1);
  
  updateCartBadge();
  renderCarrito();
}

/**
 * Actualiza la insignia (badge) de cantidad de items en el header
 */
function updateCartBadge() {
  const cartCount = el('cartCount');
  if (!cartCount) return;

  const totalItems = state.carrito.reduce((acc, item) => acc + item.Cantidad, 0);
  cartCount.textContent = totalItems;
  
  const btnCart = el('btnCart');
  if (btnCart) {
    if (totalItems > 0 && state.loggedUser && (state.loggedUser.role !== 'admin' && state.loggedUser.rol !== 'admin')) {
      btnCart.classList.remove('hidden');
    } else if (totalItems === 0) {
      btnCart.classList.add('hidden');
    }
  }
}

/**
 * Procesa el pago llamando a la pasarela de Stripe
 */
export async function handlePayment() {
  if (state.carrito.length === 0) return alert('El carrito está vacío');

  try {
    const itemsProcesados = state.carrito.map(item => ({
      IdProducto: item.IdProducto,
      Nombre: item.Nombre,
      Precio: item.EnPromocion === 1 ? item.PrecioOferta : item.Precio,
      Cantidad: item.Cantidad
    }));

    const bodyEnvio = {
      items: itemsProcesados,
      latitud: state.loggedUser?.latitud || null,
      longitud: state.loggedUser?.longitud || null
    };

    const response = await apiFetch('/api/stripe/create-checkout-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bodyEnvio)
    });

    const session = await response.json();
    if (!response.ok) {
      throw new Error(session.message || session.error || "Error al crear sesion de pago");
    }

    if (session.id && state.stripe) {
      const result = await state.stripe.redirectToCheckout({ sessionId: session.id });
      if (result.error) {
        alert(result.error.message);
      }
    } else {
      throw new Error(session.error || "Error al crear sesión");
    }
  } catch (error) {
    console.error("Error Stripe:", error);
    alert("Hubo un error al conectar con la pasarela de pagos.");
  }
}

/**
 * Proceso finalizador con geolocalización
 */
export async function finalizarCompra() {
  if (state.carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }

  if (!state.loggedUser) {
    alert("Debes iniciar sesión para finalizar la compra");
    navigateTo('/login');
    return;
  }

  try {
    const { showToast } = await import('./ui.js');
    showToast("Obteniendo tu ubicación para la entrega...");
    const coords = await obtenerUbicacionCliente(8000);

    state.loggedUser.latitud = coords.lat;
    state.loggedUser.longitud = coords.lng;

    await handlePayment();

  } catch (error) {
    console.warn("No se obtuvo la ubicación:", error);
    if (confirm("No pudimos obtener tu ubicación GPS exacta. ¿Quieres continuar con la dirección de tu perfil?")) {
      await handlePayment();
    }
  }
}

/**
 * Helper para obtener coordenadas GPS
 */
export function obtenerUbicacionCliente(timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject("GPS no soportado");
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("Tiempo de espera agotado al obtener ubicacion"));
    }, timeoutMs);

    navigator.geolocation.getCurrentPosition(
      pos => {
        clearTimeout(timeoutId);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      err => {
        clearTimeout(timeoutId);
        reject(err);
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60000 }
    );
  });
}
