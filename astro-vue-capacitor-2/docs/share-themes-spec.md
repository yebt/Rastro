# Share themes v2 — especificación

Extiende el sistema actual de tarjetas compartibles (`src/features/share/`).
Hoy una tarjeta es `layout × palette`, canvas puro, offline. Este documento
**no reemplaza** ese modelo: lo envuelve. `SharePalette` y `ShareLayout`
siguen existiendo; añadimos un `ShareBackground`, una lista de `ShareEffect[]`
y una `ShareTypography`, y un par de layouts/efectos nuevos abstraídos de las
referencias en `/assets`.

Regla de oro que ya sigue `route-card.ts`: **todo es data plana**. Ningún color
ni tamaño hardcodeado en el renderer. Los tres pilares nuevos (foto, mapa,
más layouts) tienen que caber en esa misma forma para no romper el offline ni
los tests.

---

## 1. Config model

Modelo propuesto. Mantiene compatibilidad: una tarjeta v1 es simplemente
`background.kind === "solid"` + `effects: []` + tipografía por defecto.

```ts
// --- lo que ya existe, sin tocar ---
interface SharePalette {
  id: string; label: string;
  bg: string; route: string; ink: string; muted: string;
  startDot: string; endDot: string;
}
interface ShareLayout { id: string; label: string; w: number; h: number; }

// --- NUEVO: de dónde sale el fondo ---
type ShareBackground =
  | { kind: "solid" }                      // usa palette.bg (comportamiento v1)
  | { kind: "gradient"; from: string; to: string; angle: number }
  | { kind: "photo"; src: string; source: PhotoSource; adjust: PhotoAdjust }
  | { kind: "map";   region: MapRegion; style: MapStyleId; view: MapView }
  | { kind: "topo";  region: MapRegion; lineColor: string; step: number }; // curvas de nivel line-art

type PhotoSource = "attachment" | "activityCover" | "library";

// Auto-ajuste de color a partir de la foto (ver §5)
interface PhotoAdjust {
  mode: "auto" | "manual";
  // en "auto" estos se derivan de la imagen; en "manual" los fija el usuario
  overrides?: Partial<Pick<SharePalette, "ink" | "muted" | "route" | "startDot" | "endDot">>;
  scrim: ScrimSpec;            // oscurecido/aclarado para legibilidad
}

// Vista de mapa inclinado (ver §6)
interface MapView { zoom: number; pitch: number; bearing: number; } // pitch = inclinación 3D
type MapStyleId = "carto-dark" | "carto-light" | "carto-voyager" | "topo";
interface MapRegion { bbox: [number, number, number, number]; } // se calcula del track

// --- NUEVO: efectos apilables, se dibujan en orden ---
type ShareEffect =
  | { kind: "scrim"; spec: ScrimSpec }                 // capa de contraste
  | { kind: "vignette"; strength: number }
  | { kind: "grain"; opacity: number; scale: number }
  | { kind: "frostBand"; rect: SlotId; blur: number; tint: string; alpha: number } // banda esmerilada bajo texto
  | { kind: "routeGlow"; blur: number; color?: string } // halo neón sobre la línea
  | { kind: "textShadow"; blur: number; color: string; dx: number; dy: number }
  | { kind: "duotone"; shadow: string; highlight: string } // mapea luminancia a 2 colores
  | { kind: "gridOverlay"; color: string; alpha: number } // retícula técnica / regla de tercios
  | { kind: "waypointDots"; color: string; labeled: boolean }; // puntos numerados sobre el mapa/foto

interface ScrimSpec {
  direction: "top" | "bottom" | "full" | "radial";
  color: string;   // normalmente "#000" o "#fff"
  from: number;    // alpha en el borde
  to: number;      // alpha en el centro/opuesto
}

// --- NUEVO: tipografía como data ---
interface ShareTypography {
  id: string; label: string;
  headline: FontSpec;   // el número gigante
  label: FontSpec;      // etiquetas (tiempo, ritmo)
  meta: FontSpec;       // fecha, coordenadas, wordmark
  numberStyle: "mono" | "condensed";
  uppercase: boolean;
  letterSpacing: number; // px extra, para el look "técnico"
}
interface FontSpec { family: string; weight: number; }

// --- el tema completo ---
interface ShareTheme {
  layoutId: string;
  paletteId: string;
  typographyId: string;        // default: "mono-condensed" (el look v1)
  background: ShareBackground; // default: { kind: "solid" }
  effects: ShareEffect[];      // default: []
}
```

