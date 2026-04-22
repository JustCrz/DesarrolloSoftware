const API_BASE = 'http://localhost:3000';
const stripe = Stripe('pk_test_51T8pDsFOBjDn2DDlWx88AjYqbf1NHYmfgppF5i4eIkJW65P70KQyD2INWT5YQo5FEXFDsOsFGOnBDvggkXp3E4vM00wyBe4HmE');
/* ---------------- Datos locales ---------------- */
let productos = [];
let proveedores = [];
let ventas = [];
let carrito = [];
let loggedUser = null;
let mapaAdmin = null; // Variable global para el mapa de Leafleta
let marcadorAdmin = null; // Variable global para el marcador en el mapa del admin
/* ---------------- Utilidades DOM ---------------- */
const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

/* ---------------- Navegación ---------------- */
function hideAll() {
  // Lista TODOS los IDs de secciones que aparecen en index.html
  const sections = [
    'landing', 'login', 'register', 'catalog', 'productDetail', 
    'cart', 'adminPanel', 'promociones', 'userHistory', 'modalProducto', 'adminOrders'
  ];
  sections.forEach(id => {
    const element = el(id);
    if (element) element.classList.add('hidden');
  });
  // Limpia sub-secciones del admin
  document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));
}
function showLanding(){ hideAll(); show('landing'); }
function showLogin(){ hideAll(); show('login'); }
function showRegister(){ hideAll(); show('register'); }
function showCatalog(){ hideAll(); renderCatalog(); show('catalog'); }
function showAdminPanel(){ hideAll(); show('adminPanel'); showAdminSection('inventario'); }

function showAdminSection(section){
  document.querySelectorAll('.adminSection').forEach(s=>s.classList.add('hidden'));
  switch(section){
    case 'inventario': show('adminInventario'); renderAdminList(); break;
    case 'proveedores': show('adminProveedores'); renderProveedores(); break;
    case 'catalogo': show('adminCatalogo'); renderCatalogAdmin(); break;
    case 'estadisticas': show('adminEstadisticas'); renderEstadisticas(); break;
    case 'pedidos': 
    // Quitamos hideAll() de aquí para que no se borre el panel
    show('adminOrders'); 
    renderEntregasLogistica(); // Esta función es la que llena la lista
    
    // Forzamos a Leaflet a recalcular el tamaño del mapa
    setTimeout(() => {
        if (mapaAdmin) {
            mapaAdmin.invalidateSize();
        } else {
            // Si no existe, lo creamos de una vez
            mapaAdmin = L.map('mapaAdmin').setView([29.0892, -110.9612], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapaAdmin);
        }
    }, 300);
    break;
}
}

/* ---------------- Admin: Gestión de Pedidos ---------------- */

