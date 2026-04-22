// backend/swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

// Configuración básica de Swagger
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Tienda - Documentación',
      version: '1.0.0',
      description: 'Documentación de la API para el sistema de gestión de tienda (clientes, productos, proveedores, ventas, etc.)',
    },
    servers: [
      {
        url: 'http://localhost:3000/api',
        description: 'Servidor local',
      },
    ],
  },
  // Rutas donde buscar comentarios de documentación (opcional)
  apis: ['./routes/*.js'],
};

// Generar especificación Swagger
const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;

// backend/swagger.js
/**
 * @swagger
 * openapi: 3.0.0
 * info:
 *   title: API Marjorie Store
 *   version: 1.0.0
 *   description: Documentación de la API para la tienda de ropa femenina
 * servers:
 *   - url: http://localhost:3000
 */

/**
 * USERS
 */

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestión de usuarios
 */

/**
 * @swagger
 * /users/user:
 *   get:
 *     summary: Obtener todos los usuarios (solo prueba)
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               NombreC:
 *                 type: string
 *               Correo:
 *                 type: string
 *               Telefono:
 *                 type: string
 *               Direccion:
 *                 type: string
 *               Contraseña:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario registrado correctamente
 */

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Iniciar sesión de usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Correo:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario autenticado correctamente
 *       401:
 *         description: Usuario no encontrado o contraseña incorrecta
 */

/**
 * PRODUCTS
 */

/**
 * @swagger
 * tags:
 *   - name: Products
 *     description: Gestión del catálogo de productos
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Obtener todos los productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Agregar un nuevo producto
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nombre:
 *                 type: string
 *               precio:
 *                 type: number
 *               stock:
 *                 type: number
 *               color:
 *                 type: string
 *               tipo:
 *                 type: string
 *               imagen:
 *                 type: string
 *     responses:
 *       201:
 *         description: Producto agregado
 */
/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Eliminar un producto por Id
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id del producto
 *     responses:
 *       200:
 *         description: Producto eliminado correctamente
 *       404:
 *         description: Producto no encontrado
 */

/**
 * PROVIDERS
 */

/**
 * @swagger
 * tags:
 *   - name: Providers
 *     description: Gestión de proveedores
 */

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Obtener todos los proveedores
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de proveedores
 */

/**
 * @swagger
 * /providers:
 *   post:
 *     summary: Agregar un nuevo proveedor
 *     tags: [Providers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               Nombre:
 *                 type: string
 *               Telefono:
 *                 type: string
 *               Correo:
 *                 type: string
 *               Direccion:
 *                 type: string
 *     responses:
 *       201:
 *         description: Proveedor agregado
 */

/**
 * @swagger
 * /providers/{id}:
 *   delete:
 *     summary: Eliminar un proveedor
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Proveedor eliminado
 */

/**
 * SALES
 */

/**
 * @swagger
 * tags:
 *   - name: Sales
 *     description: Gestión de ventas
 */

/**
 * @swagger
 * /sales:
 *   get:
 *     summary: Obtener todas las ventas
 *     tags: [Sales]
 *     responses:
 *       200:
 *         description: Lista de ventas
 */

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Registrar una venta
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     cantidad:
 *                       type: number
 *               total:
 *                 type: number
 *     responses:
 *       201:
 *         description: Venta registrada
 */

/**
 * CART
 */

/**
 * @swagger
 * tags:
 *   - name: Cart
 *     description: Carrito de compras
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtener los productos en el carrito
 *     tags: [Cart]
 *     responses:
 *       200:
 *         description: Lista de productos en el carrito
 */

/**
 * @swagger
 * /cart:
 *   post:
 *     summary: Agregar producto al carrito
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idProducto:
 *                 type: integer
 *               cantidad:
 *                 type: number
 *     responses:
 *       201:
 *         description: Producto agregado al carrito
 */

/**
 * CORTE DE CAJA
 */

/**
 * @swagger
 * tags:
 *   - name: CorteCaja
 *     description: Gestión de corte de caja
 */

/**
 * @swagger
 * /corteCaja:
 *   get:
 *     summary: Obtener ventas del día
 *     tags: [CorteCaja]
 *     responses:
 *       200:
 *         description: Total de ventas del día
 */

/**
 * @swagger
 * /corteCaja:
 *   post:
 *     summary: Realizar corte de caja
 *     tags: [CorteCaja]
 *     responses:
 *       201:
 *         description: Corte de caja registrado
 */

/**
 * PAGOS
 */

/**
 * @swagger
 * tags:
 *   - name: Pagos
 *     description: Gestión de pagos
 */

/**
 * @swagger
 * /pagos:
 *   get:
 *     summary: Obtener todos los pagos
 *     tags: [Pagos]
 *     responses:
 *       200:
 *         description: Lista de pagos
 */

/**
 * @swagger
 * /pagos:
 *   post:
 *     summary: Registrar un pago
 *     tags: [Pagos]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               monto:
 *                 type: number
 *               metodo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pago registrado
 */
