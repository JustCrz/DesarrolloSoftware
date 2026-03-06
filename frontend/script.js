/* ---------------- Configuracion ---------------- */
// const API_BASE = 'https://desarrollosoftware.onrender.com'; // Trabajar con la api en la nube
const API_BASE = 'http://localhost:3000'; // Trabajar local

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
const getProductId = product => product?.IdProducto ?? product?.id;
const getProductStock = product => Number(product?.Stock ?? product?.stock ?? 0);

/* ---------------- Navegacion ---------------- */
function hideAll() {
  ['landing', 'login', 'register', 'catalog', 'productDetail', 'adminPanel', 'cart'].forEach(id => hide(id));
  document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));
}

function showLanding() { hideAll(); show('landing'); }
function showLogin() { hideAll(); show('login'); }
function showRegister() { hideAll(); show('register'); }
function showCatalog() { hideAll(); renderCatalog(); show('catalog'); }
function showAdminPanel() { hideAll(); show('adminPanel'); showAdminSection('inventario'); }

function showAdminSection(section) {
  document.querySelectorAll('.adminSection').forEach(s => s.classList.add('hidden'));
  switch (section) {
    case 'inventario': show('adminInventario'); renderAdminList(); break;
    case 'proveedores': show('adminProveedores'); renderProveedores(); break;
    case 'catalogo': show('adminCatalogo'); renderCatalogAdmin(); break;
    case 'corte': show('adminCorte'); if (typeof renderCorte === 'function') renderCorte(); break;
    case 'pagos': show('adminPagos'); renderPagos(); break;
  }
}

/* ---------------- Autenticacion ---------------- */
async function login() {
  const correo = el('loginUser').value.trim();
  const contrasena = el('loginPass').value;
  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ correo, contrasena, ['contrase\u00f1a']: contrasena })
    });
    const data = await res.json();
    if (data.ok) {
      loggedUser = data.user;
      afterLogin();
    } else {
      el('loginMsg').textContent = data.message;
    }
  } catch (err) {
    el('loginMsg').textContent = 'Error de conexion con el servidor';
    console.error(err);
  }
}

