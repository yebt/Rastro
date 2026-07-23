# Rastro — Especificación del producto

**App personal de seguimiento de ejercicio: GPS (caminar / trotar / correr) + dominadas, con reportes.**
Local-first, sin cuenta, datos en el dispositivo.

Versión del documento: 1.0 · Estado del producto: v1 en uso (app web) → objetivo v2 (app nativa con Capacitor).

---

## 1. Visión

Una sola app para registrar lo que camino/troto/corro y las dominadas que hago, que además me **enseñe cómo mejoro**: no solo cuántos km hice, sino a qué ritmo, con qué cadencia de pasos y cuál es mi zancada eficiente. Todo sin depender de una cuenta ni de la nube.

## 2. Principios y restricciones (no negociables)

- **Sin cuenta.** Nada de login, correo ni registro.
- **Local-first.** Los datos viven en el dispositivo. No hay servidor propio.
- **El usuario es dueño de sus datos.** Exportar/importar siempre disponible; borrado total siempre disponible.
- **Privacidad.** La ubicación nunca sale del dispositivo salvo que el usuario exporte a propósito.
- **Métrico.** Kilómetros, metros, min/km.
- **Español** como idioma de interfaz.
- **Funciona sin internet** para registrar (el mapa base es lo único que pide red).

## 3. Estrategia de plataforma

| Fase | Empaque | Persistencia | GPS con pantalla apagada | Podómetro real |
|------|---------|--------------|--------------------------|----------------|
| **v1 (hoy)** | App web, 1 archivo HTML | `localStorage` | No (el navegador congela la pestaña) | No (solo aproximado por acelerómetro) |
| **v2 (objetivo)** | Nativa vía **Capacitor** (mismo HTML/JS envuelto) | SQLite / almacenamiento nativo + export | **Sí** (geolocalización en segundo plano + servicio en primer plano) | **Sí** (sensor de pasos por hardware) |

Capacitor toma el código web actual y lo convierte en app instalable (Android/iOS) sin reescribir la lógica; lo nuevo entra como *plugins*. Esto confirma que nada de lo hecho se tira.

---

## 4. Estado actual — v1 (implementado y en uso)

App web en un solo archivo (`Rastro.html`). Navegación inferior de 4 pestañas: Registrar · Dominadas · Historial · Datos.

### 4.1 Registrar (GPS)
- Selección de tipo antes de iniciar: **Caminata / Trote / Carrera**.
- Controles: **Iniciar → Pausar/Reanudar → Finalizar**.
- Mapa en vivo (Leaflet + OpenStreetMap) con la ruta dibujada y el punto actual.
- Lectura en vivo estilo reloj GPS: **distancia (km)**, **tiempo**, **ritmo (min/km)**, **velocidad (km/h)**.
- Filtrado de ruido de GPS: descarta puntos con baja precisión (>40 m), micro-movimientos (<2 m) y saltos irreales (>60 m no suman distancia).
- Al finalizar guarda la actividad automáticamente (descarta si fue demasiado corta).

### 4.2 Dominadas
- Contador de reps por serie con stepper (− / +).
- "Agregar serie" acumula series; total de la sesión en vivo; se pueden quitar series antes de guardar.
- Al guardar la sesión, tarjeta de resumen: **total histórico**, **hoy**, **mejor sesión**, **mejor serie**.

### 4.3 Historial
- Lista unificada de salidas y sesiones, ordenada por fecha, con filtros por tipo.
- Cada ítem muestra métricas clave (km/tiempo/ritmo o total/series/mejor serie) y permite **eliminar**.

### 4.4 Datos
- **Exportar** a `.json` (todo el historial).
- **Importar** desde `.json` (combinar o reemplazar).
- **Borrar todo** (con doble confirmación).
- Resumen: nº de actividades, km totales, dominadas totales.

### 4.5 Limitaciones conocidas de v1
- No trackea con pantalla apagada ni en segundo plano (límite del navegador).
- Sin podómetro real ni cadencia.
- Reportes limitados a totales; sin gráficas ni análisis de ritmo.
- Precisión de distancia ~1–3% (GPS de teléfono).

---

## 5. A dónde vamos — features objetivo

Ordenadas por fase. Cada una detallada en §7–§9.
**Estado:** ✅ hecho · 🔧 implementado, falta pulir/validar en dispositivo · ⏳ pendiente.

