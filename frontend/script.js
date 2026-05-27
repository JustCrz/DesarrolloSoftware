const API_BASE = 'http://localhost:3000';
const stripe = Stripe('pk_test_51T8pDsFOBjDn2DDlWx88AjYqbf1NHYmfgppF5i4eIkJW65P70KQyD2INWT5YQo5FEXFDsOsFGOnBDvggkXp3E4vM00wyBe4HmE');
/* ---------------- Datos locales ---------------- */
let productos = [];
let proveedores = [];
let ventas = [];
let carrito = [];
let loggedUser = null;
let mapaAdmin = null; 
let marcadorAdmin = null;
let productoSeleccionadoOferta = null;

const estadosLogistica = {
    "1": "Pagado",
    "2": "Preparando",
    "3": "En Camino",
    "4": "Entregado"
};
/* ---------------- Utilidades DOM ---------------- */
const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

/* ---------------- Navegación ---------------- */
function hideAll() {
  const sections = [
    'landing', 'login', 'register', 'catalog', 'productDetail', 
    'cart', 'adminPanel', 'promociones', 'userHistory', 'modalProducto', 'adminOrders', 'userProfile'
  ];
  sections.forEach(id => {
    const element = el(id);
    if (element) element.classList.add('hidden');
  });
  document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));
}
function showLanding(){ hideAll(); show('landing'); }
function showLogin(){ hideAll(); show('login'); }
function showRegister(){ hideAll(); show('register'); }
function showCatalog(){ hideAll(); renderCatalog(); show('catalog'); }
function showAdminPanel() {
  // Protección: solo admins
  if (!loggedUser || loggedUser.role !== 'admin') {
    alert('Acceso no autorizado');
    showLanding();
    return;
  }
  hideAll();
  show('adminPanel');
  showAdminSection('inventario');
}

function showAdminSection(section) {
  document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));

  switch (section) {
    case 'inventario': 
      show('adminInventario'); 
      renderAdminList(); 
      break;
    case 'proveedores': 
      show('adminProveedores'); 
      renderProveedores(); 
      break;
    case 'catalogo': 
      show('adminCatalogo');
      renderOfertasActivas();
      break;
    case 'estadisticas': 
      show('adminEstadisticas'); 
      renderEstadisticas(); 
      break;
    case 'pedidos': 
      showAdminOrders(); 
      break; 
    case 'pagos':
      show('adminPagos');
      renderPagos();
      break;
      
  }
}

/* ---------------- Admin: Gestión de Pedidos ---------------- */

// Función para mostrar la lista de todos los pedidos (Solo Admin)
async function showAdminOrders() {
    hideAll();
    show('adminPanel');
    document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));
    show('adminOrders');

    const container = el('adminOrdersList');
    if (!container) return;
    container.innerHTML = '<p style="text-align:center; color: var(--accent); padding: 20px;">Cargando pedidos...</p>';

    try {
        const res = await fetch(`${API_BASE}/api/sales`);
        const ventas = await res.json();

        // Acepta tanto array directo como { sales: [] }
        const lista = Array.isArray(ventas) ? ventas : (ventas.sales || []);

        if (lista.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px; color:#888;">No hay pedidos registrados.</p>';
            return;
        }
        const nombresEstado = { '1': 'Pagado', '2': 'Preparando', '3': 'En Camino', '4': 'Entregado' };
        const coloresEstado = { '1': '#d4a373', '2': '#3b82f6', '3': '#f59e0b', '4': '#22c55e' };

        container.innerHTML = lista.map(p => {
            const estado = String(p.Estado);
            const tieneGPS = p.Latitud && p.Longitud;
            const urlGoogleMaps = tieneGPS
                ? `https://www.google.com/maps?q=${p.Latitud},${p.Longitud}`
                : '#';

            return `
            <div style="
                background: #1a1a1a;
                border: 1px solid #2a2a2a;
                border-left: 4px solid ${coloresEstado[estado] || '#d4a373'};
                border-radius: 12px;
                padding: 16px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 10px;">
                    
                    <div style="flex: 1;">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <span style="color: #d4a373; font-weight: 700; font-size: 1rem;">
                                #MS-${p.IdPedido}
                            </span>
                            <span style="
                                background: ${coloresEstado[estado]}22;
                                color: ${coloresEstado[estado]};
                                font-size: 0.72rem;
                                font-weight: 700;
                                padding: 2px 8px;
                                border-radius: 20px;
                                border: 1px solid ${coloresEstado[estado]}44;
                            ">
                                ${nombresEstado[estado] || 'Desconocido'}
                            </span>
                        </div>

                        <p style="margin: 0 0 4px; color: #ccc; font-size: 0.88rem;">
                            👤 ${p.NombreC || 'Cliente'}
                        </p>
                        <p style="margin: 0 0 10px; color: #d4a373; font-weight: 700; font-size: 1rem;">
                            $${parseFloat(p.Total || 0).toFixed(2)}
                        </p>

                        ${tieneGPS ? `
                        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                            <button onclick="enfocarPedidoEnMapa(${p.Latitud}, ${p.Longitud}, '${p.NombreC || 'Cliente'}')"
                                style="background: #1a1a1a; border: 1px solid #d4a373; color: #d4a373;
                                       padding: 5px 12px; border-radius: 8px; cursor: pointer; font-size: 0.78rem; font-weight: 600;">
                                 Ver en mapa
                            </button>
                            <a href="${urlGoogleMaps}" target="_blank"
                               style="background: #1a1a1a; border: 1px solid #4285F4; color: #4285F4;
                                      padding: 5px 12px; border-radius: 8px; font-size: 0.78rem; font-weight: 600;
                                      text-decoration: none; display: inline-flex; align-items: center; gap: 4px;">
                                 Google Maps
                            </a>
                        </div>
                        ` : `
                        <span style="font-size: 0.78rem; color: #555; font-style: italic;">📍 Sin ubicación GPS</span>
                        `}
                    </div>

                    <!-- Selector de estado -->
                    <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px; min-width: 130px;">
                        <label style="font-size: 0.7rem; color: #666; text-transform: uppercase; letter-spacing: 1px;">
                            Estado
                        </label>
                        <select onchange="actualizarEstadoPedido(${p.IdPedido}, this.value, ${p.IdCliente || 'null'})"
                            style="background: #111; color: white; border: 1px solid #d4a373;
                                   padding: 7px 10px; border-radius: 8px; cursor: pointer;
                                   font-size: 0.82rem; width: 100%;">
                            <option value="1" ${estado === '1' ? 'selected' : ''}> Pagado</option>
                            <option value="2" ${estado === '2' ? 'selected' : ''}> Preparando</option>
                            <option value="3" ${estado === '3' ? 'selected' : ''}> En Camino</option>
                            <option value="4" ${estado === '4' ? 'selected' : ''}> Entregado</option>
                        </select>
                    </div>

                </div>
            </div>
            `;
        }).join('');

        // Inicializar mapa
        setTimeout(() => inicializarMapaAdmin(lista), 300);

    } catch (err) {
        console.error("Error al cargar pedidos:", err);
        container.innerHTML = '<p style="color: #ff4d4d; padding: 20px; text-align: center;"> Error al conectar con el servidor.</p>';
    }
}