function afterLogin() {
  el('loginMsg').textContent = '';
  el('btnLogout').classList.remove('hidden');
  el('btnInicio').classList.add('hidden');

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

function logout() {
  loggedUser = null;
  el('btnCart').classList.add('hidden');
  el('btnLogout').classList.add('hidden');
  el('btnPanel').classList.add('hidden');
  el('btnInicio').classList.remove('hidden');
  hideAll();
  show('landing');
}

/* ---------------- Registro ---------------- */
async function register() {
  const NombreC = el('regUser').value.trim();
  const Correo = el('regEmail').value.trim();
  const Contrasena = el('regPass').value;
  try {
    const res = await fetch(`${API_BASE}/api/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        NombreC,
        Correo,
        Contrase\u00f1a: Contrasena,
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
    el('regMsg').textContent = 'Error de conexion con el servidor';
    console.error(err);
  }
}

/* ---------------- Productos (Cliente) ---------------- */
async function cargarProductos() {
  try {
    const res = await fetch(`${API_BASE}/api/products`);
    const data = await res.json();
    if (data.ok && Array.isArray(data.products)) {
      productos = data.products;
    } else if (Array.isArray(data)) {
      productos = data;
    } else {
      productos = [];
    }
  } catch (err) {
    console.warn('Backend no disponible. Mostrando catalogo vacio...');
    productos = [];
    renderCatalog();
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
function mostrarCarrito() { hideAll(); show('cart'); renderCarrito(); }

function renderCarrito() {
  const container = el('cartContents');
  const footer = el('cartFooter');
  container.innerHTML = '';
  footer.innerHTML = '';

  if (carrito.length === 0) {
    container.innerHTML = '<p>Tu carrito esta vacio</p>';
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
      <button onclick="eliminarDelCarrito(${index})">Eliminar</button>`;
    container.appendChild(div);
  });

  footer.innerHTML = `<p><strong>Total: $${total}</strong></p>
    <button onclick="finalizarCompra()">Finalizar Compra</button>`;
}

function addToCart(id) {
  if (!loggedUser) { alert('Debes iniciar sesion'); return; }
  const p = productos.find(x => getProductId(x) === id);
  if (!p) { alert('Producto no encontrado'); return; }

  const qty = parseInt(el(`cantidad_${id}`)?.value || 1, 10);
  if (getProductStock(p) < qty) { alert('Stock insuficiente'); return; }

  const item = carrito.find(i => getProductId(i) === id);
  if (item) item.Cantidad += qty;
  else carrito.push({ ...p, Cantidad: qty });

  p.Stock = getProductStock(p) - qty;
  renderCatalog();
  renderCarrito();
  showToast(`${p.Nombre} agregado (${qty})`);
}

function updateCantidad(index, nuevaCantidad) {
  nuevaCantidad = parseInt(nuevaCantidad, 10);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;

  const item = carrito[index];
  const producto = productos.find(p => getProductId(p) === getProductId(item));
  if (!producto) return;

  const diff = nuevaCantidad - item.Cantidad;
  if (diff > 0 && getProductStock(producto) < diff) {
    alert('No hay suficiente stock');
    renderCarrito();
    return;
  }

  item.Cantidad = nuevaCantidad;
  producto.Stock = getProductStock(producto) - diff;
  renderCatalog();
  renderCarrito();
}

function eliminarDelCarrito(index) {
  const item = carrito[index];
  const producto = productos.find(p => getProductId(p) === getProductId(item));
  if (producto) producto.Stock = getProductStock(producto) + item.Cantidad;
  carrito.splice(index, 1);
  renderCatalog();
  renderCarrito();
}

async function finalizarCompra() {
  if (carrito.length === 0) {
    alert('No hay productos en el carrito');
    return;
  }

  const venta = {
    IdCliente: loggedUser?.id || 0,
    productos: carrito.map(i => ({ IdProducto: getProductId(i), Cantidad: i.Cantidad }))
  };

  try {
    const res = await fetch(`${API_BASE}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(venta)
    });

    const data = await res.json();

    if (res.ok && data.ok) {
      carrito = [];
      await cargarProductos();
      renderCatalog();
      renderCarrito();
      showToast('Compra registrada correctamente');
    } else {
      alert('Error al registrar la compra: ' + (data.message || 'Desconocido'));
    }
  } catch (err) {
    alert('Error de conexion al registrar compra');
    console.error(err);
  }
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
      await fetch(`${API_BASE}/api/products/${editingId}`, {
        method: 'PUT',
        body: formData
      });
    } else {
      await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        body: formData
      });
    }

    editingId = null;
    alert(editingId ? 'Producto actualizado' : 'Producto agregado con éxito');
    formProducto.reset();
    await cargarProductos();
    showAdminPanel();
    showAdminSection('inventario');
  } catch (err) {
    console.error(err);
    alert('Error al guardar producto');
  }
});

function renderAdminList() {
  const container = el('adminList');
  container.innerHTML = '';
  productos.forEach(p => {
    const productId = getProductId(p);
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <button onclick="editProducto(${productId})">Editar</button>
      <button onclick="deleteProducto(${productId})">Eliminar</button>`;
    container.appendChild(card);
  });
}

function editProducto(id) {
  const p = productos.find(prod => getProductId(prod) === id);
  if (!p) return;
  el('nombre').value = p.Nombre;
  el('talla').value = p.Talla;
  el('categoria').value = p.Categoria;
  el('stock').value = p.Stock;
  el('precio').value = p.Precio;
  el('color').value = p.Color;
  editingId = id;
}

async function deleteProducto(id) {
  if (!confirm('Eliminar producto?')) return;

  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`, {
      method: 'DELETE'
    });

    const data = await res.json();

    if (!data.ok) {
      alert('Error al eliminar producto: ' + (data.message || 'Desconocido'));
      return;
    }

    await cargarProductos();
    renderAdminList();
  } catch (err) {
    alert('Error al eliminar producto');
    console.error(err);
  }
}

/* ---------------- Admin: Proveedores ---------------- */
const formProveedor = el('formProveedor');
formProveedor.addEventListener('submit', async e => {
  e.preventDefault();
  const prov = {
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

async function renderProveedores() {
  try {
    const res = await fetch(`${API_BASE}/api/providers`);
    const data = await res.json();
    if (!data.ok) {
      alert('Error al cargar proveedores');
      return;
    }

    proveedores = data.providers || data.provider || [];
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

async function deleteProveedor(id) {
  if (!confirm('Eliminar proveedor?')) return;
  try {
    await fetch(`${API_BASE}/api/providers/${id}`, { method: 'DELETE' });
    renderProveedores();
  } catch (err) {
    alert('Error al eliminar proveedor');
  }
}

/* ---------------- Admin: Catalogo ---------------- */
function renderCatalogAdmin() {
  const container = el('catalogAdmin');
  container.innerHTML = '';
  productos.forEach(p => {
    const productId = getProductId(p);
    const card = document.createElement('div');
    card.className = 'producto';
    card.innerHTML = `
      <img src="${p.Imagen}" alt="${p.Nombre}" style="height:150px;object-fit:cover">
      <h4>${p.Nombre}</h4>
      <p>Stock: ${p.Stock} | $${p.Precio}</p>
      <button onclick="editProducto(${productId})">Editar</button>
      <button onclick="deleteProducto(${productId})">Eliminar</button>`;
    container.appendChild(card);
  });
}

async function renderPagos() {
  const container = el('pagosLista');
  const totalEl = el('totalPagos');
  container.innerHTML = '';
  totalEl.textContent = 'Total de pagos: $0';

  try {
    const res = await fetch(`${API_BASE}/api/pagos`);
    const data = await res.json();
    const pagos = data.pagos || [];

    if (!data.ok || pagos.length === 0) {
      container.innerHTML = '<p>No hay pagos registrados</p>';
      return;
    }

    let total = 0;
    pagos.forEach(p => {
      total += Number(p.Monto || 0);
      const div = document.createElement('div');
      div.className = 'pago-item';
      div.textContent = `${new Date(p.Fecha).toLocaleDateString()} - Cliente: ${p.IdCliente} - Monto: $${p.Monto} - Estado: ${p.Estado}`;
      container.appendChild(div);
    });

    totalEl.textContent = `Total de pagos: $${total}`;
  } catch (err) {
    console.error(err);
    container.innerHTML = '<p>Error al cargar los pagos</p>';
  }
}

/* ---------------- Toast ---------------- */
function showToast(msg) {
  const t = el('cartMessage');
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(() => { t.style.display = 'none'; }, 2000);
}

/* ---------------- Init ---------------- */
cargarProductos();
showLanding();
