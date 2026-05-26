/**
 * admin.js - Lógica de control y paneles del administrador
 * Marjorie Store Boutique Premium
 */

import { state, el } from './app.js';
import { navigateTo } from './router.js';
import { apiFetch } from './api.js';

// ID del producto que se está editando actualmente
let editingId = null;

/**
 * Carga e inyecta una subvista del administrador en el contenedor del dashboard
 * @param {string} sectionName - Nombre de la subsección (Ej: 'inventario', 'proveedores')
 */
export async function showAdminSection(sectionName) {
  const viewName = sectionName === 'pedidos' ? 'entregas' : sectionName;
  const container = el('adminContentContainer');

  if (!container) return;

  container.innerHTML = '<div style="color:var(--accent); text-align:center; padding:30px;">Cargando sección...</div>';

  try {
    const res = await fetch(`views/admin/${viewName}.html`);
    if (!res.ok) throw new Error("No se pudo cargar la vista de administración");
    const html = await res.text();
    container.innerHTML = html;

    if (!state.productos || state.productos.length === 0) {
      const { cargarProductos } = await import('./api.js');
      await cargarProductos();
    }
    // Ejecutar lógica de inicialización específica de cada subvista
    if (sectionName === 'inventario') {
      renderAdminList();
      setupInventarioFormEvents();
    } else if (sectionName === 'proveedores') {
      renderProveedores();
      setupProveedoresFormEvents();
    } else if (sectionName === 'catalogo') {
      renderCatalogAdmin();
      setupCatalogoPromoEvents();
    } else if (sectionName === 'estadisticas') {
      renderEstadisticas();
    } else if (sectionName === 'pedidos') {
      renderEntregasLogistica();
    } else if (sectionName === 'pagos') {
      renderPagos();
    }

  } catch (error) {
    console.error("ERROR ADMIN:", error);
    alert(error.message);
    container.innerHTML = '<p style="color:red; text-align:center; padding:30px;">Error al cargar sección de administración</p>';
  }

  // Vincular eventos del sidebar de navegación cada vez
  setupDashboardSidebarEvents();
}

/**
 * Vincula los event listeners a la barra lateral del administrador
 */
function setupDashboardSidebarEvents() {
  const adminNav = document.querySelector('.admin-nav');
  if (!adminNav) return;

  const buttons = adminNav.querySelectorAll('button');
  buttons.forEach(btn => {
    // Si ya tiene listener, no volver a agregarlo
    if (btn.dataset.listenerBound) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const text = btn.textContent.trim().toLowerCase();
      if (text.includes('inventario')) {
        showAdminSection('inventario');
      } else if (text.includes('proveedores')) {
        showAdminSection('proveedores');
      } else if (text.includes('catálogo')) {
        showAdminSection('catalogo');
      } else if (text.includes('reportes')) {
        showAdminSection('estadisticas');
      } else if (text.includes('entregas')) {
        showAdminSection('pedidos');
      } else if (text.includes('pagos')) {
        showAdminSection('pagos');
      } else if (text.includes('salir')) {
        navigateTo('/');
      }
    });

    btn.dataset.listenerBound = 'true';
  });
}

/* ---------------- Admin: Inventario ---------------- */

/**
 * Vincula el evento submit del formulario de producto
 */
