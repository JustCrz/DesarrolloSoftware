/**
 * ui.js - Utilidades de interfaz comunes y renderizados dinámicos
 * Marjorie Store Boutique Premium
 */

import { state, el } from './app.js';
import { navigateTo } from './router.js';
import { apiFetch, get } from './api.js';

/**
 * Muestra un mensaje flotante (toast)
 */
export function showToast(msg) {
  const t = el('cartMessage');
  if (!t) return;
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => {
    t.style.display = 'none';
  }, 2500);
}

/**
 * Renderiza estrellas de calificación
 */
export function renderEstrellas(calificacion) {
  const total = 5;
  let estrellas = '';
  for (let i = 1; i <= total; i++) {
    estrellas += i <= Math.round(calificacion) ? '★' : '☆';
  }
  return `<span style="color: #FFD700; font-size: 1.2rem;">${estrellas}</span>`;
}

/**
 * Valida el acceso antes de abrir detalles de un producto
 */
export function validarAccesoDetalle(id) {
  if (!state.loggedUser) {
    alert("Para ver detalles y comprar, por favor inicia sesión.");
    navigateTo('/login');
  } else {
    abrirModalProducto(id);
  }
}

/**
 * Abre la ventana modal para detalles de producto
 */
export function abrirModalProducto(id) {
  const p = state.productos.find(x => x.IdProducto === id);
  if (!p) return;

  const tienePromo = p.EnPromocion === 1 && p.PrecioOferta > 0;
  const precioMostrar = tienePromo ? p.PrecioOferta : p.Precio;

  const modalBody = el('modalBody');
  if (!modalBody) return;
  
  const nombreImagen = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
  const urlFinal = `${state.API_BASE}/uploads/${nombreImagen}`;

  const controlesCompra = state.loggedUser ? `
    <div class="selection-group" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
      <label>Talla:</label>
      <select id="modalTalla" class="modern-select">
        <option value="M">Talla M</option>
        <option value="L">Talla L</option>
      </select>
      
      <label>Cantidad:</label>
      <input type="number" id="modalCantidad" value="1" min="1" max="${p.Stock}" class="modern-input">
      
      <button class="btn-add-modal btn-hero" style="width:100%; margin-top:10px;">
        Agregar al carrito
      </button>
    </div>
  ` : `
    <div style="margin-top: 15px; padding: 15px; background: #fff5f5; border-radius: 10px; text-align: center;">
      <p style="color: #ff3e3e; font-weight: bold; margin: 0;">
         Inicia sesión para elegir tu talla y comprar
      </p>
      <button class="btn-go-login" style="background: none; border: none; color: var(--accent); text-decoration: underline; cursor: pointer; margin-top: 5px;">
        Ir al Login ahora
      </button>
    </div>
  `;

  modalBody.innerHTML = `
    <div class="modal-product-layout">
      <button class="close-modal" style="position: absolute; right: 15px; top: 15px; background: none; border: none; font-size: 2rem; color: white; cursor: pointer;">×</button>
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; height: 300px; object-fit: cover; border-radius:12px; margin-bottom:15px;">
      
      <div class="product-info">
        <h2 style="margin:0; color: white;">${p.Nombre}</h2>
        <div style="margin: 5px 0;">${renderEstrellas(p.Calificacion || 0)}</div>
        <p style="font-size:1.2rem; color:var(--accent); font-weight:bold;">
            $${precioMostrar} 
            ${tienePromo ? `<small style="text-decoration:line-through; color:gray; font-size:0.8rem; margin-left:10px;">$${p.Precio}</small>` : ''}
        </p>
        <p style="font-size:0.9rem; color:#888; line-height: 1.4;">
            Esta prenda ha sido seleccionada por su calidad y estilo único en <b>Marjorie Store</b>. 
            Perfecta para lucir moderna y cómoda.
        </p>
        <p style="font-size:0.8rem; color: #888;">Stock disponible: ${p.Stock} unidades</p>
      </div>

      ${controlesCompra} 
    </div>
  `;

  // Bind de eventos dinámicos
  const btnClose = modalBody.querySelector('.close-modal');
  if (btnClose) {
    btnClose.addEventListener('click', cerrarModal);
  }

  const btnAdd = modalBody.querySelector('.btn-add-modal');
  if (btnAdd) {
    btnAdd.addEventListener('click', async () => {
      const { addToCartFromModal } = await import('./cart.js');
      addToCartFromModal(p.IdProducto);
    });
  }

  const btnGoLogin = modalBody.querySelector('.btn-go-login');
  if (btnGoLogin) {
    btnGoLogin.addEventListener('click', () => {
      cerrarModal();
      navigateTo('/login');
    });
  }

  // Mostrar modal
  const modal = el('modalProducto');
  if (modal) modal.classList.remove('hidden');
}

