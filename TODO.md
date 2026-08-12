# TODO — Rastro v2

Roadmap de objetivos. Es el "qué queremos alcanzar", no el "cómo" definitivo.
Se trabaja con **refactors incrementales sobre base estable**, de a poco, y la
**UI/UX se acuerda en conjunto antes de construir** cada parte.

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecho.
App activa: `astro-vue-capacitor-2/` (Astro + isla Vue + Capacitor, arquitectura
hexagonal, diseño monocromo, offline-first / local-first / sin cuenta).

---

## 1. Navegación y estructura

- [x] Shell de navegación v2 con tabs (Home · Actividad · Info).
- [x] Home / dashboard base.
- [x] Ajustes / datos como vista propia (tab **Info**, antes "Perfil"): sin card
      de nombre, arranca con totales de por vida + accesos a Calendario/Historial.

## 2. Calendario y racha

- [x] Vista de calendario (caminar / trotar / correr / ejercicios).
- [x] Racha (streak) de días activos (en los totales de Info).

## 3. Ejercicios y rutinas

- [x] Modelo generalizado de ejercicios (no solo dominadas).
- [x] Conteo estilo v1: card de stats (total / hoy / mejor sesión / mejor serie)
      + stepper.
- [x] UX de series: el conteo **persiste** y se re-aplica sin re-tipear N; ± solo
      cuando una serie difiere.
- [x] Catálogo editable y persistido (seed: solo dominadas). Agregar / renombrar /
      borrar, con **warning** si se borra un ejercicio usado en una rutina.
- [x] Rutinas = circuitos ("vuelta = serie"): modelo + store + builder (Fase 1).
- [x] **Fase 2 — player guiado**: correr la rutina con descansos cronometrados
      (pausar/reanudar, +15s, saltar) y **reiniciar con confirmación**.
- [x] **Fase 3 — guardar sesión de rutina** como actividad (RoutineActivity),
      visible en historial/detalle/calendario y sumada a los reps de Info.

## 4. Métricas (repensar a fondo)

- [x] Métricas base: distancia, tiempo, ritmo, velocidad, desnivel, pausas, pasos.
- [x] **Splits por km** (barras, más rápido resaltado) + **velocidad en el tiempo**
      (gráfica de línea SVG) en el detalle. Dominio puro `analytics.ts`.
- [x] Métricas extra en el detalle: mejor km, cadencia media, zancada media, desnivel −.
- [x] **Progreso** (Info): tendencias de distancia y velocidad por tipo entre
      salidas + récords (salidas, km más largo, mejor ritmo). `progress.ts`.
- [ ] Zancada/cadencia **en el tiempo** (requiere capturar pasos por punto GPS
      durante la grabación — cambio en el modelo de datos).
- [ ] Zonas de esfuerzo, dónde apreté / dónde caí por tramo.

## 5. Share card del rastro

- [x] Vista de compartir (no share instantáneo) con **preview en vivo**.
- [x] Temas = **layout × paleta** (4 layouts: Clásico/Póster/Minimal/Historia ·
      5 paletas: Noche/Papel/Oro/Neón/Mono).
- [x] **Galería** de compartidos, persistida (re-compartir / borrar).
- [x] **Foto de fondo** (adjuntar imagen local, offline) con **auto-ajuste de
      color** (ink/muted por luminancia) o manual, + scrim automático.
- [x] **Tipografías** configurables (mono / grotesk / técnica).
- [x] **Efectos** apilables (scrim, grano, glow de ruta) + layout `overlay`.
- [ ] **Colores desde imagen** completo: paleta dominante (median-cut) + acento
      de ruta con contraste validado (hoy solo ink/muted por luminancia).
- [ ] **Override manual de colores** editable (campos ink/muted/route/dots).
- [x] **Mapas** de fondo **inclinados** (pitch 3D) como en v1 — MapLibre + tiles
      CARTO (Mapa / noche / claro + Inclinar), lazy-load, ruta horneada en el
      snapshot, degrada offline (dibuja solo la ruta). Spec §6.
- [x] **Mapa topográfico** en el share (OpenTopoMap, curvas de nivel, sin key) +
      **inclinación 3D** explícita en el editor de mapa.
- [ ] Más layouts abstraídos del spec: editorial, dataGrid, blueprint, techCard.
- [ ] **Marcador de meta** (flag/pin/ring) más marcado en la llegada.
- [ ] Guardar una configuración de tema como **favorito**.

## 6. Altitud / elevación

- [x] Guardar altitud del GPS por punto (captura sin pérdida).
- [x] Desnivel acumulado en métricas.
- [ ] Suavizado de altitud dedicado.
- [ ] Elevación precisa vía terceros (opt-in, rompe offline) — futuro.

