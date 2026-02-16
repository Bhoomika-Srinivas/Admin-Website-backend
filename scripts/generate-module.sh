#!/usr/bin/env bash
# Scaffolds a new module from _template.
# Usage: ./scripts/generate-module.sh <module-name> [--type core|app] [--app <app-name>]
# Example: ./scripts/generate-module.sh my-feature
#          ./scripts/generate-module.sh admission --type app --app campus-erp

set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <module-name> [--type core|app] [--app <app-name>]"
  echo "Example: $0 my-feature"
  echo "         $0 admission --type app --app campus-erp"
  echo "  --type: core = src/core-modules/, app = src/app-modules/ (default)"
  echo "  --app: add to app-configs/<app-name>.yaml and compose that app's template (app modules only)"
  exit 1
fi

NAME="$1"
TYPE="app"
TARGET_APP=""
shift || true
while [ $# -gt 0 ]; do
  if [ "$1" = "--type" ] && [ -n "${2:-}" ]; then
    TYPE="$2"
    shift 2
    continue
  fi
  if [ "$1" = "--app" ] && [ -n "${2:-}" ]; then
    TARGET_APP="$2"
    shift 2
    continue
  fi
  shift
done
[ "$TYPE" = "core" ] || TYPE="app"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ "$TYPE" = "core" ]; then
  TEMPLATE="$ROOT/src/core-modules/_template"
  DEST="$ROOT/src/core-modules/$NAME"
  MODULE_SCOPE="src/core-modules/$NAME"
  REGISTRY_CATEGORY="Core"
else
  TEMPLATE="$ROOT/src/app-modules/_template"
  DEST="$ROOT/src/app-modules/$NAME"
  MODULE_SCOPE="src/app-modules/$NAME"
  REGISTRY_CATEGORY="Custom"
fi
MODULE_NAME="$(echo "$NAME" | sed 's/-/ /g' | sed 's/\b\(.\)/\u\1/g' | sed 's/ //g')"

if [ -d "$DEST" ]; then
  echo "Module $NAME already exists at $DEST"
  exit 1
fi

