# Reporte de brechas v1 → v2 (Rastro)

Comparación entre la app **v1** (`astro-vue-capacitor/`) y la **v2**
(`astro-vue-capacitor-2/`). Objetivo: identificar qué implementaba v1 que v2 no
tiene o resuelve distinto. Rutas absolutas; identificadores en inglés.

> Nota de método: se leyeron directamente los módulos de persistencia, backup,
> share, charts y metrics de ambos árboles. Cada afirmación cita el archivo y la
> función/constante concreta.

---

## Prioridad 1 — Persistencia / "guardar la info en carpetas para no perderla"

### Cómo lo hace v1

v1 tiene **DOS capas** de durabilidad, y la clave que recuerda el usuario
("carpetas") es la **segunda**:

**1. Motor de almacenamiento (repositorio, patrón hexagonal).**
`astro-vue-capacitor/src/persistence/` define el puerto
`ActivityRepository` (`repository.ts`) y **tres** adaptadores seleccionados en
tiempo de ejecución por `createRepository()` (`index.ts`):

- Nativo (Capacitor) → `SqliteAdapter` (`sqlite.ts`): tabla `activities` con
  `id/date/kind/data` donde `data` es el JSON completo de la actividad. Base
  `rastro`, `INSERT OR REPLACE`, `executeSet` para bulk.
- Navegador → `IndexedDBAdapter` (`indexeddb.ts`).
- Tests/SSR → `MemoryAdapter` (`memory.ts`).

**2. Respaldo en archivos dentro de una CARPETA (lo que el usuario pide).**
`astro-vue-capacitor/src/backup.ts` escribe un **único archivo JSON con TODAS
las actividades** en `Documents/Rastro/`:

```ts
// backup.ts — saveBackup()
const BACKUP_DIR = "Rastro";
await Filesystem.writeFile({
  path: `${BACKUP_DIR}/${filename}`,   // p.ej. Rastro/rastro-2024-05-13_090507.json
  data: json,
  directory: Directory.Documents,       // carpeta visible al usuario
  encoding: Encoding.UTF8,
  recursive: true,                      // crea Documents/Rastro si no existe
});
```

- Si `Documents` no es escribible, hace *fallback* a `Directory.Cache`.
- El payload lo arma `backupJson()` en
  `astro-vue-capacitor/src/components/DatosTab.vue`:
  `{ app: 'Rastro', version: 1, exportedAt, units: 'km', activities }`, con
  nombre `rastro-<backupStamp>.json`.
- `cleanOldBackups(keep)` (backup.ts) hace `Filesystem.readdir` sobre la
  carpeta, ordena por nombre (cronológico) y borra las viejas con
  `Filesystem.deleteFile`, conservando la más reciente.
- `shareBackup()` (backup.ts) escribe a `Cache` y lo pasa a `Share.share`
  (Drive, correo…). En web usa `navigator.share` con *fallback* a descarga.
- **Restauración/import**: `DatosTab.vue → onFile()` lee un `.json` con un
  `<input type=file>`, `JSON.parse`, y llama
  `importActivities(data, mode)` (`stores/activities.ts`) que valida con
  `extractActivities` y fusiona con `mergeActivities` en modo `merge` o
  `replace` (pregunta al usuario con `confirm`).
- `clearAllActivities()` con doble confirmación.
- La **imagen** del share también se guarda en la misma carpeta:
  `astro-vue-capacitor/src/share.ts → saveImage()` escribe
  `Rastro/<archivo>.png` en `Directory.Documents` (recursive).

UI completa de respaldo en `DatosTab.vue`: botones "Guardar copia",
"Compartir", "Limpiar copias viejas", "Importar datos", "Borrar todo".

### Qué tiene v2

- Puerto `ActivityRepository` en
  `astro-vue-capacitor-2/src/features/tracking/ports/activity-repository.ts` y
  **solo dos** adaptadores: `createIdbRepository` (`adapters/idb-repository.ts`,
  IndexedDB, base `rastro`, store `activities`, índice `by-startedAt`) y
  `memory-repository.ts`. **No hay adaptador SQLite** (se eliminó la dependencia
  `@capacitor-community/sqlite` del `package.json`).