function inicializarMapaAdmin(lista) {
    const contenedor = el('mapaAdmin');
    if (!contenedor) return;

    // Si el mapa ya existe lo destruimos para evitar conflictos
    if (mapaAdmin) {
        mapaAdmin.remove();
        mapaAdmin = null;
    }

    // Crear mapa centrado en Hermosillo
    mapaAdmin = L.map('mapaAdmin').setView([29.0892, -110.9612], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(mapaAdmin);

    // Icono personalizado dorado
    const iconoDorado = L.divIcon({
        html: `<div style="
            background: #d4a373;
            width: 14px; height: 14px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 0 6px rgba(212,163,115,0.8);
        "></div>`,
        className: '',
        iconSize: [14, 14],
        iconAnchor: [7, 7]
    });

    // Poner marcadores de todos los pedidos con GPS
    const pedidosConGPS = lista.filter(p => p.Latitud && p.Longitud);
    pedidosConGPS.forEach(p => {
        L.marker([p.Latitud, p.Longitud], { icon: iconoDorado })
            .addTo(mapaAdmin)
            .bindPopup(`
                <div style="font-family: sans-serif; min-width: 150px;">
                    <b style="color: #d4a373;">#MS-${p.IdPedido}</b><br>
                     ${p.NombreC || 'Cliente'}<br>
                     $${parseFloat(p.Total || 0).toFixed(2)}<br>
                     Estado: ${p.Estado}
                </div>
            `);
    });

    if (pedidosConGPS.length === 0) {
        contenedor.insertAdjacentHTML('afterend',
            '<p style="color:#555; font-size:0.8rem; text-align:center; margin-top:8px;">Sin pedidos con GPS registrado aún.</p>'
        );
    }
}

function enfocarPedidoEnMapa(lat, lng, nombre) {
    if (!mapaAdmin) return;
    mapaAdmin.flyTo([lat, lng], 16, { duration: 1.2 });

    if (marcadorAdmin) mapaAdmin.removeLayer(marcadorAdmin);
    marcadorAdmin = L.marker([lat, lng])
        .addTo(mapaAdmin)
        .bindPopup(`<b style="color:#d4a373;">Entrega: ${nombre}</b>`)
        .openPopup();
}
// Función para actualizar el estado en la BD
async function cambiarEstadoPedido(idPedido, estadoActual) {
    const estados = ['Pagado', 'Preparando', 'En Camino', 'Entregado'];
    const siguienteIndice = estados.indexOf(estadoActual) + 1;

    if (siguienteIndice >= estados.length) {
        alert("El pedido ya ha sido entregado completamente.");
        return;
    }

    const nuevoEstado = estados[siguienteIndice];

    if (confirm(`¿Quieres mover el pedido #MS-${idPedido} a "${nuevoEstado}"?`)) {
        try {
            const res = await fetch(`${API_BASE}/api/sales/update-status/${idPedido}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nuevoEstado })
            });

            if (res.ok) {
                showToast(`Pedido #${idPedido} actualizado a ${nuevoEstado}`);
                showAdminOrders(); 
            } else {
                alert("No se pudo actualizar el estado en el servidor.");
            }
        } catch (err) {
            console.error(err);
            alert("Error de conexión.");
        }
    }
}
/* ---------------- Autenticación ---------------- */
window.addEventListener('DOMContentLoaded', () => {
  const savedUser = localStorage.getItem('user');
  if (savedUser) {
    try {
      loggedUser = JSON.parse(savedUser);
      console.log("Sesión recuperada:", loggedUser);
      afterLogin(); // Entra directo si ya estaba logueado
    } catch (e) {
      localStorage.removeItem('user');
    }
  } else {
    showLanding(); // Si no hay nadie, muestra el inicio
  }
});

/* --- 2. FUNCIÓN LOGIN CORREGIDA --- */
async function login() {
  const correo = el('loginUser').value.trim().toLowerCase();
  const contraseña = el('loginPass').value;
  
  if (!correo || !contraseña) {
    el('loginMsg').textContent = 'Por favor, llena todos los campos';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña }) 
    });
    
    const data = await res.json();
    console.log("Respuesta login:", data); 

    if (data.ok) {
      loggedUser = data.user; 
      
      // GUARDAR EN EL NAVEGADOR: Esto evita que te saque al registrar proveedores
      localStorage.setItem('user', JSON.stringify(data.user)); 
      
      afterLogin();
    } else {
      el('loginMsg').textContent = data.message;
    }
  } catch (err) {
    el('loginMsg').textContent = 'Error de conexión';
    console.error(err);
  }
}

function afterLogin() {
  el('loginMsg').textContent = '';
  hideAll();
  el('authButtons').classList.add('hidden');
  el('btnLogout').classList.remove('hidden');
  el('notifContainer').classList.remove('hidden');
  cargarNotificaciones();

  if (loggedUser.role === 'admin') {
    el('btnCart')?.classList.add('hidden');
    el('btnHistorial')?.classList.add('hidden');
    el('btnPerfil')?.classList.add('hidden');
    el('btnGoAdmin')?.classList.remove('hidden'); // ESTE es el botón Panel Admin
    show('adminPanel');
  } else {
    el('btnCart')?.classList.remove('hidden');
    el('btnHistorial')?.classList.remove('hidden');
    el('btnPerfil')?.classList.remove('hidden');
    el('btnGoAdmin')?.classList.add('hidden'); // cliente NO ve Panel Admin
    showCatalog();
  }
}

function logout() {
  localStorage.removeItem('user'); // Borramos la sesión del disco
  loggedUser = null;
  
  // Escondemos botones y volvemos al inicio
  el('btnCart')?.classList.add('hidden');
  el('btnLogout')?.classList.add('hidden');
  el('btnHistorial')?.classList.add('hidden');
  el('notifContainer')?.classList.add('hidden');
  el('authButtons')?.classList.remove('hidden');
  
  hideAll();
  showLanding();
}

/* ---------------- Registro ---------------- */
async function register() {
  const NombreC = el('regUser').value.trim();
  const Correo = el('regEmail').value.trim();
  const Contraseña = el('regPass').value;

  if(!NombreC || !Correo || Contraseña.length < 6) {
    el('regMsg').textContent = 'Datos incompletos o contraseña muy corta';
    el('regMsg').style.color = 'orange';
    return;
  }

  try {

    const res = await fetch(`${API_BASE}/api/users/register`, { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        NombreC,
        Correo,
        Contraseña,
        Telefono: el('regTelefono')?.value || '',
        Direccion: el('regDireccion')?.value || ''
      })
    });

    const data = await res.json();
    console.log("Respuesta servidor registro:", data); 

    if (data.ok) {
      el('regMsg').style.color = 'green';
      el('regMsg').textContent = 'Registrado con éxito';
      setTimeout(showLogin, 1500);
    } else {
      el('regMsg').style.color = 'red';
      el('regMsg').textContent = data.message;
    }
  } catch (err) {
    el('regMsg').textContent = 'Error de conexión';
  }
}

