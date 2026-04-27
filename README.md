
# Marjorie Store

**Marjorie Store** es un sistema web completo para la gestión de una tienda de ropa femenina. El proyecto está dividido en backend (API REST) y frontend (interfaz web), integrando pagos en línea y reportes de ventas.

## Tecnologías principales
- **Backend:** Node.js, Express, MySQL
- **Frontend:** HTML, CSS, JavaScript puro
- **Pagos:** Stripe
- **Documentación:** Swagger

## Funcionalidades principales
- Gestión de usuarios (registro, login, administración)
- Catálogo de productos con imágenes y variantes
- Carrito de compras y procesamiento de ventas
- Gestión de proveedores
- Reportes de ventas y productos más vendidos
- Pagos en línea con Stripe

## Estructura del proyecto

```
DesarrolloDeSoftware/
├── backend/        # API REST, lógica de negocio y conexión a BD
├── frontend/       # Interfaz web para clientes y admins
├── docs/           # Documentación y recursos
└── README.md
```

## Instalación y ejecución

1. Clona el repositorio:
	```bash
	git clone https://github.com/JustCrz/DesarrolloSoftware.git
	cd DesarrolloDeSoftware/backend
	npm install
	```
2. Configura las variables de entorno en `.env` (ver ejemplo en backend).
3. Inicia el backend:
	```bash
	node server.js
	```
4. Abre el frontend desde `frontend/index.html` en tu navegador.

## Endpoints principales (API REST)

- `/api/products`   → Productos (CRUD)
- `/api/users`      → Usuarios (registro, consulta, eliminación)
- `/api/cart`       → Carrito de compras
- `/api/sales`      → Ventas
- `/api/providers`  → Proveedores
- `/api/reports`    → Reportes de ventas
- `/api/payments`   → Pagos
- `/api/auth`       → Autenticación (login)
- `/api/stripe`     → Pagos con Stripe

Consulta la documentación interactiva en: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

## Despliegue

- **Frontend:** [profreehost](https://profreehost.com/)
- **Backend:** [render](https://render.com/)
- **Base de datos:** [aiven](https://aiven.io/)

---
Desarrollado para la materia de Desarrollo de Software.