- **No hay backup/export/import**. `DataSettings.vue`
  (`src/features/settings/pages/DataSettings.vue`) muestra "Exportar → Próximamente"
  e "Importar → Próximamente" como filas **no interactivas**. Solo funciona
  "Borrar actividades" (`activityRepository().clear()`).
- El PNG del share se escribe **solo a `Directory.Cache`**
  (`src/features/share/share-route.ts → shareImage`), es decir, temporal; no hay
  copia en `Documents/Rastro`.
- Sí existe una galería de imágenes compartidas persistida en IndexedDB
  (`gallery-store.ts`), pero es solo para re-compartir dentro de la app, no
  archivos accesibles al usuario.

### Brecha

| Aspecto | v1 | v2 |
|---|---|---|
| Export JSON a archivo | Sí, `Documents/Rastro/*.json` | **No** (Próximamente) |
| Import/restore | Sí (merge/replace) | **No** |
| Compartir respaldo (Share sheet) | Sí | **No** |
| Limpiar copias viejas | Sí | **No** |
| Archivos visibles/portables al usuario | Sí (Documents) | **No** (IndexedDB opaco) |
| Sobrevive desinstalación de la app | Sí (Documents queda) | **No** (IndexedDB se borra) |
| PNG guardado en Documents | Sí (`saveImage`) | **No** (solo Cache temporal) |
| Motor nativo | SQLite + IndexedDB | Solo IndexedDB |

**Qué da la "carpeta" de v1 que IndexedDB de v2 NO da:** portabilidad
(archivo `.json` copiable a Drive/PC), supervivencia ante desinstalación o
"borrar datos" del sistema, y recuperación manual. IndexedDB es cómodo y rápido
pero es una caja negra ligada al ciclo de vida del WebView.

### Recomendación

1. **Adaptador de respaldo, no cambiar el motor.** Mantener IndexedDB como
   repositorio activo (es buena decisión) y portar `backup.ts` como una feature
   nueva `src/features/backup/` con dos casos de uso sobre el puerto existente
   (`activityRepository().list()` / `replaceAll`-equivalente):
   - `exportBackup()`: arma `{ app, version, exportedAt, activities }` y llama
     `Filesystem.writeFile({ path: 'Rastro/rastro-<stamp>.json', directory:
     Directory.Documents, recursive: true })` con *fallback* a `Cache`.
   - `importBackup(file)`: `input[type=file]` → `JSON.parse` → validar →
     `save`/`clear` por lote. Falta añadir un `replaceAll`/`saveMany` al puerto
     `ActivityRepository` (hoy solo tiene `save/get/list/remove/clear`).
   - `shareBackup()` reusando `@capacitor/share` (ya es dependencia).
2. **Cablear `DataSettings.vue`**: reemplazar los "Próximamente" por estas
   acciones + "Limpiar copias viejas" (`readdir`/`deleteFile`).
3. **`saveImage` para el share**: añadir en `share-route.ts` la variante que
   escribe el PNG a `Documents/Rastro` (como v1) además del Cache.
4. Opcional: *auto-backup* silencioso tras cada guardado (v1 dejaba el gancho
   con `cleanOldBackups(1)`).

---

## Prioridad 2 — Share / tarjeta de ruta

### Cómo lo hace v1

Renderizador en `astro-vue-capacitor/src/shareCard.ts` (canvas 2D, 1080×1080) +
`ShareCard.vue` (UI) + `routeMap.ts` (mapa real) + `share.ts` (share/save).

**Modelo de tema (`ShareTheme` en shareCard.ts):** `bg` (color sólido o
`[top,bottom]` para gradiente vertical), `route`, `text`, `sub`, `accent`,
`texture?`, `textureColor?`, `requiresOnline?`, `mapStyle?`.