> **Migración base (no numerada, hecha):** app reescrita a **Astro + Vue 3 (Composition API + TS) + nanostores**, **PWA** (vite-pwa, offline + caché de tiles OSM), **Capacitor Android** (shell nativo + live reload), **puerto de geolocalización** hexagonal (adaptadores web/Capacitor/background), **puerto de persistencia** (IndexedDB/SQLite/memoria), filtro de GPS consciente de precisión (anti-drift), íconos Lucide, ícono de app branded, tooling (Vitest + oxlint/oxfmt). Ver §14 y el código.

### Fase 1.1 — Mejoras rápidas en web (sin cambiar de plataforma)
- ✅ **F1. Wake Lock:** la pantalla no se apaga sola mientras registrás. *(implementado; indicador "pantalla activa")*
- ✅ **F2. Cadencia aproximada por acelerómetro** (`@capacitor/motion`). *Validado en dispositivo (dispara: ~125 ppm + conteo de pasos reales). Detector de pasos + cadencia guardados en `samples.cad` y `activity.steps`; mostrados en vivo y en el detalle. Habilita F8.*
- ✅ **F3. Serie de tiempo por actividad:** muestras (t, distancia, velocidad, cadencia) cada ~3s. *(implementado)*
- ✅ **F4. Reportes básicos:** splits por km (drill-down por km) + ritmo/velocidad/cadencia en el tiempo con **tooltip táctil**, eje conmutable tiempo/distancia, y marcadores de inicio/fin en el mapa. *(implementado)*

### Fase 2 — App nativa (Capacitor)
- 🔧 **F5. GPS en segundo plano** (`@capacitor-community/background-geolocation`, servicio en primer plano + notificación). *Código completo y cableado (nativo → `BackgroundGeolocationAdapter`; el permiso de notificación se pide en el setup; el servicio en primer plano de tipo `location` permite pantalla apagada sin `ACCESS_BACKGROUND_LOCATION`). Hint del tracker corregido: en nativo ya dice "podés bloquear la pantalla". **Solo falta validación en dispositivo con pantalla apagada** — no queda código pendiente.*
- 🔧 **F6. Podómetro real por sensor de hardware** (`@capgo/capacitor-pedometer`, `TYPE_STEP_COUNTER`, permiso `ACTIVITY_RECOGNITION`). *Implementado como **contador alterno**: corre en paralelo al acelerómetro (F2) durante cada salida. Se muestran ambos en vivo (pestaña Registrar) y comparados en el detalle; toggle de "fuente por defecto" persistido. Falta: validar precisión en dispositivo y elegir el default definitivo.*
- ✅ **F7. Almacenamiento nativo** (SQLite vía `@capacitor-community/sqlite`, adaptador del puerto de persistencia). *Implementado en nativo; web sigue con IndexedDB. Falta migración IndexedDB→SQLite (opcional).*

### Fase 3 — Análisis y reportes avanzados
- 🔧 **F8. Motor de zancada y cadencia óptima** (la idea central del usuario, §8). *Implementado: `src/lib/stride.ts` (puntos zancada=v/(cad/60), bins de cadencia, cadencia óptima + zona de rendimiento decreciente) con tests; gráfica scatter `StrideChart.vue` (zancada vs cadencia, zona óptima resaltada) + insight en lenguaje humano en el detalle. Falta: validar en dispositivo con cadencia real (depende de F2/F6).*
- 🔧 **F9. Reportes e histogramas** (§9). *Implementado: por-actividad (F4) + **perfil por tramo** (velocidad media denoised a lo largo del recorrido) + **pestaña Progreso** con récords (1k/5k más rápido, salida más larga, mejor sesión/serie), distancia por semana, ritmo y cadencia promedio por semana, dominadas por semana (`src/lib/trends.ts` con tests, `ProgresoTab.vue`, `WeekBars.vue`, `SegmentChart.vue`). Falta: histogramas dominadas §9.3 (mejor serie en el tiempo) y pulir con más datos reales.*
- ⏳ **F10. Récords (PR) automáticos** y **metas** (diaria de dominadas, semanal de km).
- ⏳ **F11. Calorías estimadas** y **progreso semanal**.
- ⏳ **F13. Más tipos de ejercicio** (no solo dominadas). *Backlog: generalizar el modelo de "sesión sin GPS" para registrar otros ejercicios (flexiones, sentadillas, abdominales, plancha por tiempo, etc.) con series/reps o duración. Requiere: catálogo de ejercicios, UI de registro genérica, historial/reportes por tipo. Detalle en §10.*
- ✅ **F12. Vista de ruta y tarjeta para compartir** (§9.5). *Implementado: botón compartir en el detalle → `ShareCard.vue` genera imagen 1080² en canvas (ruta + stats + marca) con **8 temas**: 4 planos (Noche/Papel/Energía/Bosque) + 4 con texturas procedurales offline (Blueprint/Topográfico/Trama/Halftone) + 1 tema **Mapa real** (solo online): basemap vectorial CARTO vía **MapLibre GL** (worker cableado con `?worker&url` + `setWorkerUrl` y `ssr.noExternal` en astro.config, el fix documentado para Vite) renderizado offscreen y capturado a canvas + ruta encima. Compartir Web Share / plugin Share, guardar PNG en Documentos/Rastro. `shareCard.ts`, `routeMap.ts`, `share.ts`. Falta: validar en dispositivo con conexión.*

