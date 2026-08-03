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
- [ ] **Fase 2 — player guiado**: correr la rutina con cuentas de descanso entre
      ejercicio y entre vuelta, pausar/reanudar, y **reiniciar con confirmación**.
- [ ] **Fase 3 — guardar sesión de rutina** como actividad y mostrarla en
      historial / calendario.

## 4. Métricas (repensar a fondo)

- [x] Métricas base: distancia, tiempo, ritmo, velocidad, desnivel, pausas, pasos.
- [ ] Insights útiles: dónde apreté (ej. km 18→19), dónde rendí más, dónde caí.
- [ ] Splits negativos/positivos, zonas de esfuerzo, eficiencia por tramo.
- [ ] Gráficas interactivas de ritmo/velocidad en el tiempo (como v1).

## 5. Share card del rastro

- [x] Vista de compartir (no share instantáneo) con **preview en vivo**.
- [x] Temas = **layout × paleta** (4 layouts: Clásico/Póster/Minimal/Historia ·
      5 paletas: Noche/Papel/Oro/Neón/Mono).
- [x] **Galería** de compartidos, persistida (re-compartir / borrar).
- [ ] **Más temas/plantillas**: más variantes de layout y disposición de la data.
- [ ] **Tipografías** configurables por tema.
- [ ] **Mapas** de fondo (tiles) como en v1 — rompe algo del offline puro, evaluar
      lazy-load como v1 (CARTO/MapLibre).
- [ ] **Foto de fondo** (tomada al finalizar) como fondo de la card.
- [ ] **Colores desde imagen**: paleta dominante + ajuste por contraste.
- [ ] **Tema topográfico** (topografía del terreno como fondo).
- [ ] **Marcador de meta** más marcado en el punto de llegada.
- [ ] Guardar una configuración de tema como **favorito**.

## 6. Altitud / elevación

- [x] Guardar altitud del GPS por punto (captura sin pérdida).
- [x] Desnivel acumulado en métricas.
- [ ] Suavizado de altitud dedicado.
- [ ] Elevación precisa vía terceros (opt-in, rompe offline) — futuro.

## 7. Datos y captura (fundación)

- [x] Captura sin pérdida (lat/lng/t/alt/acc por punto).
- [x] Esquema versionado + capa de migración.
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
- [x] Sistema de accent color con contraste garantizado (test).
- [ ] Revisar estado del dark mode a fondo.

---

## Mejorar HOME (pendiente puntual)

- [ ] Stats + gráficas + favoritos / acciones rápidas (pedido explícito).

## Futuro / backlog

- [ ] Notificación con estado del recorrido (en progreso / pausado) mientras rastrea.
- [ ] Detección automática de tramos repetidos (vs. marcado manual).
- [ ] Sync online opcional (Google), privado y opt-in.
- [ ] Íconos PWA 192/512 maskable reales.

---

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
