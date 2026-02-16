#!/usr/bin/env bash
# Validates that every publishEvent call in handler/trigger code is documented in MODULE.md.
# Usage: ./scripts/validate-events.sh [project-root]
# Exit 0 if all events match; 1 if mismatches found.

set -e
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
CORE_DIR="$ROOT/src/core-modules"
APP_DIR="$ROOT/src/app-modules"
FAIL=0

echo "Validating event contracts (handlers vs MODULE.md)"
echo "Root: $ROOT"
echo ""

# Collect publishEvent( 'module', 'DetailType' from all JS under module dir
get_code_events() {
  local mod_dir="$1"
  grep -rh "publishEvent\s*(" "$mod_dir" --include="*.js" 2>/dev/null | \
  sed -n "s/.*publishEvent\s*(\s*['\"]\([^'\"]*\)['\"]\s*,\s*['\"]\([^'\"]*\)['\"].*/\1 \2/p" | sort -u
}

# Get Events Published from MODULE.md (lines like "- **DetailType**:" or "- DetailType, DetailType2")
get_module_events() {
  local md="$1"
  [ ! -f "$md" ] && return
  sed -n '/^## Events Published$/,/^## /p' "$md" | \
  sed 's/^\s*-\s*//;s/\*\*//g' | tr ',' '\n' | \
  sed 's/:.*//;s/^[[:space:]]*//;s/[[:space:]]*$//' | grep -E '^[A-Za-z][A-Za-z0-9]+$' | sort -u
}

for modules_dir in "$CORE_DIR" "$APP_DIR"; do
  [ ! -d "$modules_dir" ] && continue
  for dir in "$modules_dir"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  [[ "$name" == _* ]] && continue

  code_events=$(get_code_events "$dir" | sort -u)
  module_events=$(get_module_events "$dir/MODULE.md")

  if [ -z "$code_events" ]; then
    continue
  fi

  while read -r line; do
    [ -z "$line" ] && continue
    detail_type="${line#* }"
    if ! echo "$module_events" | grep -qx "$detail_type" 2>/dev/null; then
      echo "FAIL: $name — publishEvent('$name', '$detail_type', ...) not listed in MODULE.md Events Published"
      FAIL=1
    fi
  done <<< "$code_events"

  for ev in $module_events; do
    if ! echo "$code_events" | grep -q " $ev$"; then
      # Only warn if there is at least one publishEvent in this module (otherwise module might not publish)
      if [ -n "$code_events" ]; then
        echo "WARN: $name — MODULE.md lists $ev but no publishEvent('$name', '$ev', ...) found in code"
      fi
    fi
  done
  done
done

if [ $FAIL -eq 0 ]; then
  echo "OK: All publishEvent calls are documented in MODULE.md"
else
  echo ""
  echo "Fix: Add missing events to the module's MODULE.md under '## Events Published'"
fi
exit $FAIL