`SlotId` (ver §2) permite que efectos y textos se posicionen relativos a las
regiones del layout en vez de a píxeles absolutos — hoy `route-card.ts` usa
coordenadas mágicas; conviene migrar a slots para que foto/mapa reencuadren
sin reescribir cada `drawX`.

---

## 2. Layouts

Cada layout define un lienzo (`w×h`) y una serie de **slots** (rects
nombrados: `routeSlot`, `titleSlot`, `statsSlot`, `metaSlot`, `wordmarkSlot`).
El renderer pinta fondo → efectos de fondo → ruta → efectos de línea → texto →
efectos de texto. Aspect ratios: `1080²` (feed), `1080×1350` (retrato 4:5),
`1080×1920` (story 9:16), `900²` (card cuadrada tipo vinilo).

**`clasico` (1:1)** — v1. Ruta arriba, bloque de stats abajo-izq.
```
┌──────────────┐
│   ╭───╮      │  routeSlot (top ~55%)
│  ╱     ╲     │
│ TIPO · fecha │
│ 12.4 KM      │  headline
│ 48:05  5:04  │  statsSlot
└──────────────┘
```

**`poster` (4:5)** — v1. Ruta como arte a sangre, título+coords+stat-line centrados.
```
┌────────────┐
│   RASTRO   │
│   ╱╲  ╱╲   │  route fill
│  ╱  ╲╱  ╲  │
│   TRAIL    │  titleSlot (centrado)
│ 4.09°N 76°W│  coords
│ 12k·48m·5:04│ stat-line
└────────────┘
```

**`minimal` (1:1)** — v1. Ruta chica centrada, número enorme, contexto susurro.

**`story` (9:16)** — v1. Tipo·fecha arriba, ruta media, stats apilados abajo.

**`editorial` (4:5) — NUEVO** — de `3e9ee` (Pedra da Mina) y `dde4db`. Foto a
sangre, título en 3 palabras espaciadas edge-to-edge arriba, coordenadas
DMS bajo el título, ruta line-art superpuesta sobre la foto, marcador de pin al
final. Stats mínimos o ausentes.
```
┌────────────┐
│PEDRA DA MINA│  title split full-width
│ 22°25'S 44°W│  coords DMS
│  │         │
│  ╿  ruta   │  route sobre foto
│  ◉ pin      │
│  [ FOTO ]   │
└────────────┘
```

**`overlayStats` (9:16 / 1:1) — NUEVO** — de `15bf` (Strava story), `f185`,
`8c25`. Foto llena el marco; ruta arriba con etiquetas de lugar; stats grandes
apilados y centrados en el tercio inferior sobre scrim. Wordmark abajo.
```
┌────────────┐
│  ╭─────╮   │  route + place labels
│  ╰─────╯   │
│  DISTANCE  │
│  8.17 km   │  stats apiladas centradas
│  59m 39s   │
│  [logo]    │
└────────────┘
```

**`dataGrid` (4:5) — NUEVO** — de `af4c2` (Morning Gravel) y `4fbe`. Título+fecha
arriba-izq, silueta de ruta al centro, stats distribuidos en **rejilla de
esquinas/columnas** (2×2 o 5-col) al pie. Look "dashboard".
```
┌────────────┐
│Title  date │
│    ╭◯╮      │  route silhouette
│   ╰──╯      │
│Dist  Elev Time│
│52k   382  2h11│ grid de stats
└────────────┘
```

**`blueprint` (4:5) — NUEVO** — de `0fa028` (West Trail Guide). Fondo claro/foto
desaturada, **tarjeta esmerilada flotante** con la ruta reducida a segmentos +
cuadraditos en cada vértice, tipografía técnica en rejilla de palabras,
coordenadas en fila superior, waypoints numerados (`06…18`) repartidos sobre la
foto. Muy "mapa técnico / brief".
```
┌────────────┐
│ 43.3°N  39.7°N 42.3°N │  fila de coords
│ ┌─────────┐  ·07      │
│ │WEST TRAIL│ ·09  ·12  │  waypoints num.
│ │ ▪─▪╱▪╲▪  │      ·15  │  frosted card + ruta
│ │06:30 19:00│  [FOTO]  │
│ └─────────┘            │
└────────────┘
```

**`techCard` (1:1) — NUEVO** — de `4c5b` (Invasion breach report). Estética
"ficha de espécimen": headline serif/mono, mini tabla clave→valor, fila de
swatches de la paleta extraída, etiqueta colgante. Útil como variante
"data-card" premium (ruta como red/line-art fina).

