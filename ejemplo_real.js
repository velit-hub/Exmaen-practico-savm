// Prueba con una imagen real (PNG de cualquier tamano).
// Uso: node ejemplo_real.js ruta_de_la_imagen.png nombre 0 10 30
const fs = require("fs");
const q = require("./quadtree");

const ruta = process.argv[2] || "imagenes_prueba/real_1300x740.png";
const nombre = process.argv[3] || "real";
const tolerancias = process.argv.slice(4).map(Number);
if (tolerancias.length === 0) tolerancias.push(0, 10, 30, 60);

const img = q.cargarImagen(ruta);
fs.mkdirSync("evidencia", { recursive: true });
q.guardarImagen(img, `evidencia/${nombre}_original_gris.png`);
console.log(`Imagen ${img.ancho}x${img.alto} (${img.ancho * img.alto} pixeles)`);

for (const tol of tolerancias) {
  const inicio = process.hrtime.bigint();
  const raiz = q.crearQuadtree(img, tol);
  const tiempo = Number(process.hrtime.bigint() - inicio) / 1e9;

  const c = q.contar(raiz);
  const rec = q.reconstruirImagen(raiz);
  const bitsO = q.bitsOriginal(img);
  const bitsC = q.bitsQuadtree(c.total, c.hojas);
  const datos = {
    tiempo_seg: Number(tiempo.toFixed(5)), nodos: c.total, hojas: c.hojas,
    profundidad: c.profundidad, bits_original: bitsO, bits_quadtree: bitsC,
    razon_compresion: Number(q.razonCompresion(bitsO, bitsC).toFixed(3)),
    mse: Number(q.mse(img, rec).toFixed(3)),
  };

  q.guardarImagen(rec, `evidencia/${nombre}_tol${tol}_reconstruida.png`);
  let texto = `Configuracion: imagen ${img.ancho}x${img.alto} (escala de grises), tolerancia ${tol}\n`;
  for (const k in datos) texto += `${k}: ${datos[k]}\n`;
  fs.writeFileSync(`evidencia/${nombre}_tol${tol}_metricas.txt`, texto);
  console.log(`tol ${tol}:`, JSON.stringify(datos));
}
