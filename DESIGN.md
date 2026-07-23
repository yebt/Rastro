# DESIGN — Rastro v2

Contrato de diseño de la app. Toda pantalla, componente o tarjeta nueva debe
cumplir esta lista. Es la vara: si algo no la respeta, no entra.

**Dirección en una línea:** instrumento deportivo serio + póster editorial de mapa.
Monocromo, tipografía técnica, iconografía de línea, mucho aire, **un solo acento
usado con bisturí**. Referencias: carto.net, tarjetas de Strava, relojes GPS premium.

---

## 0. Principios (la vara)

- **Menos, mejor puesto.** Cada pantalla tiene UN trabajo. Si un elemento no ayuda a ese trabajo, se saca.
- **Jerarquía por tipografía y espacio, no por color ni cajas.** El color es información, no decoración.
- **Instrumento, no juguete.** Se lee de un vistazo, en movimiento, a veces con una mano.
- **Consistencia por tokens.** Ningún valor "suelto": todo color/espacio/tipo sale de una variable.
- **Local-first y privado** también en la UI: nada sugiere cuentas, nube ni tracking social salvo que el usuario lo pida.

---

## 1. Color

- **Monocromo + 1 acento.** Base de grises neutros (con leve sesgo hacia el acento, nunca gris puro "sin elegir") + el accent configurable.
- **Accent con bisturí:** solo en acción primaria, estado "en curso/live", datos destacados y marcas de racha. Nunca como relleno general.
- **Sistema de accent tokens** (ya construido): `--accent`, `--accent-strong`, `--accent-soft`, `--accent-contrast`. Opciones: verde (default) / naranja / púrpura / azul / mono.
- **Contraste garantizado por test.** WCAG AA es obligatorio y está encodeado en `accent.test.ts`. Romperlo = falla CI.
- **Regla de oro del acento como relleno:** si un fondo usa `var(--accent)`, su texto usa `var(--accent-contrast)`. **Nunca** `#fff` hardcodeado (se rompe en naranja/mono).
- **Colores semánticos son aparte del acento:** inicio de ruta (verde), peligro/detener (rojo), estados (ok/warning). No cuentan como "el acento" y no se tiñen con él.
- **Neutros elegidos**, no heredados: negro casi puro y blanco roto están bien si son decisión, no default.

## 2. Tipografía

- **Display / numerales:** Barlow Condensed (ya cargada, self-hosted, offline). Para tiempos, distancias, ritmos.
- **Texto:** Inter (ya cargada). Cuerpo, descripciones, botones.
- **Micro-labels técnicos** (PACE, GPS, fechas, coordenadas): mayúscula + `letter-spacing` amplio (~0.14–0.18em), tamaño chico, peso medio, color muted. → **Recomendado: sumar una monoespaciada** (ej. JetBrains Mono vía fontsource, offline) para estos labels y datos; es lo que da el aire de "instrumento" de las referencias.
- **Numerales tabulares siempre** en datos que se alinean: `font-variant-numeric: tabular-nums`.
- **Escala de tipo definida y respetada.** Nada de tamaños al azar. Headings con `text-wrap: balance`.
- **Tracking negativo** en números y titulares grandes (~-0.03em); tracking positivo en micro-labels.
- **Ancho de lectura** ~60–66ch en textos largos.

## 3. Iconografía

- **CERO emojis en la UI.** Nunca como ícono, marcador de sección, ni en tarjetas.
- **Iconos de línea (stroke)** coherentes: un solo set (Lucide, ya integrado vía unplugin-icons), grosor consistente (~1.7–2), `linecap`/`linejoin` redondeados.
- **Tamaño y color por contexto:** heredan `currentColor`; tamaños de una escala corta (16/18/20/21).
- **Preferir dato sobre ícono figurativo** cuando aplica: p.ej. intensidad de actividad como medidor de barras, no un muñequito corriendo.

## 4. Layout y espaciado

- **Escala de espaciado consistente** (múltiplos base, ej. 4/8). El `gap` de flex/grid hace el espaciado, no márgenes sueltos.
- **Hairlines, no cajas.** Separar con líneas de 1px (`--line`) antes que encajonar todo en tarjetas. Cajas solo cuando agrupan de verdad.
- **Aire generoso.** El vacío es parte del diseño; no llenar por llenar.
- **Radios de una escala corta** y coherente (no `rounded-lg` en todo por default).
- **Safe areas** respetadas (notch, barra inferior): usar `--safe-t`/`--safe-b`.
- **Nada de scroll horizontal** en el body; contenido ancho (tablas/charts) scrollea en su propio contenedor.

## 5. Componentes (reglas transversales)