/**
 * Cierra la ventana modal de producto
 */
export function cerrarModal() {
  const modal = el('modalProducto');
  if (modal) modal.classList.add('hidden');
}

/**
 * Renderiza el catálogo completo
 */
export function renderCatalog() {
  const container = el('catalogGrid');
  if (!container) return;
  container.innerHTML = '';

  state.productos.forEach(p => {
    const card = document.createElement('article');
    card.className = 'producto';

    const tienePromo = p.EnPromocion === 1 && p.PrecioOferta > 0;
    const precioHTML = tienePromo
      ? `<p class="precio">
          <span class="oferta" style="color:red; font-weight:bold;">$${p.PrecioOferta}</span> 
          <span class="original-tachado" style="text-decoration:line-through; font-size:0.8em; color:#888;">$${p.Precio}</span>
         </p>`
      : `<p class="precio">$${p.Precio}</p>`;

    const nombreImagen = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlFinal = `${state.API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
      ${tienePromo ? '<div class="badge-promo" style="position:absolute; background:red; color:white; padding:5px; border-radius:0 8px 8px 0; z-index: 10;">OFERTA</div>' : ''}
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; height:250px; object-fit:cover; border-radius: 8px;">
      <h3>${p.Nombre}</h3>
      ${precioHTML}
      <div>${renderEstrellas(p.Calificacion || 0)}</div>
      <button class="btn-ver-detalles">Ver detalles</button>
    `;
    
    card.querySelector('.btn-ver-detalles').addEventListener('click', () => {
      validarAccesoDetalle(p.IdProducto);
    });

    container.appendChild(card);
  });

  // Intentar cargar la sección de producto estrella cliente si la vista catalogo lo requiere
  cargarMasVendidoCliente();
}

/**
 * Renderiza la sección de Producto Estrella en el catálogo del Cliente
 */