**11 temas (`SHARE_THEMES`):**

- Planos sin textura: `noche`, `papel`, `energia` (gradiente naranja→rojo),
  `bosque` (gradiente verde).
- Con **textura procedural** (`drawTexture`):
  - `blueprint` → `grid` (rejilla de líneas cada 64px).
  - `topografico` → `topo` (curvas de nivel con `sin()`).
  - `trama` → `streets` (líneas aleatorias tipo calles, PRNG `mulberry32`).
  - `halftone` → **gradiente violeta `[#2b1055,#7b2ff7]` + patrón de PUNTOS**
    cuyo radio crece con la posición (`r = 2 + ((x+y)/(2·size))·8`).
    **← ésta es la segunda tarjeta que mostró el usuario.**
- Con **mapa real** (`requiresOnline: true`): `mapa` (voyager), `mapa-noche`
  (dark), `mapa-claro` (light). **← primera tarjeta del usuario ("Caminata",
  calles reales, CARTO).**

**Cómo se produce cada fondo:**

- Plano/gradiente/textura → `drawShareCard()`: `fillBackground` (sólido o
  `createLinearGradient`), `drawTexture`, `drawRoute`, `drawCardText`.
- Mapa real → `routeMap.ts::renderRouteMap()`: crea un `maplibre-gl` **Map**
  offscreen con basemap **raster de CARTO**
  (`https://{a-d}.basemaps.cartocdn.com/{voyager|dark_all|light_all}/{z}/{x}/{y}.png`),
  añade la ruta como capa `line` (casing + line) y marcadores `circle`
  (inicio verde `#12A150`, fin naranja `#ff5a1f`), hace `fitBounds`, captura el
  canvas con `preserveDrawingBuffer`. Luego `composeMapCard()` (shareCard.ts)
  dibuja el mapa + **`frostBands`** (blur progresivo tipo vidrio esmerilado en
  bandas superior/inferior con máscara `destination-in`) + scrims (gradientes
  negros arriba/abajo para legibilidad) + sombra por glifo + atribución
  "© OpenStreetMap · CARTO".
- **Cámara personalizable** (solo temas de mapa): `MapView { pitch, bearing,
  zoom }` con sliders en `ShareCard.vue` (Inclinación 0-60°, Rotación 0-360°,
  Zoom ±2).

**Ruta (`drawRoute`):** proyección equirectangular con corrección de longitud
por latitud (`cos(midLat)`), norte arriba, línea 12px `round`, punto inicio
verde / fin `accent`.

**Tipografía:** `Barlow Condensed` (display) + `system-ui`. Wordmark "RASTRO"
con `letterSpacing`, fecha, tipo de actividad grande, 3 stats (Distancia,
Tiempo, Ritmo) + km/h promedio.

**Guardar/compartir (`share.ts`):** `shareImage` (Web Share / `Share.share`
nativo desde Cache) y `saveImage` (PNG a `Documents/Rastro`).

### Qué tiene v2

Arquitectura **más modular** (`src/features/share/`):
`themes.ts` (datos) + `route-card.ts` (render) + `share-route.ts` (envío) +
`gallery-store.ts` (galería IndexedDB) + `ShareScreen.vue` (UI).

- **Tema = layout × palette × typography × background × effects** (todo data-driven).
- **5 layouts con distinta relación de aspecto** (`SHARE_LAYOUTS`): `clasico`
  1080², `poster` 1080×1350, `minimal` 1080², `story` 1080×1920, `overlay`
  1080×1350. **← v1 solo tenía 1080² fijo. Esto es mejor en v2.**
- **5 paletas** (`noche`, `papel`, `oro`, `neon`, `mono`) con `startDot`/`endDot`.
- **3 tipografías** (`mono`, `grotesk`, `tecnica`) recombinando Barlow
  Condensed / Roboto / Roboto Mono. **← sistema tipográfico nuevo, mejor que v1.**