## 7. Datos y captura (fundación)

- [x] Captura sin pérdida (lat/lng/t/alt/acc por punto).
- [x] Esquema versionado + capa de migración.
- [x] **Backup en carpetas**: export/import/compartir un JSON (actividades +
      rutinas + catálogo + perfil) a `Documents/Rastro`, con confirmación y
      spinner. Import combinar (dedup) o reemplazar.
- [x] Filtros de traza intercambiables (raw / drift / kalman / D+K) con selector
      para A/B comparar cuál aproxima mejor.
- [ ] Tramos guardables y reutilizables: comparar ritmo en el mismo tramo entre
      salidas.
- [ ] Fotos durante el recorrido (más que solo la ruta).

## 8. Captura / tracking (UX)

- [x] Pantalla de tracking inmersiva: mapa protagonista, stats en blur toggleable,
      botones fijos abajo, nav oculto, botón de recentrar.
- [x] Basemap Leaflet + CARTO dark bajo la ruta (con fixes de zoom/pinch/mundo).
- [x] Esperar "Iniciar" antes de arrancar el contador.
- [x] Confirmar antes de guardar recorridos < 10 s.
- [x] Congelar stats en el instante de finalizar (sin perder tiempo/distancia).
- [x] Al finalizar → ir directo a la review.
- [x] Pausar/reanudar/finalizar (finalizar = back ×2).

## 9. Permisos, identidad y sistema

- [x] Splash con logo.
- [x] Pedir permisos de entrada + **encender ubicación** como v1
      (request-location-accuracy) — verificado en dispositivo.
- [x] Migración a background-geolocation (grabar con pantalla apagada).
- [x] Podómetro por hardware (@capgo/capacitor-pedometer).
- [x] Permisos de notificación.
- [x] Sistema de versión en el APK atado al commit (versionName/versionCode).
- [x] Info base: nombre/apodo + altura + peso como registro.

## 10. Diseño / UI

- [x] Contrato de diseño (DESIGN.md): monocromo, íconos de línea, sin emojis.
- [x] Sistema de accent color **configurable** (6 paletas) con contraste
      garantizado en claro/oscuro (test). Selector en Apariencia.
- [ ] Revisar estado del dark mode a fondo.

---

## HOME

- [x] Dashboard gráfico/deportivo: racha, gráfica de barras semanal, y favoritos
      de arranque rápido (Correr/Trotar/Caminar → Ready). Sin lista de historial.

## Registro / captura extra

- [x] **Cuenta atrás** configurable (3/5/10 s) antes de que arranque el conteo.
- [x] **Cache de tiles** (service worker, solo CARTO) para que los mapas carguen
      rápido en vistas repetidas y offline.

## Futuro / backlog

- [ ] Notificación con estado del recorrido (en progreso / pausado) mientras rastrea.
- [ ] Detección automática de tramos repetidos (vs. marcado manual).
- [ ] Sync online opcional (Google), privado y opt-in.
- [ ] Íconos PWA 192/512 maskable reales.

---

## Pendiente de SPECS.md (features del producto aún sin hacer en v2)

- [ ] **F8 — Motor de cadencia óptima** (la "idea central" del spec §8): a qué
      cadencia tu **zancada** rinde más (velocidad = zancada × cadencia). Ya
      capturamos pasos por punto → es factible: scatter zancada-vs-cadencia +
      insight ("tu zancada más eficiente fue a ~X p/min"). **Alto valor.**
- [ ] **F10 — Metas + PR automáticos**: meta semanal de km / diaria de reps con
      barra de progreso; récords auto al guardar (tenemos récords en Analíticas,
      falta metas y badges).
- [ ] **F11 — Calorías estimadas**: aprox. por MET × peso × tiempo (ya guardamos
      el peso en el perfil). Siempre etiquetado "estimado".
- [ ] F16 — Sync online opcional (Google) — futuro, no rompe local-first.

## Auditoría — cosas que se saltaron / quedaron a medias

- **Rutinas Fase 2 y 3**: el builder existe, pero **no hay player** (correr la
  rutina con descansos, pausa/reinicio) ni se guarda la sesión de rutina. Es lo
  más grande pendiente del bloque ejercicios.
- **Share**: quedaron fuera del primer corte los **mapas de fondo**, la **foto**,
  las **tipografías** y varios **temas** (topográfico, colores desde imagen,
  favorito, marcador de meta). Hecho: layout × paleta + galería.
- **Home**: sigue base; falta gráficas + favoritos.
- **Métricas**: falta todo el bloque de insights/splits y las gráficas
  interactivas de v1.