// 1. Función para mostrar la lista de todos los pedidos (Solo Admin)
async function showAdminOrders() {
    hideAll();
    show('adminOrders'); 
    const container = el('adminOrdersList');
    if(!container) return;
    
    container.innerHTML = '<p style="text-align:center;">Cargando pedidos de la tienda...</p>';

    try {
        const res = await fetch(`${API_BASE}/api/sales`);
        const ventas = await res.json();

        if (ventas.length === 0) {
            container.innerHTML = '<p style="text-align:center;">No hay pedidos registrados aún.</p>';
            return;
        }

        container.innerHTML = ventas.map(p => `
            <div class="pedido-card" style="margin-bottom: 15px; padding: 20px; border-radius: 12px; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; border-left: 5px solid ${p.Estado === 'Entregado' ? '#2e7d32' : '#d4a373'};">
                <div>
                    <strong style="font-size: 1.1rem;">Orden #MS-${p.IdPedido}</strong> 
                    <span style="margin-left:10px; font-size: 0.8rem; color: #666;">Cliente: ${p.NombreC}</span>
                    <p style="margin: 5px 0 0 0; color: #888;">Estado actual: <b style="color: #333;">${p.Estado}</b></p>
                </div>
                <div style="text-align: right;">
                    <button onclick="cambiarEstadoPedido(${p.IdPedido}, '${p.Estado}')" 
                            style="background: #333; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.3s;">
                        Avanzar Estado →
                    </button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Error al cargar pedidos admin:", err);
        container.innerHTML = '<p>Error al conectar con el servidor.</p>';
    }
}

// 2. Función para actualizar el estado en la BD
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
                showAdminOrders(); // Refrescamos la lista automáticamente
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
async function login() {
  const correo = el('loginUser').value.trim().toLowerCase();
  const contraseña = el('loginPass').value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña }) 
    });
    
    const data = await res.json();
    console.log("Respuesta login:", data); // Dirá qué pasó exactamente

    if (data.ok) {
      loggedUser = data.user; 
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
  if (loggedUser.role === 'admin') {
    el('btnCart').classList.add('hidden');     
    el('btnHistorial').classList.add('hidden'); 
    show('adminPanel');                        
  } else {
    el('btnCart').classList.remove('hidden');   
    el('btnHistorial').classList.remove('hidden');
    showCatalog();                              // MOSTRAR TIENDA
  }
}

function logout(){
  localStorage.removeItem('user');
  loggedUser = null;
  el('btnCart').classList.add('hidden');
  el('btnLogout').classList.add('hidden');
  el('btnHistorial').classList.add('hidden');
  el('authButtons').classList.remove('hidden');
  hideAll();
  show('landing');
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

  
    // la URL completa: BASE + uploads + nombre_imagen
    const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
    const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
  <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; height:250px; object-fit:cover; border-radius: 8px;">
  <h3>${p.Nombre}</h3>
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
        div.className = 'cart-item-container'; // Una clase para controlarlos mejor
        
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
  if (carrito.length === 0) {
    alert('No hay productos en el carrito');
    return;
  }

  try {
    // 1. Enviamos el carrito y el ID del usuario al backend
    // Esto crea la sesión y prepara la "metadata" para el Webhook
    const response = await fetch(`${API_BASE}/api/stripe/create-checkout-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            items: carrito,
            idUsuario: loggedUser ? loggedUser.IdCliente : null,
            latitud: loggedUser.latitud || null,
            longitud: loggedUser.longitud || null
        }) 
    });

    const session = await response.json();

    // 2. Redirigir a Stripe
    const result = await stripe.redirectToCheckout({
        sessionId: session.id
    });

    if (result.error) alert(result.error.message);
    
  } catch (error) {
    console.error("Error al procesar pago:", error);
    alert("Hubo un error al conectar con el servidor de pagos.");
  }
}

function limpiarCarrito() {
    carrito = [];
    renderCarrito(); // Esto actualizará la vista a "carrito vacío"
    showToast("¡Pago procesado con éxito!");
}

/* ---------------- Proceso de Finalización y Ubicación ---------------- */
async function finalizarCompra() {
  if (carrito.length === 0) {
    alert('Tu carrito está vacío');
    return;
  }

  try {
    showToast("📍 Obteniendo tu ubicación para la entrega...");
    
    // Intentamos obtener las coordenadas del cliente
    const coords = await obtenerUbicacionCliente();
    
    // Guardamos las coordenadas temporalmente en el objeto del usuario o una variable global
    // para que el backend las reciba al crear la sesión de Stripe
    loggedUser.latitud = coords.lat;
    loggedUser.longitud = coords.lng;

    // Una vez tenemos la ubicación, procedemos al pago
    handlePayment();

  } catch (error) {
    console.warn("No se obtuvo la ubicación:", error);
    if(confirm("No pudimos obtener tu ubicación exacta. ¿Quieres continuar con la dirección de tu perfil?")) {
      handlePayment();
    }
  }
}