- **Fondo foto** (`kind: "photo"`): el usuario sube una imagen local (data URL,
  offline), con auto-ajuste de ink/muted según luminancia media
  (`avgLuminance` + `adjustForPhoto`) y scrim automático. **← nuevo, no existía en v1.**
- **Galería persistida** de tarjetas compartidas (`gallery-store.ts`) para
  re-compartir/borrar. **← nuevo.**
- Efectos **realmente renderizados**: `scrim`, `grain`, `routeGlow`.

### Brecha

**Lo que v1 tenía y v2 NO reproduce hoy:**

1. **Mapa real de fondo (CARTO/MapLibre).** v2 **no tiene** MapLibre (se quitó
   `maplibre-gl` del `package.json`) ni `renderRouteMap`, ni los temas
   `mapa/mapa-noche/mapa-claro`, ni `composeMapCard`, ni `frostBands`, ni la
   cámara `pitch/bearing/zoom`. **La primera tarjeta del usuario (calles reales
   "Caminata") es hoy irreproducible en v2.**
2. **Halftone (segunda tarjeta: violeta + puntos).** v2 **declara** el tipo
   `ShareEffect { kind: "halftone" }` en `themes.ts`, pero `route-card.ts`
   **NO lo renderiza**: el bucle de efectos solo maneja `scrim`/`grain` (+
   `routeGlow`). Tampoco `blur`, `exposure`, `vignette` ni `duotone` — todos son
   **tipos muertos, declarados y no implementados.**
3. **Gradientes de fondo sin UI.** `SHARE_GRADIENTS` (`violeta`, `atardecer`,
   `oceano`, `carbon`) existe en `themes.ts` y el renderer sí pinta
   `bg.kind === "gradient"`, **pero `ShareScreen.vue` no importa `SHARE_GRADIENTS`
   ni ofrece selector de gradiente** (solo paletas sólidas + foto). Es decir, ni
   siquiera el gradiente violeta se puede elegir → refuerza que la tarjeta
   violeta+puntos no es alcanzable.
4. **Texturas procedurales** `grid`/`topo`/`streets` de v1: eliminadas.
5. **Guardar PNG a Documents**: v2 solo persiste el dataURL en IndexedDB
   (galería), no escribe archivo en `Documents/Rastro` (ver Prioridad 1).

**Lo que v2 gana sobre v1** (no perder al portar): layouts multi-formato,
tipografías, fondo foto con auto-contraste, galería persistida, modelo de
efectos apilables.

### Recomendación

1. **Implementar los efectos ya declarados** en `route-card.ts` (bucle de
   `effects`): añadir ramas para `halftone` (portar el patrón de puntos de
   `shareCard.ts::drawTexture`), `blur`, `exposure`, `vignette`, `duotone`.
   Bajo esfuerzo, alto valor: reactiva tipos que ya existen.
2. **Exponer gradientes en la UI**: importar `SHARE_GRADIENTS` en
   `ShareScreen.vue` y añadir un selector "Fondo → Gradiente"; con eso +
   halftone se reconstruye la tarjeta **violeta + puntos** 1:1.
3. **Reintroducir el mapa real** como `background: { kind: "map" }`:
   volver a añadir `maplibre-gl`, portar `routeMap.ts::renderRouteMap` +
   `composeMapCard` (frostBands + scrims + atribución) y la cámara
   `pitch/bearing/zoom`. Marcarlo `requiresOnline` y ocultarlo offline como en v1.
4. Añadir `saveImage`-a-Documents (ver Prioridad 1, punto 3).

---

## Prioridad 3 — Inventario de lo demás notable en v1 ausente en v2

**Métricas y charts interactivos (la brecha más grande después de backup):**

- v1 tiene 5 componentes de gráfico:
  `astro-vue-capacitor/src/components/charts/{LineChart,SegmentChart,SplitsChart,StrideChart,WeekBars}.vue`.
