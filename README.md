# Compresión de imágenes con Quadtree

Proyecto de Diseño y Análisis de Algoritmos. Comprime imágenes en escala de grises con un Quadtree hecho con divide y vencerás, y mide qué tanto se comprime y cuánto error hay.

## Archivos

- `quadtree.js`: el Quadtree (construir, reconstruir, contar nodos) y las métricas (MSE y razón de compresión).
- `experimentos.js`: genera las imágenes de prueba, corre los 27 experimentos y guarda los resultados.
- `prueba_impares.js`: prueba con imágenes de tamaño impar (la reconstrucción con tolerancia 0 debe quedar igual).
- `ejemplo_real.js`: corre el Quadtree con una imagen real (PNG de cualquier tamaño) y guarda la evidencia. Ejemplo: `node ejemplo_real.js imagenes_prueba/real_1300x740.png real_hollowknight 0 10 30 60`.
- `resultados.csv`: tabla con todos los resultados.
- `graficas.html`: las 3 gráficas (se abre en el navegador, necesita internet para cargar Chart.js).
- `imagenes_prueba/`: imágenes que se generan (uniforme, bloques y detalle, de 64, 128 y 256 px).
- `evidencia/`: 3 ejemplos con imagen original, imagen reconstruida y métricas.

## Dependencias

Node.js (se probó con la versión 22) y una biblioteca:

```
npm install
```

- `pngjs`: solo para leer y guardar archivos PNG.
- `Chart.js`: se carga desde internet en `graficas.html` para dibujar las gráficas.

El Quadtree está hecho a mano, sin bibliotecas.

## Cómo correrlo

```
npm install
node experimentos.js
node prueba_impares.js
```

Las imágenes se generan con una semilla fija, así que los resultados salen iguales cada vez, después abre `graficas.html` en el navegador.

Para usar una imagen propia (PNG):

```js
const q = require("./quadtree");
const img = q.cargarImagen("mi_imagen.png");
const raiz = q.crearQuadtree(img, 10);       // 10 = tolerancia
const rec = q.reconstruirImagen(raiz);
q.guardarImagen(rec, "reconstruida.png");
```

## resumen de cómo funciona

- Una región es uniforme si `máximo - mínimo <= tolerancia`. Con tolerancia 0 todos los píxeles deben ser iguales.
- Si es uniforme, se guarda como una hoja con el color promedio.
- Si no, se divide en 4 cuadrantes y se repite. Si el tamaño es impar, un cuadrante queda con un píxel más. Si alguna medida es 1, no se crean cuadrantes vacíos.
- Tamaño estimado en bits: 32 de encabezado + 1 bit por nodo + 8 bits por hoja.
- Razón de compresión = bits de la imagen original / bits del Quadtree.

## Imagen real

`imagenes_prueba/real_1300x740.png` es una ilustración del videojuego Hollow Knight (arte promocional, del estudio Team Cherry). Se usó solo como ejemplo para este trabajo escolar.

Fuente: Team Cherry. (s. f.). *Hollow Knight* [ilustración]. Recuperado el 10 de octubre de 2026 de https://images.squarespace-cdn.com/content/v1/606d159a953867291018f801/7dc1dbea-b5fc-4c8f-8768-1a5c3ede53e3/HK_header.jpg

## Uso de IA

Este proyecto se hizo con ayuda de un asistente de IA (Claude), incluyendo correcciones en las explicaciones escritas