async function cargarMasVendidoCliente() {
  const contCliente = el('infoEstrellaCliente');
  if (!contCliente) return;

  try {
    const data = await get('/api/reports/top-product');
    if (data.ok && data.producto) {
      const imgNombre = data.producto.Imagen ? data.producto.Imagen.replace(/^(\/)?uploads\//, '') : '';
      const urlImg = `${state.API_BASE}/uploads/${imgNombre}`;

      contCliente.innerHTML = `
        <div class="estrella-card-inner" style="display: flex; gap: 20px; align-items: center; background: rgba(0, 0, 0, 0.4); padding: 20px; border-radius: 15px; border: 1px solid var(--accent);">
          <img src="${urlImg}" onerror="this.src='https://via.placeholder.com/300'" style="width: 150px; height: 150px; object-fit: cover; border-radius: 10px;">
          <div>
            <small style="text-transform:uppercase; letter-spacing:2px; color:#d4a373; font-weight:bold; display: block; margin-bottom: 5px;">★ MÁS VENDIDO</small>
            <strong style="font-size: 1.5rem; color: white; display: block; margin-bottom: 5px;">${data.producto.prenda}</strong>
            <span style="color: #ccc; font-size: 0.9rem; display: block; margin-bottom: 10px;">Esta es la prenda favorita de nuestra comunidad. ¡No te quedes sin la tuya!</span>
            <p style="margin: 0 0 10px 0; color: white;"> Unidades vendidas: <b>${data.producto.unidades_vendidas}</b></p>
            <button class="btn-estrella-action btn-hero" style="font-size: 0.85rem; padding: 8px 15px;">
                Ver Detalles y Comprar
            </button>
          </div>
        </div>
      `;

      contCliente.querySelector('.btn-estrella-action').addEventListener('click', () => {
        validarAccesoDetalle(data.producto.IdProducto);
      });
    }
  } catch (error) {
    console.error("Error al cargar producto estrella cliente:", error);
  }
}

/**
 * Renderiza los destacados (Best Sellers) en el Lobby
 */
export async function renderBestSellers() {
  const container = el('bestSellersGrid');
  if (!container) return;

  const destacados = [...state.productos]
    .sort((a, b) => b.Stock - a.Stock)
    .slice(0, 3);

  if (destacados.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%; color: white;">Cargando nueva colección...</p>';
    return;
  }

  container.innerHTML = '';
  destacados.forEach(p => {
    const card = document.createElement('article');
    card.className = 'producto';

    const imgNombre = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlFinal = `${state.API_BASE}/uploads/${imgNombre}`;

    card.innerHTML = `
      <div class="img-container" style="height: 250px; overflow: hidden; border-radius: 12px;">
          <img src="${urlFinal}" alt="${p.Nombre}" 
               style="width: 100%; height: 100%; object-fit: cover;"
               onerror="this.src='https://via.placeholder.com/250x300?text=Marjorie+Store'">
      </div>
      <div style="padding: 15px; text-align: center;">
          <h3 style="margin: 10px 0 5px; font-size: 1.1rem;">${p.Nombre}</h3>
          <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 10px;">${p.Categoria || 'Edición Limitada'}</p>
          <p style="font-weight: 800; color: var(--primary); font-size: 1.2rem; margin-bottom: 15px;">$${p.Precio}</p>
          <button class="btn-hero btn-best-detail" style="width: 100%; padding: 10px; font-size: 0.9rem;">
              Ver detalles
          </button>
      </div>
    `;

    card.querySelector('.btn-best-detail').addEventListener('click', () => {
      validarAccesoDetalle(p.IdProducto);
    });

    container.appendChild(card);
  });
}

/**
 * Renderiza la sección de ofertas relámpago en el lobby
 */
export function renderPromociones() {
  const container = el('promoGrid');
  const section = el('promociones');
  if (!container || !section) return;

  const enOferta = state.productos.filter(p => p.EnPromocion == 1);

  if (enOferta.length > 0) {
    section.classList.remove('hidden');
    container.innerHTML = '';
    enOferta.forEach(p => {
      const card = document.createElement('article');
      card.className = 'producto promo-card';
      card.innerHTML = `
        <span class="badge-promo" style="position: absolute; background: red; color: white; padding: 5px 10px; font-size: 0.8rem; border-radius: 0 8px 8px 0; z-index: 10;">⚡ OFERTA</span>
        <img src="${state.API_BASE}/uploads/${p.Imagen.replace('uploads/', '')}" alt="${p.Nombre}" style="width:100%; height:250px; object-fit:cover; border-radius: 8px;">
        <h3>${p.Nombre}</h3>
        <p>
            <span class="precio-original" style="text-decoration: line-through; color: #888; margin-right: 10px;">$${p.Precio}</span>
            <span class="precio-promo" style="color: red; font-weight: bold;">$${p.PrecioOferta}</span>
        </p>
        <button class="btn-hero btn-aprovechar" style="width: 100%;">Aprovechar</button>
      `;

      card.querySelector('.btn-aprovechar').addEventListener('click', () => {
        abrirModalProducto(p.IdProducto);
      });

      container.appendChild(card);
    });
  } else {
    section.classList.add('hidden');
  }
}

/**
 * Renderiza la vista de Ofertas
 */
export function showPromocionesPage() {
  const container = el('catalogGrid');
  if (!container) return;

  const ofertas = state.productos.filter(p => p.EnPromocion == 1);

  if (ofertas.length > 0) {
    container.innerHTML = '';
    ofertas.forEach(p => {
      const card = document.createElement('article');
      card.className = 'producto promo-card';
      card.innerHTML = `
        <span class="badge-promo" style="position: absolute; background: red; color: white; padding: 5px 10px; font-size: 0.8rem; border-radius: 0 8px 8px 0; z-index: 10;">⚡ DESCUENTO</span>
        <img src="${state.API_BASE}/uploads/${p.Imagen.replace('uploads/', '')}" alt="${p.Nombre}" style="width:100%; height:250px; object-fit:cover; border-radius: 8px;">
        <h3>${p.Nombre}</h3>
        <p>
            <span style="text-decoration: line-through; color: #999; margin-right: 10px;">$${p.Precio}</span>
            <strong style="color: #ff3e3e; font-size: 1.2rem;">$${p.PrecioOferta}</strong>
        </p>
        <button class="btn-hero btn-aprovechar" style="width: 100%;">Comprar</button>
      `;

      card.querySelector('.btn-aprovechar').addEventListener('click', () => {
        abrirModalProducto(p.IdProducto);
      });

      container.appendChild(card);
    });
  } else {
    container.innerHTML = '<p style="text-align:center; width:100%; color: white; padding: 50px;">No hay ofertas activas en este momento.</p>';
  }
}

/**
 * Renderiza el formulario de Mi Perfil con los datos del usuario
 */
export function showUserProfile() {
  if (!state.loggedUser) {
    navigateTo('/login');
    return;
  }

  const pNombre = el('perfilNombre');
  const pTelefono = el('perfilTelefono');
  const pDireccion = el('perfilDireccion');

  if (pNombre && pTelefono && pDireccion) {
    pNombre.value = state.loggedUser.NombreC || '';
    pTelefono.value = state.loggedUser.Telefono || '';
    pDireccion.value = state.loggedUser.Direccion || '';
  }
}

/**
 * Renderiza el historial de pedidos del cliente
 */
export async function showUserHistory() {
  if (!state.loggedUser) return;

  const container = el('historyList');
  if (!container) return;
  container.innerHTML = '<p style="color: white; text-align: center;">Cargando tus pedidos...</p>';

  try {
    const userId = state.loggedUser.IdCliente || state.loggedUser.id;
    const res = await apiFetch(`/api/sales/usuario/${userId}`);
    const data = await res.json();
    
    const listaPedidos = data.sales || data;

    if (!listaPedidos || listaPedidos.length === 0) {
      container.innerHTML = '<p style="color: white; text-align: center;">Aún no has realizado ninguna compra. ¡Anímate!</p>';
      return;
    }

    container.innerHTML = '';
    listaPedidos.forEach(p => {
      const div = document.createElement('div');
      div.className = 'pedido-card';
      div.style = 'margin-bottom: 20px; padding: 25px; border-radius: 15px; background: #111; border: 1px solid #222; border-left: 5px solid #d4a373; display: flex; justify-content: space-between; align-items: center;';
      div.innerHTML = `
        <div style="display: flex; flex-direction: column; gap: 5px;">
            <span style="color: #d4a373; font-size: 0.75rem; font-weight: 800; letter-spacing: 1px;">ORDEN</span>
            <h3 style="margin: 0; color: #fff; font-size: 1.4rem;">#MS-${p.IdPedido}</h3> 
            <small style="color: #666; font-weight: 500;">${new Date(p.Fecha).toLocaleDateString()}</small>
        </div>

        <div style="display: flex; align-items: center; gap: 20px;">
            <div style="background: #222; padding: 8px 15px; border-radius: 10px; border: 1px solid #333;">
                <span style="color: #d4a373; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">
                    ${p.Estado == '1' ? 'Pagado' : p.Estado == '2' ? 'Preparando' : p.Estado == '3' ? 'En Camino' : 'Entregado'}
                </span>
            </div>
            <div style="text-align: right;">
                <span style="color: #666; font-size: 0.7rem; display: block;">TOTAL</span>
                <span style="font-size: 1.3rem; font-weight: 800; color: #fff;">$${parseFloat(p.Total).toFixed(2)}</span>
            </div>
        </div>

        <div>
             <button class="btn-detalle-pedido" style="background: #d4a373; color: #000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
                Ver detalles →
             </button>
        </div>
      `;

      div.querySelector('.btn-detalle-pedido').addEventListener('click', () => {
        verDetallePedido(p.IdPedido);
      });

      container.appendChild(div);
    });

  } catch (err) {
    console.error("Error al cargar historial:", err);
    container.innerHTML = '<p style="color: red; text-align: center;">Hubo un error al obtener tus pedidos.</p>';
  }
}

/**
 * Abre modal con detalle específico de un pedido (con stepper)
 */
export async function verDetallePedido(idPedido) {
  try {
    const response = await apiFetch(`/api/sales/detalle/${idPedido}`);
    const data = await response.json();
    const detalles = data.detail;

    if (!detalles || detalles.length === 0) {
      alert("No se encontraron productos para este pedido.");
      return;
    }

    const estadosNombres = ['Pagado', 'Preparando', 'En Camino', 'Entregado'];
    const estadoActual = parseInt(detalles[0].Estado) || 1;
    let pasoActivo = estadoActual - 1;

    const stepperHTML = `
            <div style="display: flex; justify-content: space-between; margin: 25px 0; position: relative; padding: 0 10px;">
                <div style="position: absolute; top: 15px; left: 10%; width: 80%; height: 2px; background: #333; z-index: 1;"></div>
                <div style="position: absolute; top: 15px; left: 10%; width: ${(pasoActivo / 3) * 80}%; height: 2px; background: #d4a373; z-index: 2; transition: width 0.5s ease;"></div>
                
                ${estadosNombres.map((est, index) => `
                    <div style="z-index: 3; text-align: center; width: 65px;">
                        <div style="width: 32px; height: 32px; border-radius: 50%; 
                             background: ${index <= pasoActivo ? '#d4a373' : '#1a1a1a'}; 
                             border: 2px solid #d4a373; margin: 0 auto; display: flex; align-items: center; justify-content: center; 
                             color: ${index <= pasoActivo ? '#fff' : '#d4a373'}; 
                             font-size: 12px; font-weight: bold;">
                            ${index < pasoActivo ? '✓' : index + 1}
                        </div>
                        <p style="margin-top: 8px; font-size: 0.6rem; color: ${index <= pasoActivo ? '#fff' : '#666'}; text-transform: uppercase; font-weight: bold;">${est}</p>
                    </div>
                `).join('')}
            </div>
        `;

    const detalleHTML = detalles.map(item => {
      const nombreImg = item.Imagen ? item.Imagen.split(/[\\/]/).pop() : '';
      const urlFinal = `${state.API_BASE}/uploads/${nombreImg}`;
      const precioUnitario = parseFloat(item.PrecioUnitario || item.Precio || 0);
      const cantidad = parseInt(item.Cantidad || 0);
      const subtotal = (precioUnitario * cantidad).toFixed(2);

      return `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; border-bottom: 1px solid #333; padding-bottom: 10px;">
                    <img src="${urlFinal}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px; border: 1px solid #444;" 
                         onerror="this.src='https://via.placeholder.com/70?text=Error'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem; color: #fff;">${item.Nombre || 'Producto'}</h4>
                        <p style="margin: 0; color: #888; font-size: 0.85rem;">Cantidad: ${cantidad}</p>
                    </div>
                    <span style="font-weight: bold; color: #d4a373; font-size: 1.1rem;">$${subtotal}</span>
                </div>
            `;
    }).join('');

    const modalBody = el('modalBody');
    if (!modalBody) return;

    const totalFinal = parseFloat(detalles[0].TotalPedido || detalles[0].Total || 0).toFixed(2);

    modalBody.innerHTML = `
            <button class="close-modal" style="position: absolute; right: 15px; top: 15px; background: none; border: none; font-size: 2rem; color: white; cursor: pointer;">×</button>
            <h2 style="color: #fff; margin-top: 0; text-align: center;">Resumen de Compra</h2>
            <p style="color: #d4a373; font-size: 0.9rem; margin-bottom: 5px; text-align: center; font-weight: bold;">Orden: #MS-${idPedido}</p>
            
            ${stepperHTML}

            <div style="max-height: 300px; overflow-y: auto; padding-right: 5px; margin-top: 30px;">
                ${detalleHTML}
            </div>
            
            <div style="margin-top: 20px; text-align: right; border-top: 2px solid #d4a373; padding-top: 15px;">
                <span style="color: #888; font-size: 0.9rem;">Total de la Orden:</span>
                <div style="font-size: 1.8rem; font-weight: 800; color: #fff;">$${totalFinal}</div>
            </div>
        `;

    modalBody.querySelector('.close-modal').addEventListener('click', cerrarModal);
    
    const modal = el('modalProducto');
    if (modal) modal.classList.remove('hidden');

  } catch (err) {
    console.error("Error al obtener detalles:", err);
    showToast("❌ No se pudo cargar el detalle.");
  }
}

/**
 * Cajita de notificaciones
 */
export function toggleNotiBox() {
  const box = el('notiBox');
  if (!box) return;
  box.classList.toggle('hidden');

  if (!box.classList.contains('hidden')) {
    const count = el('notiCount');
    if (count) {
      count.style.display = 'none';
      count.textContent = '0';
    }
  }
}

/**
 * Buscar notificaciones en la base de datos
 */
export async function cargarNotificaciones() {
  if (!state.loggedUser) return;

  const destino = state.loggedUser.rol === 'admin' || state.loggedUser.role === 'admin' ? 'admin' : 'cliente';
  const userId = state.loggedUser.IdCliente || state.loggedUser.id;
  try {
    const res = await apiFetch(`/api/notificaciones/${destino}/${userId}`);
    const data = await res.json();

    if (data.ok) {
      const lista = el('notiList');
      const count = el('notiCount');

      if (data.notificaciones.length > 0 && lista && count) {
        count.innerText = data.notificaciones.length;
        count.style.display = 'flex';

        lista.innerHTML = data.notificaciones.map(n => `
                    <div style="padding: 10px; border-bottom: 1px solid #222; font-size: 0.85rem;">
                        <p style="margin:0; color: white;">${n.Mensaje}</p>
                        <small style="color: #666;">${new Date(n.Fecha).toLocaleString()}</small>
                    </div>
                `).join('');
      }
    }
  } catch (err) {
    console.log("Error al cargar notificaciones");
  }
}

export function enviarNotificacion(mensaje, tipo = 'info') {
  const list = el('notiList');
  if (!list) return;

  if (list.innerHTML.includes('No tienes')) list.innerHTML = '';

  const fecha = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const item = document.createElement('div');
  item.className = `noti-item ${tipo}`;
  item.innerHTML = `
        <small>${fecha}</small>
        <p>${mensaje}</p>
    `;

  list.prepend(item);

  const count = el('notiCount');
  if (count) {
    count.textContent = parseInt(count.textContent || 0) + 1;
    count.classList.remove('hidden');
  }
}

export function agregarNotificacion(mensaje) {
  const list = el('notiList');
  const countBadge = el('notiCount');
  if (!list || !countBadge) return;

  if (list.querySelector('.empty-noti')) list.innerHTML = '';

  const ahora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const div = document.createElement('div');
  div.className = 'noti-item';
  div.innerHTML = `
        <small>${ahora}</small>
        <p style="margin: 5px 0 0; color: #444; font-size: 0.85rem;">${mensaje}</p>
    `;

  list.prepend(div);

  let actuales = parseInt(countBadge.textContent) || 0;
  actuales++;
  countBadge.textContent = actuales;
  countBadge.style.display = 'flex';
}
