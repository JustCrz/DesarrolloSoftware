/* ---------------- Configuración ---------------- */
const API_BASE = 'https://desarrollosoftware.onrender.com';

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
    case 'pagos': show('adminPagos'); renderPagos(); break
  }
}

/* ---------------- Autenticación ---------------- */
async function login() {
  const correo = el('loginUser').value.trim();
  const contraseña = el('loginPass').value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Correo: correo, Contraseña: contraseña })
    });
    const data = await res.json();
    if (data.ok) {
      loggedUser = data.user;
      afterLogin();
    } else {
      el('loginMsg').textContent = data.message;
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
  const Contraseña = el('regPass').value;
  try {
    const res = await fetch(`${API_BASE}/api/users/register`, { // Eliminar /register
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
    el('regMsg').textContent = data.message;
    if (data.ok) {
      setTimeout(showLogin, 1000);
    }
  } catch (err) {
    el('regMsg').textContent = 'Error de conexión con el servidor';
    console.error(err);
  }
}

/* ---------------- Productos (Cliente) ---------------- */
async function cargarProductos(){
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.products)) {
      productos = data.products;
    } else if (Array.isArray(data)) {
      productos = data; // soporte legacy
    } else {
      productos = [];
    }
  } catch (err) {
    console.warn("Backend no disponible. Mostrando catálogo vacío...");
    productos = []; // catálogo vacío temporal
    renderCatalog();
  }
}

function renderCatalog(){
  const container = el('catalog'); container.innerHTML='';
  productos.forEach(p=>{
    const card=document.createElement('article');
    card.className='producto';
    card.innerHTML=`
      <img src="${p.Imagen}" alt="${p.Nombre}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      <h3>${p.Nombre}</h3>
      <p class="muted">Color: ${p.Color}</p>
      <p><strong>$${p.Precio}</strong></p>
      <p>Stock: ${p.Stock}</p>
      <div class="meta">
        ${loggedUser?.role==='cliente' ? `<input id="cantidad_${p.id}" type="number" min="1" max="${p.Stock}" value="${p.Stock>0?1:0}" style="width:60px">
        <button ${p.Stock===0?'class="agotado" disabled':''} onclick="addToCart(${p.id})">${p.Stock===0?'Agotado':'Agregar'}</button>` : ''}
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
  const p=productos.find(x=>x.id===id);
  const qty=parseInt(el(`cantidad_${id}`)?.value || 1);
  if(p.Stock<qty){ alert('Stock insuficiente'); return; }
  const item=carrito.find(i=>i.id===id);
  if(item) item.Cantidad+=qty; else carrito.push({...p,Cantidad:qty});
  p.Stock-=qty; renderCatalog(); renderCarrito();
  showToast(`${p.Nombre} agregado (${qty})`);
}

function updateCantidad(index,nuevaCantidad){
  nuevaCantidad=parseInt(nuevaCantidad); if(isNaN(nuevaCantidad)||nuevaCantidad<1) return;
  const item=carrito[index];
  const producto=productos.find(p=>p.id===item.id);
  const diff=nuevaCantidad-item.Cantidad;
  if(diff>0 && producto.stock<diff){ alert('No hay suficiente stock'); renderCarrito(); return; }
  item.Cantidad=nuevaCantidad; producto.Stock-=diff; renderCatalog(); renderCarrito();
}

function eliminarDelCarrito(index){
  const item=carrito[index];
  const producto=productos.find(p=>p.id===item.id);
  if(producto) producto.Stock+=item.Cantidad;
  carrito.splice(index,1); renderCatalog(); renderCarrito();
}

async function finalizarCompra() {
  if (carrito.length === 0) {
    alert('No hay productos en el carrito');
    return;
  }

  const venta = {
    usuarioId: loggedUser?.id || 0,
    total: carrito.reduce((sum, i) => sum + i.Precio * i.Cantidad, 0),
    items: carrito.map(i => ({ ProductoId: i.id, Cantidad: i.Cantidad }))
  };

  try {
    const res = await fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    const data = await res.json();

    if (res.ok && data.ok) {  // verifica status HTTP y campo ok del JSON
      carrito = [];
      renderCatalog();
      renderCarrito();
      showToast('Compra registrada correctamente');
    } else {
      alert('Error al registrar la compra: ' + (data.message || 'Desconocido'));
    }
  } catch (err) {
    alert('Error de conexión al registrar compra');
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
    formProducto.reset();
    cargarProductos(); // recarga la lista de productos
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
      <button onclick="editProducto(${p.id})">Editar</button>
      <button onclick="deleteProducto(${p.id})">Eliminar</button>`;
    container.appendChild(card);
  });
}

function editProducto(id){
  const p = productos.find(p => p.id === id);
  el('nombre').value = p.Nombre;
  el('talla').value = p.Talla;
  el('categoria').value = p.Categoria;
  el('stock').value = p.Stock;
  el('precio').value = p.Precio;
  el('color').value = p.Color;
  el('imagen').value = p.Imagen; // si usas file, este valor no se puede asignar directamente
  editingId = id;
}

async function deleteProducto(id){
  if(!confirm('¿Eliminar producto?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'DELETE',
      credentials: 'include'  // importante para mantener la sesión
    });

    const data = await res.json();

    if (!data.ok) {
      alert('Error al eliminar producto: ' + (data.message || 'Desconocido'));
      return;
    }

    // Si todo va bien, recargar productos
    cargarProductos();

  } catch (err) {
    alert('Error al eliminar producto');
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
/*
async function renderProveedores(){
  try {
    const res = await fetch(`${API_BASE}/providers`);
    proveedores = await res.json();
    const container=el('listaProveedores'); container.innerHTML='';
    proveedores.forEach(p=>{
      const div=document.createElement('div');
      div.innerHTML=`<span>${p.Nombre} | ${p.Telefono} | ${p.Correo} | ${p.Direccion}</span>
      <button onclick="deleteProveedor(${p.id})">Eliminar</button>`;
      container.appendChild(div);
    });
  } catch (err) {
    alert('Error al cargar proveedores');
  }
}
*/
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

/* ---------------- Admin: Catalogo ---------------- */
function renderCatalogAdmin(){
  const container=el('catalogAdmin'); container.innerHTML='';
  productos.forEach(p=>{
    const card=document.createElement('div'); card.className='producto';
    card.innerHTML=`
      <img src="${p.Imagen}" alt="${p.Nombre}" style="height:150px;object-fit:cover">
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <button onclick="editProducto(${p.id})">Editar</button>
      <button onclick="deleteProducto(${p.id})">Eliminar</button>`;
    container.appendChild(card);
  });
}

/* ---------------- Admin: Corte de caja ---------------- */
function renderCorte(){
  const container=el('ventasDia'); container.innerHTML='';
  const hoy = new Date().toISOString().slice(0,10);
  const ventasHoy = ventas.filter(v=>v.fecha.slice(0,10)===hoy);
  let total=0;
  ventasHoy.forEach(v=>{
    total+=v.total;
    const div=document.createElement('div');
    div.textContent=`${new Date(v.fecha).toLocaleTimeString()} - Total: $${v.total} - Items: ${v.items.length}`;
    container.appendChild(div);
  });
  el('totalVentas').textContent=`Total ventas hoy: $${total}`;
}
function actualizarCorte(){ renderCorte(); }
function realizarCorte(){ alert('Corte de caja realizado para hoy'); ventas=[]; renderCorte(); }

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
cargarProductos();
showLanding();