---

## 3. Effects

Cada efecto es una pasada sobre el canvas 2D. Orden importa; se aplican en el
orden del array.

| Effect | Cómo se renderiza en canvas 2D |
|---|---|
| `scrim` | `createLinearGradient`/`createRadialGradient` con alpha `from→to`, `fillRect` sobre el fondo. Base de legibilidad para foto/mapa. |
| `vignette` | Radial gradient transparente→negro en los bordes, `globalCompositeOperation="multiply"`. Ver `97ca`, `af4c2`. |
| `grain` | Tile de ruido pre-generado (o `putImageData` con random) a baja opacidad, `overlay`/`soft-light`. Da el look film de `aa880`, `efe87e`, `4062`. |
| `frostBand` | Recorta el rect del slot, `filter="blur(Npx)"` sobre una copia del fondo, encima `tint` con `alpha`. Emula backdrop-blur bajo el texto. Ver `0fa028`, `c7b1` (card de mapa), `53a7`. |
| `routeGlow` | Redibuja la polyline con `shadowBlur` alto y `shadowColor=route` antes del trazo nítido; opcional segunda pasada más ancha con alpha bajo. Neón de `3ccf`, `2e315`, `aa880`. |
| `textShadow` | `shadowColor/Blur/Offset` antes de `fillText`. Sostiene texto blanco sobre foto clara (`3e9ee`, `15bf`). |
| `duotone` | Pasa la foto a gris (luminancia) y mapea a rampa `shadow→highlight` vía `getImageData` o dos capas `multiply`+`lighten`. Ver `2e315`, `aa880`, `66f8`, `3ccf`. |
| `gridOverlay` | Líneas finas equiespaciadas (tercios o rejilla densa) con alpha bajo. Look técnico de `0fa028`, `af4c2`. |
| `waypointDots` | Puntos/cuadrados en vértices muestreados del track o en POIs, con número opcional. `0fa028`, `15bf` (place labels). |

**Marcadores start/end** ya existen (`startDot`/`endDot`). Ampliar el vocabulario:
`dot`, `checkeredFlag` (meta, ver `3ccf`/`aa880`/`c3bd`), `pin` (`3e9ee`),
`ringHollow` (`6f9cc`). Modelarlo como `markerStyle: "dot"|"flag"|"pin"|"ring"`
en la paleta o en el layout.

---

## 4. Typographies

Abstraídas de las referencias. Todas como data (`ShareTypography`).

- **`mono-condensed`** (default v1): Barlow Condensed + Roboto Mono. Número gigante mono.
- **`grotesk-bold`**: sans geométrica bold, stats apiladas (`15bf`, `f185`, `8c25`). Números grandes, etiqueta chica encima en caps.
- **`technical-caps`**: mono, UPPERCASE, `letterSpacing` alto, coordenadas y horas (`0fa028`, `aa880`, `4c5b`). Palabras repartidas en rejilla.
- **`editorial-serif`**: titular serif display + cuerpo mono (`4c5b` Invasion). Para `techCard`.
- **`humanist-light`**: sans ligera, jerarquía por peso no por tamaño (`53a7` EYE, `66f8`). Etiqueta en caps pequeñas + valor debajo.

Tratamientos recurrentes a exponer como flags: `uppercase`, `letterSpacing`,
`numberStyle` (mono tabular vs condensed), unidad en tamaño reducido junto al
número (ya lo hace v1), etiqueta encima vs debajo del valor.

---

## 5. Photo background

Flujo: el usuario adjunta una imagen (o toma la portada de la actividad) →
se dibuja como fondo `cover` del canvas → se ajustan colores para que ruta y
texto queden legibles → se ofrece **auto** o **manual**.

**Pipeline de auto-ajuste de color:**
1. **Downscale** la foto a ~32×32 offscreen y `getImageData`.
2. **Paleta dominante**: quantización simple (median-cut o buckets por celdas
   del cubo RGB). Sacar 3–5 colores + luminancia media.
3. **Decidir tema claro/oscuro**: si luminancia media < umbral → texto claro
   (`ink=#f4f4f4`), si no → texto oscuro. Determina también color del scrim.
4. **Ruta con contraste**: elegir un acento que destaque sobre el fondo
   (color complementario/saturado de la paleta, o un neón fijo tipo naranja
   Strava). Validar contraste (WCAG-ish, ratio ≥ ~3:1) contra la zona donde cae
   la línea; si no pasa, subir a un fallback (blanco/negro).
