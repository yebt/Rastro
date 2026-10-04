#!/usr/bin/env bash
# Cut a Rastro release: checks, tags vX.Y.Z and pushes the tag. GitHub Actions
# (.github/workflows/android-release.yml) then builds the signed APK and
# publishes the GitHub Release.
#
#   npm run release -- patch | minor | major | X.Y.Z [--dry-run]
set -euo pipefail

cd "$(dirname "$0")/.."

BUMP="${1:-}"
DRY_RUN=0
[ "${2:-}" = "--dry-run" ] && DRY_RUN=1

if [ -z "$BUMP" ]; then
  echo "Uso: npm run release -- <patch|minor|major|X.Y.Z> [--dry-run]" >&2
  exit 1
fi

# Last release tag; before the first one, versions continue the 2.0 line.
LAST=$(git describe --tags --abbrev=0 --match 'v[0-9]*' 2>/dev/null || echo "v2.0.0")
IFS=. read -r MAJ MIN PAT <<<"${LAST#v}"
PAT="${PAT%%-*}"
case "$BUMP" in
  patch) VERSION="$MAJ.$MIN.$((PAT + 1))" ;;
  minor) VERSION="$MAJ.$((MIN + 1)).0" ;;
  major) VERSION="$((MAJ + 1)).0.0" ;;
  *) VERSION="${BUMP#v}" ;;
esac
if ! echo "$VERSION" | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.]+)?$'; then
  echo "Versión inválida: $VERSION (esperado X.Y.Z)" >&2
  exit 1
fi
TAG="v$VERSION"

if [ -n "$(git status --porcelain)" ]; then
  echo "Hay cambios sin commitear — commiteá o guardá antes de liberar." >&2
  exit 1
fi
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  echo "El tag $TAG ya existe." >&2
  exit 1
fi
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  read -r -p "Estás en '$BRANCH', no en main. ¿Liberar igual? [s/N] " ok
  [ "$ok" = "s" ] || exit 1
fi
git fetch -q origin "$BRANCH" || true
if [ "$(git rev-parse HEAD)" != "$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo none)" ]; then
  echo "HEAD no coincide con origin/$BRANCH — hacé push (o pull) primero." >&2
  exit 1
fi

echo "→ $LAST  ⇒  $TAG  ($(git rev-parse --short HEAD))"
echo "→ Corriendo tests…"
npm test --silent

if [ "$DRY_RUN" = 1 ]; then
  echo "(dry-run) Se crearía y publicaría el tag $TAG."
  exit 0
fi

git tag -a "$TAG" -m "Rastro $TAG"
git push origin "$TAG"
# owner/repo from any remote form (git@github.com:o/r.git, https://github.com/o/r).
REPO=$(git remote get-url origin | sed -E 's#\.git$##; s#.*[/:]([^/:]+/[^/:]+)$#\1#')
echo "✓ Tag $TAG publicado. El APK se arma en GitHub Actions:"
echo "  https://github.com/$REPO/actions"
echo "  y queda en https://github.com/$REPO/releases/tag/$TAG"
