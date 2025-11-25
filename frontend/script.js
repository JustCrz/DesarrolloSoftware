/* ---------------- Configuración ---------------- */
const API_BASE = 'http://localhost:3000/api';

/* ---------------- Datos locales ---------------- */
let productos = [];
let proveedores = [];
let ventas = [];
let carrito = [];
let loggedUser = null;
let editingId = null;

/* ---------------- Utilidades DOM ---------------- */
const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

/* ---------------- Navegación ---------------- */
function hideAll() {
  ['landing','login','register','catalog','productDetail','adminPanel','cart'].forEach(id => hide(id));
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
    case 'corte': show('adminCorte'); renderCorte(); break;
    case 'pagos': show('adminPagos'); renderPagos(); break;
  }
}

/* ---------------- Autenticación ---------------- */
async function login() {
  const correo = el('loginUser').value.trim();
  const contraseña = el('loginPass').value;

  if(!correo || !contraseña){
    el('loginMsg').textContent = 'Ingrese correo y contraseña';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contraseña })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      loggedUser = data.user;
      afterLogin();
    } else {
      el('loginMsg').textContent = data.message || 'Usuario o contraseña incorrectos';
    }

  } catch (err) {
    el('loginMsg').textContent = 'Error de conexión con el servidor';
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
  const Telefono = el('regTelefono').value.trim();
  const Direccion = el('regDireccion').value.trim();
  const Contraseña = el('regPass').value;

  if (!NombreC || !Correo || !Contraseña) {
    el('regMsg').textContent = 'Todos los campos obligatorios';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ NombreC, Correo, Telefono, Direccion, Contraseña })
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      el('regMsg').textContent = 'Usuario registrado correctamente';
      setTimeout(showLogin, 1000);
    } else {
      el('regMsg').textContent = data.message || 'Error al registrar usuario';
    }
  } catch(err) {
    el('regMsg').textContent = 'Error de conexión con el servidor';
    console.error(err);
  }
}

/* ---------------- Productos (Cliente) ---------------- */
async function cargarProductos(){
  try {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    productos = Array.isArray(data.products) ? data.products : [];
  } catch(err){
    console.warn('No se pudo cargar productos', err);
    productos = [];
  }
  renderCatalog();
}

function renderCatalog(){
  const container = el('catalog'); container.innerHTML='';
  productos.forEach(p=>{
    const card=document.createElement('article');
    card.className='producto';
    card.innerHTML=`
      <img src="http://localhost:3000/uploads/${p.Imagen}" alt="${p.Nombre}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      <h3>${p.Nombre}</h3>
      <p class="muted">Color: ${p.Color}</p>
      <p><strong>$${p.Precio}</strong></p>
      <p>Stock: ${p.Stock}</p>
      <div class="meta">
        ${loggedUser?.role==='cliente' ? `<input id="cantidad_${p.IdProducto}" type="number" min="1" max="${p.Stock}" value="${p.Stock>0?1:0}" style="width:60px">
        <button ${p.Stock===0?'class="agotado" disabled':''} onclick="addToCart(${p.IdProducto})">${p.Stock===0?'Agotado':'Agregar'}</button>` : ''}
      </div>`;
    container.appendChild(card);
  });
}

/* ---------------- Carrito ---------------- */
function mostrarCarrito(){ 
  hideAll(); 
  show('cart'); 
  renderCarrito(); 
}

