const app = require('./app');
const DEFAULTPORT = 3000;
const PORT = process.env.PORT || DEFAULTPORT;
app.listen(PORT, () => {
  console.log(`Servidor de Marjorie Store corriendo en http://localhost:${PORT}`);
  console.log(`Documentación API: http://localhost:${PORT}/api-docs`);
});
