# TODO — Rastro

Roadmap de objetivos. Es el "qué queremos alcanzar", no el "cómo" definitivo.
Se trabaja con **refactors incrementales sobre base estable**, de a poco, y la
**UI/UX se acuerda en conjunto antes de construir** cada parte.

Leyenda: `[ ]` pendiente · `[~]` en progreso · `[x]` hecho.
Base estable actual: `7355e03` (share/maplibre themes).

---

## 1. Navegación y estructura

- [ ] Nueva distribución de tabs (reorganizar las 5 actuales `track/pull/hist/progress/data` en algo más claro). Propuesta a confirmar.
- [ ] Home / dashboard con las stats base.
- [ ] Ajustes como vista propia (hoy es un overlay).

## 2. Calendario y racha

- [ ] Vista de calendario para ver cuándo salí a caminar / trotar / correr / ejercicios.
- [ ] Racha (streak) de días activos.

## 3. Ejercicios (antes "Dominadas")

- [ ] Generalizar dominadas → ejercicios: sumar burpees, abdominales, flexiones de pecho, y dejar la puerta abierta a más.
- [ ] Rutinas configurables (futuro).

## 4. Métricas (repensar a fondo)

- [ ] Analizar cómo se toman, qué se evalúa y cómo se muestran hoy.
- [ ] Insights útiles para el corredor/caminante: dónde apreté (ej. km 18→19), dónde con zancada más larga rendí más, dónde bajé el ritmo, dónde empecé a caer.
- [ ] Splits negativos/positivos, zonas de esfuerzo, eficiencia de zancada por tramo.
- [ ] Depende de datos que hoy no se guardan (ver §6 altitud y §7 captura rica).

## 5. Share card del rastro

- [ ] Mejorar cómo se arma la card.
- [ ] Nuevas plantillas/temas: variar layout de la data, fuentes, colores, inclinación.
- [ ] Guardar una configuración como favorito.
- [ ] Adjuntar foto (tomada al finalizar) como fondo.
- [ ] Colores desde imagen: paleta dominante + ajuste de secundarios por contraste.
- [ ] Tema topográfico (topografía del terreno como fondo).
- [ ] Marcador de meta en el punto de llegada.

## 6. Altitud / elevación

- [ ] Guardar la altitud del GPS (suavizada) por punto.
- [ ] Usarla en métricas (desnivel acumulado) y, opcionalmente, en la card.
- [ ] Conectar a terceros para elevación precisa (opt-in, rompe offline) — futuro.

## 7. Datos y captura (fundación)

- [ ] Captura sin pérdida: guardar altitud + tiempo + precisión por punto (hoy se descartan).
- [ ] Esquema de datos versionado + capa de migración (para no romper datos viejos).
- [ ] Tramos guardables y reutilizables: comparar el ritmo en el mismo tramo entre salidas.
- [ ] Fotos durante el recorrido (más que solo la ruta).

## 8. Captura / tracking (UX)

- [ ] Repensar la pantalla de tracking: más inmersiva, mapa protagonista, pausar/reanudar/finalizar/foto.
- [ ] Al finalizar la actividad → ir directo a la review.

## 9. Onboarding e identidad

- [ ] Splash con logo (sin flash blanco/negro al iniciar).
- [ ] Pedir permisos de entrada.
- [ ] Nombre/nickname (local, opcional; para uso futuro).

## 10. Diseño / UI

- [ ] Definir la dirección visual en conjunto (el intento anterior no convenció — arrancar de referencias que sí gusten).
- [ ] Accent color configurable con contraste garantizado en claro y oscuro.
- [ ] Revisar/estado del dark mode.

---

## Futuro / backlog

- [ ] Notificación con estado del recorrido (en progreso / pausado) mientras se rastrea.
- [ ] Detección automática de tramos repetidos (vs. marcado manual).
- [ ] Sync online opcional (Google), privado y opt-in.
- [ ] Íconos PWA 192/512 maskable reales.
