/* ---------------- Configuración ---------------- */
// const API_BASE = 'https://desarrollosoftware.onrender.com'; // Trabajar con la api en la nube
const API_BASE = 'http://localhost:3000';
const stripe = Stripe('pk_test_51T9FMCAuz5OrtKFT0wnEX0niDHjIfkaXG6FnIER897RI9Xg30mYG14QJHc4S8B8DBu2UgQnpnwTjhxJqPyuMu9mO00yFEC18Tn');
/* ---------------- Datos locales ---------------- */
let productos = [];
let proveedores = [];
let ventas = [];
let carrito = [];
let loggedUser = null;

/* ---------------- Helpers de variantes ---------------- */
function getDefaultVariant(producto) {
  return producto?.Variantes && producto.Variantes.length > 0 ? producto.Variantes[0] : null;
}

function findVariantById(idVariante) {
  for (const p of productos) {
    const v = p.Variantes?.find(vr => vr.IdVariante === idVariante);
    if (v) return { producto: p, variante: v };
  }
  return null;
}

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
    case 'estadisticas': show('adminEstadisticas'); renderEstadisticas(); break;
    case 'pagos': show('adminPagos'); renderPagos(); 
    break;
  }
}

/* ---------------- Autenticación ---------------- */
async function login() {
  const correo = el('loginUser').value.trim().toLowerCase();// Nombre consistente
  const contraseña = el('loginPass').value;

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña }) // Enviamos con Mayúscula
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

function afterLogin() {
  el('loginMsg').textContent = '';
  el('btnLogout').classList.remove('hidden');
  el('btnInicio').classList.add('hidden');

  // Ajustado para usar la propiedad 'role' que envía tu backend
  if (loggedUser.role === 'admin') {
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
        container.innerHTML = '<p>Tu carrito está vacío.</p>';
        if(totalDisplay) totalDisplay.innerText = '$0.00';
        if(btnPagar) btnPagar.classList.add('hidden');
        return;
    }
    
    let total = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.Precio * item.Cantidad;
        total += subtotal;
        
        const div = document.createElement('div');
        const labelVar = [item.Talla, item.Color].filter(Boolean).join(' / ');
        const imgSrc = item.Imagen ? `${API_BASE}/uploads/${item.Imagen.replace('uploads/', '').replace('/uploads/', '')}` : 'placeholder.jpg';

        // Usamos una estructura simple para que el CSS viejo la detecte bien
        div.innerHTML = `
            <div class="producto-item">
                <img src="${imgSrc}" alt="${item.Nombre}" style="width: 80px;">
                <h3>${item.Nombre}</h3>
                <p>${labelVar || ''}</p>
                <p>$${item.Precio} x ${item.Cantidad}</p>
                <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
            </div>
            <p>Subtotal: $${subtotal.toFixed(2)}</p>
            <hr>
        `;
        container.appendChild(div);
    });
    
    if(totalDisplay) totalDisplay.innerText = `$${total.toFixed(2)}`;
    if(btnPagar) btnPagar.classList.remove('hidden');
}

function addToCart(id){
  if(!loggedUser){ alert('Debes iniciar sesión'); return; }
  const p=productos.find(x=>x.IdProducto===id);
  const variante = getDefaultVariant(p);
  const qty=parseInt(el(`cantidad_${id}`)?.value || 1);
  if(!variante){ alert('Sin variantes disponibles'); return; }
  if(variante.Stock<qty){ alert('Stock insuficiente'); return; }
  const item=carrito.find(i=>i.IdVariante===variante.IdVariante);
  if(item) item.Cantidad+=qty; 
  else carrito.push({
    IdProducto: p.IdProducto,
    IdVariante: variante.IdVariante,
    Nombre: p.Nombre,
    Imagen: p.Imagen,
    Talla: variante.Talla,
    Color: variante.Color,
    Precio: variante.Precio,
    Cantidad: qty
  });
  variante.Stock-=qty; renderCatalog(); renderCarrito();
  showToast(`${p.Nombre} agregado (${qty})`);
}

function updateCantidad(index,nuevaCantidad){
  nuevaCantidad=parseInt(nuevaCantidad); if(isNaN(nuevaCantidad)||nuevaCantidad<1) return;
  const item=carrito[index];
  const found = findVariantById(item.IdVariante);
  const diff=nuevaCantidad-item.Cantidad;
  if(diff>0 && found?.variante?.Stock < diff){ alert('No hay suficiente stock'); renderCarrito(); return; }
  item.Cantidad=nuevaCantidad; 
  if(found?.variante) found.variante.Stock -= diff;
  renderCatalog(); renderCarrito();
}