function renderCatalog() {
  const container = el('catalogGrid'); 
  if (!container) return;
  container.innerHTML = '';

  productos.forEach(p => {
    const card = document.createElement('article');
    card.className = 'producto';
    
    // MS-07: Lógica de visualización de precios
    const tienePromo = p.EnPromocion === 1 && p.PrecioOferta > 0;
    const precioHTML = tienePromo 
      ? `<p class="precio">
          <span class="oferta" style="color:red; font-weight:bold;">$${p.PrecioOferta}</span> 
          <span class="original-tachado" style="text-decoration:line-through; font-size:0.8em; color:#888;">$${p.Precio}</span>
         </p>`
      : `<p class="precio">$${p.Precio}</p>`;

    const nombreImagen = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
      ${tienePromo ? '<div class="badge-promo" style="position:absolute; background:red; color:white; padding:5px; border-radius:0 8px 8px 0;">OFERTA</div>' : ''}
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; height:250px; object-fit:cover; border-radius: 8px;">
      <h3>${p.Nombre}</h3>
      ${precioHTML}
      <div>${renderEstrellas(p.Calificacion || 0)}</div>
      <button onclick="abrirModalProducto(${p.IdProducto})">Ver detalles</button>
    `;
    container.appendChild(card);
  });
}
/* ---------------- Carrito ---------------- */
function mostrarCarrito(){ hideAll(); show('cart'); renderCarrito(); }

function renderCarrito() {
    const container = document.getElementById('cartContents');
    const totalDisplay = document.getElementById('totalDisplay');
    const btnPagar = document.getElementById('btnPagar');
    
    container.innerHTML = ''; 
    
    if (carrito.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px;">Tu carrito está vacío.</p>';
        if(totalDisplay) totalDisplay.innerText = '$0.00';
        if(btnPagar) btnPagar.classList.add('hidden');
        return;
    }
    
    let total = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.Precio * item.Cantidad;
        total += subtotal;
        const nombreImg = item.Imagen ? item.Imagen.replace(/^(\/)?uploads\//, '') : '';
        const urlImg = `${API_BASE}/uploads/${nombreImg}`;
        
        const div = document.createElement('div');
        div.className = 'cart-item-container';
        
        div.innerHTML = `
            <div class="producto-item" style="display: flex; align-items: center; gap: 15px; margin-bottom: 10px;">
                <img src="${urlImg}" alt="${item.Nombre}" 
                     style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
                     onerror="this.src='https://via.placeholder.com/80?text=Sin+Foto'">
                <div style="flex: 1;">
                    <h3 style="margin: 0; font-size: 1.1rem;">${item.Nombre}</h3>
                    <p style="margin: 5px 0; color: #666;">$${item.Precio} x ${item.Cantidad}</p>
                    <button onclick="eliminarDelCarrito(${index})" 
                            style="background: #ff4d4d; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.8rem;">
                        Eliminar
                    </button>
                </div>
                <div style="text-align: right; font-weight: bold;">
                    $${subtotal.toFixed(2)}
                </div>
            </div>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 10px 0;">
        `;
        container.appendChild(div);
    });
    
    if(totalDisplay) totalDisplay.innerText = `$${total.toFixed(2)}`;
    if(btnPagar) btnPagar.classList.remove('hidden');
}

function addToCart(id){
  if(!loggedUser){ alert('Debes iniciar sesión'); return; }
  const p=productos.find(x=>x.IdProducto===id);
  const qty=parseInt(el(`cantidad_${id}`)?.value || 1);
  if(p.Stock<qty){ alert('Stock insuficiente'); return; }
  const item=carrito.find(i=>i.IdProducto===id);
  if(item) item.Cantidad+=qty; else carrito.push({...p,Cantidad:qty});
  p.Stock-=qty; renderCatalog(); renderCarrito();
  showToast(`${p.Nombre} agregado (${qty})`);
}

function updateCantidad(index,nuevaCantidad){
  nuevaCantidad=parseInt(nuevaCantidad); if(isNaN(nuevaCantidad)||nuevaCantidad<1) return;
  const item=carrito[index];
  const producto=productos.find(p=>p.IdProducto===item.IdProducto);
  const diff=nuevaCantidad-item.Cantidad;
  if(diff>0 && producto.Stock<diff){ alert('No hay suficiente stock'); renderCarrito(); return; }
  item.Cantidad=nuevaCantidad; producto.Stock-=diff; renderCatalog(); renderCarrito();
}

function eliminarDelCarrito(index){
  const item=carrito[index];
  const producto=productos.find(p=>p.IdProducto===item.IdProducto);
  if(producto) producto.Stock+=item.Cantidad;
  carrito.splice(index,1); renderCatalog(); renderCarrito();
}


/* ---------------- Pagos con Stripe ---------------- */
async function handlePayment() {
  if (carrito.length === 0) return alert('El carrito está vacío');

  try {
    const itemsProcesados = carrito.map(item => ({
        IdProducto: item.IdProducto,
        Nombre: item.Nombre,
        Precio: item.EnPromocion === 1 ? item.PrecioOferta : item.Precio, 
        Cantidad: item.Cantidad
    }));

    const bodyEnvio = {
        items: itemsProcesados,
        idUsuario: loggedUser ? loggedUser.IdCliente : null,
        latitud: loggedUser?.latitud || null,
        longitud: loggedUser?.longitud || null
    };

    const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyEnvio) 
    });

    const session = await response.json();
    
    if (session.id) {
        const result = await stripe.redirectToCheckout({ sessionId: session.id });
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

/* ---------------- Proceso de Finalización y Ubicación ---------------- */
async function finalizarCompra() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }
  if (!loggedUser) {
    alert("Debes iniciar sesión para finalizar la compra");
    showLogin();
    return;
  }

  // NUEVO: guardar carrito antes de salir a Stripe
  localStorage.setItem('carritoAntesPago', JSON.stringify(carrito));

  try {
    showToast("Obteniendo tu ubicación para la entrega...");
    const coords = await obtenerUbicacionCliente();
    loggedUser.latitud = coords.lat;
    loggedUser.longitud = coords.lng;
    handlePayment();
  } catch (error) {
    console.warn("No se obtuvo la ubicación:", error);
    if(confirm("No pudimos obtener tu ubicación GPS exacta. ¿Quieres continuar con la dirección de tu perfil?")) {
      handlePayment();
    }
  }
}
async function renderEntregasLogistica() {
  const container = el('adminOrdersList');
  if (!container) return;
  container.innerHTML = '<p style="padding:15px; color: #d4a373;">Cargando entregas...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/sales`);
    const data = await res.json();
    // Ajuste para aceptar tanto un array directo como un objeto con propiedad sales
    const todosLosPedidos = Array.isArray(data) ? data : (data.sales || []); 

    if (todosLosPedidos.length === 0) {
      container.innerHTML = '<p style="padding:15px; color: #888;">No se encontraron pedidos en el sistema.</p>';
      return;
    }

    container.innerHTML = todosLosPedidos.map(p => {
      const nombreMostrar = p.NombreC || p.cliente || "Cliente";
      // IMPORTANTE: Cambiado a Mayúsculas para coincidir con la BD
      const tieneGPS = p.Latitud && p.Longitud; 
      const urlGoogleMaps = tieneGPS ? `https://www.google.com/maps?q=${p.Latitud},${p.Longitud}` : '#';

      return `
        <div class="card-entrega" style="padding:15px; border-bottom:1px solid #333; background:#1a1a1a; margin-bottom:10px; border-radius:12px; color: white; border: 1px solid #2a2a2a;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap: 10px;">
            
            <div style="flex: 1;">
              <div ${tieneGPS ? `onclick="enfocarPedidoEnMapa(${p.Latitud}, ${p.Longitud}, '${nombreMostrar}')"` : ''} 
                   style="${tieneGPS ? 'cursor:pointer;' : 'cursor:default;'}">
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
                <select onchange="actualizarEstadoPedido(${p.IdPedido}, this.value, ${p.IdCliente})" 
                        style="background:#222; color:white; border:1px solid #d4a373; padding:6px; border-radius:6px; cursor: pointer; font-size: 0.85rem; width: 100%;">
                    <option value="1" ${p.Estado == '1' ? 'selected' : ''}> Pagado</option>
                    <option value="2" ${p.Estado == '2' ? 'selected' : ''}> Preparando</option>
                    <option value="3" ${p.Estado == '3' ? 'selected' : ''}> En Camino</option>
                    <option value="4" ${p.Estado == '4' ? 'selected' : ''}> Entregado</option>
                </select>
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    console.error("Error en renderEntregasLogistica:", err);
    container.innerHTML = '<p style="padding:15px; color: #ff4d4d;"> Error de conexión.</p>';
  }
}

function enfocarPedidoEnMapa(lat, lng, nombre) {
  if (!lat || !lng) {
    alert("Este pedido no tiene coordenadas GPS guardadas.");
    return;
  }

  // Si el mapa no se ha inicializado se crea poniendo las (Coordenadas de Hermosillo por defecto)
  if (!mapaAdmin) {
    mapaAdmin = L.map('mapaAdmin').setView([29.0892, -110.9612], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaAdmin);
  }

  // Marcador anterior si existe
  if (marcadorAdmin) mapaAdmin.removeLayer(marcadorAdmin);

  // Nuevo marcador
  marcadorAdmin = L.marker([lat, lng]).addTo(mapaAdmin)
    .bindPopup(`<b>Entrega para: ${nombre}</b>`)
    .openPopup();
    mapaAdmin.flyTo([lat, lng], 16);
}

// Función auxiliar para el GPS 
function obtenerUbicacionCliente() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) reject("GPS no soportado");
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err),
      { enableHighAccuracy: true }
    );
  });
}
function abrirModalProducto(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;

  const tienePromo = p.EnPromocion === 1 && p.PrecioOferta > 0;
  const precioMostrar = tienePromo ? p.PrecioOferta : p.Precio;

  const modalBody = el('modalBody');
  const nombreImagen = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
  const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

  const controlesCompra = (loggedUser && loggedUser.role !== 'admin') ? `
    <div class="selection-group" style="margin-top: 15px; border-top: 1px solid #eee; padding-top: 15px;">
      <label>Talla:</label>
      <select id="modalTalla" class="modern-select">
        <option value="M">Talla M</option>
        <option value="L">Talla L</option>
      </select>
      <label>Cantidad:</label>
      <input type="number" id="modalCantidad" value="1" min="1" max="${p.Stock}" class="modern-input">
      <button class="btn-add-modal" onclick="addToCartFromModal(${p.IdProducto})" style="width:100%; margin-top:10px;">
        Agregar al carrito
      </button>
    </div>
` : (loggedUser && loggedUser.role === 'admin') ? `
    <div style="margin-top: 15px; padding: 15px; background: #1a1a1a; border-radius: 10px; text-align: center; border: 1px solid #d4a373;">
      <p style="color: #d4a373; font-weight: bold; margin: 0;">
        Vista previa del administrador
      </p>
      <small style="color: #666;">Los administradores no pueden realizar compras</small>
    </div>
` : `
    <div style="margin-top: 15px; padding: 15px; background: #fff5f5; border-radius: 10px; text-align: center;">
      <p style="color: #ff3e3e; font-weight: bold; margin: 0;">
        Inicia sesión para elegir tu talla y comprar
      </p>
      <button onclick="cerrarModal(); showLogin();" style="background: none; border: none; color: var(--accent); text-decoration: underline; cursor: pointer; margin-top: 5px;">
        Ir al Login ahora
      </button>
    </div>
`;
  modalBody.innerHTML = `
    <div class="modal-product-layout">
      <button class="close-modal" onclick="cerrarModal()">×</button>
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; height: 300px; object-fit: cover; border-radius:12px; margin-bottom:15px;">
      
      <div class="product-info">
        <h2 style="margin:0;">${p.Nombre}</h2>
        <div style="margin: 5px 0;">${renderEstrellas(p.Calificacion || 0)}</div>
        <p style="font-size:1.2rem; color:var(--accent); font-weight:bold;">
            $${precioMostrar} 
            ${tienePromo ? `<small style="text-decoration:line-through; color:gray; font-size:0.8rem; margin-left:10px;">$${p.Precio}</small>` : ''}
        </p>
        <p style="font-size:0.9rem; color:var(--muted); line-height: 1.4;">
            Esta prenda ha sido seleccionada por su calidad y estilo único en <b>Marjorie Store</b>. 
            Perfecta para lucir moderna y cómoda.
        </p>
        <p style="font-size:0.8rem; color: #888;">Stock disponible: ${p.Stock} unidades</p>
      </div>

      ${controlesCompra} </div>
  `;
  
  show('modalProducto');
}

function addToCartFromModal(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;
  const cantidad = parseInt(el('modalCantidad').value);
  const talla = el('modalTalla').value;

  if (isNaN(cantidad) || cantidad < 1) {
    alert("Por favor ingresa una cantidad válida");
    return;
  }

  if (cantidad > p.Stock) {
    alert('Stock insuficiente');
    return;
  }

  // CORRECCIÓN: usar precio de oferta si está en promoción
  const precioFinal = (p.EnPromocion == 1 && p.PrecioOferta > 0) 
    ? p.PrecioOferta 
    : p.Precio;

  const item = {
    ...p,
    Precio: precioFinal,
    Cantidad: cantidad,
    TallaSeleccionada: talla
  };

  const existente = carrito.find(i => i.IdProducto === id && i.TallaSeleccionada === talla);
  if (existente) {
    existente.Cantidad += cantidad;
  } else {
    carrito.push(item);
  }

  p.Stock -= cantidad;
  cerrarModal();
  showToast(`${p.Nombre} (${talla}) agregado - $${precioFinal}`);
  renderCarrito();
}

function cerrarModal() {
    document.getElementById('modalProducto').classList.add('hidden');
}
/* ---------------- Admin: Inventario ---------------- */
const formProducto = el('formProducto');
let editingId = null;

formProducto.addEventListener('submit', async e => {
  e.preventDefault();

  // Captura de los valores de los inputs
  const Nombre = el('nombre').value.trim();
  const Talla = el('talla').value.trim();
  const Categoria = el('categoria').value.trim();
  const Stock = parseInt(el('stock').value);
  const Precio = parseFloat(el('precio').value);
  const Color = el('color').value.trim();
  
  
  const EnPromocion = el('enPromocion').checked ? 1 : 0;
  const PrecioOferta = parseFloat(el('precioOferta').value) || 0;
  const FechaFinPromo = el('fechaFinPromo').value;

  const ImagenFile = el('imagen').files[0]; 


  const formData = new FormData();
  formData.append('Nombre', Nombre);
  formData.append('Talla', Talla);
  formData.append('Categoria', Categoria);
  formData.append('Stock', Stock);
  formData.append('Precio', Precio);
  formData.append('Color', Color);
  
  // CAMPOS DE PROMOCIÓN 
  formData.append('EnPromocion', EnPromocion);
  formData.append('PrecioOferta', PrecioOferta);
  formData.append('FechaFinPromo', FechaFinPromo);
  
  if (ImagenFile) {
      formData.append('Imagen', ImagenFile);
  }

  try {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`;

    const res = await fetch(url, {
      method: method,
      body: formData
    });

    const data = await res.json();

    if (data.ok) {
      alert(editingId ? 'Producto actualizado' : 'Producto agregado con éxito');
      formProducto.reset();
      editingId = null; // Limpia dep ID después de guardar
      await cargarProductos(); 
      showAdminPanel(); 
      showAdminSection('inventario');
    } else {
      alert('Error: ' + data.message);
    }
  } catch (err) {
    console.error(err);
    alert('Error al conectar con el servidor');
  }
});

function renderAdminList(){
  const container=el('adminList'); container.innerHTML='';
  productos.forEach(p=>{
    const card=document.createElement('div'); card.className='producto';
    card.innerHTML=`
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <button onclick="editProducto(${p.IdProducto})">Editar</button>
      <button onclick="deleteProducto(${p.IdProducto})">Eliminar</button>`;
    container.appendChild(card);
  });
}

function editProducto(id){
const p = productos.find(x => x.IdProducto === id);
  el('nombre').value = p.Nombre;
  el('talla').value = p.Talla;
  el('categoria').value = p.Categoria;
  el('stock').value = p.Stock;
  el('precio').value = p.Precio;
  el('color').value = p.Color;
  el('enPromocion').checked = p.EnPromocion == 1;
  el('precioOferta').value = p.PrecioOferta || '';
  el('fechaFinPromo').value = p.FechaFinPromo ? p.FechaFinPromo.slice(0, 16) : '';
    

 const imgPreview = el('imgPreview'); 
    if(imgPreview) imgPreview.src = `${API_BASE}/uploads/${p.Imagen}`;
    
    editingId = id;

}


async function deleteProducto(id) {
  if (!confirm('¿Estás seguro de que deseas eliminar este producto permanentemente?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (res.ok && data.ok) { 
      alert(' Producto eliminado correctamente.');
      
      await cargarProductos(); // Refresca la lista global
      showAdminPanel();
      showAdminSection('inventario');
    } else {
      const msgError = data.message && data.message.includes('foreign key') 
        ? "⚠️ No se puede eliminar: Este producto tiene pedidos asociados. Para no perder el historial de ventas, te sugerimos solo agotar el stock."
        : (data.message || 'Error desconocido');

      alert(msgError);
    }
  } catch (err) {
    alert(' Error de conexión: El servidor no responde.');
    console.error(err);
  }
}


/* ---------------- Admin: Formulario Proveedores ---------------- */
const formProveedor = el('formProveedor');

if (formProveedor) {
  formProveedor.addEventListener('submit', async e => {
    e.preventDefault();

    // Usamos FormData para enviar el logo
    const formData = new FormData();
    formData.append('Nombre', el('provNombre').value);
    formData.append('Telefono', el('provTelefono').value);
    formData.append('Correo', el('provEmail').value); 
    formData.append('Direccion', el('provDireccion').value);

    const logoInput = el('provLogo');
    if (logoInput && logoInput.files[0]) {
      formData.append('Logo', logoInput.files[0]); // El nombre 'Logo' lo recibe el  Multer
    }

    try {
      const res = await fetch(`${API_BASE}/api/providers`, {
        method: 'POST',
        body: formData 
      });

      const data = await res.json();

      if (res.ok && data.ok) {
        alert(' Proveedor guardado correctamente');
        formProveedor.reset();
        await renderProveedores();
      } else {
        alert(' Error: ' + (data.message || 'Error al guardar'));
      }
    } catch (err) {
      console.error("Error en POST proveedores:", err);
      alert(' Error de conexión');
    }
  });
}
async function deleteProveedor(id) {
    if (!confirm('¿Seguro que quieres eliminar este proveedor?')) return;
    try {
        const res = await fetch(`${API_BASE}/api/providers/${id}`, { method: 'DELETE' });
        const data = await res.json();
        if (data.ok) {
            renderProveedores();
        }
    } catch (err) {
        console.error("Error al eliminar:", err);
    }
}
async function renderProveedores() {
  const container = el('listaProveedores');
  if (!container) return; 

  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    const data = await res.json();
    const lista = data.providers || [];
    container.innerHTML = '';

    if (lista.length === 0) {
      container.innerHTML = '<p style="color:gray; text-align:center; grid-column:1/-1;">No hay proveedores registrados.</p>';
      return;
    }

    container.innerHTML = lista.map(p => {
      const nombreLogo = p.Logo ? p.Logo.replace(/^.*[\\\/]/, '') : '';
      const urlFinal = p.Logo 
        ? `${API_BASE}/uploads/${nombreLogo}` 
        : 'https://via.placeholder.com/150/1a1a1a/d4a373?text=Sin+Logo';

      return `
        <div class="card-proveedor" style="background: #111; border: 1px solid #333; border-radius: 12px; padding: 15px; position: relative; display: flex; flex-direction: column; gap: 10px;">
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
            <button onclick="deleteProveedor(${p.IdProveedor})" style="position: absolute; top: 10px; right: 10px; background: none; border: none; color: #ff6b6b; cursor: pointer; font-size: 1.2rem;">×</button>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error("Error render:", err);
  }
}
function renderListaVentas(ventas) {
  const container = el('listaVentasHistorial');
  if (!container) return; // Si no existe el elemento, no hace nada
  
  container.innerHTML = '';
  
  if (!ventas || ventas.length === 0) {
    container.innerHTML = '<p>No hay ventas registradas para esta fecha.</p>';
    return;
  }

  ventas.forEach(v => {
    const div = document.createElement('div');
    div.style = "padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;";
    div.innerHTML = `
      <span><b>${v.NombreC || 'Cliente'}</b></span> 
      <span>$${v.Total}</span>
    `;
    container.appendChild(div);
  });
}

function renderCatalogAdmin(){
  const container = el('catalogAdmin'); 
  if (!container) return;
  container.innerHTML = '';
  
  productos.forEach(p => {
    const card = document.createElement('div'); 
    card.className = 'producto';
    const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
    const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
     <img src="${urlFinal}" alt="${p.Nombre}" 
          style="width:100%; height:150px; object-fit:cover; border-radius:8px;"
          onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <div class="meta">
        <button onclick="editProducto(${p.IdProducto})">Editar</button>
        <button class="secondary" onclick="deleteProducto(${p.IdProducto})">Eliminar</button>
      </div>`;
    container.appendChild(card);
  });
}


/* ---------------- Admin: Dashboard de Estadísticas ---------------- */
async function renderEstadisticas() {
  try {
    // Resumen del día
    const resDay = await fetch(`${API_BASE}/api/reports/daily-summary`);
    const dataDay = await resDay.json();
    if (dataDay.ok) {
      el('statVentasHoy').textContent = `$${parseFloat(dataDay.datos.ingresos_sucios || 0).toFixed(2)}`;
      el('statPedidosHoy').textContent = `${dataDay.datos.total_pedidos || 0} pedidos`;
    }

    // Producto estrella
    const resTop = await fetch(`${API_BASE}/api/reports/top-product`);
    const dataTop = await resTop.json();
    if (dataTop.ok && dataTop.producto) {
      el('statProductoEstrella').textContent = dataTop.producto.prenda;
      el('statUnidadesEstrella').textContent = `${dataTop.producto.unidades_vendidas} unidades vendidas`;
    }

    // Stock crítico
    const criticos = productos.filter(p => p.Stock < 5);
    el('statCantidadCriticos').textContent = criticos.length;
    const listaCriticos = el('listaStockCritico');
    if (listaCriticos) {
      listaCriticos.innerHTML = criticos.length === 0
        ? '<p style="color:#4CAF50; font-size:0.85rem;">Todo el stock está en niveles óptimos.</p>'
        : criticos.map(p => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:10px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px;">
            <span style="color:#fff; font-size:0.9rem;">${p.Nombre}</span>
            <span style="color:#ff4d4d; font-weight:800; font-size:0.85rem;">Quedan: ${p.Stock}</span>
          </div>
        `).join('');
    }

    // Últimas ventas
    const resVentas = await fetch(`${API_BASE}/api/sales`);
    const dataVentas = await resVentas.json();
    const ventas = Array.isArray(dataVentas) ? dataVentas : (dataVentas.sales || []);
    const listaV = el('listaVentasHistorial');
    if (listaV) {
      listaV.innerHTML = ventas.slice(0, 8).map(v => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:8px;">
          <div>
            <span style="color:#d4a373; font-weight:700; font-size:0.9rem;">#MS-${v.IdPedido}</span>
            <span style="color:#888; font-size:0.8rem; margin-left:8px;">${v.NombreC || 'Cliente'}</span>
          </div>
          <div style="text-align:right;">
            <span style="color:#fff; font-weight:800;">$${parseFloat(v.Total).toFixed(2)}</span>
            <span style="display:block; color:#555; font-size:0.7rem;">${new Date(v.Fecha).toLocaleDateString()}</span>
          </div>
        </div>
      `).join('');
    }

  } catch(err) {
    console.error('Error en reportes:', err);
  }
}

/*------------------ Admin: Pagos realizados --------------------*/
async function renderPagos() {
  const container = el('pagosLista');
  if (!container) return;
  container.innerHTML = '<p style="color:#555; text-align:center; padding:20px;">Cargando pagos...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/sales`);
    const data = await res.json();
    const ventas = Array.isArray(data) ? data : (data.sales || []);

    if (ventas.length === 0) {
      container.innerHTML = '<p style="color:#555; text-align:center; padding:20px;">No hay pagos registrados.</p>';
      return;
    }

    let total = 0;
    ventas.forEach(v => total += parseFloat(v.Total || 0));

    el('pagosTotalRecaudado').textContent = `$${total.toFixed(2)}`;
    el('pagosCompletados').textContent = ventas.length;

    container.innerHTML = ventas.map(v => `
      <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:12px;">
        <div style="display:flex; align-items:center; gap:15px;">
          <div style="width:40px; height:40px; background:#1a3a5c; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">💳</div>
          <div>
            <p style="margin:0; color:#fff; font-weight:700;">#MS-${v.IdPedido}</p>
            <p style="margin:3px 0 0; color:#888; font-size:0.8rem;">${v.NombreC || 'Cliente'} · ${new Date(v.Fecha).toLocaleDateString()}</p>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="margin:0; color:#d4a373; font-weight:800; font-size:1.1rem;">$${parseFloat(v.Total).toFixed(2)}</p>
          <span style="background:#22c55e22; color:#22c55e; font-size:0.7rem; font-weight:700; padding:2px 8px; border-radius:20px;">Stripe · Completado</span>
        </div>
      </div>
    `).join('');

  } catch(err) {
    console.error(err);
    container.innerHTML = '<p style="color:#ff4d4d; text-align:center;">Error al cargar pagos.</p>';
  }
}
/* ---------------- Toast ---------------- */
function showToast(msg){ const t=el('cartMessage'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

/* ---------------- Init ---------------- */

/* ---------------- Carga de Productos con Promociones ---------------- */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (data.ok) {
      productos = data.products;
    } else {
      productos = data; 
    }
    
    // Vista Cliente: Catálogo general
    renderCatalog();      
    
    // Vista Cliente: Sección de Ofertas Relámpago 
    if (typeof renderPromociones === 'function') {
        renderPromociones();
    }
    
    // Vistas Admin
    renderAdminList();    
    renderCatalogAdmin(); 
    
    console.log("Productos cargados y promociones actualizadas:", productos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
  }
}


showLanding();
async function cargarMasVendido() {
  try {
    const res = await fetch(`${API_BASE}/api/reports/top-product`);
    const data = await res.json();
    
    const contCliente = el('infoEstrellaCliente');
    const contAdmin = el('productoEstrellaContenedor');

    if (data.ok && data.producto) {
      const imgNombre = data.producto.Imagen ? data.producto.Imagen.replace(/^(\/)?uploads\//, '') : '';
      const urlImg = `${API_BASE}/uploads/${imgNombre}`;

      if (contCliente) {
        contCliente.innerHTML = `
          <img src="${urlImg}" onerror="this.src='https://via.placeholder.com/300'">
          <div>
            <small style="text-transform:uppercase; letter-spacing:2px; color:#d4a373; font-weight:bold;">★ MÁS VENDIDO</small>
            <strong>${data.producto.prenda}</strong>
            <span>Esta es la prenda favorita de nuestra comunidad. ¡No te quedes sin la tuya!</span>
            <p style="margin-top:10px;"> Unidades vendidas: <b>${data.producto.unidades_vendidas}</b></p>
            <button class="btn-estrella-action" onclick="abrirModalProducto(${data.producto.IdProducto})">
                Ver Detalles y Comprar
            </button>
          </div>
        `;
      }

      // Diseño para el Admin 
      if (contAdmin) {
        contAdmin.innerHTML = `
          <div style="display:flex; align-items:center; gap:20px; padding:15px;">
            <img src="${urlImg}" style="width:80px; height:80px; object-fit:cover; border-radius:10px;">
            <div>
              <h4 style="margin:0; color:var(--primary);">${data.producto.prenda}</h4>
              <p style="margin:5px 0; font-size:0.85rem;">📈 Ventas: <b>${data.producto.unidades_vendidas}</b> | Ganancia: <b style="color:green;">$${data.producto.total_generado}</b></p>
            </div>
          </div>
        `;
      }
    }
  } catch (err) { 
    console.error("Error cargando producto estrella:", err); 
  }
}



function renderEstrellas(calificacion) {
  const total = 5;
  let estrellas = '';
  for (let i = 1; i <= total; i++) {
    estrellas += i <= Math.round(calificacion) ? '★' : '☆';
  }
  return `<span style="color: #FFD700; font-size: 1.2rem;">${estrellas}</span>`;

}
/* ---------------- Vista Cliente: Renderizar Top Productos (Lobby) ---------------- */
async function renderBestSellers() {
  const container = el('bestSellersGrid');
  if (!container) return;

  // Obtenemos los productos con más stock o simplemente los primeros 3 para el lobby
  const destacados = [...productos]
    .sort((a, b) => b.Stock - a.Stock)
    .slice(0, 3);

  if (destacados.length === 0) {
    container.innerHTML = '<p style="text-align:center; width:100%;">Cargando nueva colección...</p>';
    return;
  }

  container.innerHTML = destacados.map(p => {
    const imgNombre = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlFinal = `${API_BASE}/uploads/${imgNombre}`;

    return `
      <article class="producto">
        <div class="img-container" style="height: 250px; overflow: hidden; border-radius: 12px;">
            <img src="${urlFinal}" alt="${p.Nombre}" 
                 style="width: 100%; height: 100%; object-fit: cover;"
                 onerror="this.src='https://via.placeholder.com/250x300?text=Marjorie+Store'">
        </div>
        <div style="padding: 15px; text-align: center;">
            <h3 style="margin: 10px 0 5px; font-size: 1.1rem;">${p.Nombre}</h3>
            <p style="color: var(--muted); font-size: 0.85rem; margin-bottom: 10px;">${p.Categoria || 'Edición Limitada'}</p>
            <p style="font-weight: 800; color: var(--primary); font-size: 1.2rem; margin-bottom: 15px;">$${p.Precio}</p>
            
            <button class="btn-hero" onclick="validarAccesoDetalle(${p.IdProducto})" style="width: 100%; padding: 10px; font-size: 0.9rem;">
                Ver detalles
            </button>
        </div>
      </article>
    `;
  }).join('');
}
/* ---------------- Init ---------------- */
async function init() {
  await cargarProductos();
  await cargarMasVendido();
  await renderBestSellers();
  renderEstadisticas();
  showLanding();
  console.log("Aplicación inicializada correctamente.");
}

document.addEventListener('DOMContentLoaded', init);

// validación
function validarAccesoDetalle(id) {
    if (!loggedUser) {
        alert("Para ver detalles y comprar, por favor inicia sesión.");
        showLogin(); // Muestra el formulario de login
    } else {
        abrirModalProducto(id); // Si está logueado, abre el modal normal
    }
}

function renderPromociones() {
  const container = el('promoGrid');
  const section = el('promociones');
  if (!container || !section) return;

  const enOferta = productos.filter(p => p.EnPromocion == 1);

  if (enOferta.length > 0) {
    section.classList.remove('hidden'); 
    container.innerHTML = enOferta.map(p => `
      <article class="producto promo-card">
        <span class="badge-promo">⚡ OFERTA</span>
        <img src="${API_BASE}/uploads/${p.Imagen.replace('uploads/', '')}" alt="${p.Nombre}">
        <h3>${p.Nombre}</h3>
        <p>
            <span class="precio-original">$${p.Precio}</span>
            <span class="precio-promo">$${p.PrecioOferta}</span>
        </p>
        <button onclick="abrirModalProducto(${p.IdProducto})">Aprovechar</button>
      </article>
    `).join('');
  } else {
    section.classList.add('hidden');
  }
}
function showPromocionesPage() {
    hideAll();
    show('catalog');
    
    const container = document.getElementById('catalogGrid');
    const ofertas = productos.filter(p => p.EnPromocion == 1);
    
    container.innerHTML = ofertas.length > 0 
        ? ofertas.map(p => `
            <article class="producto promo-card">
                <span class="badge-promo">⚡ DESCUENTO</span>
                <img src="${API_BASE}/uploads/${p.Imagen.replace('uploads/', '')}" alt="${p.Nombre}">
                <h3>${p.Nombre}</h3>
                <p>
                    <span style="text-decoration: line-through; color: #999;">$${p.Precio}</span>
                    <strong style="color: #ff3e3e; display: block;">$${p.PrecioOferta}</strong>
                </p>
                <button onclick="abrirModalProducto(${p.IdProducto})">Comprar</button>
            </article>
        `).join('')
        : '<p style="text-align:center; width:100%;">No hay ofertas activas en este momento.</p>';
}
async function showUserHistory() {
    // 1. Diagnóstico: Mira en la consola si el ID existe realmente
    console.log("Revisando pedidos para el usuario:", loggedUser);

    if (!loggedUser) return;
    
    hideAll();
    show('userHistory');
    const container = el('historyList');
    container.innerHTML = '<p>Cargando tus pedidos...</p>';

    try {
        // AJUSTE SEGURO: Usamos IdCliente o id, lo que exista
        const userId = loggedUser.IdCliente || loggedUser.id; 
        
        const res = await fetch(`${API_BASE}/api/sales/usuario/${userId}`);
        const data = await res.json();

        // 2. Diagnóstico: Mira qué respondió el servidor
        console.log("Respuesta del servidor:", data);

        // AJUSTE DE ESTRUCTURA:
        // Algunos servidores devuelven 'data.sales', otros solo 'data'
        const listaPedidos = data.sales || data;

        if (!listaPedidos || listaPedidos.length === 0) {
            container.innerHTML = '<p>Aún no has realizado ninguna compra. ¡Anímate!</p>';
            return;
        } 

        container.innerHTML = listaPedidos.map(p => `
    <div class="pedido-card" style="margin-bottom: 20px; padding: 25px; border-radius: 15px; background: #111; border: 1px solid #222; border-left: 5px solid #d4a373; display: flex; justify-content: space-between; align-items: center;">
        
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
             <button onclick="verDetallePedido(${p.IdPedido})" class="btn-detalle-pedido" style="background: #d4a373; color: #000; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">
                Ver detalles →
             </button>
        </div>
    </div>
`).join('');

    } catch (err) {
        console.error("Error al cargar historial:", err);
        container.innerHTML = '<p>Hubo un error al obtener tus pedidos.</p>';
    }
}

async function verDetallePedido(idPedido) { 
    try {
        const response = await fetch(`${API_BASE}/api/sales/detalle/${idPedido}`);
        const data = await response.json(); 
        const detalles = data.detail;

        if (!detalles || detalles.length === 0) {
            alert("No se encontraron productos para este pedido.");
            return;
        }

        // --- LÓGICA DE ESTADOS (STEPPER) ---
        const estadosNombres = ['Pagado', 'Preparando', 'En Camino', 'Entregado'];
        // Usamos 'Estado' que viene del JOIN en el backend
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

        // Generar Lista de Productos
        const detalleHTML = detalles.map(item => {
            // CORRECCIÓN IMAGEN: Sacamos solo el nombre del archivo para evitar rutas rotas
            const nombreImg = item.Imagen ? item.Imagen.split(/[\\/]/).pop() : '';
            const urlFinal = `${API_BASE}/uploads/${nombreImg}`;
            
            // CORRECCIÓN PRECIO: Validamos múltiples nombres de columna para evitar NaN
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

        // Inyectar en el Modal
        const modalBody = el('modalBody');
        // Usamos TotalPedido que viene de la consulta del backend
        const totalFinal = parseFloat(detalles[0].TotalPedido || detalles[0].Total || 0).toFixed(2);

        modalBody.innerHTML = `
            <button class="close-modal" onclick="cerrarModal()">×</button>
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
        show('modalProducto'); 
        
    } catch (err) {
        console.error("Error al obtener detalles:", err);
        showToast("❌ No se pudo cargar el detalle.");
    }
}

async function generarReporteVentas() {
    const inicio = document.getElementById('reporteVentaInicio').value;
    const fin = document.getElementById('reporteVentaFin').value;
    
    if(!inicio || !fin) return alert("Por favor, selecciona un rango de fechas.");

    try {
        const res = await fetch(`${API_BASE}/api/reports/sales?start=${inicio}&end=${fin}`);
        const data = await res.json();
        
        document.getElementById('ingresosTotalesReporte').innerText = `$${data.totalIngresos.toFixed(2)}`;
        document.getElementById('pedidosTotalesReporte').innerText = data.totalPedidos;
    } catch (err) {
        console.error("Error al generar reporte de ventas:", err);
    }
}

function renderStockCritico() {
    const lista = el('listaStockCritico');
    if (!lista) return;
    const criticos = productos.filter(p => p.Stock < 5);
    
    if(criticos.length === 0) {
        lista.innerHTML = '<p style="color: #4CAF50; font-size: 0.8rem;">Todo el stock está en niveles óptimos.</p>';
        return;
    }
    lista.innerHTML = criticos.map(p => `
        <div class="stock-item-alert" style="display:flex; justify-content:space-between; margin-bottom:5px;">
            <span>${p.Nombre}</span>
            <b style="color: #ff4444;">Quedan: ${p.Stock}</b>
        </div>
    `).join('');
}

function showUserProfile() {
    if (!loggedUser) return showLogin();
    hideAll(); 
    show('userProfile'); 

    el('perfilNombre').value = loggedUser.NombreC || '';
    el('perfilTelefono').value = loggedUser.Telefono || '';
    el('perfilDireccion').value = loggedUser.Direccion || '';
}

async function actualizarEstadoPedido(idPedido, nuevoEstado, idCliente) { 
    try {
        const res = await fetch(`${API_BASE}/api/sales/update-status/${idPedido}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                nuevoEstado, 
                idCliente // Se envía para insertar en la tabla de notificaciones
            }) 
        });

        const data = await res.json();

        if (res.ok && data.ok) {
            const nombreEstado = estadosLogistica[nuevoEstado] || "Actualizado";
            showToast(`✅ Orden #${idPedido} actualizada a: ${nombreEstado}`);

            // Refrescamos toda la vista del admin para ver los cambios
            await renderEntregasLogistica(); 
            renderEstadisticas(); 
        } else {
            alert("❌ Error: " + (data.message || "No se pudo actualizar."));
        }
    } catch (err) {
        console.error("Error crítico en actualizarEstadoPedido:", err);
        showToast("❌ Error de conexión con el servidor.");
    }
}
function enviarNotificacion(mensaje, tipo = 'info') {
    const list = el('notiList');
    if (!list) return;

    // Quitar el mensaje de "No tienes notificaciones"
    if (list.innerHTML.includes('No tienes')) list.innerHTML = '';

    const fecha = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const item = document.createElement('div');
    item.className = `noti-item ${tipo}`;
    item.innerHTML = `
        <small>${fecha}</small>
        <p>${mensaje}</p>
    `;
    
    list.prepend(item); // Poner la más reciente arriba
    
    // Actualizar el contador
    const count = el('notiCount');
    count.textContent = parseInt(count.textContent || 0) + 1;
    count.classList.remove('hidden');
}

