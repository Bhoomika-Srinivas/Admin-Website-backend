#!/usr/bin/env bash
# Remove a module from config (and optionally delete its code). With --app, only remove from that app's config.
# Usage: ./scripts/remove-module.sh <module-name> [--force] [--app <app-name>]
# Example: ./scripts/remove-module.sh my-feature
#          ./scripts/remove-module.sh admission --app campus-erp

set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <module-name> [--force] [--app <app-name>]"
  echo "Example: $0 my-feature"
  echo "         $0 admission --app campus-erp"
  echo "  --force: skip confirmation when removing a core module"
  echo "  --app: only remove from app-configs/<app-name>.yaml and re-compose that app (does not delete module code)"
  exit 1
fi

NAME="$1"
FORCE=""
TARGET_APP=""
shift || true
while [ $# -gt 0 ]; do
  if [ "$1" = "--force" ]; then FORCE="--force"; shift; continue; fi
  if [ "$1" = "--app" ] && [ -n "${2:-}" ]; then TARGET_APP="$2"; shift 2; continue; fi
  shift
done

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$ROOT/src/core-modules/$NAME" ]; then
  MODULE_DIR="$ROOT/src/core-modules/$NAME"
elif [ -d "$ROOT/src/app-modules/$NAME" ]; then
  MODULE_DIR="$ROOT/src/app-modules/$NAME"
else
  MODULE_DIR="$ROOT/src/core-modules/$NAME"
fi
AGENT_FILE="$ROOT/docs/agents/${NAME}-agent.SKILL.md"
REGISTRY="$ROOT/docs/agents/REGISTRY.md"
PRODUCT_MD="$ROOT/docs/PRODUCT.md"
ARCHITECTURE="$ROOT/docs/ARCHITECTURE.md"

# Core modules (ship with starter) — removing them is only recommended during init-project.sh
CORE_MODULES="tenant-management user-management form-management notification-management storage-management workflow-management audit-log"

# --app only: remove from that app's config and re-compose/merge (do not delete module code)
if [ -n "$TARGET_APP" ]; then
  APP_CONFIG="$ROOT/app-configs/${TARGET_APP}.yaml"
  if [ ! -f "$APP_CONFIG" ]; then
    echo "Error: $APP_CONFIG not found."
    exit 1
  fi
  echo "Removing $NAME from app $TARGET_APP only (config and template)"
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak "/  - $NAME/d" "$APP_CONFIG" 2>/dev/null || true
    rm -f "$APP_CONFIG.bak" 2>/dev/null || true
    echo "  Removed $NAME from app-configs/${TARGET_APP}.yaml"
  fi
  if [ -f "$ROOT/scripts/compose-template.sh" ]; then
    bash "$ROOT/scripts/compose-template.sh" --app "$TARGET_APP" && echo "  Re-composed template.${TARGET_APP}.yaml"
  fi
  if [ -f "$ROOT/scripts/merge-graphql.sh" ]; then
    bash "$ROOT/scripts/merge-graphql.sh" --app "$TARGET_APP" && echo "  Regenerated schema.${TARGET_APP}.graphql"
  fi
  echo "Module $NAME removed from app $TARGET_APP."
  exit 0
fi

if [ ! -d "$MODULE_DIR" ]; then
  echo "Error: module not found at $MODULE_DIR"
  exit 1
fi

# Check if core module
is_core=false
for core in $CORE_MODULES; do
  if [ "$NAME" = "$core" ]; then
    is_core=true
    break
  fi
done

if [ "$is_core" = true ] && [ "$FORCE" != "--force" ]; then
  echo "Warning: $NAME is a core module. Removing it is only recommended during init-project.sh."
  echo "Continue? [y/N]"
  read -r confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "Aborted."
    exit 0
  fi
fi

echo "Removing module: $NAME"

# 1. Remove module directory and its unit test directory
rm -rf "$MODULE_DIR"
echo "  Removed $MODULE_DIR"
if [ -d "$ROOT/tests/unit/modules/$NAME" ]; then
  rm -rf "$ROOT/tests/unit/modules/$NAME"
  echo "  Removed tests/unit/modules/$NAME"
fi

# 2. Remove agent SKILL.md
if [ -f "$AGENT_FILE" ]; then
  rm -f "$AGENT_FILE"
  echo "  Removed $AGENT_FILE"
fi

# 3. Remove row from REGISTRY.md (line containing src/core-modules/NAME/ or src/app-modules/NAME/)
if [ -f "$REGISTRY" ]; then
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak "/src\/core-modules\/$NAME\//d" "$REGISTRY"
    sed -i.bak "/src\/app-modules\/$NAME\//d" "$REGISTRY"
    rm -f "$REGISTRY.bak"
    echo "  Updated docs/agents/REGISTRY.md"
  fi
fi

# 4. Update PRODUCT.md: uncheck core module or remove from custom list
if [ -f "$PRODUCT_MD" ]; then
  if command -v sed >/dev/null 2>&1; then
    if [ "$is_core" = true ]; then
      sed -i.bak "/$NAME/s/\[x]/[ ]/" "$PRODUCT_MD"
    else
      sed -i.bak "/^- $NAME$/d" "$PRODUCT_MD"
    fi
    rm -f "$PRODUCT_MD.bak"
    echo "  Updated docs/PRODUCT.md"
  fi
fi

# 5. Remove SAM fragment if present; remove from app-config.yaml and all app-configs/*.yaml; re-compose
if [ -f "$ROOT/stacks/core/$NAME.yaml" ]; then
  rm -f "$ROOT/stacks/core/$NAME.yaml"
  echo "  Removed stacks/core/$NAME.yaml"
fi
if [ -f "$ROOT/stacks/app/$NAME.yaml" ]; then
  rm -f "$ROOT/stacks/app/$NAME.yaml"
  echo "  Removed stacks/app/$NAME.yaml"
  if [ -f "$ROOT/app-config.yaml" ]; then
    sed -i.bak "/  - $NAME/d" "$ROOT/app-config.yaml" 2>/dev/null || true
    rm -f "$ROOT/app-config.yaml.bak" 2>/dev/null || true
    echo "  Removed $NAME from app-config.yaml"
  fi
  for ac in "$ROOT/app-configs"/*.yaml; do
    [ -f "$ac" ] || continue
    if grep -q "  - $NAME" "$ac" 2>/dev/null; then
      sed -i.bak "/  - $NAME/d" "$ac" 2>/dev/null || true
      rm -f "${ac}.bak" 2>/dev/null || true
      echo "  Removed $NAME from $(basename "$ac")"
    fi
  done
  if [ -f "$ROOT/scripts/compose-template.sh" ]; then
    bash "$ROOT/scripts/compose-template.sh" && echo "  Re-composed template.yaml"
    for ac in "$ROOT/app-configs"/*.yaml; do
      [ -f "$ac" ] || continue
      app=$(basename "$ac" .yaml)
      bash "$ROOT/scripts/compose-template.sh" --app "$app" && echo "  Re-composed template.${app}.yaml"
    done
  fi
fi

# 6. Merge GraphQL to drop this module from root schema (and per-app schemas if any)
if [ -f "$ROOT/scripts/merge-graphql.sh" ]; then
  bash "$ROOT/scripts/merge-graphql.sh" && echo "  Regenerated schema.graphql"
  for ac in "$ROOT/app-configs"/*.yaml; do
    [ -f "$ac" ] || continue
    app=$(basename "$ac" .yaml)
    bash "$ROOT/scripts/merge-graphql.sh" --app "$app" && echo "  Regenerated schema.${app}.graphql"
  done
fi

echo ""
echo "Manual cleanup (if needed):"
echo "  - Update docs/ARCHITECTURE.md: remove $NAME from the diagram and Module Dependency Order"
echo ""
echo "Module $NAME removed."