function eliminarDelCarrito(index){
  const item=carrito[index];
  const found = findVariantById(item.IdVariante);
  if(found?.variante) found.variante.Stock += item.Cantidad;
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
            idUsuario: loggedUser ? loggedUser.IdCliente : null 
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
// En tu script.js, añade esta función de limpieza
function limpiarCarrito() {
    carrito = [];
    renderCarrito(); // Esto actualizará la vista a "carrito vacío"
    showToast("¡Pago procesado con éxito!");
}


function abrirModalProducto(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;

  const variantes = p.Variantes || [];
  const modalBody = el('modalBody');
  const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
  const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

  if (variantes.length === 0) {
    modalBody.innerHTML = `
      <div class="modal-product-layout">
        <button class="close-modal" onclick="cerrarModal()">×</button>
        <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; border-radius:12px; margin-bottom:15px;">
        <div class="product-info">
          <h2 style="margin:0;">${p.Nombre}</h2>
          <p style="font-size:0.9rem; color:var(--muted);">Sin variantes disponibles</p>
        </div>
      </div>
    `;
    show('modalProducto');
    return;
  }

  const options = variantes.map(v => {
    const talla = v.Talla || 'Unica';
    const color = v.Color || '';
    const label = color ? `${talla} / ${color}` : `${talla}`;
    return `<option value="${v.IdVariante}" data-precio="${v.Precio}" data-stock="${v.Stock}" data-talla="${v.Talla || ''}" data-color="${v.Color || ''}">${label} - $${v.Precio}</option>`;
  }).join('');

  modalBody.innerHTML = `
    <div class="modal-product-layout">
      <button class="close-modal" onclick="cerrarModal()">×</button>
      <img src="${urlFinal}" alt="${p.Nombre}" style="width:100%; border-radius:12px; margin-bottom:15px;">
      
      <div class="product-info">
        <h2 style="margin:0;">${p.Nombre}</h2>
        <div style="margin: 5px 0;">${renderEstrellas(p.Calificacion || 0)}</div>
        <p style="font-size:1.2rem; color:var(--accent); font-weight:bold;">Precio: <span id="modalPrecio">$${variantes[0].Precio}</span></p>
        <p style="font-size:0.9rem; color:var(--muted);">Stock disponible: <span id="modalStock">${variantes[0].Stock}</span></p>
      </div>
      
      <div class="selection-group">
        <label>Variante:</label>
        <select id="modalVariante" class="modern-select" onchange="updateModalVariantInfo()">
          ${options}
        </select>
        
        <label>Cantidad:</label>
        <input type="number" id="modalCantidad" value="1" min="1" max="${variantes[0].Stock}" class="modern-input">
      </div>
      
      <button class="btn-add-modal" onclick="addToCartFromModal(${p.IdProducto})">
        Agregar al carrito
      </button>
    </div>
  `;

  show('modalProducto');
}

function updateModalVariantInfo() {
  const select = el('modalVariante');
  if (!select) return;
  const opt = select.options[select.selectedIndex];
  const precio = parseFloat(opt.dataset.precio || '0');
  const stock = parseInt(opt.dataset.stock || '0');

  const precioEl = el('modalPrecio');
  const stockEl = el('modalStock');
  if (precioEl) precioEl.textContent = `$$`;
  if (stockEl) stockEl.textContent = `${stock}`;

  const qty = el('modalCantidad');
  if (qty) {
    qty.max = stock;
    if (parseInt(qty.value) > stock) qty.value = stock || 1;
  }
}

function addToCartFromModal(id) {
  const p = productos.find(x => x.IdProducto === id);
  if (!p) return;

  const select = el('modalVariante');
  if (!select) return;
  const opt = select.options[select.selectedIndex];
  const idVariante = parseInt(select.value);
  const precio = parseFloat(opt.dataset.precio || '0');
  const stock = parseInt(opt.dataset.stock || '0');
  const talla = opt.dataset.talla || null;
  const color = opt.dataset.color || null;

  const cantidad = parseInt(el('modalCantidad').value);

  if (isNaN(cantidad) || cantidad < 1) {
    alert("Por favor ingresa una cantidad válida");
    return;
  }

  if (cantidad > stock) {
    alert('Stock insuficiente');
    return;
  }

  const item = {
    IdProducto: p.IdProducto,
    IdVariante: idVariante,
    Nombre: p.Nombre,
    Imagen: p.Imagen,
    Talla: talla,
    Color: color,
    Precio: precio,
    Cantidad: cantidad
  };

  const existente = carrito.find(i => i.IdVariante === idVariante);
  if (existente) {
    existente.Cantidad += cantidad;
  } else {
    carrito.push(item);
  }

  const found = findVariantById(idVariante);
  if (found?.variante) found.variante.Stock -= cantidad;
  
  cerrarModal();
  showToast(`${p.Nombre} agregado al carrito`);
  renderCarrito();
}

function cerrarModal() {
    document.getElementById('modalProducto').classList.add('hidden');
}
/* ---------------- Admin: Inventario ---------------- */
const formProducto = el('formProducto');
let editingId = null;
let editingVarianteId = null;

formProducto.addEventListener('submit', async e => {
  e.preventDefault();

  const Nombre = el('nombre').value.trim();
  const Talla = el('talla').value.trim();
  const Categoria = el('categoria').value.trim();
  const Stock = parseInt(el('stock').value);
  const Precio = parseFloat(el('precio').value);
  const Color = el('color').value.trim();
  
  // Captura el archivo real, no el valor del input
  const ImagenFile = el('imagen').files[0]; 

  const formData = new FormData();
  formData.append('Nombre', Nombre);
  formData.append('Talla', Talla);
  formData.append('Categoria', Categoria);
  formData.append('Stock', Stock);
  formData.append('Precio', Precio);
  formData.append('Color', Color);

  if (editingVarianteId) {
    formData.append('IdVariante', editingVarianteId);
  }
  
  // Solo agrega la imagen si el usuario seleccionó una nueva
  if (ImagenFile) {
      formData.append('Imagen', ImagenFile);
  }

  const wasEditing = Boolean(editingId);

  try {
    if (wasEditing) {
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
    editingVarianteId = null;

    alert(wasEditing ? 'Producto actualizado' : 'Producto agregado con éxito');
    formProducto.reset();
    await cargarProductos(); // recarga la lista de productos
    showAdminPanel(); // FORZAMOS que se quede en el panel
    showAdminSection('inventario');
  } catch (err) {
    console.error(err);
    alert('Error al guardar producto');
  }
});

function renderAdminList(){
  const container=el('adminList'); container.innerHTML='';
  productos.forEach(p=>{
    const v = getDefaultVariant(p);
    const stock = v?.Stock ?? 0;
    const precio = v?.Precio ?? 0;
    const etiqueta = [v?.Talla, v?.Color].filter(Boolean).join(' / ');
    const card=document.createElement('div'); card.className='producto';
    card.innerHTML=`
      <h4>${p.Nombre}</h4>
      <p>${etiqueta || 'Sin variante'} | Stock: ${stock} | $${precio}</p>
      <button onclick="editProducto(${p.IdProducto})">Editar</button>
      <button onclick="deleteProducto(${p.IdProducto})">Eliminar</button>`;
    container.appendChild(card);
  });
}

function editProducto(id){
  const p = productos.find(x => x.IdProducto === id);
  const v = getDefaultVariant(p);
  el('nombre').value = p?.Nombre || '';
  el('talla').value = v?.Talla || '';
  el('categoria').value = p?.Categoria || '';
  el('stock').value = v?.Stock ?? '';
  el('precio').value = v?.Precio ?? '';
  el('color').value = v?.Color || '';
  const imgPreview = el('imgPreview');
  if(imgPreview && p?.Imagen) imgPreview.src = `${API_BASE}/uploads/${p.Imagen}`;
  
  editingId = id;
  editingVarianteId = v?.IdVariante || null;
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

    const v = getDefaultVariant(p);
    const stock = v?.Stock ?? 0;
    const precio = v?.Precio ?? 0;
    const etiqueta = [v?.Talla, v?.Color].filter(Boolean).join(' / ');

    // APLICAMOS LA MISMA LIMPIEZA QUE EN EL CATÁLOGO DE CLIENTE
    const nombreImagen = p.Imagen ? p.Imagen.replace('uploads/', '').replace('/uploads/', '') : '';
    const urlFinal = `${API_BASE}/uploads/${nombreImagen}`;

    card.innerHTML = `
     <img src="${urlFinal}" alt="${p.Nombre}" 
          style="width:100%; height:150px; object-fit:cover; border-radius:8px;"
          onerror="this.src='https://via.placeholder.com/400x300?text=Sin+Imagen'">
      <h4>${p.Nombre}</h4>
      <p>${etiqueta || 'Sin variante'} | Stock: ${stock} | $${precio}</p>
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
          <span>Vendidos: <b>${dataEstrella.producto.unidades_vendidas}</b> unidades</span><br>
          <span style="color:green; font-weight:bold;">Generado: $${dataEstrella.producto.total_generado}</span>
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
    const pagos = await res.json(); // Asegúrate de que esto sea el array de ventas

    if(!Array.isArray(pagos) || pagos.length === 0) {
      container.innerHTML = '<p>No hay pagos registrados</p>';
      return;
    }

    let total = 0;
    pagos.forEach(p => {
      // 1. Usa p.Total (mayúscula) para que coincida con el backend
      total += parseFloat(p.Total || 0); 
      
      const div = document.createElement('div');
      div.className = 'pago-item';
      
      // 2. Ajusta las propiedades para que coincidan con la respuesta del SQL
      // p.Fecha (mayúscula), p.NombreC (o el ID que devuelvas)
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
          <span style="font-size:0.9rem; color:#555;">Unidades vendidas: <b>${data.producto.unidades_vendidas}</b></span><br>
          <span style="color:green; font-weight:bold; font-size:1.1rem;">Ganancia: $${data.producto.total_generado}</span>
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
      // Si el backend te manda la lista de ventas de ese día, puedes renderizarla aquí
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














