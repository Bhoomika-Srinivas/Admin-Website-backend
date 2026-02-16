#!/usr/bin/env bash
# Builds dependency graph from MODULE.md and checks for cycles and cross-module requires.
# Usage: ./scripts/check-dependencies.sh [project-root]
# Exit 0 if no cycles and no cross-module imports; 1 otherwise.

set -e
ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
CORE_DIR="$ROOT/src/core-modules"
APP_DIR="$ROOT/src/app-modules"
FAIL=0

echo "Checking module dependencies"
echo "Root: $ROOT"
echo ""

# Extract Dependencies section from MODULE.md (e.g. "None", "Tenant", "Tenant, User")
get_deps() {
  local md="$1"
  [ ! -f "$md" ] && echo "" && return
  sed -n '/^## Dependencies$/,/^## /p' "$md" | sed '1d;/^## /d' | \
  tr -d '\n' | sed 's/None//;s/^[[:space:]]*//;s/[[:space:]]*$//' | tr ',' '\n' | \
  sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | grep -v '^$' | sort -u
}

# Normalize dep name to module dir name (e.g. Tenant -> tenant-management)
normalize_dep() {
  case "$1" in
    Tenant) echo "tenant-management" ;;
    User) echo "user-management" ;;
    Form) echo "form-management" ;;
    Notification) echo "notification-management" ;;
    Storage) echo "storage-management" ;;
    Workflow) echo "workflow-management" ;;
    Audit) echo "audit-log" ;;
    *) echo "$1" ;;
  esac
}

# Build graph: each line "module dep1 dep2"
echo "=== Dependency graph (from MODULE.md) ==="
graph_file=$(mktemp)
trap 'rm -f "$graph_file"' EXIT
for modules_dir in "$CORE_DIR" "$APP_DIR"; do
  [ ! -d "$modules_dir" ] && continue
  for dir in "$modules_dir"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  [[ "$name" == _* ]] && continue
  deps=$(get_deps "$dir/MODULE.md")
  deps_normalized=""
  for d in $deps; do
    nd=$(normalize_dep "$d")
    deps_normalized="$deps_normalized $nd"
    echo "$name $nd" >> "$graph_file"
  done
  [ -n "$deps_normalized" ] && echo "$name ->$deps_normalized"
  done
done
echo ""

# Check for cross-module require() in JS files (relative path escaping module dir)
echo "=== Cross-module requires ==="
found_cross=0
for modules_dir in "$CORE_DIR" "$APP_DIR"; do
  [ ! -d "$modules_dir" ] && continue
  while IFS= read -r -d '' f; do
    rel="${f#$modules_dir/}"
    mod=$(echo "$rel" | cut -d/ -f1)
    if grep -q "require\s*(\s*['\"]\.\./\.\./" "$f" 2>/dev/null; then
      other=$(grep -o "require\s*(\s*['\"]\.\./\.\./[^/]*" "$f" | head -1 | sed "s/.*\.\.\/\.\.\///;s/['\"].*//")
      if [ -n "$other" ] && [ "$other" != "$mod" ]; then
        echo "FAIL: $f — requires from parent (possible cross-module: $other)"
        found_cross=1
        FAIL=1
      fi
    fi
  done < <(find "$modules_dir" -name "*.js" -not -path "*/_template/*" -print0 2>/dev/null)
done
[ $found_cross -eq 0 ] && echo "OK: No cross-module require() found."
echo ""

# Cycle detection: DFS from each node (max depth 10) to detect any cycle
echo "=== Cycle check ==="
cycle_found=0
MAX_DEPTH=10

# DFS: start=starting node, current=current node, path=space-separated path, depth=current depth
find_cycle() {
  local start="$1"
  local current="$2"
  local path="$3"
  local depth="$4"
  [ "$depth" -gt "$MAX_DEPTH" ] && return 0
  local neighbors
  neighbors=$(awk -v from="$current" '$1==from {print $2}' "$graph_file" 2>/dev/null)
  for n in $neighbors; do
    if [ "$n" = "$start" ]; then
      echo "FAIL: Cycle: $start -> ... -> $n"
      return 1
    fi
    if echo " $path " | grep -q " $n "; then
      echo "FAIL: Cycle: $n appears in path (cycle back to $n)"
      return 1
    fi
    find_cycle "$start" "$n" "$path $n" "$((depth + 1))" || return 1
  done
  return 0
}

nodes=$(awk '{print $1}' "$graph_file" | sort -u)
for node in $nodes; do
  if ! find_cycle "$node" "$node" " $node " 0; then
    cycle_found=1
    FAIL=1
  fi
done
[ $cycle_found -eq 0 ] && echo "OK: No circular dependencies found."
echo ""

if [ $FAIL -eq 0 ]; then
  echo "All dependency checks passed."
else
  echo "Fix: Remove cross-module requires (use EventBridge) or fix MODULE.md Dependencies."
fi
exit $FAIL