function setupInventarioFormEvents() {
  const formProd = el('formProducto');
  if (!formProd) return;

  formProd.addEventListener('submit', async (e) => {
    e.preventDefault();

    const Nombre = el('nombre').value.trim();
    const Talla = el('talla').value.trim();
    const Categoria = el('categoria').value.trim();
    const Stock = parseInt(el('stock').value);
    const Precio = parseFloat(el('precio').value);
    const Color = el('color').value.trim();

    // Obtener campos de promoción si existen en el DOM, o dejarlos por defecto
    const enPromoEl = el('enPromocion');
    const EnPromocion = enPromoEl ? (enPromoEl.checked ? 1 : 0) : 0;
    const precioOfertaEl = el('precioOferta');
    const PrecioOferta = precioOfertaEl ? (parseFloat(precioOfertaEl.value) || 0) : 0;
    const fechaFinPromoEl = el('fechaFinPromo');
    const FechaFinPromo = fechaFinPromoEl ? fechaFinPromoEl.value : '';

    const ImagenFile = el('imagen').files[0];

    const formData = new FormData();
    formData.append('Nombre', Nombre);
    formData.append('Talla', Talla);
    formData.append('Categoria', Categoria);
    formData.append('Stock', Stock);
    formData.append('Precio', Precio);
    formData.append('Color', Color);
    formData.append('EnPromocion', EnPromocion);
    formData.append('PrecioOferta', PrecioOferta);
    formData.append('FechaFinPromo', FechaFinPromo);

    if (ImagenFile) {
      formData.append('Imagen', ImagenFile);
    }

    try {
      const method = editingId ? 'PUT' : 'POST';
      const endpoint = editingId ? `/api/products/${editingId}` : '/api/products';

      const res = await apiFetch(endpoint, {
        method: method,
        body: formData
      });

      const data = await res.json();

      if (data.ok) {
        alert(editingId ? 'Producto actualizado correctamente' : 'Producto agregado con éxito');
        formProd.reset();
        editingId = null;

        // Recargar productos desde el backend
        const { cargarProductos } = await import('./api.js');
        await cargarProductos();

        // Recargar lista actual
        renderAdminList();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (err) {
      console.error(err);
      alert('Error al conectar con el servidor');
    }
  });

  // Vincular botón de ajuste rápido de stock
  const btnAjusteRapido = document.querySelector('.btn-hero');
  if (btnAjusteRapido && btnAjusteRapido.textContent.includes('Ajuste Manual')) {
    btnAjusteRapido.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModalAjusteStock();
    });
  }

  // Vincular botones del modal de ajuste de stock
  const btnConfirmar = el('btnConfirmarAjusteStock');
  if (btnConfirmar) {
    btnConfirmar.addEventListener('click', (e) => {
      e.preventDefault();
      confirmarAjusteStock();
    });
  }

  const btnCerrar = el('btnCerrarAjusteStock');
  if (btnCerrar) {
    btnCerrar.addEventListener('click', (e) => {
      e.preventDefault();
      el('modalAjusteStock')?.classList.add('hidden');
    });
  }
}

/**
 * Renderiza la lista de productos en el inventario del administrador
 */
export function renderAdminList() {
  const container = el('adminList');
  if (!container) return;
  container.innerHTML = '';

  state.productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'producto';
    card.style = 'background: #111; padding: 15px; border-radius: 10px; border: 1px solid #333; margin-bottom: 10px; color: white; display: flex; justify-content: space-between; align-items: center;';
    card.innerHTML = `
      <div>
        <h4 style="margin: 0 0 5px 0; color: var(--accent);">${p.Nombre}</h4>
        <p style="margin: 0; font-size: 0.85rem; color: #ccc;">Stock: <b>${p.Stock}</b> | Precio: <b>$${p.Precio}</b></p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-edit btn-save-admin" style="font-size: 0.8rem; padding: 5px 10px;">Editar</button>
        <button class="btn-delete btn-reset-admin" style="font-size: 0.8rem; padding: 5px 10px; background: #ff4d4d; color: white;">Eliminar</button>
      </div>
    `;

    card.querySelector('.btn-edit').addEventListener('click', () => {
      editProducto(p.IdProducto);
    });

    card.querySelector('.btn-delete').addEventListener('click', () => {
      deleteProducto(p.IdProducto);
    });

    container.appendChild(card);
  });
}

/**
 * Carga un producto en el formulario para editarlo
 */