### Fase 4 — Configuración, UX y nube
- ✅ **F14. Configuración global** (overlay desde engranaje en el topbar): elegir **fuente de pasos** (hardware/acelerómetro, antes de empezar — no en vivo) y **estilo del mapa** (OSM, Voyager, Claro, Oscuro, Topográfico; tiles OSM/CARTO sin API key). *(implementado; `SettingsSheet.vue`, `stores/settings.ts`)*
- ✅ **Fix navegación:** el botón **atrás** de Android ya no cierra la app — cierra overlays, luego vuelve al home, y solo minimiza (sin cortar el tracking) desde el home. *(`@capacitor/app` backButton)*
- ✅ **F15. Pantalla de setup / permisos previos:** onboarding en primera corrida (nativo) que solicita ubicación, notificaciones y actividad física (podómetro de hardware), con explicación de cada uno y estado en vivo; reabrible desde Configuración → "Revisar permisos". *(implementado; `SetupScreen.vue`, `src/permissions.ts`, flag `$setupDone` persistido)*
- ⏳ **F16. Sync online opcional (Google):** respaldo/sincronización opt-in con cuenta de Google cuando haya conexión, sin romper el principio local-first (funciona 100% offline; la nube es un extra). *Futuro.*
- ✅ **F17. Dark mode:** tema Auto / Claro / Oscuro (selector en Configuración → Apariencia), vía `data-theme` en `<html>` + override de variables CSS; "Auto" sigue `prefers-color-scheme`; script anti-flash en `index.astro`; `theme-color` sincronizado. *(implementado; `theme.ts`, `$theme` persistido. El mapa se elige aparte — hay tiles "Oscuro" CARTO.)*

---

## 6. Modelo de datos

### 6.1 Actividad GPS (extendida para soportar análisis)
```json
{
  "id": "a1720000000000",
  "kind": "gps",
  "type": "Trote",                // Caminata | Trote | Carrera
  "date": 1720000000000,          // epoch ms, inicio
  "distance": 5230,               // metros
  "duration": 1740,               // segundos (sin pausas)
  "route": [[lat, lng], ...],     // ruta simplificada
  "samples": [                    // NUEVO: serie de tiempo (Fase 1.1+)
    { "t": 5, "d": 12, "v": 2.4, "cad": 168, "acc": 8 }
    // t=seg desde inicio, d=metros acumulados, v=m/s, cad=pasos/min, acc=precisión m
  ],
  "steps": 4820,                  // NUEVO: total de pasos (Fase 2)
  "source": { "gps": true, "pedometer": "hardware" } // procedencia de los datos
}
```

### 6.2 Sesión de dominadas
```json
{
  "id": "p1720000000000",
  "kind": "dominadas",
  "type": "dominadas",
  "date": 1720000000000,
  "sets": [8, 7, 6, 5],
  "total": 26,
  "notes": ""                     // opcional
}
```

### 6.3 Récords / metas (Fase 3)
```json
{
  "goals": { "pullupsDaily": 30, "kmWeekly": 20 },
  "prs": { "fastest1k": 285, "fastest5k": 1620, "longestRun": 12400,
           "bestPullSession": 42, "bestPullSet": 12 }
}
```
Los PR se recalculan al guardar cada actividad; no se editan a mano.

---

## 7. Especificación de features nuevas

### F1 · Wake Lock (Fase 1.1)
- Al iniciar registro, solicitar `navigator.wakeLock` para mantener la pantalla encendida.
- Reintentar el lock cuando la app vuelve a foco (el lock se pierde al minimizar).
- Liberar al finalizar/pausar. Indicador visual de que la pantalla se mantendrá activa.
- Fallback silencioso si el navegador no lo soporta.

### F5 · GPS en segundo plano (Fase 2, Capacitor)
- Permiso de **ubicación “Siempre”** (background).
- **Android:** servicio en primer plano con notificación persistente “Rastro está registrando”. Sin esto el sistema mata el rastreo.
- **iOS:** modo de fondo de ubicación habilitado; requiere permiso “Siempre” y avisa que aun así conviene probar en el equipo real.
- Requiere un plugin de *background geolocation* de Capacitor. **Nota:** el plugin concreto y su versión mantenida deben verificarse al momento de construir (no fijar de memoria).

