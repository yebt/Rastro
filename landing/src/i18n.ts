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

	// A11y
	'a11y.skip': { es: 'Saltar al contenido', en: 'Skip to content' },

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
		en: 'One app for the route and for strength work. Every activity is stored locally and analyzed just as deeply.',
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
	'share.card.dawn': { es: 'Amanecer largo', en: 'Long dawn' },
	'share.card.mountain': { es: 'Ruta de montaña', en: 'Mountain route' },
	'share.card.night': { es: 'Vuelta nocturna', en: 'Night loop' },
	'share.card.duo': { es: 'Vuelta larga', en: 'Long loop' },
	'share.card.longcap': { es: 'km · vuelta larga', en: 'km · long loop' },
	'share.card.cycle': { es: 'Diseños para compartir', en: 'Share designs' },

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
	'dl.req': { es: 'Android 8+ · instalación por APK', en: 'Android 8+ · APK sideload' },

	// Analysis — enriched stat cluster
	'an.stat.total': { es: 'distancia total', en: 'total distance' },
	'an.stat.time': { es: 'en movimiento', en: 'moving time' },
	'an.stat.best': { es: 'mejor km', en: 'best km' },
	'an.stat.cal': { es: 'calorías', en: 'calories' },
	'an.stat.gain': { es: 'desnivel +', en: 'elevation +' },
	'an.stat.seg': { es: 'segmentos', en: 'segments' },
	'an.elev.cap': { es: 'Altitud', en: 'Elevation' },

	// Exercises
	'ex.title1': { es: 'La fuerza', en: 'Strength' },
	'ex.title2': { es: 'también cuenta', en: 'counts too' },
	'ex.sub': {
		es: 'No todo es GPS. Registrá series y repeticiones, armá rutinas y reproducilas con descansos cronometrados. La sesión entera queda guardada y medida.',
		en: "It's not all GPS. Log sets and reps, build routines and play them back with timed rests. The whole session is saved and measured.",
	},
	'ex.reps.cap': { es: 'Serie en curso', en: 'Current set' },
	'ex.reps.note': { es: 'La cuenta queda persistente y se reaplica a la próxima serie.', en: 'The count stays persistent and re-applies to the next set.' },
	'ex.routine.cap': { es: 'Reproductor de rutina', en: 'Routine player' },
	'ex.routine.now': { es: 'Ahora', en: 'Now' },
	'ex.routine.next': { es: 'Sigue', en: 'Next' },
	'ex.routine.rest': { es: 'Descanso', en: 'Rest' },
	'ex.name1': { es: 'Dominadas', en: 'Pull-ups' },
	'ex.name2': { es: 'Sentadillas', en: 'Squats' },
	'ex.name3': { es: 'Flexiones', en: 'Push-ups' },
	'ex.f1': { es: 'Catálogo editable', en: 'Editable catalog' },
	'ex.f2': { es: 'Series y repeticiones', en: 'Sets and reps' },
	'ex.f3': { es: 'Descansos cronometrados', en: 'Timed rests' },
	'ex.f4': { es: 'Historial y récords', en: 'History and records' },

	// Roadmap
	'road.title': { es: 'Lo que viene', en: "What's next" },
	'road.sub': { es: 'Rastro es un proyecto vivo. Esto es lo que está en camino.', en: "Rastro is a living project. Here's what's on the way." },
	'road.status': { es: 'En camino', en: 'Planned' },
	'road.i1.t': { es: 'Sync opcional', en: 'Optional sync' },
	'road.i1.d': { es: 'Respaldo cifrado a tu propia nube, sin cuentas de por medio.', en: 'Encrypted backup to your own cloud, still no accounts.' },
	'road.i2.t': { es: 'Fotos al grabar', en: 'Photos while recording' },
	'road.i2.d': { es: 'Capturá momentos del recorrido y adjuntalos a la actividad.', en: 'Capture moments on the route and attach them to the activity.' },
	'road.i3.t': { es: 'Notificación en vivo', en: 'Live notification' },
	'road.i3.d': { es: 'Estado del registro en la barra mientras te movés.', en: 'Recording status in the bar while you move.' },
	'road.i4.t': { es: 'Segmentos automáticos', en: 'Auto segments' },
	'road.i4.d': { es: 'Detección de tramos repetidos para comparar sin configurar nada.', en: 'Repeated-stretch detection to compare with zero setup.' },

	// Footer
	'foot.tagline': { es: 'Registrador de recorridos, offline y sin cuenta.', en: 'A movement recorder — offline and accountless.' },
	'foot.license': { es: 'Publicado bajo AGPL-3.0', en: 'Released under AGPL-3.0' },
	'foot.made': { es: 'Hecho con Astro, Vue y Capacitor', en: 'Built with Astro, Vue and Capacitor' },
	'foot.tech': { es: 'Cómo funciona', en: 'How it works' },

	// Tech page (/tecnologia)
	'tech.back': { es: 'Volver al inicio', en: 'Back home' },
	'tech.title1': { es: 'Cómo funciona', en: 'How Rastro' },
	'tech.title2': { es: 'Rastro', en: 'works' },
	'tech.intro': {
		es: 'Rastro es offline-first: todo el trabajo ocurre en tu teléfono. Acá va cómo está construida y por qué se siente como un instrumento.',
		en: "Rastro is offline-first: all the work happens on your phone. Here's how it's built and why it feels like an instrument.",
	},
	'tech.arch.title': { es: 'Arquitectura hexagonal', en: 'Hexagonal architecture' },
	'tech.arch.body': {
		es: 'El dominio —cálculo de métricas, análisis, récords— es código puro y testeado, sin saber nada de GPS, base de datos ni UI. Los adaptadores conectan ese núcleo con el mundo. Cambiar una pieza de afuera nunca toca la lógica.',
		en: 'The domain — metrics, analysis, records — is pure, tested code that knows nothing about GPS, database or UI. Adapters connect that core to the world. Swapping an outer piece never touches the logic.',
	},
	'tech.diagram.adapters': { es: 'Adaptadores', en: 'Adapters' },
	'tech.diagram.domain': { es: 'Dominio puro', en: 'Pure domain' },
	'tech.diagram.domainsub': { es: 'métricas · análisis · récords', en: 'metrics · analysis · records' },
	'tech.diagram.ports': { es: 'Puertos', en: 'Ports' },
	'tech.diagram.gps': { es: 'Geolocalización', en: 'Geolocation' },
	'tech.diagram.ped': { es: 'Podómetro', en: 'Pedometer' },
	'tech.diagram.db': { es: 'IndexedDB', en: 'IndexedDB' },
	'tech.diagram.ui': { es: 'Isla Vue', en: 'Vue island' },
	'tech.stack.title': { es: 'El stack', en: 'The stack' },
	'tech.stack.body': {
		es: 'Astro sirve una isla Vue persistente empaquetada con Capacitor 8 para Android. El estado vive en nanostores; los datos en IndexedDB. Los mapas usan Leaflet y MapLibre sobre tiles de CARTO y OpenTopoMap.',
		en: 'Astro serves a persistent Vue island packaged with Capacitor 8 for Android. State lives in nanostores; data in IndexedDB. Maps use Leaflet and MapLibre over CARTO and OpenTopoMap tiles.',
	},
	'tech.offline.title': { es: 'Offline de verdad', en: 'Truly offline' },
	'tech.offline.body': {
		es: 'No hay backend. Se abre, se graba y se guarda local. Un service worker cachea los tiles del mapa para que carguen al instante. Exportás a GPX cuando querés llevarte tus datos.',
		en: 'There is no backend. Open, record, store locally. A service worker caches map tiles so they load instantly. Export to GPX whenever you want to take your data.',
	},
	'tech.test.title': { es: 'Probado donde importa', en: 'Tested where it matters' },
	'tech.test.body': {
		es: 'El dominio tiene ~170 tests unitarios: parciales, cadencia, desnivel, récords, segmentos. La lógica que produce tus números está cubierta.',
		en: 'The domain has ~170 unit tests: splits, cadence, elevation, records, segments. The logic behind your numbers is covered.',
	},
	'tech.stat.tests': { es: 'tests de dominio', en: 'domain tests' },
	'tech.stat.backend': { es: 'servidores', en: 'backends' },
	'tech.stat.license': { es: 'licencia', en: 'license' },
	'tech.license': { es: 'Todo el código es abierto bajo AGPL-3.0.', en: 'All the code is open under AGPL-3.0.' },
	'tech.cta': { es: 'Ver el repositorio', en: 'View the repository' },
};