function renderCarrito(){
  const container = el('cartContents'); 
  const footer = el('cartFooter'); 
  container.innerHTML = ''; 
  footer.innerHTML = '';

  if(carrito.length === 0){ 
    container.innerHTML = '<p>Tu carrito está vacío</p>'; 
    return; 
  }

  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = item.Precio * item.Cantidad; 
    total += subtotal;

    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span><strong>${item.Nombre}</strong> - $${item.Precio}</span>
      <input type="number" min="1" value="${item.Cantidad}" style="width:50px" onchange="updateCantidad(${index},this.value)">
      <span>Subtotal: $${subtotal}</span>
      <button onclick="eliminarDelCarrito(${index})">Eliminar</button>
    `;
    container.appendChild(div);
  });

  footer.innerHTML = `
    <p><strong>Total: $${total}</strong></p>
    <button onclick="finalizarCompra()">Finalizar Compra</button>
  `;
}

function addToCart(IdProducto){
  if(!loggedUser){ alert('Debes iniciar sesión'); return; }
  const p = productos.find(x => x.IdProducto === IdProducto);
  const qty = parseInt(el(`cantidad_${IdProducto}`)?.value || 1);
  if(p.Stock<qty){ alert('Stock insuficiente'); return; }
  const item=carrito.find(i=>i.IdProducto===IdProducto);
  if(item) item.Cantidad+=qty; 
  else carrito.push({...p,Cantidad:qty});
  p.Stock-=qty; 
  renderCatalog(); 
  renderCarrito();
  showToast(`${p.Nombre} agregado (${qty})`);
}

function updateCantidad(index, nuevaCantidad){
  nuevaCantidad = parseInt(nuevaCantidad);
  if(isNaN(nuevaCantidad) || nuevaCantidad < 1) return;

  const item = carrito[index];
  const producto = productos.find(p => p.IdProducto === item.IdProducto);
  if(!producto) return;

  const diff = nuevaCantidad - item.Cantidad;
  if(diff > 0 && producto.Stock < diff){ 
    alert('No hay suficiente stock'); 
    renderCarrito(); 
    return; 
  }

  item.Cantidad = nuevaCantidad;
  producto.Stock -= diff;
  renderCarrito();
}

function eliminarDelCarrito(index){
  const item = carrito[index];
  const producto = productos.find(p => p.IdProducto === item.IdProducto);
  if(producto) producto.Stock += item.Cantidad;

  carrito.splice(index, 1);
  renderCatalog();
  renderCarrito();
}

async function finalizarCompra(){
  if(carrito.length===0){ alert('No hay productos en el carrito'); return; }

  const venta = {
    IdCliente: loggedUser?.IdCliente || loggedUser?.id,
    productos: carrito.map(i=>({ IdProducto: i.IdProducto, Cantidad: i.Cantidad })),
    Estado: 'Pendiente'
  };

  try {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    if (res.ok) {
      carrito = [];
      renderCatalog(); 
      renderCarrito();
      showToast('Compra registrada correctamente');
    } else {
      alert('Error al registrar la compra');
    }
  } catch (err) {
    alert('Error de conexión al registrar compra');
  }
}

/* ---------------- Toast ---------------- */
function showToast(msg){
  const t = el('cartMessage');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 2000);
}

/* ---------------- Admin: Inventario ---------------- */
const formProducto = el('formProducto');
formProducto.addEventListener('submit', async e=>{
  e.preventDefault();
  const Nombre = el('nombre').value.trim();
  const Talla = el('talla').value.trim();
  const Categoria = el('categoria').value.trim();
  const Stock = parseInt(el('stock').value);
  const Precio = parseFloat(el('precio').value);
  const Color = el('color').value.trim();
  const Imagen = el('imagen').files[0];

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
      await fetch(`${API_BASE}/products/${editingId}`, { method: 'PUT', body: formData });
    } else {
      await fetch(`${API_BASE}/products`, { method: 'POST', body: formData });
    }
    editingId = null; formProducto.reset();
    cargarProductos();
  } catch(err){ console.error(err); alert('Error al guardar producto'); }
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

function editProducto(IdProducto){
  const p = productos.find(p => p.IdProducto === IdProducto);
  el('nombre').value = p.Nombre;
  el('talla').value = p.Talla;
  el('categoria').value = p.Categoria;
  el('stock').value = p.Stock;
  el('precio').value = p.Precio;
  el('color').value = p.Color;
  editingId = IdProducto;
}

async function deleteProducto(IdProducto){
  if(!confirm('¿Eliminar producto?')) return;
  try {
    const res = await fetch(`${API_BASE}/products/${IdProducto}`, { method: 'DELETE' });
    const data = await res.json();
    if(!data.ok) alert('Error al eliminar producto');
    cargarProductos();
  } catch(err){ alert('Error al eliminar producto'); }
}

/* ---------------- Admin: Proveedores ---------------- */
const formProveedor=el('formProveedor');
formProveedor.addEventListener('submit', async e=>{
  e.preventDefault();
  const prov={ Nombre: el('provNombre').value, Telefono: el('provTelefono').value, Correo: el('provEmail').value, Direccion: el('provDireccion').value };
  try { await fetch(`${API_BASE}/providers`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(prov) }); formProveedor.reset(); renderProveedores(); }
  catch(err){ alert('Error al guardar proveedor'); }
});

async function renderProveedores(){
  try {
    const res = await fetch(`${API_BASE}/providers`);
    const data = await res.json();
    if(!data.ok){ alert('Error al cargar proveedores'); return; }
    proveedores = data.providers;
    const container = el('listaProveedores');
    container.innerHTML = '';
    proveedores.forEach(p => {
      const div = document.createElement('div');
      div.innerHTML = `<span>${p.Nombre} | ${p.Telefono || ''} | ${p.Correo || ''} | ${p.Direccion || ''}</span>
      <button onclick="deleteProveedor(${p.IdProveedor})">Eliminar</button>`;
      container.appendChild(div);
    });
  } catch (err) { alert('Error al cargar proveedores'); console.error(err); }
}

async function deleteProveedor(id){
  if(!confirm('¿Eliminar proveedor?')) return;
  try { await fetch(`${API_BASE}/providers/${id}`, { method: 'DELETE' }); renderProveedores(); } catch(err){ alert('Error al eliminar proveedor'); }
}

/* ---------------- Init ---------------- */
cargarProductos();
showLanding();

async function cargarVentas() {
  try {
    const res = await fetch(`${API_BASE}/sales`);
    const data = await res.json();
    ventas = Array.isArray(data.sales) ? data.sales.map(v => ({
      fecha: v.Fecha || v.fecha || new Date().toISOString(),
      total: v.Total || v.total || v.productos.reduce((sum,p)=>sum+(p.Cantidad*p.Precio || 0),0),
      items: v.productos || []
    })) : [];
  } catch(err) {
    console.error('No se pudieron cargar ventas', err);
    ventas = [];
  }
}

let cortesArray = [];

async function cargarCortes() {
  try {
    const res = await fetch(`${API_BASE}/corteCaja`);
    const data = await res.json();
    cortesArray = Array.isArray(data.cortes) ? data.cortes : [];
  } catch(err) {
    console.error('No se pudieron cargar cortes de caja', err);
    cortesArray = [];
  }
}

function renderCorte() {
  const container = el('corteContainer');
  container.innerHTML = '';
  if(cortesArray.length === 0) return container.innerHTML = '<p>No hay cortes registrados.</p>';

  cortesArray.forEach(c => {
    const div = document.createElement('div');
    div.className = 'corteItem';
    div.innerHTML = `
      <p>Fecha Inicio: ${new Date(c.FechaInicio).toLocaleString()}</p>
      <p>Fecha Fin: ${new Date(c.FechaFin).toLocaleString()}</p>
      <p>Ventas Totales: $${c.VentasTotales}</p>
      <p>Transacciones: ${c.CantidadTransacciones}</p>
      <p>Efectivo: $${c.TotalEfectivo} | Tarjeta: $${c.TotalTarjeta}</p>
    `;
    container.appendChild(div);
  });
}

let pagosArray = [];

async function cargarPagos() {
  try {
    const res = await fetch(`${API_BASE}/pagos`);
    const data = await res.json();
    pagosArray = Array.isArray(data.pagos) ? data.pagos : [];
  } catch(err) {
    console.error('No se pudieron cargar pagos', err);
    pagosArray = [];
  }
}

function renderPagos() {
  const container = el('pagosContainer');
  container.innerHTML = '';
  if(pagosArray.length === 0) return container.innerHTML = '<p>No hay pagos registrados.</p>';

  pagosArray.forEach(p => {
    const div = document.createElement('div');
    div.className = 'pagoItem';
    div.innerHTML = `
      <p>IdPedido: ${p.IdPedido}</p>
      <p>Monto: $${p.Monto}</p>
      <p>Método: ${p.MetodoPago}</p>
      <p>Fecha: ${new Date(p.Fecha).toLocaleString()}</p>
      <p>Estado Pedido: ${p.EstadoPedido}</p>
    `;
    container.appendChild(div);
  });
}