function agregarNotificacion(mensaje) {
    const list = el('notiList');
    const countBadge = el('notiCount');
    
    // Si es la primera, limpiamos el mensaje de "vacío"
    if (list.querySelector('.empty-noti')) list.innerHTML = '';

    const ahora = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const div = document.createElement('div');
    div.className = 'noti-item';
    div.innerHTML = `
        <small>${ahora}</small>
        <p style="margin: 5px 0 0; color: #444; font-size: 0.85rem;">${mensaje}</p>
    `;
    
    list.prepend(div);

    // Actualizar círculo rojo
    let actuales = parseInt(countBadge.textContent) || 0;
    actuales++;
    countBadge.textContent = actuales;
    countBadge.style.display = 'flex'; // Mostrar el circulito
}

// Función para abrir/cerrar
function toggleNotiBox() {
    const box = el('notiBox');
    box.classList.toggle('hidden');
    
    // Opcional: Limpiar contador al abrir
    if (!box.classList.contains('hidden')) {
        el('notiCount').style.display = 'none';
        el('notiCount').textContent = '0';
    }
}
// Abrir y cerrar la cajita de notificaciones
function toggleNotiBox() {
    const box = document.getElementById('notiBox');
    box.classList.toggle('hidden');
    // Si la abrimos, podrías marcar como leídas (opcional)
}

