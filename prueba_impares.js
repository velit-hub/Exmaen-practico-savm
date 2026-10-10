// Prueba sencilla: con imagenes de tamano impar (o que no son potencia de 2)
// y tolerancia 0, la imagen reconstruida debe ser IGUAL a la original.
const q = require("./quadtree");

const tamanos = [[1, 1], [1, 7], [5, 3], [37, 65], [100, 100]];

for (const [alto, ancho] of tamanos) {
  const img = q.crearImagen(alto, ancho);
  for (let i = 0; i < img.datos.length; i++) img.datos[i] = (i * 37) % 256;

  const raiz = q.crearQuadtree(img, 0);
  const rec = q.reconstruirImagen(raiz);
  const error = q.mse(img, rec);
  console.log(`${ancho}x${alto}: MSE = ${error} ->`, error === 0 ? "bien" : "MAL");
}
