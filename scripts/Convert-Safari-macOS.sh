#!/bin/sh
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
SRC="$HERE/../dist/safari"
if [ ! -f "$SRC/manifest.json" ]; then
  echo 'Run python3 scripts/build-cross-browser.py first.' >&2
  exit 1
fi
if ! command -v xcrun >/dev/null 2>&1; then
  echo 'Requires macOS and Apple Xcode command line tools.' >&2
  exit 1
fi
# Current Apple command; formerly safari-web-extension-converter.
xcrun safari-web-extension-packager "$SRC" --app-name "Context Guardian"