async function cargarNotificaciones() {
    // Buscamos 'user' porque así lo guardas en la función login()
    const session = localStorage.getItem('user'); 
    if (!session) return;
    
    const user = JSON.parse(session);
    const destino = user.role === 'admin' ? 'admin' : 'cliente';
    // Usamos IdCliente que es el nombre de tu columna en MySQL
    const userId = user.IdCliente || user.id; 

    const url = `${API_BASE}/api/notificaciones/${destino}/${userId}`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.ok) {
            const lista = document.getElementById('notiList');
            const count = document.getElementById('notiCount');
            
            if (data.notificaciones.length > 0) {
                count.innerText = data.notificaciones.length;
                count.style.display = 'flex';
                
                lista.innerHTML = data.notificaciones.map(n => `
    <div style="padding: 12px; border-bottom: 1px solid #333; background: #1a1a1a; margin-bottom: 5px; border-radius: 8px;">
        <p style="margin:0; color: #d4a373; font-weight: bold; font-size: 0.85rem;">${n.mensaje}</p>
        <small style="color: #666; font-size: 0.7rem;">${new Date(n.Fecha).toLocaleString()}</small>
    </div>
`).join('');
            } else {
                lista.innerHTML = '<p style="color:gray; text-align:center; padding:10px;">No tienes notificaciones.</p>';
                count.style.display = 'none';
            }
        }
    } catch (err) {
        console.log("Error al cargar notificaciones de la BD");
    }
}