export async function editProducto(id) {
  const inventarioSection = el('adminInventario');
  if (!inventarioSection) {
    await showAdminSection('inventario');
  }

  const p = state.productos.find(x => x.IdProducto === id);
  if (!p) return;

  el('nombre').value = p.Nombre || '';
  el('talla').value = p.Talla || '';
  el('categoria').value = p.Categoria || '';
  el('stock').value = p.Stock || 0;
  el('precio').value = p.Precio || 0;
  el('color').value = p.Color || '';

  const enPromo = el('enPromocion');
  if (enPromo) enPromo.checked = p.EnPromocion == 1;
  const precioOferta = el('precioOferta');
  if (precioOferta) precioOferta.value = p.PrecioOferta || '';
  const fechaFinPromo = el('fechaFinPromo');
  if (fechaFinPromo) fechaFinPromo.value = p.FechaFinPromo ? p.FechaFinPromo.slice(0, 16) : '';

  editingId = id;

  // Hacer scroll suave hacia el formulario
  el('formProducto')?.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Elimina un producto del inventario
 */
export async function deleteProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) return;

  try {
    const res = await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();

    if (res.ok && data.ok) {
      alert('Producto eliminado correctamente.');

      const { cargarProductos } = await import('./api.js');
      await cargarProductos();

      renderAdminList();
    } else {
      const msgError = data.message && data.message.includes('foreign key')
        ? "No se puede eliminar: Este producto tiene pedidos asociados en el historial. Te sugerimos solo agotar su stock."
        : (data.message || 'Error al eliminar');
      alert(msgError);
    }
  } catch (err) {
    alert('Error de conexión: El servidor no responde.');
    console.error(err);
  }
}

/* ---------------- Admin: Proveedores ---------------- */

/**
 * Vincula el evento submit del formulario de proveedor
 */
function setupProveedoresFormEvents() {
  const formProv = el('formProveedor');
  if (!formProv) return;

  formProv.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('Nombre', el('provNombre').value.trim());
    formData.append('Telefono', el('provTelefono').value.trim());
    formData.append('Correo', el('provEmail').value.trim());
    formData.append('Direccion', el('provDireccion').value.trim());

    const logoInput = el('provLogo');
    if (logoInput && logoInput.files[0]) {
      formData.append('Logo', logoInput.files[0]);
    }

    try {
      const res = await apiFetch('/api/providers', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        alert('Proveedor guardado correctamente');
        formProv.reset();
        await renderProveedores();
      } else {
        alert('Error: ' + (data.message || 'Error al guardar'));
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión con el servidor');
    }
  });
}

/**
 * Renderiza la lista de proveedores
 */