echo "Creating module: $NAME at $DEST"
mkdir -p "$DEST"/{functions,schemas,graphql,resolvers}
cp -r "$TEMPLATE"/functions/* "$DEST/functions/" 2>/dev/null || true
cp -r "$TEMPLATE"/schemas/* "$DEST/schemas/" 2>/dev/null || true
cp -r "$TEMPLATE"/graphql/* "$DEST/graphql/" 2>/dev/null || true
cp -r "$TEMPLATE"/resolvers/* "$DEST/resolvers/" 2>/dev/null || true
cp "$TEMPLATE/MODULE.md" "$DEST/MODULE.md"

# Replace MODULE_NAME placeholder in handler and MODULE.md
if command -v sed >/dev/null 2>&1; then
  sed -i.bak "s/MODULE_NAME/$NAME/g" "$DEST/functions/handler.js" 2>/dev/null || true
  sed -i.bak "s/MODULE_NAME/$NAME/g" "$DEST/MODULE.md" 2>/dev/null || true
  rm -f "$DEST/functions/handler.js.bak" "$DEST/MODULE.md.bak" 2>/dev/null || true
fi

# Scaffold handler test and fixtures
mkdir -p "$ROOT/tests/unit/modules/$NAME/fixtures"
if [ -f "$ROOT/tests/_template/handler.test.js" ]; then
  cp "$ROOT/tests/_template/handler.test.js" "$ROOT/tests/unit/modules/$NAME/handler.test.js"
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak "s/MODULE_NAME/$NAME/g" "$ROOT/tests/unit/modules/$NAME/handler.test.js" 2>/dev/null || true
    rm -f "$ROOT/tests/unit/modules/$NAME/handler.test.js.bak" 2>/dev/null || true
  fi
  echo "  Created tests/unit/modules/$NAME/handler.test.js and fixtures/"
fi

# Generate vertical agent SKILL.md from template
AGENT_TEMPLATE="$ROOT/docs/agents/_template.SKILL.md"
AGENT_FILE="$ROOT/docs/agents/${NAME}-agent.SKILL.md"
if [ -f "$AGENT_TEMPLATE" ] && [ ! -f "$AGENT_FILE" ]; then
  sed -e "s/{{MODULE_PATH}}/$NAME/g" -e "s/{{MODULE_NAME}}/$MODULE_NAME/g" "$AGENT_TEMPLATE" > "$AGENT_FILE"
  echo "  Created agent: docs/agents/${NAME}-agent.SKILL.md"
fi

# Append row to REGISTRY.md
REGISTRY="$ROOT/docs/agents/REGISTRY.md"
if [ -f "$REGISTRY" ]; then
  echo "| $MODULE_NAME | Vertical | $REGISTRY_CATEGORY | $MODULE_SCOPE/ | docs/agents/${NAME}-agent.SKILL.md |" >> "$REGISTRY"
  echo "  Updated docs/agents/REGISTRY.md"
fi

# Append to PRODUCT.md Custom Modules section
PRODUCT_MD="$ROOT/docs/PRODUCT.md"
if [ -f "$PRODUCT_MD" ]; then
  if grep -q "^- $NAME$" "$PRODUCT_MD" 2>/dev/null; then
    : already listed
  else
    if command -v sed >/dev/null 2>&1; then
      sed -i.bak "/auto-updated by generate-module.sh/a\\
- $NAME" "$PRODUCT_MD"
      rm -f "$PRODUCT_MD.bak" 2>/dev/null || true
      echo "  Updated docs/PRODUCT.md (Custom Modules)"
    fi
  fi
fi

# For app modules: create SAM fragment and add to app config, then compose template
if [ "$TYPE" = "app" ]; then
  mkdir -p "$ROOT/stacks/app"
  FRAGMENT="$ROOT/stacks/app/$NAME.yaml"
  if "$ROOT/scripts/generate-sam-resources.sh" "$NAME" 2>/dev/null | sed '/^#/d' > "$FRAGMENT"; then
    echo "  Created stacks/app/$NAME.yaml"
  fi
  if [ -n "$TARGET_APP" ]; then
    APP_CONFIG="$ROOT/app-configs/${TARGET_APP}.yaml"
  else
    APP_CONFIG="$ROOT/app-config.yaml"
  fi
  if [ -f "$APP_CONFIG" ] && ! grep -q "  - $NAME" "$APP_CONFIG" 2>/dev/null; then
    if grep -q "app_modules: \[\]" "$APP_CONFIG" 2>/dev/null; then
      sed -i.bak 's/app_modules: \[\]/app_modules:\
  - '"$NAME"'/' "$APP_CONFIG" 2>/dev/null || true
    else
      sed -i.bak "/^app_modules:/a\\
  - $NAME" "$APP_CONFIG" 2>/dev/null || true
    fi
    rm -f "$APP_CONFIG.bak" 2>/dev/null || true
    echo "  Added $NAME to $(basename "$APP_CONFIG") app_modules"
  fi
  if [ -f "$ROOT/scripts/compose-template.sh" ]; then
    if [ -n "$TARGET_APP" ]; then
      bash "$ROOT/scripts/compose-template.sh" --app "$TARGET_APP" && echo "  Composed template.${TARGET_APP}.yaml"
    else
      bash "$ROOT/scripts/compose-template.sh" && echo "  Composed template.yaml"
    fi
  fi
fi

echo "Done. Next steps:"
echo "  1. Edit $DEST/MODULE.md with data models, events, permissions"
echo "  2. Implement $DEST/functions/handler.js and $DEST/schemas/"
echo "  3. Add resolvers and update stacks (app modules: edit stacks/app/$NAME.yaml or re-run generate-sam-resources.sh)"
echo "  4. Add GraphQL types to src/appsync/schema/schema.graphql or run scripts/merge-graphql.sh"
echo "  5. Agent created: docs/agents/${NAME}-agent.SKILL.md (and registered in REGISTRY.md)"