// Revisar cada 1 minuto
setInterval(cargarNotificaciones, 60000);

// Abrir el modal y llenar el selector de productos
async function abrirModalAjusteStock() {
    const res = await fetch(`${API_BASE}/api/products`); // Ajusta a tu ruta de productos
    const productos = await res.json();
    
    const select = document.getElementById('selectProductoStock');
    select.innerHTML = productos.map(p => `<option value="${p.IdProducto}">${p.Nombre} (Stock actual: ${p.Stock})</option>`).join('');
    
    document.getElementById('modalAjusteStock').classList.remove('hidden');
}

async function confirmarAjusteStock() {
    const idProducto = document.getElementById('selectProductoStock').value;
    const cantidadNueva = document.getElementById('inputNuevaCantidad').value;

    if (!cantidadNueva || cantidadNueva < 0) return alert("Ingresa una cantidad válida");

    try {
        const res = await fetch(`${API_BASE}/api/sales/adjust-stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idProducto, cantidadNueva })
        });

        const data = await res.json();
        if (data.ok) {
            alert("✅ Stock actualizado exitosamente");
            document.getElementById('modalAjusteStock').classList.add('hidden');
            
            // RE-RENDERIZADO: Esto es lo que actualiza la pantalla del admin
            await cargarProductos(); // Recarga los datos del servidor
            renderAdminList();       // Actualiza la lista simple
            renderCatalogAdmin();    // Actualiza la lista con fotos
        }
    } catch (err) {
        console.error("Error al ajustar stock:", err);
        alert("Hubo un error al conectar con el servidor.");
    }
}
function resetFormProducto() {
  el('formProducto').reset();
  editingId = null;
  el('idProductoEdit').value = '';
}

// ============ SISTEMA DE OFERTAS ADMIN ============

async function buscarProductoParaOferta(query) {
  const container = el('resultadosBusquedaOferta');
  if (!query || query.length < 2) { container.innerHTML = ''; return; }

  try {
    const res = await fetch(`${API_BASE}/api/products/buscar?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    const lista = data.products || [];

    if (lista.length === 0) {
      container.innerHTML = '<p style="color:#555; font-size:0.85rem;">Sin resultados.</p>';
      return;
    }

    container.innerHTML = lista.map(p => {
      const nombreImg = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
      const urlImg = `${API_BASE}/uploads/${nombreImg}`;
      return `
        <div onclick="seleccionarProductoOferta(${p.IdProducto})"
          style="display:flex; align-items:center; gap:12px; padding:12px; background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; cursor:pointer; transition:0.2s;"
          onmouseover="this.style.borderColor='#d4a373'" onmouseout="this.style.borderColor='#2a2a2a'">
          <img src="${urlImg}" style="width:50px; height:50px; object-fit:cover; border-radius:8px;">
          <div>
            <strong style="color:#fff;">${p.Nombre}</strong>
            <p style="margin:2px 0 0; color:#888; font-size:0.8rem;">
              Precio: $${p.Precio} | Stock: ${p.Stock}
              ${p.EnPromocion == 1 ? '<span style="color:#d4a373; margin-left:8px;">⚡ En oferta</span>' : ''}
            </p>
          </div>
        </div>
      `;
    }).join('');
  } catch(err) {
    console.error('Error al buscar:', err);
  }
}

function seleccionarProductoOferta(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;

  productoSeleccionadoOferta = p;

  const nombreImg = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
  el('ofertaIdProducto').value = p.IdProducto;
  el('ofertaImgProducto').src = `${API_BASE}/uploads/${nombreImg}`;
  el('ofertaNombreProducto').textContent = p.Nombre;
  el('ofertaPrecioOriginal').textContent = `Precio original: $${p.Precio}`;
  el('ofertaPrecioNuevo').value = p.PrecioOferta || '';
  el('ofertaFechaFin').value = p.FechaFinPromo ? p.FechaFinPromo.slice(0, 16) : '';

  show('formOfertaContainer');
  el('resultadosBusquedaOferta').innerHTML = '';
  el('buscarProductoOferta').value = p.Nombre;
}

async function guardarOferta() {
  const id = el('ofertaIdProducto').value;
  const precioOferta = parseFloat(el('ofertaPrecioNuevo').value);
  const fechaFin = el('ofertaFechaFin').value;
  const fechaInicio = el('ofertaFechaInicio').value;

  if (!precioOferta || precioOferta <= 0) return alert('Ingresa un precio de oferta válido');
  if (!fechaFin) return alert('Ingresa la fecha de fin de la promoción');

  try {
    const formData = new FormData();
    const p = productoSeleccionadoOferta;
    formData.append('Nombre', p.Nombre);
    formData.append('Categoria', p.Categoria || '');
    formData.append('Talla', p.Talla || '');
    formData.append('Color', p.Color || '');
    formData.append('Precio', p.Precio);
    formData.append('Stock', p.Stock);
    formData.append('EnPromocion', 1);
    formData.append('PrecioOferta', precioOferta);
    formData.append('FechaFinPromo', fechaFin);

    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'PUT',
      body: formData
    });

    const data = await res.json();
    if (data.ok) {
      // Notificar a todos los clientes
      await notificarOfertaClientes(p.Nombre, precioOferta, p.Precio);
      
      showToast(`¡Oferta activada para ${p.Nombre}!`);
      await cargarProductos();
      renderOfertasActivas();
      hide('formOfertaContainer');
      el('buscarProductoOferta').value = '';
    }
  } catch(err) {
    console.error(err);
    alert('Error al guardar la oferta');
  }
}