### F6 · Podómetro y cadencia (Fases 1.1 y 2)
- **Web (aprox., F2):** leer `DeviceMotion`/acelerómetro, detectar picos de aceleración como pasos, suavizar y calcular cadencia. Funciona solo con pantalla encendida; menos preciso.
- **Nativo (F6):** usar el **sensor de conteo de pasos por hardware** (Android: step counter/detector; iOS: podómetro nativo). Cuenta en segundo plano, gasta muy poca batería. Da pasos y cadencia fiables. El plugin concreto se verifica al construir.
- Cadencia se guarda por muestra en `samples[].cad` para el análisis.

---

## 8. Motor de zancada y “cadencia óptima” (F8, la idea central)

**Objetivo:** entender si acelerar viene de dar más pasos, de pasos más largos, o ambos — y encontrar la cadencia donde el usuario avanza más por cada paso.

### 8.1 Variable correcta a analizar
La comparación limpia **no es cadencia vs distancia total**, sino cadencia vs **velocidad** y **longitud de zancada**, porque:

```
velocidad (m/s) = longitud_de_zancada (m) × cadencia (pasos/s)
longitud_de_zancada = velocidad / cadencia
```

Interpretación (coincide con la intuición del usuario):
- Más pasos/seg **y** más rápido → la zancada se mantuvo → **aceleraste bien.**
- Más pasos/seg **pero** más lento → la zancada se acortó (patalear sin avanzar, típico de fatiga) → **menos eficiente.**

### 8.2 Cómo se calcula
1. Trabajar sobre `samples` (ventanas de ~3–5 s) de cada actividad.
2. Por ventana: velocidad `v`, cadencia `cad`, zancada `stride = v / (cad/60)`.
3. Agrupar por rangos de cadencia (bins) y promediar velocidad y zancada.
4. **Cadencia óptima** = el rango donde la **zancada sigue alta y la velocidad aún sube**; a partir de ahí, si más cadencia ya no da más velocidad, es zona de rendimiento decreciente.

### 8.3 Insight que se le muestra al usuario
- “Tu zancada más eficiente fue a ~X pasos/min (≈ Y m por paso).”
- “Por encima de Z pasos/min dejaste de ganar velocidad → estabas acortando el paso.”

---

## 9. Reportes e histogramas (F9)

### 9.1 Por actividad
- **Mapa de la ruta.**
- **Splits por km:** tabla con ritmo de cada kilómetro.
- **Ritmo/velocidad y cadencia como serie:** líneas a lo largo de la salida, con **eje X conmutable entre tiempo y distancia recorrida** (toggle "Por tiempo / Por distancia"). El eje por distancia permite ver *en qué punto del trayecto* pasó algo (p. ej. "aceleré a partir de los 300 m"), no solo *en qué minuto*.
- **Zancada vs cadencia (dispersión/histograma):** el gráfico clave del §8, resalta la zona óptima.
- **Velocidad vs cadencia:** para ver dónde acelerar deja de rendir.

### 9.2 Tendencias (varias actividades)
- **Distancia por semana** (barras).
- **Ritmo promedio en el tiempo** (línea, para ver si mejora).
- **Cadencia promedio en el tiempo.**
- **Récords:** 1 km más rápido, 5 km más rápido, salida más larga.

### 9.3 Dominadas
- **Reps por semana** (barras).
- **Mejor serie en el tiempo** (línea) y **mejor sesión.**
- **Total acumulado.**

### 9.5 Vista de ruta y tarjeta para compartir (F12)
- **Vista de detalle de la actividad.** Al abrir una salida GPS desde el Historial, pantalla de detalle con el mapa de la ruta completa dibujada (polyline) y el encuadre ajustado a los límites del trazado (`fitBounds`). Usa el campo `route` que ya existe desde v1.
- **Tarjeta compartible ("share card").** Imagen generada **en el dispositivo** con el trazado de la ruta + métricas clave (tipo, distancia, tiempo, ritmo, fecha). Estética consistente con la marca Rastro.
- **Compartir como imagen (PNG).** En web, usar la API **Web Share** (`navigator.share` / `canShare` con archivos) cuando esté disponible; en nativo (Capacitor), usar el plugin **Share**. Fallback: descargar la imagen.
- **Generación 100% local.** La tarjeta se compone en `canvas` con la ruta dibujada; no depende de un servicio externo para la imagen final. Si no hay tiles disponibles offline, degradar a **solo-stats** (ruta sobre fondo liso + métricas) sin romperse.
- **Privacidad.** Compartir es **siempre una acción explícita** del usuario; nunca automática. La ubicación no sale del dispositivo salvo que el usuario comparta a propósito (coherente con §2).