async function renderEntregasLogistica() {
  const container = el('adminOrdersList');
  if (!container) return;

  // Aseguramos que el contenedor se limpie antes de mostrar "Cargando"
  container.innerHTML = '<p style="padding:15px;">Cargando entregas...</p>';

  try {
    const res = await fetch(`${API_BASE}/api/sales`);
    const ventas = await res.json();

    // FILTRO MEJORADO: 
    // Mostramos pedidos que tengan coordenadas Y que no estén marcados como 'Entregado'
    // Esto incluirá los que tienen estado NULL o vacío.
    const pendientes = ventas.filter(v => 
      v.latitud !== null && 
      v.Estado !== 'Entregado'
    );

    if (pendientes.length === 0) {
      container.innerHTML = '<p style="padding:15px;">No hay entregas pendientes con GPS. ✨</p>';
      return;
    }

    container.innerHTML = pendientes.map(p => `
      <div class="card-entrega" 
           onclick="enfocarPedidoEnMapa(${p.latitud}, ${p.longitud}, '${p.NombreC || 'Cliente'}')" 
           style="cursor:pointer; padding:15px; border-bottom:1px solid #eee; background: #fff; margin-bottom: 8px; border-radius: 8px; border-left: 5px solid var(--accent); box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <strong style="color: #333;">Orden #MS-${p.IdPedido}</strong><br>
        <small style="color: #666;">Cliente: ${p.NombreC || 'Sin nombre'}</small><br>
        <span style="color: var(--accent); font-weight: bold; font-size: 0.85rem;">
            ${p.Estado || 'Pendiente de revisión'} 📍
        </span>
      </div>
    `).join('');

  } catch (err) {
    console.error("Error cargando logística:", err);
    container.innerHTML = '<p style="padding:15px;">Error al cargar datos del servidor.</p>';
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

  const modalBody = el('modalBody');
  const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
  const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

  modalBody.innerHTML = `
    <div class="modal-product-layout">
      <button class="close-modal" onclick="cerrarModal()">×</button>
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; border-radius:12px; margin-bottom:15px;">
      
      <div class="product-info">
        <h2 style="margin:0;">${p.Nombre}</h2>
        <div style="margin: 5px 0;">${renderEstrellas(p.Calificacion || 0)}</div>
        <p style="font-size:1.2rem; color:var(--accent); font-weight:bold;">$${p.Precio}</p>
        <p style="font-size:0.9rem; color:var(--muted);">Stock disponible: ${p.Stock}</p>
      </div>
      
      <div class="selection-group">
        <label>Talla:</label>
        <select id="modalTalla" class="modern-select">
          <option value="M">Talla M</option>
          <option value="L">Talla L</option>
        </select>
        
        <label>Cantidad:</label>
        <input type="number" id="modalCantidad" value="1" min="1" max="${p.Stock}" class="modern-input">
      </div>
      
      <button class="btn-add-modal" onclick="addToCartFromModal(${p.IdProducto})">
        Agregar al carrito
      </button>
    </div>
  `;

  show('modalProducto');
}


function addToCartFromModal(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;

  // Se capturanlos valores del DOM antes de procesar
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

  // Creamos el objeto con la personalización
  const item = {
    ...p,
    Cantidad: cantidad,
    TallaSeleccionada: talla // Guardamos la talla elegida por el cliente
  };

  // Lógica para añadir al carrito
  const existente = carrito.find(i => i.IdProducto === id && i.TallaSeleccionada === talla);
  if (existente) {
    existente.Cantidad += cantidad;
  } else {
    carrito.push(item);
  }

  p.Stock -= cantidad; // Reducimos el stock
  
  cerrarModal(); // Se cierra la ventana
  showToast(`${p.Nombre} (${talla}) agregado al carrito`);
  renderCarrito(); // Actualizacion de la vista del carrito
}

function cerrarModal() {
    document.getElementById('modalProducto').classList.add('hidden');
}
/* ---------------- Admin: Inventario ---------------- */
const formProducto = el('formProducto');
let editingId = null;

formProducto.addEventListener('submit', async e => {
  e.preventDefault();

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
  formData.append('EnPromocion', EnPromocion);
  formData.append('PrecioOferta', PrecioOferta);
  formData.append('FechaFinPromo', FechaFinPromo);
  
  // Solo agrega la imagen si el usuario seleccionó una nueva
  if (ImagenFile) {
      formData.append('Imagen', ImagenFile);
  }

  try {
    if (editingId) {
      // Editar producto existente
      await fetch(`${API_BASE}/api/products/${editingId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      // Crear nuevo producto
      await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        body: formData    
      });
    }

  editingId = null;
    alert(editingId ? 'Producto actualizado' : 'Producto agregado con éxito');
    formProducto.reset();
    await cargarProductos(); // recarga la lista de productos
    showAdminPanel(); // Se forza, que se quede en el panel
    showAdminSection('inventario');
  } catch (err) {
    console.error(err);
    alert('Error al guardar producto');
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
  if (!confirm('¿Eliminar producto?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json(); // Se lee la respuesta primero

    if (res.ok && data.ok) { 
      // Si todo salió bien en el servidor
      alert('Producto eliminado correctamente');
      
      await cargarProductos(); // Refresh de los datos
      
      // Mantenemos la vista donde estamos
      showAdminPanel();
      showAdminSection('inventario');
    } else {
      // Si el servidor respondió pero hubo un error (ej. producto con ventas)
      alert('Error al eliminar producto: ' + (data.message || 'Desconocido'));
    }
  } catch (err) {
    alert('Error de conexión al eliminar producto');
    console.error(err);
  }
}


/* ---------------- Admin: Proveedores ---------------- */
const formProveedor=el('formProveedor');
formProveedor.addEventListener('submit', async e=>{
  e.preventDefault();
  const prov={
    Nombre: el('provNombre').value,
    Telefono: el('provTelefono').value,
    Correo: el('provEmail').value,
    Direccion: el('provDireccion').value
  };
  try {
    await fetch(`${API_BASE}/api/providers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prov)
    });
    formProveedor.reset();
    renderProveedores();
  } catch (err) {
    alert('Error al guardar proveedor');
  }
});