export async function renderProveedores() {
  const container = el('listaProveedores');
  if (!container) return;

  container.innerHTML = '<div style="color:var(--accent);">Cargando proveedores...</div>';

  try {
    const res = await apiFetch('/api/providers');
    const data = await res.json();
    const lista = data.providers || data || [];
    container.innerHTML = '';

    if (lista.length === 0) {
      container.innerHTML = '<p style="color:gray; text-align:center; grid-column:1/-1;">No hay proveedores registrados.</p>';
      return;
    }

    lista.forEach(p => {
      const nombreLogo = p.Logo ? p.Logo.replace(/^.*[\\\/]/, '') : '';
      const urlFinal = p.Logo
        ? `${state.API_BASE}/uploads/${nombreLogo}`
        : 'https://via.placeholder.com/150/1a1a1a/d4a373?text=Sin+Logo';

      const card = document.createElement('div');
      card.className = 'card-proveedor';
      card.style = 'background: #111; border: 1px solid #333; border-radius: 12px; padding: 15px; position: relative; display: flex; flex-direction: column; gap: 10px;';
      card.innerHTML = `
          <div style="width: 100%; height: 100px; border-radius: 8px; background: #050505; display: flex; align-items: center; justify-content: center; overflow: hidden;">
              <img src="${urlFinal}" alt="Logo" style="max-width: 90%; max-height: 90%; object-fit: contain;" onerror="this.src='https://via.placeholder.com/100/1a1a1a/d4a373?text='">
          </div>
          <div style="color: #fff;">
              <h4 style="margin: 0 0 5px 0; color: #d4a373;">${p.Nombre}</h4>
              <div style="font-size: 0.8rem; color: #ccc;">
                  <p style="margin: 2px 0;">📞 ${p.Telefono || 'N/A'}</p>
                  <p style="margin: 2px 0;">📧 ${p.Correo || 'N/A'}</p>
              </div>
          </div>
          <button class="btn-delete-prov" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 1.2rem;">×</button>
      `;

      card.querySelector('.btn-delete-prov').addEventListener('click', () => {
        deleteProveedor(p.IdProveedor);
      });

      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error render proveedores:", err);
    container.innerHTML = '<p style="color:red;">Error al cargar proveedores</p>';
  }
}

/**
 * Elimina un proveedor
 */
export async function deleteProveedor(id) {
  if (!confirm('¿Seguro que quieres eliminar este proveedor?')) return;

  try {
    const res = await apiFetch(`/api/providers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.ok) {
      await renderProveedores();
    } else {
      alert("Error: " + data.message);
    }
  } catch (err) {
    console.error("Error al eliminar proveedor:", err);
  }
}

/* ---------------- Admin: Catálogo y Ofertas ---------------- */

/**
 * Vincula cambios del formulario de ofertas del catálogo
 */
function setupCatalogoPromoEvents() {
  // Cuando se edita una promoción desde esta vista
  const enPromo = el('enPromocion');
  if (enPromo) {
    enPromo.addEventListener('change', () => {
      console.log("Cambio en estado de promoción");
    });
  }
}

/**
 * Renderiza el catálogo del administrador
 */
export function renderCatalogAdmin() {
  const container = el('catalogAdmin');
  if (!container) return;
  container.innerHTML = '';

  state.productos.forEach(p => {
    const card = document.createElement('div');
    card.className = 'producto';
    const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
    const urlFinal = `${state.API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
     <img src="${urlFinal}" alt="${p.Nombre}" 
          style="width:100%; height:150px; object-fit:cover; border-radius:8px;"
          onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <div class="meta" style="display:flex; gap:10px; margin-top:10px;">
        <button class="btn-edit-promo btn-save-admin" style="flex:1; font-size:0.8rem;">Editar Promo</button>
        <button class="btn-delete-promo btn-reset-admin" style="flex:1; font-size:0.8rem; background:#ff4d4d; color:white;">Eliminar</button>
      </div>`;

    card.querySelector('.btn-edit-promo').addEventListener('click', () => {
      editProducto(p.IdProducto);
    });

    card.querySelector('.btn-delete-promo').addEventListener('click', () => {
      deleteProducto(p.IdProducto);
    });

    container.appendChild(card);
  });
}

/* ---------------- Admin: Estadísticas / Dashboard ---------------- */

/**
 * Renderiza reportes, estadísticas y resúmenes de venta en el panel de control
 */
export async function renderEstadisticas() {
  try {
    // 1. Cargar el Producto Más Vendido
    const resEstrella = await fetch(`${state.API_BASE}/api/reports/top-product`);
    const dataEstrella = await resEstrella.json();
    const contAdmin = el('productoEstrellaContenedor');

    if (dataEstrella.ok && dataEstrella.producto && contAdmin) {
      const imgNombre = dataEstrella.producto.Imagen ? dataEstrella.producto.Imagen.replace('uploads/', '') : '';
      const urlImg = `${state.API_BASE}/uploads/${imgNombre}`;

      contAdmin.innerHTML = `
        <div style="display:flex; align-items:center; gap:20px; width:100%; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 12px;">
          <img src="${urlImg}" style="width:80px; height:80px; object-fit:cover; border-radius:12px; border:2px solid #fff;">
          <div style="flex:1;">
            <h4 style="margin:0; color:#fff; font-size:1.1rem;">${dataEstrella.producto.prenda}</h4>
            <div style="display:flex; gap:15px; margin-top:5px; font-size:0.9rem;">
              <span style="color: #ccc;"> Vendidos: <b>${dataEstrella.producto.unidades_vendidas}</b></span>
              <span style="color:var(--accent); font-weight:bold;"> $${dataEstrella.producto.total_generado}</span>
            </div>
          </div>
        </div>
      `;
    }

    // 2. Cargar Resumen Diario de Ventas
    const resVentas = await apiFetch('/api/reports/daily-summary');
    const dataVentas = await resVentas.json();

    if (dataVentas.ok) {
      const ingresosEl = el('dashIngresosPeriodo');
      const pedidosEl = el('dashPedidosPeriodo');
      if (ingresosEl) ingresosEl.textContent = `$${dataVentas.datos.ingresos_sucios || 0}`;
      if (pedidosEl) pedidosEl.textContent = dataVentas.datos.total_pedidos || 0;
    }

    // 3. Cargar las últimas 5 ventas en el historial
    const resHistorial = await apiFetch('/api/sales');
    const dataHistorial = await resHistorial.json();
    const listaH = el('listaVentasHistorial');

    if (listaH) {
      listaH.innerHTML = '';
      const ventas = Array.isArray(dataHistorial) ? dataHistorial : (dataHistorial.pedidos || []);

      ventas.slice(0, 5).forEach(v => {
        const div = document.createElement('div');
        div.className = 'pago-item';
        div.style = 'display:flex; justify-content:space-between; align-items:center; padding:10px; border-bottom:1px solid #333;';
        div.innerHTML = `
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:600; color:#fff;">${v.NombreC || 'Cliente'}</span>
              <small style="color:#888;">${new Date(v.Fecha || Date.now()).toLocaleDateString()}</small> 
            </div>
            <span style="font-weight:bold; color:var(--accent); font-size:1.1rem;">$${v.Total}</span>
          `;
        listaH.appendChild(div);
      });
    }

    // 4. Renderizar Alertas de Stock Crítico
    renderStockCritico();

    // 5. Vincular generador de reportes por fecha
    setupReportFormEvents();

  } catch (err) {
    console.error("Error en Dashboard de estadísticas:", err);
  }
}

/**
 * Vincula el formulario para generar reporte de ventas por rango de fechas
 */
function setupReportFormEvents() {
  const btnReporte = document.querySelector('.stat-card button');
  if (btnReporte) {
    btnReporte.addEventListener('click', (e) => {
      e.preventDefault();
      generarReporteVentas();
    });
  }
}

/**
 * Genera el reporte de ventas llamando al backend
 */
export async function generarReporteVentas() {
  const inicioEl = document.getElementById('reporteVentaInicio');
  const finEl = document.getElementById('reporteVentaFin');

  if (!inicioEl || !finEl) return;

  const inicio = inicioEl.value;
  const fin = finEl.value;

  if (!inicio || !fin) return alert("Por favor, selecciona un rango de fechas.");

  try {
    const res = await apiFetch(`/api/reports/sales?start=${inicio}&end=${fin}`);
    const data = await res.json();

    const ingresosRep = document.getElementById('ingresosTotalesReporte');
    const pedidosRep = document.getElementById('pedidosTotalesReporte');

    if (ingresosRep) ingresosRep.innerText = `$${(data.totalIngresos || 0).toFixed(2)}`;
    if (pedidosRep) pedidosRep.innerText = data.totalPedidos || 0;
  } catch (err) {
    console.error("Error al generar reporte de ventas:", err);
  }
}

/**
 * Muestra alertas sobre stock crítico (menor a 5 unidades)
 */
export function renderStockCritico() {
  const lista = el('listaStockCritico');
  if (!lista) return;

  const criticos = state.productos.filter(p => p.Stock < 5);

  if (criticos.length === 0) {
    lista.innerHTML = '<p style="color: #4CAF50; font-size: 0.85rem;">Todo el stock está en niveles óptimos.</p>';
    return;
  }

  lista.innerHTML = criticos.map(p => `
        <div class="stock-item-alert" style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #222; padding-bottom:5px;">
            <span style="color:#fff;">${p.Nombre}</span>
            <b style="color: #ff4444;">Quedan: ${p.Stock}</b>
        </div>
    `).join('');
}

/* ---------------- Admin: Pagos ---------------- */

/**
 * Carga e inyecta la lista de pagos en la subvista correspondientes
 */
export async function renderPagos() {
  const container = el('pagosLista');
  const totalEl = el('totalPagos');

  if (!container || !totalEl) return;

  container.innerHTML = '<div style="color:var(--accent);">Cargando pagos...</div>';
  totalEl.textContent = 'Total de pagos: $0';

  try {
    const res = await apiFetch('/api/sales');
    const pagos = await res.json();

    const listaPagos = Array.isArray(pagos) ? pagos : (pagos.sales || []);

    if (listaPagos.length === 0) {
      container.innerHTML = '<p style="color:gray;">No hay pagos registrados</p>';
      return;
    }

    container.innerHTML = '';
    let total = 0;

    listaPagos.forEach(p => {
      total += parseFloat(p.Total || 0);

      const div = document.createElement('div');
      div.className = 'pago-item';
      div.style = 'padding:10px; border-bottom:1px solid #333; display:flex; justify-content:space-between; color: white;';
      div.innerHTML = `
        <span>📅 ${new Date(p.Fecha).toLocaleDateString()} - Cliente: <b>${p.NombreC || 'N/A'}</b></span>
        <span style="color:var(--accent); font-weight:bold;">$${p.Total}</span>
      `;

      container.appendChild(div);
    });

    totalEl.textContent = `Total de pagos: $${total.toFixed(2)}`;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p style="color:red;">Error al cargar los pagos</p>';
  }
}

/* ---------------- Admin: Entregas Logística ---------------- */

/**
 * Renderiza la lista de entregas de logística
 */
export async function renderEntregasLogistica() {
  const container = el('adminOrdersList');
  if (!container) return;
  container.innerHTML = '<p style="padding:15px; color: #d4a373; text-align:center;">Cargando entregas...</p>';

  try {
    const res = await apiFetch('/api/sales');
    const data = await res.json();
    const ventas = data.sales || data || [];

    if (ventas.length === 0) {
      container.innerHTML = '<p style="padding:15px; color: #888; text-align:center;">No se encontraron pedidos en el sistema.</p>';
      return;
    }

    container.innerHTML = '';
    ventas.forEach(p => {
      const nombreMostrar = p.NombreC || p.cliente || p.Nombre || "Cliente no identificado";
      const tieneGPS = p.latitud && p.longitud;
      const urlGoogleMaps = tieneGPS ? `https://www.google.com/maps?q=${p.latitud},${p.longitud}` : '#';

      const div = document.createElement('div');
      div.className = 'card-entrega';
      div.style = 'padding:15px; border-bottom:1px solid #333; background:#1a1a1a; margin-bottom:10px; border-radius:12px; color: white; border: 1px solid #2a2a2a;';
      div.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; gap: 10px;">
          <div style="flex: 1;">
            <div class="btn-focus-order" style="${tieneGPS ? 'cursor:pointer;' : 'cursor:default;'}">
                <strong style="color:#d4a373; font-size: 1.1rem;">Orden #MS-${p.IdPedido}</strong><br>
                <span style="font-size: 0.9rem; color: #eee;">👤 ${nombreMostrar}</span>
            </div>
            ${tieneGPS ? `
              <a href="${urlGoogleMaps}" target="_blank" 
                 style="display: inline-flex; align-items: center; margin-top: 10px; color: #4285F4; text-decoration: none; font-size: 0.85rem; font-weight: bold; gap: 5px;">
                 <span>📍</span> Ver ubicación GPS
              </a>
            ` : `
              <span style="display:block; margin-top:10px; color:#555; font-size:0.8rem; font-style:italic;">📍 Sin datos de ubicación</span>
            `}
          </div>
          <div style="text-align: right; min-width: 120px;">
              <label style="display:block; font-size: 0.7rem; color: #888; margin-bottom: 4px;">Estado del envío:</label>
              <select class="select-estado" 
                      style="background:#222; color:white; border:1px solid #d4a373; padding:6px; border-radius:6px; cursor: pointer; font-size: 0.85rem; width: 100%;">
                  <option value="1" ${p.Estado == '1' ? 'selected' : ''}> Pagado</option>
                  <option value="2" ${p.Estado == '2' ? 'selected' : ''}> Preparando</option>
                  <option value="3" ${p.Estado == '3' ? 'selected' : ''}> En Camino</option>
                  <option value="4" ${p.Estado == '4' ? 'selected' : ''}> Entregado</option>
              </select>
          </div>
        </div>
      `;

      if (tieneGPS) {
        div.querySelector('.btn-focus-order').addEventListener('click', () => {
          enfocarPedidoEnMapa(p.latitud, p.longitud, nombreMostrar);
        });
      }

      div.querySelector('.select-estado').addEventListener('change', (e) => {
        actualizarEstadoPedido(p.IdPedido, e.target.value, p.IdCliente || p.idUsuario);
      });

      container.appendChild(div);
    });

    // Inicializar el mapa Leaflet si no está inicializado
    setTimeout(() => {
      const mapaEl = el('mapaAdmin');
      if (mapaEl && !state.mapaAdmin) {
        state.mapaAdmin = L.map('mapaAdmin').setView([29.0892, -110.9612], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.mapaAdmin);
      }
    }, 100);

  } catch (err) {
    console.error("Error al cargar logística:", err);
    container.innerHTML = '<p style="padding:15px; color: #ff4d4d;"> Error de conexión al cargar entregas.</p>';
  }
}

/**
 * Enfoca el mapa interactivo en las coordenadas dadas y agrega un marcador
 */
export function enfocarPedidoEnMapa(lat, lng, nombre) {
  if (!lat || !lng) {
    alert("Este pedido no tiene coordenadas GPS guardadas.");
    return;
  }

  // Inicializar mapa si no existe
  if (!state.mapaAdmin) {
    state.mapaAdmin = L.map('mapaAdmin').setView([lat, lng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(state.mapaAdmin);
  }

  // Quitar marcador anterior
  if (state.marcadorAdmin) {
    state.mapaAdmin.removeLayer(state.marcadorAdmin);
  }

  // Nuevo marcador
  state.marcadorAdmin = L.marker([lat, lng]).addTo(state.mapaAdmin)
    .bindPopup(`<b>Entrega para: ${nombre}</b>`)
    .openPopup();

  state.mapaAdmin.flyTo([lat, lng], 16);
}

/**
 * Actualiza el estado de envío de un pedido en la base de datos
 */
export async function actualizarEstadoPedido(idPedido, nuevoEstado, idCliente) {
  try {
    const res = await apiFetch(`/api/sales/update-status/${idPedido}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nuevoEstado,
        idCliente
      })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      const nombreEstado = state.estadosLogistica[nuevoEstado] || "Actualizado";

      const { showToast, agregarNotificacion } = await import('./ui.js');
      showToast(`Orden #${idPedido} actualizada a: ${nombreEstado}`);

      // Actualizar listado de logística
      await renderEntregasLogistica();

      // Notificación visual en campana del Admin
      agregarNotificacion(`Orden #${idPedido} pasó a: ${nombreEstado}`);

    } else {
      alert("Error: " + (data.message || "No se pudo actualizar el estado."));
    }
  } catch (err) {
    console.error("Error crítico en actualizarEstadoPedido:", err);
    const { showToast } = await import('./ui.js');
    showToast("Error de conexión con el servidor.");
  }
}

/* ---------------- Admin: Ajuste Rápido de Stock ---------------- */

/**
 * Abre el modal y llena el selector de productos para el ajuste de stock
 */
export async function abrirModalAjusteStock() {
  try {
    const res = await fetch(`${state.API_BASE}/api/products`);
    const productos = await res.json();

    const listaProductos = Array.isArray(productos) ? productos : (productos.products || []);

    const select = el('selectProductoStock');
    if (!select) return;

    select.innerHTML = listaProductos.map(p => `<option value="${p.IdProducto}">${p.Nombre} (Stock actual: ${p.Stock})</option>`).join('');

    const modal = el('modalAjusteStock');
    if (modal) modal.classList.remove('hidden');
  } catch (error) {
    console.error(error);
    alert("Error al cargar productos en el selector de stock");
  }
}

/**
 * Envía la nueva cantidad de stock al servidor
 */
export async function confirmarAjusteStock() {
  const idProducto = el('selectProductoStock')?.value;
  const cantidadNueva = el('inputNuevaCantidad')?.value;

  if (!cantidadNueva) return alert("Ingresa una cantidad");

  try {
    const res = await apiFetch('/api/sales/adjust-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idProducto, cantidadNueva })
    });

    const data = await res.json();
    if (data.ok) {
      alert("Stock ajustado correctamente");
      el('modalAjusteStock')?.classList.add('hidden');

      // Actualizar inventario local
      const { cargarProductos } = await import('./api.js');
      await cargarProductos();

      // Recargar lista actual
      renderAdminList();
    }
  } catch (err) {
    alert("Error al actualizar el stock");
  }
}
