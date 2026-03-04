/* ---------------- Configuración ---------------- */
const API_BASE = 'http://localhost:3000';

/* ---------------- Datos locales ---------------- */
let productos = [];
let proveedores = [];
let ventas = [];
let carrito = [];
let loggedUser = null;

/* ---------------- Utilidades DOM ---------------- */
const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

/* ---------------- Navegación ---------------- */
function hideAll(){
  ['landing','login','register','catalog','productDetail','adminPanel','cart'].forEach(id=>hide(id));
  document.querySelectorAll('.adminSection').forEach(s=>s.classList.add('hidden'));
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
    case 'corte': show('adminCorte'); renderCorte(); break;
    case 'estadisticas': show('adminEstadisticas'); renderEstadisticas(); break;
    case 'pagos': show('adminPagos'); renderPagos(); 
    break;
  }
}

/* ---------------- Autenticación ---------------- */
async function login() {
  const Correo = el('loginUser').value.trim(); // Nombre consistente
  const Contraseña = el('loginPass').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo, Contraseña }) // Enviamos con Mayúscula
    });
    
    const data = await res.json();
    console.log("Respuesta login:", data); // Esto te dirá qué pasó exactamente

    if (data.ok) {
      // IMPORTANTE: Guardamos el usuario que viene del servidor
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

function afterLogin(){
  el('loginMsg').textContent='';
  el('btnLogout').classList.remove('hidden');
  el('btnInicio').classList.add('hidden');

  if(loggedUser.role==='admin'){
    el('btnPanel').classList.remove('hidden');
    el('btnCart').classList.add('hidden');
    showAdminPanel();
  } else {
    el('btnPanel').classList.add('hidden');
    el('btnCart').classList.remove('hidden');
    showCatalog();
  }
}

function logout(){
  loggedUser = null;
  el('btnCart').classList.add('hidden');
  el('btnLogout').classList.add('hidden');
  el('btnPanel').classList.add('hidden');
  el('btnInicio').classList.remove('hidden');
  hideAll(); show('landing');
}

/* ---------------- Registro ---------------- */
async function register() {
  const NombreC = el('regUser').value.trim();
  const Correo = el('regEmail').value.trim();
  const Contraseña = el('regPass').value;

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

    // LIMPIEZA DE RUTA: 
    // Si p.Imagen ya trae "uploads/", lo quitamos para no repetirlo.
    // Luego construimos la URL completa: BASE + uploads + nombre_imagen
    const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
    const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
      <img src="${urlFinal}" 
           alt="${p.Nombre}" 
           style="width:100%; height:200px; object-fit:cover; border-radius: 8px;"
           onerror="this.src='https://via.placeholder.com/400x300?text=Imagen+no+disponible'">
      
      <h3>${p.Nombre}</h3>
      <p class="muted">Color: ${p.Color || 'N/A'}</p>
      <p><strong>$${p.Precio}</strong></p>
      <p>Stock: ${p.Stock}</p>
      
      <div class="meta">
        ${loggedUser?.role === 'cliente' ? `
          <input id="cantidad_${p.IdProducto}" type="number" min="1" max="${p.Stock}" 
                 value="${p.Stock > 0 ? 1 : 0}" style="width:60px">
          <button ${p.Stock === 0 ? 'class="agotado" disabled' : ''} 
                  onclick="addToCart(${p.IdProducto})">
            ${p.Stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        ` : ''}
      </div>`;
      
    container.appendChild(card);
  });
}

/* ---------------- Carrito ---------------- */
function mostrarCarrito(){ hideAll(); show('cart'); renderCarrito(); }
function renderCarrito(){
  const container = el('cartContents'); const footer=el('cartFooter'); container.innerHTML=''; footer.innerHTML='';
  if(carrito.length===0){ container.innerHTML='<p>Tu carrito está vacío</p>'; return; }
  let total=0;
  carrito.forEach((item,index)=>{
    const subtotal=item.Precio*item.Cantidad; total+=subtotal;
    const div=document.createElement('div');
    div.className='cart-item';
    div.innerHTML=`
      <span><strong>${item.Nombre}</strong> - $${item.Precio}</span>
      <input type="number" min="1" value="${item.Cantidad}" style="width:50px" onchange="updateCantidad(${index},this.value)">
      <span>Subtotal: $${subtotal}</span>
      <button onclick="eliminarDelCarrito(${index})">Eliminar</button>`;
    container.appendChild(div);
  });
  footer.innerHTML=`<p><strong>Total: $${total}</strong></p>
    <button onclick="finalizarCompra()">Finalizar Compra</button>`;
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

async function finalizarCompra() {
  if (carrito.length === 0) {
    alert('No hay productos en el carrito');
    return;
  }

  // 1. Objeto para TU base de datos (simplificado para el backend)
  const ventaPendiente = {
      IdCliente: loggedUser?.IdCliente || null,
      productos: carrito.map(i => ({ 
        IdProducto: i.IdProducto, 
        Cantidad: i.Cantidad 
      })),
      Estado: 'Pagado'
  };

  localStorage.setItem('venta_pendiente', JSON.stringify(ventaPendiente));

  try {
    // 2. Solicitamos la preferencia enviando lo que Mercado Pago necesita ver
    const res = await fetch(`${API_BASE}/api/payments/create_preference`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        // IMPORTANTE: Aquí enviamos los datos para la pantalla de pago de MP
        items: carrito.map(i => ({
          title: i.Nombre,
          unit_price: Number(parseFloat(i.Precio).toFixed(2)),
          quantity: parseInt(i.Cantidad),
          currency_id: 'MXN'
        }))
      })
    });

    const data = await res.json();

    if (data.id) {
      // 3. Inicializar Mercado Pago
      const mp = new MercadoPago('APP_USR-795ce2fa-78bf-4003-89af-d1ca0188b4b3', {
        locale: 'es-MX'
      }); 

      mp.checkout({
        preference: { id: data.id },
        autoOpen: true 
      });
    } else {
      alert('Error al generar la pasarela de pago');
    }
  } catch (err) {
    alert('Error de conexión con el servidor de pagos');
    console.error(err);
  }
}


/* ---------------- Admin: Inventario ---------------- */
const formProducto = el('formProducto');
let editingId = null;

formProducto.addEventListener('submit', async e=>{
  e.preventDefault();

  const Nombre = el('nombre').value.trim();
  const Talla = el('talla').value.trim();
  const Categoria = el('categoria').value.trim();
  const Stock = parseInt(el('stock').value);
  const Precio = parseFloat(el('precio').value);
  const Color = el('color').value.trim();
  const Imagen = el('imagen').files[0];

  //const producto = { Nombre, Talla, Categoria, Stock, Precio, Color, Imagen };
  
  const formData = new FormData();
  formData.append('Nombre', Nombre);
  formData.append('Talla', Talla);
  formData.append('Categoria', Categoria);
  formData.append('Stock', Stock);
  formData.append('Precio', Precio);
  formData.append('Color', Color);
  if (Imagen) formData.append('Imagen', Imagen);

  try {
    if (editingId) {
      // Editar producto existente
      await fetch(`${API_BASE}/api/products/${editingId}`, {
        method: 'PUT',
        body: formData
        //credentials: 'include'
      });
    } else {
      // Crear nuevo producto
      await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        body: formData
        //credentials: 'include'
      });
    }

  editingId = null;
    alert(editingId ? 'Producto actualizado' : 'Producto agregado con éxito');
    formProducto.reset();
    await cargarProductos(); // recarga la lista de productos
    showAdminPanel(); // <-- FORZAMOS que se quede en el panel
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
  el('imagen').value = p.Imagen; // si usas file, este valor no se puede asignar directamente
  editingId = id;
}

async function deleteProducto(id) {
  if (!confirm('¿Eliminar producto?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, { method: 'DELETE' });
    const data = await res.json(); // Leemos la respuesta primero

    if (res.ok && data.ok) { 
      // Si todo salió bien en el servidor
      alert('Producto eliminado correctamente');
      
      await cargarProductos(); // Refrescamos los datos
      
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

function renderCatalogAdmin(){
  const container = el('catalogAdmin'); 
  if (!container) return;
  container.innerHTML = '';
  
  productos.forEach(p => {
    const card = document.createElement('div'); 
    card.className = 'producto';

    // APLICAMOS LA MISMA LIMPIEZA QUE EN EL CATÁLOGO DE CLIENTE
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
    // 1. Cargar el Producto Más Vendido (Top Product)
    const resEstrella = await fetch(`${API_BASE}/api/reports/top-product`);
    const dataEstrella = await resEstrella.json();

    // Elementos donde se mostrará (Catálogo y Admin)
    const contCliente = el('infoEstrellaCliente');
    const contAdmin = el('productoEstrellaContenedor');

    if (dataEstrella.ok && dataEstrella.producto) {
      // Limpieza de ruta de imagen (la misma lógica que usamos antes)
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
      total += p.total;
      const div = document.createElement('div');
      div.className = 'pago-item';
      div.textContent = `${new Date(p.fecha).toLocaleDateString()} - Usuario: ${p.UsuarioId} - Total: $${p.Total}`;
      container.appendChild(div);
    });

    totalEl.textContent = `Total de pagos: $${total}`;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error al cargar los pagos</p>';
  }
}

/* ---------------- Toast ---------------- */
function showToast(msg){ const t=el('cartMessage'); t.textContent=msg; t.style.display='block'; setTimeout(()=>t.style.display='none',2000); }

/* ---------------- Init ---------------- */

async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    
    // Si el backend responde { ok: true, products: [...] }
    if (data.ok) {
      productos = data.products;
    } else {
      // Si el backend responde directamente el array
      productos = data; 
    }
    
    renderCatalog();      // Para la vista de cliente
    renderAdminList();    // Para la lista de inventario
    renderCatalogAdmin(); // Para la vista de catálogo del admin
    
    console.log("Productos cargados:", productos);
  } catch (err) {
    console.error("Error al cargar productos:", err);
  }
}
cargarProductos();

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
          <span style="font-size:0.9rem; color:#555;">🔥 Unidades vendidas: <b>${data.producto.unidades_vendidas}</b></span><br>
          <span style="color:green; font-weight:bold; font-size:1.1rem;">💰 Ganancia: $${data.producto.total_generado}</span>
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
      el('totalIngresosVal').textContent = `$${data.ingresos || 0}`;
      el('totalPedidosVal').textContent = data.pedidos || 0;
      
      // Si el backend te manda la lista de ventas de ese día, puedes renderizarla aquí
      renderListaVentas(data.ventasDetalle || []);
    }
  } catch (err) {
    console.error("Error filtrando ventas:", err);
  }
}


window.addEventListener('load', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status'); 

    if (status === 'approved') {
        const ventaParaGuardar = JSON.parse(localStorage.getItem('venta_pendiente'));

        if (ventaParaGuardar) {
            // Mostramos un mensaje de "Procesando" para que el usuario no cierre la página
            showToast("Registrando tu compra, por favor espera...");
            
            try {
                const res = await fetch(`${API_BASE}/api/sales`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(ventaParaGuardar)
                });

                const data = await res.json();

                if (res.ok && data.ok) {
                    localStorage.removeItem('venta_pendiente'); 
                    carrito = []; // Limpiar carrito local
                    renderCarrito();
                    alert(`¡Pago exitoso! Pedido #${data.IdPedido} registrado.`);
                    
                    // Limpiar la URL para que no se registre dos veces si recarga
                    window.history.replaceState({}, document.title, window.location.pathname);
                    showCatalog();
                } else {
                    alert("Error al registrar: " + data.message);
                }
            } catch (err) {
                console.error("Error post-pago:", err);
                alert("Hubo un problema al registrar tu pedido en nuestra base de datos.");
            }
        }
    }
});