### 9.6 Notas de implementación
- Las gráficas se generan **en el dispositivo** con los datos locales (sin nube).
- Deben degradar bien: si una actividad vieja no tiene `samples`/cadencia, se muestran solo los reportes posibles (distancia/ritmo) sin romperse.
- El cálculo pesado (motor de zancada §8, agregación para gráficas) se recomienda en un **Web Worker** para no bloquear la UI; el tracking GPS y los sensores (`geolocation`, `DeviceMotion`) permanecen en el hilo principal porque no están disponibles en workers.

---

## 10. Otras features de Fase 3

- **F10 · PR y metas:** detección automática de récords al guardar; meta diaria de dominadas y semanal de km, con barra de progreso.
- **F11 · Calorías estimadas:** cálculo aproximado por tipo de actividad, distancia/tiempo y peso del usuario (dato opcional que el usuario ingresa una vez; se guarda local). Siempre etiquetado como *estimado*.
- **F12 · Vista de ruta y tarjeta para compartir:** detalle de la actividad con el mapa de la ruta y una tarjeta compartible (imagen con trazado + stats), generada localmente y compartida solo por acción explícita del usuario. Detalle en §9.5.
- **F13 · Más tipos de ejercicio (backlog):** hoy solo hay dominadas como sesión sin GPS. Generalizar a un catálogo de ejercicios de fuerza/peso corporal (flexiones, sentadillas, abdominales, dominadas, plancha por tiempo…). Modelo: sesión con `exercise` (id/nombre), y series de **reps** o de **duración** según el ejercicio. UI de registro reutilizable (el stepper de series ya sirve), historial y reportes filtrables por ejercicio, PR por ejercicio. Mantiene el principio local-first; no toca el motor GPS. A definir: catálogo fijo vs. ejercicios personalizados del usuario.

---

## 11. Fórmulas de referencia

| Métrica | Fórmula |
|---|---|
| Distancia | Suma de Haversine entre puntos GPS válidos |
| Ritmo (min/km) | `duración_s / distancia_km`, formateado `mm:ss` |
| Velocidad (km/h) | `distancia_km / (duración_s / 3600)` |
| Velocidad instantánea | `Δdistancia_segmento / Δtiempo_segmento` |
| Cadencia (pasos/min) | `pasos / (duración_s / 60)` |
| Longitud de zancada (m) | `velocidad_m_s / (cadencia_pasos_min / 60)` |
| Relación clave | `velocidad = zancada × (cadencia/60)` |
| Calorías (estimado) | Aprox. por MET del tipo de actividad × peso × tiempo |

---

## 12. Permisos y notas por plataforma

- **Ubicación “Siempre”**: obligatoria para el rastreo en segundo plano (Fase 2).
- **Actividad física / sensor de pasos**: para el podómetro nativo.
- **Notificaciones**: para el servicio en primer plano de Android.
- **Android** permite rastreo de fondo confiable con el servicio en primer plano.
- **iOS** es más estricto: requiere permiso “Siempre”, modos de fondo declarados, y probar en el equipo real antes de confiar.

## 13. Requisitos no funcionales

- **Batería:** preferir sensores de hardware (bajo consumo) y muestreo de GPS razonable (p. ej. cada 1–3 s).
- **Precisión:** filtrar ruido de GPS (ya hecho en v1); marcar la distancia como aproximada (~1–3%).
- **Offline:** registrar debe funcionar sin red; solo el mapa base pide internet.
- **Robustez de datos:** import/export versionado; nunca perder datos por un import mal formado (validar antes de escribir).
- **Compatibilidad hacia atrás:** actividades viejas sin `samples` deben seguir mostrándose.

## 14. Decisiones abiertas (para confirmar antes de construir)

1. ¿Pasamos ya a **Capacitor** (Fase 2) o exprimimos primero la web (Wake Lock + cadencia aproximada)?
2. **Android primero** y luego iOS, ¿o ambos desde el inicio?
3. ¿Guardás el **peso** para estimar calorías, o dejamos calorías para después?
4. Nivel de detalle de `samples`: cada cuántos segundos guardar (afecta tamaño de datos y detalle de los reportes).
5. Plugins concretos de *background geolocation* y *podómetro*: **verificar la opción mantenida al día** al momento de construir, no fijarlos ahora.

---

*Fin del documento. Las secciones §7–§10 son la hoja de ruta; §4 es lo ya entregado.*