async function renderProveedores(){
  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    const data = await res.json();
    if(!data.ok){
      alert('Error al cargar proveedores');
      return;
    }
    proveedores = data.providers;
    const container = el('listaProveedores');
    container.innerHTML = '';
    proveedores.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = `<span>${p.Nombre} | ${p.Telefono || ''} | ${p.Correo || ''} | ${p.Direccion || ''}</span>
      <button onclick="deleteProveedor(${p.IdProveedor})">Eliminar</button>`;
      container.appendChild(div);
    });
  } catch (err) {
    alert('Error al cargar proveedores');
    console.error(err);
  }
}
async function deleteProveedor(id){
  if(!confirm('¿Eliminar proveedor?')) return;
  try {
    await fetch(`${API_BASE}/providers/${id}`, { method: 'DELETE' });
    renderProveedores();
  } catch (err) {
    alert('Error al eliminar proveedor');
  }
}
/**
 * Renderiza la lista de ventas filtradas por fecha
 */
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
    // 1. Cargar el Producto Más Vendido 
    const resEstrella = await fetch(`${API_BASE}/api/reports/top-product`);
    const dataEstrella = await resEstrella.json();

    // Elementos donde se mostrará (Catálogo y Admin)
    const contCliente = el('infoEstrellaCliente');
    const contAdmin = el('productoEstrellaContenedor');

    if (dataEstrella.ok && dataEstrella.producto) {
      // Limpieza de ruta de imagen 
      const imgNombre = dataEstrella.producto.Imagen ? dataEstrella.producto.Imagen.replace('uploads/', '') : '';
      const urlImg = `${API_BASE}/uploads/${imgNombre}`;

      const htmlContent = `
        <img src="${urlImg}" style="width:100px; height:100px; object-fit:cover; border-radius:10px;" onerror="this.src='https://via.placeholder.com/100?text=Sin+Foto'">
        <div>
          <strong style="font-size:1.2rem; color:var(--primary);">${dataEstrella.producto.prenda}</strong><br>
          <span>🔥 Vendidos: <b>${dataEstrella.producto.unidades_vendidas}</b> unidades</span><br>
          <span style="color:green; font-weight:bold;">💰 Generado: $${dataEstrella.producto.total_generado}</span>
        </div>
      `;
      if(contCliente) contCliente.innerHTML = htmlContent;
      if(contAdmin) contAdmin.innerHTML = htmlContent;
    }

    // 2. Cargar Resumen de Ventas
    const resVentas = await fetch(`${API_BASE}/api/reports/daily-summary`);
    const dataVentas = await resVentas.json();

    if (dataVentas.ok) {
        el('dashIngresosPeriodo').textContent = `$${dataVentas.datos.ingresos_sucios || 0}`;
        el('dashPedidosPeriodo').textContent = dataVentas.datos.total_pedidos || 0;
    }

    // 3. Cargar historial en el panel admin
    const resHistorial = await fetch(`${API_BASE}/api/sales`);
    const dataHistorial = await resHistorial.json();
    const listaH = el('listaVentasHistorial');
    listaH.innerHTML = '';
    
    // Mostramos los últimos 5
    const ventas = Array.isArray(dataHistorial) ? dataHistorial : (dataHistorial.pedidos || []);
    ventas.slice(0, 5).forEach(v => {
        const div = document.createElement('div');
        div.className = 'pago-item';
        div.style = "padding:10px; border-bottom:1px solid #eee; display:flex; justify-content:space-between;";
        div.innerHTML = `<span><b>${v.NombreC || 'Cliente'}</b></span> <span>$${v.Total}</span>`;
        listaH.appendChild(div);
    });

  } catch (err) {
    console.error("Error en Dashboard:", err);
  }
}

