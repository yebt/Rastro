#!/usr/bin/env bash
# Prepare the release signing key and print the four GitHub secrets for it.
#
#   npm run keystore                         # create a new release keystore
#   npm run keystore -- ~/.android/debug.keystore   # reuse an existing one
#
# Reusing the debug keystore you already install APKs with lets the release APK
# update the app in place (same signature → no uninstall, no data loss).
# A new keystore means uninstalling the current app once (export a backup first).
#
# ⚠ Keep the keystore and its passwords safe: losing them means future APKs can
# no longer update the installed app.
set -euo pipefail

KEYSTORE="${1:-}"
if [ -z "$KEYSTORE" ]; then
  KEYSTORE="$HOME/rastro-release.jks"
  if [ -e "$KEYSTORE" ]; then
    echo "Ya existe $KEYSTORE — pasalo como argumento para reutilizarlo." >&2
    exit 1
  fi
  read -r -s -p "Contraseña para el keystore (mín. 6): " PASS; echo
  ALIAS="rastro"
  keytool -genkeypair -v -keystore "$KEYSTORE" -storetype PKCS12 -alias "$ALIAS" \
    -keyalg RSA -keysize 4096 -validity 36500 \
    -storepass "$PASS" -keypass "$PASS" -dname "CN=Rastro, O=Rastro"
  KEYPASS="$PASS"
  echo "✓ Keystore creado en $KEYSTORE — hacé una copia de seguridad."
elif [ "$(basename "$KEYSTORE")" = "debug.keystore" ]; then
  ALIAS="androiddebugkey"; PASS="android"; KEYPASS="android"
else
  read -r -p "Alias de la clave: " ALIAS
  read -r -s -p "Contraseña del keystore: " PASS; echo
  read -r -s -p "Contraseña de la clave (enter = la misma): " KEYPASS; echo
  KEYPASS="${KEYPASS:-$PASS}"
fi

keytool -list -keystore "$KEYSTORE" -storepass "$PASS" -alias "$ALIAS" >/dev/null

B64=$(base64 < "$KEYSTORE" | tr -d '\n')
cat <<OUT

Cargá estos secrets en GitHub → Settings → Secrets and variables → Actions:

  ANDROID_KEYSTORE_BASE64   (abajo, una sola línea)
  ANDROID_KEYSTORE_PASSWORD $PASS
  ANDROID_KEY_ALIAS         $ALIAS
  ANDROID_KEY_PASSWORD      $KEYPASS

Con la CLI de GitHub:
  base64 < "$KEYSTORE" | tr -d '\n' | gh secret set ANDROID_KEYSTORE_BASE64
  gh secret set ANDROID_KEYSTORE_PASSWORD -b '$PASS'
  gh secret set ANDROID_KEY_ALIAS -b '$ALIAS'
  gh secret set ANDROID_KEY_PASSWORD -b '$KEYPASS'

ANDROID_KEYSTORE_BASE64:
$B64
OUT
