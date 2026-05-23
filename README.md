# Reporte General del Proyecto: Marjorie Store

Este documento ofrece una visión general de la arquitectura, funcionamiento, tecnologías utilizadas y observaciones sobre la lógica interna del proyecto **Marjorie Store**.

## 1. ¿Cómo Funciona el Sistema?
**Marjorie Store** es una plataforma de comercio electrónico dividida en dos capas principales: **Frontend** (interfaz de usuario) y **Backend** (API REST y lógica de negocio).

- **Gestión de Usuarios y Autenticación:** Los usuarios pueden registrarse y acceder al sistema. Las contraseñas se almacenan de manera segura utilizando encriptación (hash). El sistema diferencia entre clientes regulares y administradores basándose en listas de correos predefinidos.
- **Catálogo de Productos y Carrito:** El backend provee un CRUD para los productos (incluyendo manejo de imágenes y promociones). Los usuarios pueden agregar productos a su carrito, actualizar las cantidades y proceder a la compra de forma interactiva.
- **Procesamiento de Pagos y Ventas:** El flujo de compra se integra con la pasarela de pagos Stripe. Cuando un usuario finaliza la compra, se crea una sesión de pago. Una vez concretado el pago exitosamente, un *webhook* notifica al backend para procesar la venta de forma interna: se registra la transacción, se descuenta el stock de los productos usando transacciones SQL atómicas para evitar inconsistencias y se notifica al administrador.
- **Panel Administrativo (Dashboard):** Permite a los administradores gestionar productos, proveedores, visualizar resúmenes diarios de ventas, productos más vendidos y un historial detallado de transacciones y estados de pedido.

## 2. Tecnologías Utilizadas
El proyecto sigue una arquitectura cliente-servidor tradicional, implementando las siguientes tecnologías:

### Frontend
- **HTML5, CSS3, JavaScript Vanilla:** Creación de la interfaz de usuario de manera pura, sin frameworks adicionales pesados, asegurando una rápida carga y control directo del DOM.

### Backend
- **Node.js y Express.js:** Motor y framework principales para construir y exponer la API RESTful.
- **MySQL (vía `mysql2`):** Base de datos relacional. Se utiliza un *Pool* de conexiones para lograr un acceso recurrente y eficiente.
- **Bcrypt:** Librería para el hashing y verificación segura de las contraseñas de los usuarios.
- **Multer:** Middleware esencial para gestionar la subida de archivos (imágenes de los productos y logos de los proveedores) al sistema de ficheros local.
- **Stripe (y MercadoPago):** SDKs integrados para el procesamiento seguro de pagos con tarjeta de crédito/débito y flujos de checkout.
- **Swagger (`swagger-ui-express`, `swagger-jsdoc`):** Herramientas para la auto-documentación interactiva de la API.

### Cómo aportar al proyecto
- Clonar el repositorio
- Comando "cd backend"
- Aplicar "npm install"
- Crear archivo .env correspondiente

### Deploys
- Render backend/API
- Vercel frontend
- Aiven Base de datos MySQL