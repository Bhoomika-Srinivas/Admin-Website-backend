#!/usr/bin/env bash
# Initialize a new project from the GENERAL-BACKEND-SAM starter kit.
# Usage: ./scripts/init-project.sh <project-name> [--remove module1,module2] [--include-app module1,module2]
# Example: ./scripts/init-project.sh my-app
#          ./scripts/init-project.sh my-app --remove workflow-management,audit-log
#          ./scripts/init-project.sh campus-erp --include-app admission,fee-billing,library

set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <project-name> [--remove module1,module2] [--include-app module1,module2]"
  echo "Example: $0 my-app"
  echo "         $0 my-app --remove workflow-management,audit-log"
  echo "         $0 campus-erp --include-app admission,fee-billing,library"
  exit 1
fi

PROJECT_NAME="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SAMCONFIG="$ROOT/samconfig.toml"
PRODUCT_MD="$ROOT/docs/PRODUCT.md"
CHANGELOG_MD="$ROOT/docs/CHANGELOG.md"

# Parse optional --remove and --include-app (order may vary)
REMOVE_LIST=""
INCLUDE_APP_LIST=""
shift || true
while [ $# -gt 0 ]; do
  if [ "$1" = "--remove" ] && [ -n "$2" ]; then REMOVE_LIST="$2"; shift 2; continue; fi
  if [ "$1" = "--include-app" ] && [ -n "$2" ]; then INCLUDE_APP_LIST="$2"; shift 2; continue; fi
  shift
done

# Validate project name (alphanumeric and hyphen)
if ! echo "$PROJECT_NAME" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$'; then
  echo "Error: project name must be alphanumeric with optional hyphens"
  exit 1
fi

echo "Initializing project: $PROJECT_NAME"

# 1. Update samconfig.toml (replace default project name 'myapp' with PROJECT_NAME)
if [ -f "$SAMCONFIG" ]; then
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak "s/myapp/$PROJECT_NAME/g" "$SAMCONFIG"
    rm -f "$SAMCONFIG.bak"
    echo "  Updated samconfig.toml"
  fi
fi

# 2. Create or update app-config.yaml with project name, core modules, and optional app modules
APP_CONFIG="$ROOT/app-config.yaml"
CORE_MODULES_LIST="tenant-management user-management audit-log notification-management storage-management form-management workflow-management"
if [ -n "$REMOVE_LIST" ]; then
  IFS=',' read -ra REMOVE_MODULES <<< "$REMOVE_LIST"
  for r in "${REMOVE_MODULES[@]}"; do
    r=$(echo "$r" | tr -d ' ')
    CORE_MODULES_LIST=$(echo "$CORE_MODULES_LIST" | tr ' ' '\n' | grep -v "^${r}$" | tr '\n' ' ')
  done
fi
{
  echo "# App configuration: which modules are included in the composed template.yaml."
  echo "# Used by scripts/compose-template.sh. Edit to enable/disable modules."
  echo ""
  echo "project_name: $PROJECT_NAME"
  echo "environment: dev"
  echo ""
  echo "core_modules:"
  for m in $CORE_MODULES_LIST; do echo "  - $m"; done
  echo ""
  if [ -n "$INCLUDE_APP_LIST" ]; then
    echo "app_modules:"
    IFS=',' read -ra APP_MODS <<< "$INCLUDE_APP_LIST"
    for m in "${APP_MODS[@]}"; do m=$(echo "$m" | tr -d ' '); [ -n "$m" ] && echo "  - $m"; done
  else
    echo "app_modules: []"
  fi
} > "$APP_CONFIG"
echo "  Updated app-config.yaml"

# 3. Fill PRODUCT.md with project name
if [ -f "$PRODUCT_MD" ]; then
  if command -v sed >/dev/null 2>&1; then
    sed -i.bak "s/{{PROJECT_NAME}}/$PROJECT_NAME/g" "$PRODUCT_MD"
    rm -f "$PRODUCT_MD.bak"
    echo "  Updated docs/PRODUCT.md"
  fi
fi

# 4. Reset CHANGELOG.md
if [ -f "$CHANGELOG_MD" ]; then
  cat > "$CHANGELOG_MD" << 'CHANGELOG_HEADER'
# Changelog

All notable changes to this project are documented here. Reverse-chronological order.

Format: **Added** / **Changed** / **Removed** per section. Include module name, event types, and GraphQL operations when relevant.

---

## [Project Initialized]

### Added
- Project initialized from GENERAL-BACKEND-SAM starter kit.
CHANGELOG_HEADER
  echo "  Reset docs/CHANGELOG.md"
fi

# 5. Optional module removal (during init only; use --force for core modules)
if [ -n "$REMOVE_LIST" ]; then
  IFS=',' read -ra MODULES <<< "$REMOVE_LIST"
  for mod in "${MODULES[@]}"; do
    mod=$(echo "$mod" | tr -d ' ')
    if [ -n "$mod" ] && [ -d "$ROOT/src/core-modules/$mod" ]; then
      echo "  Removing module: $mod"
      "$ROOT/scripts/remove-module.sh" "$mod" --force || true
    fi
  done
fi

# 5b. Optional app module scaffolding (Scenario B: multi-domain product)
if [ -n "$INCLUDE_APP_LIST" ]; then
  IFS=',' read -ra APP_MODS <<< "$INCLUDE_APP_LIST"
  for mod in "${APP_MODS[@]}"; do
    mod=$(echo "$mod" | tr -d ' ')
    if [ -n "$mod" ] && [ ! -d "$ROOT/src/app-modules/$mod" ]; then
      echo "  Scaffolding app module: $mod"
      "$ROOT/scripts/generate-module.sh" "$mod" --type app || true
    fi
  done
  if [ -f "$ROOT/scripts/compose-template.sh" ]; then
    bash "$ROOT/scripts/compose-template.sh" && echo "  Composed template.yaml"
  fi
fi

# 6. Re-initialize git
if [ -d "$ROOT/.git" ]; then
  rm -rf "$ROOT/.git"
fi
git init
git add .
git commit -m "Initialize $PROJECT_NAME from GENERAL-BACKEND-SAM starter" || true
echo "  Git re-initialized with initial commit"

echo ""
echo "Done. Next steps:"
echo "  1. Fill out docs/PRODUCT.md (domain, key entities, business rules, core modules used)"
echo "  2. Start building — use the agent pipeline for new features (see .cursor/rules/agent-pipeline.mdc)"
echo "  3. Run: npm install && npm test"
