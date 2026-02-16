#!/usr/bin/env bash
# Merges common.graphql and module graphql files into schema.graphql (or per-app schema).
# Run from project root. Run before sam build to regenerate schema from modules.
# Usage: ./scripts/merge-graphql.sh [--app <app-name>]
#   Without --app: include all modules, output schema.graphql
#   With --app campus-erp: include only modules from app-configs/campus-erp.yaml, output schema.campus-erp.graphql

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCHEMA_DIR="$ROOT/src/appsync/schema"
CORE_DIR="$ROOT/src/core-modules"
APP_DIR="$ROOT/src/app-modules"

APP_NAME=""
while [ $# -gt 0 ]; do
  if [ "$1" = "--app" ] && [ -n "${2:-}" ]; then
    APP_NAME="$2"
    shift 2
    continue
  fi
  shift
done

if [ -n "$APP_NAME" ]; then
  APP_CONFIG="${ROOT}/app-configs/${APP_NAME}.yaml"
  OUT="$SCHEMA_DIR/schema.${APP_NAME}.graphql"
  if [ ! -f "$APP_CONFIG" ]; then
    echo "Error: $APP_CONFIG not found. Run init-app.sh $APP_NAME or create the config."
    exit 1
  fi
  get_core_list() {
    awk '/^core_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"
  }
  get_app_list() {
    awk '/^app_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"
  }
else
  OUT="$SCHEMA_DIR/schema.graphql"
fi

echo "Merging GraphQL schemas into $OUT"

{
  cat "$SCHEMA_DIR/common.graphql"
  echo ''
  echo 'type Query { _empty: String }'
  echo 'type Mutation { _empty: String }'
  echo ''
  if [ -n "$APP_NAME" ]; then
    while IFS= read -r mod; do
      [ -z "$mod" ] && continue
      dir="$CORE_DIR/$mod"
      if [ -d "${dir}/graphql" ]; then
        for f in "${dir}"/graphql/*.graphql; do
          [ -e "$f" ] && { echo "# module: $mod"; cat "$f"; echo ''; }
        done
      fi
    done <<< "$(get_core_list)"
    while IFS= read -r mod; do
      [ -z "$mod" ] && continue
      dir="$APP_DIR/$mod"
      if [ -d "${dir}/graphql" ]; then
        for f in "${dir}"/graphql/*.graphql; do
          [ -e "$f" ] && { echo "# module: $mod"; cat "$f"; echo ''; }
        done
      fi
    done <<< "$(get_app_list)"
  else
    for dir in "$CORE_DIR"/*/ "$APP_DIR"/*/; do
      [ -d "$dir" ] || continue
      name=$(basename "$dir")
      [[ "$name" == _* ]] && continue
      if [ -d "${dir}graphql" ]; then
        for f in "${dir}"graphql/*.graphql; do
          [ -e "$f" ] && { echo "# module: $name"; cat "$f"; echo ''; }
        done
      fi
    done
  fi
} > "$OUT.tmp"

# Flatten extend type Query/Mutation into single root types (AppSync does not support extend type)
# Pass 1: collect fields from extend blocks into temp files; output schema with extend blocks stripped
awk -v base="$OUT.tmp" '
  /^[[:space:]]*extend type Query[[:space:]]*\{[[:space:]]*$/ { in_query=1; next }
  /^[[:space:]]*extend type Mutation[[:space:]]*\{[[:space:]]*$/ { in_mutation=1; next }
  in_query {
    if ($0 ~ /^[[:space:]]*}[[:space:]]*$/) { in_query=0; next }
    query_fields = query_fields $0 "\n"
    next
  }
  in_mutation {
    if ($0 ~ /^[[:space:]]*}[[:space:]]*$/) { in_mutation=0; next }
    mutation_fields = mutation_fields $0 "\n"
    next
  }
  { print }
END {
  printf "%s", query_fields > (base ".q")
  printf "%s", mutation_fields > (base ".m")
}
' "$OUT.tmp" > "$OUT.tmp2"

# Pass 2: replace placeholder root types with flattened type Query and type Mutation
awk -v qf="$OUT.tmp.q" -v mf="$OUT.tmp.m" '
BEGIN {
  while ((getline < qf) > 0) query_fields = query_fields $0 "\n"
  close(qf)
  while ((getline < mf) > 0) mutation_fields = mutation_fields $0 "\n"
  close(mf)
}
/^type Query \{ _empty: String \}$/ {
  printf "type Query {\n  _empty: String\n%s}\n", query_fields
  next
}
/^type Mutation \{ _empty: String \}$/ {
  printf "type Mutation {\n  _empty: String\n%s}\n", mutation_fields
  next
}
{ print }
' "$OUT.tmp2" > "$OUT"
rm -f "$OUT.tmp" "$OUT.tmp2" "$OUT.tmp.q" "$OUT.tmp.m"

echo "Done. Schema written to $OUT (extend type Query/Mutation flattened for AppSync)."

# Validation: duplicate type definitions (type X defined more than once, excluding extend)
dup_types=$(grep -E '^\s*type\s+[A-Za-z0-9]+\s' "$OUT" | sed 's/^[[:space:]]*type[[:space:]]*\([A-Za-z0-9]*\).*/\1/' | sort | uniq -d)
if [ -n "$dup_types" ]; then
  echo "WARN: Duplicate type definition(s) in schema (use extend type for extensions): $dup_types"
fi

# Validation: list operations should return Connection (grep list*: and check for Connection in type)
list_fields=$(grep -E '^\s*list[A-Za-z]*\s*\([^)]*\)\s*:\s*[^!]' "$OUT" 2>/dev/null | sed 's/^[[:space:]]*\([a-z]*\).*/\1/' || true)
for f in $list_fields; do
  if ! grep -q "${f}.*Connection" "$OUT" 2>/dev/null; then
    echo "WARN: List operation '$f' may need to return a Connection type (items, nextCursor)"
  fi
done