/*------------------ Admin: Pagos realizados --------------------*/
async function renderPagos() {
  const container = el('pagosLista');
  const totalEl = el('totalPagos');
  container.innerHTML = '';
  totalEl.textContent = 'Total de pagos: $0';

  try {
    const res = await fetch(`${API_BASE}/api/sales`);
    const pagos = await res.json(); 

    if(!Array.isArray(pagos) || pagos.length === 0) {
      container.innerHTML = '<p>No hay pagos registrados</p>';
      return;
    }

    let total = 0;
    pagos.forEach(p => {
      total += parseFloat(p.Total || 0); 
      
      const div = document.createElement('div');
      div.className = 'pago-item';
      div.textContent = `${new Date(p.Fecha).toLocaleDateString()} - Cliente: ${p.NombreC || 'N/A'} - Total: $${p.Total}`;
      
      container.appendChild(div);
    });

    totalEl.textContent = `Total de pagos: $${total.toFixed(2)}`;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error al cargar los pagos</p>';
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
    
    // Si el backend responde { ok: true, products: [...] }
    if (data.ok) {
      productos = data.products;
    } else {
      productos = data; 
    }
    
    // 1. Vista Cliente: Catálogo general
    renderCatalog();      
    
    // 2. Vista Cliente: Sección de Ofertas Relámpago (Nueva funcionalidad)
    // Esta función filtrará automáticamente los productos con EnPromocion == 1
    if (typeof renderPromociones === 'function') {
        renderPromociones();
    }
    
    // 3. Vistas Admin
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
      // LIMPIEZA ROBUSTA: Quitamos 'uploads/' y cualquier '/' inicial para evitar errores
      const imgNombre = data.producto.Imagen ? data.producto.Imagen.replace(/^(\/)?uploads\//, '') : '';
      const urlImg = `${API_BASE}/uploads/${imgNombre}`;

      const html = `
        <img src="${urlImg}" 
             style="width:100px; height:100px; object-fit:cover; border-radius:10px;" 
             onerror="this.src='https://via.placeholder.com/100?text=Top'">
        <div>
          <strong style="font-size:1.2rem; display:block; margin-bottom:4px;">${data.producto.prenda}</strong>
          <span style="font-size:0.9rem; color:#555;"> Unidades vendidas: <b>${data.producto.unidades_vendidas}</b></span><br>
          <span style="color:green; font-weight:bold; font-size:1.1rem;"> Ganancia: $${data.producto.total_generado}</span>
        </div>
      `;
      
      if(contCliente) contCliente.innerHTML = html;
      if(contAdmin) contAdmin.innerHTML = html;
    }
  } catch (err) { 
    console.error("Error cargando producto estrella:", err); 
  }
}
async function filtrarVentas() {
  const fecha = el('filtroFechaVenta').value;
  if (!fecha) return alert("Por favor, selecciona una fecha primero.");

  try {
    const res = await fetch(`${API_BASE}/api/reports/sales-by-date?fecha=${fecha}`);
    const data = await res.json();
    
    if (data.ok) {
      // Actualizamos los números en los cuadros del Admin
    el('dashIngresosPeriodo').textContent = `$${data.ingresos || 0}`;
el('dashPedidosPeriodo').textContent = data.pedidos || 0;
      
      // Si el backend manda la lista de ventas de ese día, se renderiza aquí
      renderListaVentas(data.ventasDetalle || []);
    }
  } catch (err) {
    console.error("Error filtrando ventas:", err);
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
/* ---------------- Init ---------------- */
async function init() {
  await cargarProductos();
  await cargarMasVendido();
  await renderBestSellers();
  renderEstadisticas();
  showLanding();
  console.log("Aplicación inicializada correctamente.");
}

// Llama a esta única función cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', init);

async function renderBestSellers() {
  const container = document.getElementById('bestSellersGrid');
  if (!container) return;

  try {
    const topProducts = [...productos]
      .sort((a, b) => b.Ventas - a.Ventas) // Ordenar de mayor a menor
      .slice(0, 4); // Tomar solo los primeros 4

    container.innerHTML = '';

    topProducts.forEach(p => {
      const card = document.createElement('article');
      card.className = 'producto';
      
      // Usamos la misma lógica de imagen que en el catálogo
      const urlFinal = `${API_BASE}/uploads/${p.Imagen.replace('uploads/', '')}`;

      card.innerHTML = `
        <img src="${urlFinal}" alt="${p.Nombre}" onerror="this.src='https://via.placeholder.com/200'">
        <h3>${p.Nombre}</h3>
        <p>$${p.Precio}</p>
        <button onclick="abrirModalProducto(${p.IdProducto})">Ver detalles</button>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    console.error("Error al renderizar los más vendidos:", err);
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
    // Se filtran los productos que tienen el flag de promoción
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
    if (!loggedUser) return;
    
    hideAll();
    show('userHistory');
    const container = el('historyList');
    container.innerHTML = '<p>Cargando tus pedidos...</p>';

    try {
        const res = await fetch(`${API_BASE}/api/sales`);
        const todasLasVentas = await res.json();

        // Filtramos para que el cliente solo vea LO SUYO
        const misPedidos = todasLasVentas.filter(v => v.IdCliente === loggedUser.IdCliente);

        if (misPedidos.length === 0) {
            container.innerHTML = '<p>Aún no has realizado ninguna compra. ¡Anímate!</p>';
            return;
        } 

container.innerHTML = misPedidos.map(p => `
    <div class="pedido-card" style="margin-bottom: 20px; padding: 20px; border-radius: 15px; background: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border-left: 5px solid #d4a373;">
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <span style="color: #888; font-size: 0.8rem; font-weight: bold; text-transform: uppercase;">Orden</span>
                <h3 style="margin: 0; color: #333;">#MS-${p.IdPedido}</h3> 
                <small style="color: #666;">${new Date(p.Fecha).toLocaleDateString()} • ${new Date(p.Fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
            </div>
            <div style="text-align: right;">
                <span style="display: inline-block; padding: 4px 12px; border-radius: 20px; background: #e8f5e9; color: #2e7d32; font-size: 0.75rem; font-weight: bold; margin-bottom: 8px;">
                    ${p.Estado} 
                </span>
                <div style="font-size: 1.2rem; font-weight: 800; color: #d4a373;">$${parseFloat(p.Total).toFixed(2)}</div>
            </div>
        </div>
        <div style="margin-top: 15px; padding-top: 10px; border-top: 1px dashed #eee;">
             <button onclick="verDetallePedido(${p.IdPedido})" style="background: none; border: none; color: #d4a373; font-weight: bold; cursor: pointer; padding: 0; font-family: inherit;">
                Ver detalles del pedido →
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
        // 1. Llamada a la ruta que definimos en Express
        const response = await fetch(`${API_BASE}/api/sales/detalle/${idPedido}`)
        const detalles = await response.json();
        // Lógica para determinar el progreso según el estado
         const estados = ['Pagado', 'Preparando', 'En Camino', 'Entregado'];
        const estadoActual = detalles[0].Estado || 'Pagado';
        const pasoActivo = estados.indexOf(estadoActual);

const stepperHTML = `
    <div style="display: flex; justify-content: space-between; margin: 20px 0; position: relative;">
        <div style="position: absolute; top: 15px; left: 5%; width: 90%; height: 2px; background: #e0e0e0; z-index: 1;"></div>
        <div style="position: absolute; top: 15px; left: 5%; width: ${(pasoActivo / (estados.length - 1)) * 90}%; height: 2px; background: #d4a373; z-index: 2; transition: width 0.5s ease;"></div>
        
        ${estados.map((est, index) => `
            <div style="z-index: 3; text-align: center; width: 60px;">
                <div style="width: 30px; height: 30px; border-radius: 50%; background: ${index <= pasoActivo ? '#d4a373' : '#fff'}; border: 2px solid #d4a373; margin: 0 auto; display: flex; align-items: center; justify-content: center; color: ${index <= pasoActivo ? '#fff' : '#d4a373'}; font-size: 12px; font-weight: bold; transition: 0.3s;">
                    ${index < pasoActivo ? '✓' : index + 1}
                </div>
                <p style="margin-top: 5px; font-size: 0.7rem; color: ${index <= pasoActivo ? '#333' : '#aaa'}; font-weight: ${index === pasoActivo ? 'bold' : 'normal'}">${est}</p>
            </div>
        `).join('')}
    </div>
`;

        if (!detalles || detalles.length === 0) {
            alert("No se encontraron productos para este pedido.");
            return;
        }

        // 2. Construir el HTML de los productos
        const detalleHTML = detalles.map(item => {
            // Limpieza de imagen 
            const nombreImg = item.Imagen ? item.Imagen.replace(/^(\/)?uploads\//, '') : '';
            const urlFinal = `${API_BASE}/uploads/${nombreImg}`;
            
            return `
                <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <img src="${urlFinal}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" 
                         onerror="this.src='https://via.placeholder.com/60?text=Prod'">
                    <div style="flex: 1;">
                        <h4 style="margin: 0; font-size: 1rem; color: #333;">${item.NombreProducto}</h4>
                        <p style="margin: 0; color: #666; font-size: 0.85rem;">Cantidad: ${item.Cantidad}</p>
                    </div>
                    <span style="font-weight: bold; color: #d4a373;">$${(item.Precio * item.Cantidad).toFixed(2)}</span>
                </div>
            `;
        }).join('');

        // 3. Inyectar en el modal
        const modalBody = el('modalBody');
        modalBody.innerHTML = `
            <button class="close-modal" onclick="cerrarModal()">×</button>
            <h2 style="color: #333; margin-top: 0;">Resumen de Compra</h2>
            <p style="color: #888; font-size: 0.9rem; margin-bottom: 15px;">Orden: #MS-${idPedido}</p>
              ${stepperHTML}
            <div style="max-height: 350px; overflow-y: auto; padding-right: 5px;">
                ${detalleHTML}
            </div>
            
            <div style="margin-top: 20px; text-align: right; border-top: 2px solid #d4a373; padding-top: 10px;">
                <span style="color: #666;">Total Pagado:</span>
                <div style="font-size: 1.6rem; font-weight: 800; color: #333;">$${parseFloat(detalles[0].TotalPedido || 0).toFixed(2)}</div>
            </div>
        `;

        // 4. Mostrar el modal 
        show('modalProducto'); 
        
    } catch (err) {
        console.error("Error al obtener detalles:", err);
        alert("Hubo un error al conectar con el servidor.");
    }
}