/* ---------------- Tienda de ropa - FRONTEND con backend opcional ---------------- */

/* ---------------- configuración del backend ---------------- */
const API_BASE = 'http://localhost:5000/api'; // cambia el puerto si tu server.js usa otro

/* ---------------- datos iniciales (modo local fallback) ---------------- */
let productos = [
  {id:1,nombre:"Vestido rojo",precio:450,stock:3,color:"Rojo",tipo:"Vestido",imagen:"https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&q=80"},
  {id:2,nombre:"Blusa blanca",precio:250,stock:5,color:"Blanco",tipo:"Blusa",imagen:"https://images.unsplash.com/photo-1520975698512-9e3b9d3e8b40?w=800&q=80"},
  {id:3,nombre:"Falda negra",precio:300,stock:2,color:"Negro",tipo:"Falda",imagen:"https://images.unsplash.com/photo-1521334884684-d80222895322?w=800&q=80"}
];
let proveedores = [];
let ventas = [];
let carrito = [];
let users = [{user:"admin",email:"admin@mail.com",pass:"123",role:"admin"}];
let loggedUser = null;

/* ---------------- utilidades DOM ---------------- */
const el = id => document.getElementById(id);
const show = id => el(id)?.classList.remove('hidden');
const hide = id => el(id)?.classList.add('hidden');

/* ---------------- navegación ---------------- */
function hideAll(){
  ['landing','login','register','catalog','productDetail','adminPanel','cart'].forEach(id=>el(id)?.classList.add('hidden'));
  document.querySelectorAll('.adminSection').forEach(s=>s.classList.add('hidden'));
}
function showLanding(){ hideAll(); show('landing'); }
function showLogin(){ hideAll(); show('login'); }
function showRegister(){ hideAll(); show('register'); }
function showCatalog(){ hideAll(); renderCatalog(); show('catalog'); }
function showAdminPanel(){ hideAll(); show('adminPanel'); el('adminQuickButtons')?.classList.remove('hidden'); showAdminSection('inventario'); }

async function login() {
  const userVal = el('loginUser').value.trim();
  const passVal = el('loginPass').value;
  const roleVal = el('loginRole').value;

  el('loginMsg').textContent = '';

  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: userVal, pass: passVal, role: roleVal })
      });

      // Revisar si el backend respondió correctamente
      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          loggedUser = data.user;
          afterLogin();
          return; // Login exitoso con backend, salimos
        } else {
          el('loginMsg').textContent = data.message || 'Credenciales inválidas';
          return;
        }
      } else {
        console.warn('Backend respondió con error HTTP, se usará login local');
      }

    } catch (err) {
      console.warn('Backend no disponible, se intentará login local', err);
    }
  }
  const found = users.find(u => 
    (u.user === userVal || u.email === userVal) &&
    u.pass === passVal &&
    u.role === roleVal
  );

  if (found) {
    loggedUser = found;
    afterLogin();
  } else {
    el('loginMsg').textContent = 'Usuario/contraseña incorrectos';
  }
}