- **Botón primario (CTA):** relleno accent + texto `--accent-contrast`, ícono + label, un solo radio, alto cómodo (≥48px).
- **Botón secundario/ghost:** borde hairline, fondo sutil, texto `--ink`.
- **Segmented / chips:** activo = fondo sutil o accent, inactivo = muted; nunca cinco colores a la vez.
- **Listas (historial, ajustes):** filas separadas por hairline, ícono de línea a la izquierda, valor + chevron a la derecha. Tappable evidente.
- **Stat en columnas** con divisores verticales hairline (label mono arriba, número tabular abajo), en vez de tarjetas de colores.
- **Todo lo interactivo se ve interactivo** (affordance clara); todo lo que no, no.

## 6. Data viz (nivel instrumento)

- **Ruta:** línea fina, blanca sobre mapa oscuro (estilo Strava/póster), con casing sutil. Marcadores de **inicio** (punto) y **meta** (bandera) discretos.
- **Charts hechos a mano** (sin librería pesada): con relleno de área sutil, grilla tenue, y **endpoint enfatizado**. Mismo cuidado que la tipografía.
- **Sparklines** en Home/Profile para tendencia rápida.
- **Estado en la forma, no solo en el número:** un pill, una barra, un stripe de severidad para que "lo importante" se lea de un vistazo.

## 7. Estados y feedback

- **Empty states** diseñados (no una pantalla vacía): qué es, por qué está vacío, y la acción para llenarlo.
- **Loading** con esqueletos o indicador propio del contexto (ej. "Generando mapa…"), no un spinner genérico a secas.
- **Errores** que explican qué pasó y cómo resolver — sin disculpas, sin vaguedad. (ej. "Sin señal GPS: salí a cielo abierto".)
- **Toasts** breves, con verbo de resultado ("Guardado", "Compartido"), z-index por encima de overlays.
- **Estado "en curso/live"** siempre visible y con el acento (grabando, pausado).

## 8. Movimiento

- **Sutil y con propósito.** Micro-interacciones (press, aparición de paneles), no efectos por lucirse.
- **Un momento orquestado** > muchos efectos dispersos (ej. arranque de actividad, transición a la review).
- **`prefers-reduced-motion` respetado** siempre.
- El exceso de animación lee como "hecho por IA": ante la duda, menos.

## 9. Accesibilidad

- **Contraste AA** en texto (≥4.5) y en elementos de UI (≥3), en claro y oscuro. Enforced por test.
- **Touch targets ≥ 44×44px.**
- **Foco visible** en teclado; `aria-label`/roles en controles sin texto.
- **No depender solo del color** para transmitir estado (sumar forma/ícono/texto).

## 10. Tema (claro / oscuro)

- **Ambos temas con el mismo cuidado.** No invertir a lo bruto: recalcular contraste y que el acento funcione en los dos fondos.
- **Todo por tokens** (`:root` + overrides `[data-theme]`), nunca colores dentro del media query.
- **Anti-flash:** script inline que setea tema y accent antes del primer paint.

## 11. Voz y copy (UI en español)

- **Español**, voz activa, técnico pero cálido. El control dice exactamente qué hace.
- **Nombrar por lo que la persona reconoce**, no por cómo está construido el sistema.
- **Sin emojis** en el copy de UI. Específico > gracioso.

## 12. Mapa

- **Borderless**, casi total, durante la actividad. Nada de bordes ni marcos.
- Estilo de mapa configurable (raster CARTO: voyager/dark/light). La ruta no sale del dispositivo.
- **En reposo (Work out) no hay mapa**: aparece recién al arrancar.

## 13. Rendimiento y offline

- **Local-first:** funciona sin red para registrar (solo los tiles piden red).
- **Lazy** lo pesado (MapLibre, etc.): fuera del bundle de arranque.
- Cuidar el arranque: percibido rápido, splash con logo, sin flash blanco/negro.

## 14. Anti-patrones (prohibido)

- Emojis como iconos o marcadores. ← el error que originó este documento.
- Arcoíris de colores / acento como relleno general.
- Encajonar todo en tarjetas de colores; gradientes baratos de relleno.
- Todo centrado, todo con el mismo radio grande, todo con sombra.
- Números con fuente proporcional en columnas (usar tabular).
- Hex sueltos en componentes en vez de tokens.
- Spinners genéricos y pantallas vacías sin diseñar.

---

**Checklist rápido antes de dar por hecha una pantalla:**
`¿monocromo + 1 acento?` · `¿cero emojis?` · `¿iconos de línea coherentes?` ·
`¿numerales tabulares?` · `¿jerarquía por tipo/espacio, no por caja?` ·
`¿contraste AA claro+oscuro?` · `¿touch ≥44px + foco visible?` ·
`¿estados empty/loading/error?` · `¿tokens, sin hex sueltos?` · `¿copy claro sin emojis?`
