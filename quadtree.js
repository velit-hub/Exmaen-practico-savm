const fs = require("fs");
const { PNG } = require("pngjs");

// Datos es una lista con un numero (0 a 255) por pixel, fila por fila

// nodo del quadtree
class Nodo {
  constructor(fila, col, alto, ancho) {
    this.fila = fila; 
    this.col = col;    
    this.alto = alto;
    this.ancho = ancho;
    this.color = null;  // solo las hojas tienen color
    this.hijos = [];    // hasta 4 hijos, vacio si es hoja
  }

  esHoja() {
    return this.hijos.length === 0;
  }
}

function crearImagen(alto, ancho) {
  return { alto: alto, ancho: ancho, datos: new Uint8Array(alto * ancho) };
}

// Lee un PNG y lo pasa a escala de grises
function cargarImagen(ruta) {
  const png = PNG.sync.read(fs.readFileSync(ruta));
  const img = crearImagen(png.height, png.width);
  for (let i = 0; i < png.width * png.height; i++) {
    const r = png.data[i * 4];
    const g = png.data[i * 4 + 1];
    const b = png.data[i * 4 + 2];
    img.datos[i] = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  }
  return img;
}

// Guarda imagen en escala grises como PNG
function guardarImagen(img, ruta) {
  const png = new PNG({ width: img.ancho, height: img.alto });
  for (let i = 0; i < img.ancho * img.alto; i++) {
    png.data[i * 4] = img.datos[i];
    png.data[i * 4 + 1] = img.datos[i];
    png.data[i * 4 + 2] = img.datos[i];
    png.data[i * 4 + 3] = 255;
  }
  fs.writeFileSync(ruta, PNG.sync.write(png));
}

function revisarRegion(img, fila, col, alto, ancho) {
  let min = 255;
  let max = 0;
  let suma = 0;
  for (let f = fila; f < fila + alto; f++) {
    for (let c = col; c < col + ancho; c++) {
      const p = img.datos[f * img.ancho + c];
      if (p < min) min = p;
      if (p > max) max = p;
      suma += p;
    }
  }
  return { min: min, max: max, promedio: suma / (alto * ancho) };
}

// Construye el quadtree con divide y venceras (recursiva)
function construir(img, fila, col, alto, ancho, tolerancia) {
  const nodo = new Nodo(fila, col, alto, ancho);
  const info = revisarRegion(img, fila, col, alto, ancho);
  if (info.max - info.min <= tolerancia) {
    nodo.color = Math.round(info.promedio);
    return nodo;
  }

  // DIVIDIR: se parte la region por la mitad en alto y en ancho.
  // Si el tamano es impar, la primera mitad queda mas chica y la segunda se queda con el pixel que sobra, asi no se pierde ni se repite ningun pixel
  const mitadAlto = Math.floor(alto / 2);
  const mitadAncho = Math.floor(ancho / 2);
  const partesAlto = [[0, mitadAlto], [mitadAlto, alto - mitadAlto]];
  const partesAncho = [[0, mitadAncho], [mitadAncho, ancho - mitadAncho]];

  // RESOLVER: se llama a la funcion para cada cuadrante
  for (const [df, h] of partesAlto) {
    for (const [dc, w] of partesAncho) {
      if (h === 0 || w === 0) continue;
      // COMBINAR: el nodo padre guarda a sus hijos
      nodo.hijos.push(construir(img, fila + df, col + dc, h, w, tolerancia));
    }
  }
  return nodo;
}

function crearQuadtree(img, tolerancia) {
  return construir(img, 0, 0, img.alto, img.ancho, tolerancia);
}

// Recorre el arbol y pinta cada hoja con su color
function pintar(nodo, salida) {
  if (nodo.esHoja()) {
    for (let f = nodo.fila; f < nodo.fila + nodo.alto; f++) {
      for (let c = nodo.col; c < nodo.col + nodo.ancho; c++) {
        salida.datos[f * salida.ancho + c] = nodo.color;
      }
    }
  } else {
    for (const hijo of nodo.hijos) pintar(hijo, salida);
  }
}

function reconstruirImagen(raiz) {
  const salida = crearImagen(raiz.alto, raiz.ancho);
  pintar(raiz, salida);
  return salida;
}

// Regresa { total, hojas, profundidad }
function contar(nodo, profundidad = 0) {
  if (nodo.esHoja()) {
    return { total: 1, hojas: 1, profundidad: profundidad };
  }
  let total = 1;
  let hojas = 0;
  let maxProf = profundidad;
  for (const hijo of nodo.hijos) {
    const r = contar(hijo, profundidad + 1);
    total += r.total;
    hojas += r.hojas;
    if (r.profundidad > maxProf) maxProf = r.profundidad;
  }
  return { total: total, hojas: hojas, profundidad: maxProf };
}

// ---------- Metricas ----------

function mse(a, b) {
  let suma = 0;
  for (let i = 0; i < a.datos.length; i++) {
    const dif = a.datos[i] - b.datos[i];
    suma += dif * dif;
  }
  return suma / a.datos.length;
}

function bitsOriginal(img) {
  return img.alto * img.ancho * 8;
}

// Formato de almacenamiento (estimacion en bits)
function bitsQuadtree(total, hojas) {
  return 32 + total * 1 + hojas * 8;
}

// Original / comprimido, si sale menor que 1, el quadtree ocupa mas que la imagen
function razonCompresion(bitsO, bitsC) {
  return bitsO / bitsC;
}

module.exports = {
  crearImagen, cargarImagen, guardarImagen,
  crearQuadtree, reconstruirImagen, contar,
  mse, bitsOriginal, bitsQuadtree, razonCompresion,
};
