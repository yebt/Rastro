// Bilingual copy for the landing. Spanish is the source language (it matches the
// app's UI); English is the toggle. Keys are flat and referenced from index.astro
// both at build time (rendered ES) and at runtime (the toggle swaps textContent).

export type Lang = 'es' | 'en';

export const STRINGS: Record<string, Record<Lang, string>> = {
	// Nav
	'nav.records': { es: 'Qué registra', en: 'What it records' },
	'nav.analysis': { es: 'Análisis', en: 'Analysis' },
	'nav.share': { es: 'Compartir', en: 'Share' },
	'nav.privacy': { es: 'Privacidad', en: 'Privacy' },
	'nav.dev': { es: 'Código', en: 'Source' },

	// CTAs
	'cta.download': { es: 'Descargar APK', en: 'Download APK' },
	'cta.source': { es: 'Ver el código', en: 'View the source' },
	'cta.lang': { es: 'EN', en: 'ES' },

	// Hero
	'hero.kicker': { es: 'Registrador de recorridos · Android', en: 'Movement recorder · Android' },
	'hero.title1': { es: 'Tus recorridos,', en: 'Your movement,' },
	'hero.title2': { es: 'medidos.', en: 'measured.' },
	'hero.sub': {
		es: 'Rastro graba tus caminatas, corridas y entrenamientos enteros en el teléfono —ruta GPS, cadencia, desnivel, parciales— y convierte cada uno en un instrumento que se lee. Sin cuenta, sin nube.',
		en: 'Rastro records your walks, runs and workouts entirely on the phone — GPS route, cadence, elevation, splits — and turns each one into a readable instrument. No account, no cloud.',
	},
	'hero.stat.dist': { es: 'distancia', en: 'distance' },
	'hero.stat.pace': { es: 'ritmo', en: 'pace' },
	'hero.stat.cad': { es: 'cadencia', en: 'cadence' },
	'hero.stat.elev': { es: 'desnivel', en: 'elevation' },
	'hero.note': { es: 'Sin cuenta · Offline · Código abierto', en: 'No account · Offline · Open source' },

	// What it records
	'rec.title': { es: 'Tres formas de moverte', en: 'Three ways to move' },
	'rec.sub': {
		es: 'Una misma app para la ruta y para la fuerza. Cada actividad se guarda local y se analiza igual de fino.',
		en: 'One app for the route and for the strength. Every activity is stored locally and analyzed just as deeply.',
	},
	'rec.move.t': { es: 'Movimiento', en: 'Move' },
	'rec.move.d': {
		es: 'Caminar o correr con GPS en vivo: mapa, ritmo, parciales por km y desnivel mientras te movés.',
		en: 'Walk or run with live GPS: map, pace, per-km splits and elevation as you go.',
	},
	'rec.exercise.t': { es: 'Ejercicio', en: 'Exercise' },
	'rec.exercise.d': {
		es: 'Series y repeticiones con un catálogo editable. La cuenta queda persistente y se reaplica.',
		en: 'Sets and reps from an editable catalog. The count stays persistent and re-applies.',
	},
	'rec.routine.t': { es: 'Rutina', en: 'Routine' },
	'rec.routine.d': {
		es: 'Una secuencia de ejercicios reproducida con descansos cronometrados. La sesión se guarda entera.',
		en: 'A sequence of exercises played back with timed rests. The whole session is saved.',
	},

	// Analysis
	'an.title1': { es: 'Cada corrida,', en: 'Every run,' },
	'an.title2': { es: 'leída como un instrumento', en: 'read like an instrument' },
	'an.sub': {
		es: 'Parciales, ritmo y velocidad en el tiempo, perfil de altitud, zancada y cadencia. Y el motor que encuentra la cadencia donde de verdad fuiste más eficiente.',
		en: 'Splits, pace and speed over time, elevation profile, stride and cadence. Plus the engine that finds the cadence where you were actually most efficient.',
	},
	'an.insights.cap': { es: 'Del recorrido', en: 'From the route' },
	'an.insight1': { es: 'Tu km más rápido fue el 3.º.', en: 'Your fastest km was the 3rd.' },
	'an.insight2': { es: 'Apretaste fuerte entre el K4 y el K5.', en: 'You surged hard between K4 and K5.' },
	'an.insight3': { es: 'Pico de velocidad cerca del minuto 18.', en: 'Peak speed near minute 18.' },
	'an.splits.cap': { es: 'Ritmo por km', en: 'Pace per km' },
	'an.cadence.cap': { es: 'Cadencia óptima', en: 'Optimal cadence' },
	'an.cadence.note': {
		es: 'Tu zancada más eficiente fue a ~168 pasos/min.',
		en: 'Your most efficient stride was at ~168 steps/min.',
	},
	'an.records.cap': { es: 'Récords', en: 'Records' },
	'an.records.note': {
		es: 'Medalla automática en la actividad que marca un récord.',
		en: 'An automatic medal on the activity that sets a record.',
	},

	// Share
	'share.title': { es: 'Un estudio para compartir', en: 'A studio for sharing' },
	'share.sub': {
		es: 'Convertí una corrida en una tarjeta diseñada: fondos con foto, colores sacados de la imagen, tipografías, efectos y mapas inclinados o topográficos.',
		en: 'Turn a run into a designed card: photo backgrounds, colors pulled from the image, typographies, effects, and tilted or topographic maps.',
	},
	'share.f1': { es: 'Fondos con tu foto', en: 'Your photo as background' },
	'share.f2': { es: 'Mapas inclinados 3D', en: 'Tilted 3D maps' },
	'share.f3': { es: 'Capa topográfica', en: 'Topographic layer' },
	'share.f4': { es: 'Efectos y layouts', en: 'Effects and layouts' },
	'share.card.route': { es: 'Sendero del río', en: 'Riverside trail' },

	// Privacy
	'priv.title1': { es: 'Tus datos', en: 'Your data' },
	'priv.title2': { es: 'viven en tu teléfono', en: 'lives on your phone' },
	'priv.body': {
		es: 'No hay login, no hay servidor, no hay tracking. Todo se guarda local. Y cuando querés llevártelo, exportás a GPX y listo.',
		en: 'No login, no server, no tracking. Everything is stored locally. And when you want to take it with you, export to GPX — done.',
	},
	'priv.p1': { es: 'Sin cuenta', en: 'No account' },
	'priv.p1d': { es: 'Abrís y grabás. Nada que registrar.', en: 'Open and record. Nothing to sign up for.' },
	'priv.p2': { es: 'Sin nube', en: 'No cloud' },
	'priv.p2d': { es: 'Ningún dato sale del dispositivo.', en: 'No data leaves the device.' },
	'priv.p3': { es: 'Exportable', en: 'Exportable' },
	'priv.p3d': { es: 'GPX estándar, compatible con todo.', en: 'Standard GPX, compatible everywhere.' },

	// Dev
	'dev.title': { es: 'Abierto de par en par', en: 'Open all the way down' },
	'dev.body': {
		es: 'Astro con una isla Vue persistente sobre Capacitor. Arquitectura hexagonal, dominio puro con ~170 tests, IndexedDB. Licencia AGPL-3.0.',
		en: 'Astro with a persistent Vue island over Capacitor. Hexagonal architecture, a pure domain with ~170 tests, IndexedDB. AGPL-3.0 licensed.',
	},
	'dev.stat.tests': { es: 'tests de dominio', en: 'domain tests' },
	'dev.stat.deps': { es: 'cuentas requeridas', en: 'accounts required' },
	'dev.stat.license': { es: 'licencia', en: 'license' },

	// Download
	'dl.title': { es: 'Llevá tus recorridos con vos', en: 'Take your movement with you' },
	'dl.sub': {
		es: 'Descargá el APK desde las releases del repositorio. Android, sin tienda de por medio.',
		en: 'Download the APK from the repository releases. Android, no store in the way.',
	},
	'dl.req': { es: 'Android 8+ · ~ instalación por APK', en: 'Android 8+ · APK sideload' },

	// Footer
	'foot.tagline': { es: 'Registrador de recorridos, offline y sin cuenta.', en: 'A movement recorder — offline and accountless.' },
	'foot.license': { es: 'Publicado bajo AGPL-3.0', en: 'Released under AGPL-3.0' },
	'foot.made': { es: 'Hecho con Astro, Vue y Capacitor', en: 'Built with Astro, Vue and Capacitor' },
};
