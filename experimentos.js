const fs = require("fs");
const q = require("./quadtree");

const TAMANOS = [64, 128, 256];
const TOLERANCIAS = [0, 10, 30]; // 0 = uniformidad exacta
const TIPOS = ["uniforme", "bloques", "detalle"];

// Numeros random pero siempre iguales para que se pueda repetir (semilla)
let semilla = 1;
function azar() {
  semilla = (semilla * 1664525 + 1013904223) % 4294967296;
  return semilla / 4294967296;
}

// genera imagenes de prueba
function generarImagen(tipo, n) {
  const img = q.crearImagen(n, n);
  for (let f = 0; f < n; f++) {
    for (let c = 0; c < n; c++) {
      let valor = 0;
      if (tipo === "uniforme") {
        valor = 128;
      } else if (tipo === "bloques") {
        // 4 cuadros de colores y un cuadro en el centro
        if (f < n / 2) valor = c < n / 2 ? 50 : 200;
        else valor = c < n / 2 ? 120 : 250;
        if (f >= n / 4 && f < (3 * n) / 4 && c >= n / 4 && c < (3 * n) / 4) valor = 90;
      } else {
        const ruido = (azar() + azar() + azar() + azar() - 2) * 60;
        valor = (c / (n - 1)) * 255 + ruido;
      }
      img.datos[f * n + c] = Math.max(0, Math.min(255, Math.round(valor)));
    }
  }
  return img;
}

function correrExperimento(img, tolerancia) {
  const inicio = process.hrtime.bigint();
  const raiz = q.crearQuadtree(img, tolerancia);
  const fin = process.hrtime.bigint();
  const tiempoSeg = Number(fin - inicio) / 1e9;

  const cuenta = q.contar(raiz);
  const rec = q.reconstruirImagen(raiz);
  const bitsO = q.bitsOriginal(img);
  const bitsC = q.bitsQuadtree(cuenta.total, cuenta.hojas);

  const datos = {
    tiempo_seg: Number(tiempoSeg.toFixed(5)),
    nodos: cuenta.total,
    hojas: cuenta.hojas,
    profundidad: cuenta.profundidad,
    bits_original: bitsO,
    bits_quadtree: bitsC,
    razon_compresion: Number(q.razonCompresion(bitsO, bitsC).toFixed(3)),
    mse: Number(q.mse(img, rec).toFixed(3)),
  };
  return { rec: rec, datos: datos };
}

function guardarEvidencia(nombre, original, rec, datos, tolerancia) {
  fs.mkdirSync("evidencia", { recursive: true });
  q.guardarImagen(original, `evidencia/${nombre}_original.png`);
  q.guardarImagen(rec, `evidencia/${nombre}_reconstruida.png`);
  let texto = `Configuracion: imagen ${original.ancho}x${original.alto}, tolerancia ${tolerancia}\n`;
  for (const clave in datos) texto += `${clave}: ${datos[clave]}\n`;
  fs.writeFileSync(`evidencia/${nombre}_metricas.txt`, texto);
}

// Crea una pagina con las graficas (usa Chart.js desde internet)
function guardarGraficas(filas) {
  const colores = { uniforme: "#2a9d8f", bloques: "#e9a820", detalle: "#d1495b" };
  const todas = {
    tiempo: [],
    hojas: [],
    compresion: [],
  };
  for (const tipo of TIPOS) {
    todas.tiempo.push({
      label: tipo, borderColor: colores[tipo], backgroundColor: colores[tipo],
      data: filas.filter(r => r.tipo === tipo && r.tolerancia === 10)
        .map(r => ({ x: r.pixeles, y: r.tiempo_seg })),
    });
    todas.hojas.push({
      label: tipo, borderColor: colores[tipo], backgroundColor: colores[tipo],
      data: filas.filter(r => r.tipo === tipo && r.tamano === "256x256")
        .map(r => ({ x: r.tolerancia, y: r.hojas })),
    });
    todas.compresion.push({
      label: tipo, borderColor: colores[tipo], backgroundColor: colores[tipo],
      showLine: false,
      data: filas.filter(r => r.tipo === tipo).map(r => ({ x: r.mse, y: r.razon_compresion })),
    });
  }

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Graficas del proyecto Quadtree</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js"></script>
</head>
<body style="font-family: sans-serif; max-width: 700px; margin: auto;">
<h2>Graficas del proyecto Quadtree</h2>
<h3>1. Tiempo vs numero de pixeles (tolerancia 10)</h3>
<canvas id="g1"></canvas>
<h3>2. Hojas vs tolerancia (imagenes de 256x256, escala log)</h3>
<canvas id="g2"></canvas>
<h3>3. Razon de compresion vs MSE (todos los experimentos, escala log)</h3>
<canvas id="g3"></canvas>
<script>
const datos = ${JSON.stringify(todas)};
function hacer(id, datasets, xTitulo, yTitulo, log) {
  new Chart(document.getElementById(id), {
    type: "scatter",
    data: { datasets: datasets },
    options: {
      showLine: true,
      scales: {
        x: { title: { display: true, text: xTitulo } },
        y: { type: log ? "logarithmic" : "linear", title: { display: true, text: yTitulo } },
      },
    },
  });
}
hacer("g1", datos.tiempo, "Numero de pixeles", "Tiempo (segundos)", false);
hacer("g2", datos.hojas, "Tolerancia", "Numero de hojas", true);
hacer("g3", datos.compresion, "MSE", "Razon de compresion", true);
</script>
</body>
</html>`;
  fs.writeFileSync("graficas.html", html);
}

function main() {
  fs.mkdirSync("imagenes_prueba", { recursive: true });
  const filas = [];
  // estos 3 ejemplos se guardan como evidencia
  const evidencia = ["bloques_256_10", "detalle_256_30", "uniforme_128_0"];

  for (const tipo of TIPOS) {
    for (const n of TAMANOS) {
      const img = generarImagen(tipo, n);
      q.guardarImagen(img, `imagenes_prueba/${tipo}_${n}.png`);
      for (const tol of TOLERANCIAS) {
        const r = correrExperimento(img, tol);
        filas.push({
          imagen: `${tipo}_${n}`, tipo: tipo, tamano: `${n}x${n}`,
          pixeles: n * n, tolerancia: tol, ...r.datos,
        });
        if (evidencia.includes(`${tipo}_${n}_${tol}`)) {
          guardarEvidencia(`${tipo}_${n}_tol${tol}`, img, r.rec, r.datos, tol);
        }
      }
    }
  }

  // guardar CSV
  const columnas = Object.keys(filas[0]);
  let csv = columnas.join(",") + "\n";
  for (const fila of filas) csv += columnas.map(c => fila[c]).join(",") + "\n";
  fs.writeFileSync("resultados.csv", csv);

  guardarGraficas(filas);

  // imprimir tabla 
  console.log("imagen          tol    tiempo   nodos   hojas  prof    razon      mse");
  for (const r of filas) {
    console.log(
      r.imagen.padEnd(15), String(r.tolerancia).padStart(3),
      String(r.tiempo_seg).padStart(9), String(r.nodos).padStart(7),
      String(r.hojas).padStart(7), String(r.profundidad).padStart(5),
      String(r.razon_compresion).padStart(8), String(r.mse).padStart(8)
    );
  }
}

main();