function afterLogin(){
  el('loginMsg').textContent='';
  el('btnLogout').classList.remove('hidden');
  el('btnInicio').classList.add('hidden');
  if(loggedUser.role === 'admin'){
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
  console.log('Sesión cerrada');
}
// Registro de usuario
async function register() {
  const nombre = el('regUser').value.trim();
  const email  = el('regEmail').value.trim();
  const pass   = el('regPass').value;
  const role   = el('regRole').value;

  el('regMsg').textContent = '';

  if (!nombre || !email || !pass) {
    el('regMsg').textContent = 'Por favor completa todos los campos';
    el('regMsg').classList.remove('success');
    el('regMsg').classList.add('error');
    return;
  }

  const nuevoUsuario = { user: nombre, email, pass, role };

  if (API_BASE) {
    try {
      const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoUsuario)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.ok) {
          el('regMsg').textContent = 'Registro exitoso';
          el('regMsg').classList.remove('error');
          el('regMsg').classList.add('success');

          el('regUser').value = '';
          el('regEmail').value = '';
          el('regPass').value = '';

          setTimeout(() => showLogin(), 1000);
          return;
        } else {
          el('regMsg').textContent = data.message || 'Error al registrar';
          el('regMsg').classList.add('error');
          return;
        }
      } else {
        console.warn('Error HTTP al registrar, usando login local');
      }
    } catch (err) {
      console.warn('Backend no disponible, registrando localmente', err);
    }
  }

  if (users.some(u => u.email === email)) {
    el('regMsg').textContent = 'Este email ya está registrado';
    el('regMsg').classList.add('error');
    return;
  }

  const localUser = { id: Date.now(), ...nuevoUsuario };
  users.push(localUser);

  el('regMsg').textContent = 'Registro exitoso';
  el('regMsg').classList.remove('error');
  el('regMsg').classList.add('success');

  el('regUser').value = '';
  el('regEmail').value = '';
  el('regPass').value = '';

  setTimeout(() => showLogin(), 1000);
}
/* ---------------- render catálogo ---------------- */
function renderCatalog(){
  const container = el('catalog');
  container.innerHTML = '';
  productos.forEach(p=>{
    const card = document.createElement('article');
    card.className = 'producto';
    card.innerHTML = `
      <img src="${p.imagen}" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/400x300?text=No+Image'">
      <h3>${p.nombre}</h3>
      <p class="muted">Tipo: ${p.tipo} · Color: ${p.color}</p>
      <p><strong>$${p.precio}</strong></p>
      <p>Stock: ${p.stock}</p>
      <div class="meta">
        ${loggedUser && loggedUser.role==='cliente' ? `<input id="cantidad_${p.id}" type="number" min="1" max="${p.stock}" value="${p.stock>0?1:0}" style="width:60px">` : ''}
        ${loggedUser && loggedUser.role==='cliente' ? `<button ${p.stock===0?'class="agotado" disabled':''} onclick="addToCart(${p.id})">${p.stock===0?'Agotado':'Agregar'}</button>` : ''}
      </div>
    `;
    container.appendChild(card);
  });
}
function mostrarCarrito() {
  hideAll();
  show('cart');
  renderCarrito();
}
function renderCarrito() {
  const container = el('cartContents');
  const footer = el('cartFooter');
  container.innerHTML = '';
  footer.innerHTML = '';
  if (carrito.length === 0) {
    container.innerHTML = '<p>Tu carrito está vacío</p>';
    return;
  }
  let total = 0;
  carrito.forEach((item, index) => {
    const subtotal = item.precio * item.cantidad;
    total += subtotal;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <span><strong>${item.nombre}</strong> - $${item.precio}</span>
      <input type="number" min="1" value="${item.cantidad}" style="width:50px" onchange="updateCantidad(${index}, this.value)">
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
/* ---------------- carrito cliente ---------------- */
function addToCart(id){
  if(!loggedUser){ alert('Debes iniciar sesión como cliente'); return; }
  const p = productos.find(x=>x.id===id);
  const qtyEl = el(`cantidad_${id}`);
  const qty = Math.max(1, parseInt(qtyEl?.value || 1));
  if(p.stock < qty){ alert('Stock insuficiente'); return; }

  const item = carrito.find(i=>i.id===id);
  if(item) item.cantidad += qty; else carrito.push({...p, cantidad: qty});
  p.stock -= qty;
  renderCatalog();
  renderCarrito();
  showToast(`${p.nombre} agregado (${qty})`);
}
function updateCantidad(index, nuevaCantidad) {
  nuevaCantidad = parseInt(nuevaCantidad);
  if (isNaN(nuevaCantidad) || nuevaCantidad < 1) return;

  const item = carrito[index];
  const producto = productos.find(p => p.id === item.id);

  const diferencia = nuevaCantidad - item.cantidad;

  if(diferencia > 0 && producto.stock < diferencia){
    alert('No hay suficiente stock');
    renderCarrito();
    return;
  }
  item.cantidad = nuevaCantidad;
  producto.stock -= diferencia;

  renderCatalog();
  renderCarrito();
}
function eliminarDelCarrito(index) {
  const item = carrito[index];
  const producto = productos.find(p => p.id === item.id);
  if(producto) producto.stock += item.cantidad;

  carrito.splice(index, 1);

  renderCatalog();
  renderCarrito();
}

/* ---------------- finalizar compra (usa backend si existe) ---------------- */
async function finalizarCompra(){
  if(carrito.length === 0){ alert('No hay productos en el carrito'); return; }
  const metodo = el('metodoPago')?.value || 'efectivo';
  const venta = {
    fecha: new Date().toISOString(),
    metodo,
    total: carrito.reduce((s,i)=>s+i.precio*i.cantidad,0),
    items: carrito.map(i=>({productoId:i.id,nombre:i.nombre,cantidad:i.cantidad,precio:i.precio}))
  };

  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/sales`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify(venta)
      });
      if(!res.ok) throw new Error('Error al guardar venta en servidor');
      carrito = [];
      renderCatalog(); showToast('Compra registrada correctamente');
      return;
    }catch(err){
      console.error(err);
      alert('Error guardando en servidor, guardando localmente.');
    }
  }

  ventas.push(venta);
  carrito = [];
  renderCatalog();
  showToast('Compra registrada localmente');
}
/* ---------------- init: carga productos del backend si existe ---------------- */
async function initApp(){
  if(API_BASE){
    try{
      const res = await fetch(`${API_BASE}/products`);
      if(res.ok) productos = await res.json();
      else console.warn('Backend sin productos');
    }catch(e){ console.warn('Backend no disponible, usando datos locales'); }
  }
  showLanding();
}
initApp();

/* ---------------- utilidad ---------------- */
function showToast(msg){
  const t = el('cartMessage');
  if(!t) return alert(msg);
  t.textContent = msg;
  t.style.display = 'block';
  setTimeout(()=>t.style.display='none',2000);
}