async function quitarOferta() {
  const id = el('ofertaIdProducto').value;
  const p = productoSeleccionadoOferta;
  if (!confirm(`¿Quitar el descuento de "${p.Nombre}"?`)) return;

  try {
    const formData = new FormData();
    formData.append('Nombre', p.Nombre);
    formData.append('Categoria', p.Categoria || '');
    formData.append('Talla', p.Talla || '');
    formData.append('Color', p.Color || '');
    formData.append('Precio', p.Precio);
    formData.append('Stock', p.Stock);
    formData.append('EnPromocion', 0);
    formData.append('PrecioOferta', 0);
    formData.append('FechaFinPromo', '');

    await fetch(`${API_BASE}/api/products/${id}`, { method: 'PUT', body: formData });
    showToast(`Descuento quitado de ${p.Nombre}`);
    await cargarProductos();
    renderOfertasActivas();
    hide('formOfertaContainer');
    el('buscarProductoOferta').value = '';
  } catch(err) {
    alert('Error al quitar la oferta');
  }
}

async function notificarOfertaClientes(nombreProducto, precioOferta, precioOriginal) {
  try {
    // Obtener todos los clientes
    const res = await fetch(`${API_BASE}/api/users`);
    const data = await res.json();
    const clientes = data.users || [];

    // Insertar notificación para cada cliente
    await Promise.all(clientes.map(c =>
      fetch(`${API_BASE}/api/notificaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          IdUsuario: c.IdCliente,
          Mensaje: `⚡ ¡"${nombreProducto}" está en promoción! De $${precioOriginal} → $${precioOferta}. ¡No te lo pierdas!`,
          Destino: 'cliente'
        })
      })
    ));
  } catch(err) {
    console.error('Error al notificar clientes:', err);
  }
}
 
function renderOfertasActivas() {
  const container = el('listaOfertasActivas');
  if (!container) return;

  const enOferta = productos.filter(p => p.EnPromocion == 1 && p.PrecioOferta > 0);

  if (enOferta.length === 0) {
    container.innerHTML = '<p style="color:#555; font-size:0.85rem; grid-column:1/-1;">No hay ofertas activas.</p>';
    return;
  }

  container.innerHTML = enOferta.map(p => {
    const nombreImg = p.Imagen ? p.Imagen.replace(/^(\/)?uploads\//, '') : '';
    const urlImg = `${API_BASE}/uploads/${nombreImg}`;
    const descuento = Math.round(((p.Precio - p.PrecioOferta) / p.Precio) * 100);

    return `
      <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:16px; overflow:hidden; position:relative;">
        <div style="position:absolute; top:10px; left:10px; background:#ff3e3e; color:white; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:20px;">
          -${descuento}%
        </div>
        <img src="${urlImg}" style="width:100%; height:160px; object-fit:cover;"
             onerror="this.src='https://placehold.co/300x160/1a1a1a/d4a373?text=Sin+Imagen'">
        <div style="padding:15px;">
          <h4 style="margin:0 0 8px; color:#fff;">${p.Nombre}</h4>
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
            <span style="color:#d4a373; font-size:1.2rem; font-weight:800;">$${p.PrecioOferta}</span>
            <span style="color:#666; text-decoration:line-through; font-size:0.9rem;">$${p.Precio}</span>
          </div>
          ${p.FechaFinPromo ? `
          <div id="timer_${p.IdProducto}" style="font-size:0.78rem; color:#888; margin-bottom:10px;">
            ⏱ Calculando...
          </div>` : ''}
          <button onclick="seleccionarProductoOferta(${p.IdProducto})"
            style="width:100%; background:transparent; border:1px solid #d4a373; color:#d4a373; padding:8px; border-radius:8px; cursor:pointer; font-weight:700; font-size:0.8rem;">
            Editar Oferta
          </button>
        </div>
      </div>
    `;
  }).join('');

  // Iniciar contadores
  enOferta.forEach(p => {
    if (p.FechaFinPromo) iniciarContador(p.IdProducto, p.FechaFinPromo);
  });
}

function iniciarContador(idProducto, fechaFin) {
  const el_timer = document.getElementById(`timer_${idProducto}`);
  if (!el_timer) return;

  const fin = new Date(fechaFin).getTime();

  const interval = setInterval(() => {
    const ahora = new Date().getTime();
    const diff = fin - ahora;

    if (diff <= 0) {
      el_timer.textContent = '⏱ Oferta expirada';
      el_timer.style.color = '#ff4d4d';
      clearInterval(interval);
      return;
    }

    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const segs = Math.floor((diff % (1000 * 60)) / 1000);

    el_timer.innerHTML = `⏱ Termina en: <b style="color:#d4a373;">${dias}d ${horas}h ${mins}m ${segs}s</b>`;
  }, 1000);
}