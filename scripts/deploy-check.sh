#!/usr/bin/env bash
# Runs automated pre-deploy checks: Lambda/resolver alignment, npm test, TODO markers.
# Usage: ./scripts/deploy-check.sh [project-root] [--app <app-name>]
# Exit 0 if all checks pass; 1 otherwise.

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_NAME=""
while [ $# -gt 0 ]; do
  if [ "$1" = "--app" ] && [ -n "${2:-}" ]; then
    APP_NAME="$2"
    shift 2
    continue
  fi
  if [ -d "$1" ] 2>/dev/null; then
    ROOT="$1"
    shift
    continue
  fi
  shift
done

CORE_DIR="$ROOT/src/core-modules"
APP_DIR="$ROOT/src/app-modules"
if [ -n "$APP_NAME" ]; then
  TEMPLATE="$ROOT/template.${APP_NAME}.yaml"
  APP_CONFIG="$ROOT/app-configs/${APP_NAME}.yaml"
  if [ ! -f "$APP_CONFIG" ]; then
    echo "Error: $APP_CONFIG not found."
    exit 1
  fi
  get_core_list() { awk '/^core_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"; }
  get_app_list() { awk '/^app_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"; }
else
  TEMPLATE="$ROOT/template.yaml"
fi
FAIL=0

echo "Deploy readiness checks"
echo "Root: $ROOT"
[ -n "$APP_NAME" ] && echo "App: $APP_NAME (template: $(basename "$TEMPLATE"))"
echo ""

if [ ! -f "$TEMPLATE" ]; then
  echo "Error: $TEMPLATE not found. Run compose-template.sh first."
  exit 1
fi

# Count Lambda resources (AWS::Serverless::Function) in template
lambda_count=$(grep -c "Type: AWS::Serverless::Function" "$TEMPLATE" 2>/dev/null || echo 0)
# Count module dirs: either from app config (--app) or all core+app dirs
module_dirs=0
if [ -n "$APP_NAME" ]; then
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    for base in "$CORE_DIR/$mod" "$APP_DIR/$mod"; do
      if [ -d "$base" ] && [ -d "${base}/functions" ] && ls "${base}"/functions/*.js 1>/dev/null 2>&1; then
        ((module_dirs++)) || true
        break
      fi
    done
  done <<< "$(get_core_list)"
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    if [ -d "$APP_DIR/$mod" ] && [ -d "${APP_DIR}/${mod}/functions" ] && ls "${APP_DIR}/${mod}"/functions/*.js 1>/dev/null 2>&1; then
      ((module_dirs++)) || true
    fi
  done <<< "$(get_app_list)"
else
  for modules_dir in "$CORE_DIR" "$APP_DIR"; do
    [ -d "$modules_dir" ] || continue
    for dir in "$modules_dir"/*/; do
      [ -d "$dir" ] || continue
      name=$(basename "$dir")
      [[ "$name" == _* ]] && continue
      if [ -d "${dir}functions" ] && ls "${dir}"functions/*.js 1>/dev/null 2>&1; then
        ((module_dirs++)) || true
      fi
    done
  done
fi

echo "=== SAM template vs modules ==="
echo "  Lambdas in template: $lambda_count"
echo "  Module dirs with handler: $module_dirs"
if [ "$lambda_count" -lt "$module_dirs" ]; then
  echo "  WARN: Fewer Lambdas than module dirs — ensure every module has a Lambda in the template"
  FAIL=1
else
  echo "  OK"
fi
echo ""

# Count Resolver resources vs resolver files
resolver_count=$(grep -c "Type: AWS::AppSync::Resolver" "$TEMPLATE" 2>/dev/null || echo 0)
resolver_files=0
if [ -n "$APP_NAME" ]; then
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    for base in "$CORE_DIR/$mod" "$APP_DIR/$mod"; do
      [ -d "$base/resolvers" ] || continue
      for f in "${base}"/resolvers/*.js; do [ -f "$f" ] && ((resolver_files++)) || true; done
      break
    done
  done <<< "$(get_core_list)"
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    if [ -d "$APP_DIR/$mod/resolvers" ]; then
      for f in "${APP_DIR}/${mod}"/resolvers/*.js; do [ -f "$f" ] && ((resolver_files++)) || true; done
    fi
  done <<< "$(get_app_list)"
else
  for modules_dir in "$CORE_DIR" "$APP_DIR"; do
    [ -d "$modules_dir" ] || continue
    for dir in "$modules_dir"/*/; do
      [ -d "$dir" ] || continue
      name=$(basename "$dir")
      [[ "$name" == _* ]] && continue
      for f in "${dir}"resolvers/*.js; do
        [ -f "$f" ] && ((resolver_files++)) || true
      done
    done
  done
fi
echo "=== Resolvers ==="
echo "  Resolvers in template: $resolver_count"
echo "  Resolver files in modules: $resolver_files"
if [ "$resolver_count" -lt "$resolver_files" ]; then
  echo "  WARN: Fewer Resolvers than resolver files — add missing Resolver resources"
  FAIL=1
else
  echo "  OK"
fi
echo ""

# Run npm test (allow failure if npm not runnable)
echo "=== npm test ==="
if (cd "$ROOT" && npm test 2>&1); then
  echo "  OK"
else
  echo "  FAIL: npm test failed (run 'npm install' and 'npm test' manually)"
  FAIL=1
fi
echo ""

# TODO/FIXME in handler code
echo "=== TODO/FIXME in handlers ==="
todos=""
for modules_dir in "$CORE_DIR" "$APP_DIR"; do
  [ -d "$modules_dir" ] || continue
  todos="${todos}$(grep -rn "TODO\|FIXME" "$modules_dir" --include="*.js" 2>/dev/null | grep -v _template || true)"
done
if [ -n "$todos" ]; then todos=$(echo "$todos" | grep -v '^$'); fi
if [ -n "$todos" ]; then
  echo "$todos"
  echo "  WARN: Address TODOs before deploy if critical"
else
  echo "  OK: No TODO/FIXME in module code"
fi
echo ""

if [ $FAIL -eq 0 ]; then
  echo "All deploy checks passed."
else
  echo "One or more checks failed. Fix before deploy."
fi
exit $FAIL