- Cálculo rico en `astro-vue-capacitor/src/lib/reports.ts`: `splitsPerKm`,
  `segmentProfile`, `kmSegment`, `speedSeriesKmh`, `paceSeriesSecPerKm`,
  `cadenceSeriesSpm`, `accelerationStats`, `fastestSplit`, `avgCadence`.
- Tendencias en `astro-vue-capacitor/src/lib/trends.ts`: `weeklyDistanceKm`,
  `weeklyAvgPaceSecPerKm`, `weeklyAvgCadence`, `weeklyPullups`,
  `fastestWindowSec`, `computeRecords` (PRs/récords).
- `ActivityDetail.vue` (v1) muestra splits seleccionables por km + ritmo/velocidad
  sobre tiempo/distancia + análisis de zancada; `ProgresoTab.vue` muestra
  récords + barras semanales (`WeekBars`) + `LineChart` de tendencias.
- **v2**: `metrics.ts` solo calcula escalares
  (`distanceMeters`, `movingDurationMs`, `avgSpeedMps`, `avgPaceSecPerKm`,
  `elevationGainM/LossM`, `hasElevation`). `ActivityDetail.vue` (v2) muestra
  `RouteMap` + stats numéricos (ritmo, desnivel), **sin ningún chart**.
  `summary.ts` solo agrega totales semanales + racha. **No existe ningún
  componente de gráfico en v2** (`fd chart` no encuentra nada). → Portar
  `reports.ts`/`trends.ts` + los charts es el mayor delta de valor tras backup.

**Mapa en detalle de actividad:** ambos usan Leaflet (`leaflet` sigue en v2).
v1 `mapTiles.ts` permite **cambiar de estilo de basemap** según
`stores/settings` (`$mapStyle`); v2 `RouteMap.vue` — verificar si mantiene el
selector de estilo (v1 lo tenía explícito).

**Adaptador SQLite nativo:** presente en v1 (`persistence/sqlite.ts`), eliminado
en v2 (solo IndexedDB). Perder SQLite no es crítico si se añade backup a
archivos, pero conviene decidirlo conscientemente.

**Theming / color de acento:** v1 `theme.ts` solo hace claro/oscuro/auto
(`data-theme`, meta `theme-color`); **no encontré** un sistema de acento
personalizable con guarda WCAG en v1 (el término no aparece en `theme.ts`). En
v2, `AppearanceSettings.vue` anuncia acento "Próximamente — con contraste
garantizado en claro y oscuro". → El acento WCAG es trabajo futuro en **ambas**;
no es una regresión de v2, es un feature no hecho.

**Paridad ya lograda en v2 (no son brechas):**

- Onboarding/setup: v2 tiene `src/features/setup/` (SetupScreen + steps
  Identity/Measures/Permissions) — equivalente o superior a `SetupScreen.vue` de v1.
- Notificaciones: `@capacitor/local-notifications` sigue en v2
  (`features/permissions/permissions.ts`, geolocalización en background).
- Geolocalización background, pedómetro/motion, filtros Kalman: v2 los tiene
  bien modularizados en `features/geolocation`, `features/motion`,
  `features/tracking/domain/{kalman,clean,filters}`.
- Home dashboard: v2 `HomeScreen.vue` + `summary.ts` (totales semana + racha).

---

## Ranking por valor para el usuario

1. **Backup/export/import a archivos en `Documents/Rastro`** (Prioridad 1) —
   evita pérdida de datos; hoy v2 no tiene NADA (solo "Próximamente").
2. **Charts interactivos + métricas ricas** (splits, ritmo/velocidad, récords,
   tendencias) — v2 los perdió por completo.
3. **Tarjeta con mapa real (CARTO/MapLibre) + cámara** — primera tarjeta del usuario.
4. **Halftone + gradientes en el share** (implementar efectos ya declarados +
   UI de gradiente) — segunda tarjeta del usuario; esfuerzo bajo.
5. **Guardar el PNG del share en Documents** (no solo Cache).
6. Reconsiderar adaptador SQLite nativo (menor prioridad si hay backup a archivos).
