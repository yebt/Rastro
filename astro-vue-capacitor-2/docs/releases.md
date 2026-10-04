# Releases y APK

El APK se arma en GitHub Actions (`.github/workflows/android-release.yml`, en la raíz del repo).

| Cómo | Qué sale |
| --- | --- |
| `npm run release -- minor` (empuja el tag `vX.Y.Z`) | APK **firmado** publicado en *GitHub → Releases*, con notas armadas desde los commits |
| *Actions → Android APK → Run workflow* | APK debug o release como *artifact* descargable (no publica Release) |
| `npm run apk:debug` / `apk:release` | Build local (requiere Android SDK) |

## Una sola vez: la clave de firma

Android solo actualiza una app si el APK nuevo está firmado con **la misma clave** que el instalado.

```sh
# Opción A — reusar la clave debug con la que ya instalás (actualiza sin desinstalar):
npm run keystore -- ~/.android/debug.keystore

# Opción B — clave de release nueva (hay que desinstalar la app una vez:
# exportá un backup desde Ajustes antes, porque se borran los datos):
npm run keystore
```

El script imprime los 4 secrets para *Settings → Secrets and variables → Actions*:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.

> ⚠ Guardá el keystore y sus contraseñas. Si se pierden, ningún APK futuro podrá
> actualizar la app instalada.

Para firmar builds locales con `npm run apk:release`, creá `android/keystore.properties`
(ignorado por git):

```properties
storeFile=/ruta/a/rastro-release.jks
storePassword=...
keyAlias=rastro
keyPassword=...
```

## Sacar una versión

```sh
git checkout main && git pull
npm run release -- patch          # 2.1.0 → 2.1.1  (arreglos)
npm run release -- minor          # 2.1.1 → 2.2.0  (funciones nuevas)
npm run release -- 3.0.0          # versión exacta
npm run release -- minor --dry-run   # solo muestra qué haría
```

El script verifica árbol limpio, que `HEAD` esté pusheado y que los tests pasen; luego crea
y empuja el tag. Un tag con guion (`v2.2.0-beta.1`) sale como *pre-release*.

## Versionado

- `versionName` = el tag (`2.1.0`); se ve en *Ajustes → Acerca de*.
- `versionCode` = cantidad de commits, así cada release instala encima de la anterior.
- Builds sin tag siguen mostrando `2.0.<commits> (<hash>)`.

Las notas agrupan los commits por prefijo (`feat:` → Novedades, `fix:` → Arreglos,
`perf:` → Rendimiento, resto → Otros), así que conviene seguir escribiendo commits así.