5. **Scrim de legibilidad**: gradiente automático (bottom-up en stories,
   full en posters) cuya opacidad escala con la varianza de luminancia de la
   zona de texto — foto ruidosa ⇒ más scrim. Ver `15bf`, `f185`.
6. **frostBand** opcional bajo el bloque de stats para fotos muy cargadas
   (`0fa028`, `c7b1`).

**Manual override**: los colores derivados (`ink`, `muted`, `route`, dots) se
vuelcan como valores editables (`PhotoAdjust.overrides`). El usuario los toca
y el auto se desactiva para ese campo. Guardar tanto la foto (o su ref) como los
overrides en el registro de galería para re-render determinista.

Notas offline: la foto va embebida como dataURL/blob local — **no rompe el
offline**. Coste: memoria del canvas y tamaño del PNG guardado; considerar
recomprimir a JPEG para el fondo y componer.

---

## 6. Map background (tilted / inclinado)

Objetivo: "pretty maps" como fondo con look **inclinado 3D** (pitch), la ruta
resplandeciente encima, tipo `c7b1` pero con perspectiva (retomando la sesión
previa con MapLibre + tiles CARTO).

**Qué hace falta:**
- **MapLibre GL JS** con un raster/vector style de **CARTO** (`dark-matter`,
  `positron`, `voyager`) o un style topo.
- Encajar el `bbox` del track y setear `MapView`: `zoom`, `pitch` (p. ej. 45–60°
  para el 3D), `bearing` (rotación, alinear la ruta con el eje del card).
- Dibujar la ruta como capa `line` en el mapa (con glow) **o** superponerla en
  canvas tras el snapshot — la primera respeta la perspectiva del pitch, mejor.
- **Snapshot → canvas**: renderizar el mapa a un tamaño fijo y volcarlo como
  imagen de fondo del card (`map.getCanvas()` / `map.once('idle')` →
  `toDataURL`), luego pintar texto/efectos encima con el pipeline normal.
- Reusar todo §5 para color: extraer paleta del snapshot para ajustar texto.

**Tradeoff offline (IMPORTANTE, marcar):** los tiles de CARTO son **remotos**.
Esto **rompe el offline puro** del feature. Mitigaciones:
- **Lazy-load**: el modo `map` sólo se activa bajo demanda; si no hay red, la UI
  lo deshabilita y cae a `solid`/`photo`. MapLibre se carga como chunk aparte
  (dynamic import) para no inflar el bundle base.
- **Cache**: cachear tiles del bbox de la actividad (service worker / Capacitor)
  para re-render posterior sin red.
- Alternativa 100% offline: **`topo`** (curvas de nivel / calles como line-art
  generadas de datos vectoriales locales o del propio track), sin tiles — mismo
  look "mapa" sin dependencia remota. Buen fallback y estética coherente con
  `blueprint`.

Guardar en la galería el snapshot ya rasterizado (no la vista viva) para que la
tarjeta sea reproducible aunque luego no haya red.

---

## 7. Open questions

1. **¿Migrar `route-card.ts` a slots** (rects nombrados) antes de meter foto/mapa,
   o parchear coordenadas por layout? Slots es más trabajo ahora pero evita
   reescribir cada `drawX` cuando el fondo cambie el encuadre.
2. **Almacenamiento de fotos**: ¿embeber dataURL en el registro de galería
   (simple, pesado) o guardar blob/archivo y referenciar? Afecta tamaño de la DB.
3. **Mapa y offline**: ¿aceptamos la dependencia de red para `map` (lazy) o
   priorizamos `topo` vectorial local como el "look mapa" oficial? Decidir el
   default.
4. **Contraste automático**: ¿umbral fijo o WCAG real por zona de texto? ¿Qué
   fallback cuando la foto no permite ningún acento legible (blanco/negro puro)?
5. **Cuántos temas exponer**: el modelo permite combinatoria enorme
   (layout × palette × typography × background × effects). ¿Curar N presets
   nombrados o dejar todo abierto en la UI? Sugerido: presets curados + "avanzado".
6. **Marcadores**: ¿`markerStyle` vive en la paleta o en el layout? (flag/pin/ring
   dependen más del layout que del color).
7. **Peso del bundle**: MapLibre + posibles fuentes display. Confirmar que van por
   dynamic import y no tocan el arranque offline.
```
