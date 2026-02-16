#!/usr/bin/env bash
# Bootstrap a new app config in app-configs/ and add a samconfig.toml deploy profile.
# Usage: ./scripts/init-app.sh <app-name> [--core mod1,mod2,...] [--app mod1,mod2,...]
# Example: ./scripts/init-app.sh campus-erp --core tenant-management,user-management,audit-log --app admission,fee-billing

set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <app-name> [--core mod1,mod2,...] [--app mod1,mod2,...]"
  echo "Example: $0 campus-erp --core tenant-management,user-management,audit-log --app admission,fee-billing"
  echo "  --core: core modules to include (default: all)"
  echo "  --app: app modules to include; will scaffold if missing"
  exit 1
fi

APP_NAME="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_CONFIGS_DIR="${ROOT}/app-configs"
APP_CONFIG="${APP_CONFIGS_DIR}/${APP_NAME}.yaml"
SAMCONFIG="${ROOT}/samconfig.toml"

# Default: all core modules
CORE_MODULES_LIST="tenant-management user-management audit-log notification-management storage-management form-management workflow-management"
APP_MODULES_LIST=""

shift || true
while [ $# -gt 0 ]; do
  if [ "$1" = "--core" ] && [ -n "${2:-}" ]; then
    CORE_MODULES_LIST=""
    IFS=',' read -ra PARTS <<< "$2"
    for p in "${PARTS[@]}"; do p=$(echo "$p" | tr -d ' '); [ -n "$p" ] && CORE_MODULES_LIST="${CORE_MODULES_LIST} $p"; done
    CORE_MODULES_LIST=$(echo "$CORE_MODULES_LIST" | sed 's/^ *//')
    shift 2
    continue
  fi
  if [ "$1" = "--app" ] && [ -n "${2:-}" ]; then
    IFS=',' read -ra PARTS <<< "$2"
    for p in "${PARTS[@]}"; do p=$(echo "$p" | tr -d ' '); [ -n "$p" ] && APP_MODULES_LIST="${APP_MODULES_LIST} $p"; done
    APP_MODULES_LIST=$(echo "$APP_MODULES_LIST" | sed 's/^ *//')
    shift 2
    continue
  fi
  shift
done

# Validate app name (alphanumeric and hyphen)
if ! echo "$APP_NAME" | grep -qE '^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$'; then
  echo "Error: app name must be alphanumeric with optional hyphens"
  exit 1
fi

echo "Initializing app: $APP_NAME"

# 1. Create app-configs dir and write config
mkdir -p "$APP_CONFIGS_DIR"
{
  echo "# App configuration for $APP_NAME. Used by compose-template.sh --app $APP_NAME"
  echo ""
  echo "project_name: $APP_NAME"
  echo "environment: dev"
  echo ""
  echo "core_modules:"
  for m in $CORE_MODULES_LIST; do echo "  - $m"; done
  echo ""
  if [ -n "$APP_MODULES_LIST" ]; then
    echo "app_modules:"
    for m in $APP_MODULES_LIST; do echo "  - $m"; done
  else
    echo "app_modules: []"
  fi
} > "$APP_CONFIG"
echo "  Created $APP_CONFIG"

# 2. Add samconfig.toml deploy profile if not already present
if [ -f "$SAMCONFIG" ]; then
  if grep -q "\[${APP_NAME}.deploy.parameters\]" "$SAMCONFIG" 2>/dev/null; then
    echo "  samconfig.toml already has [$APP_NAME.deploy.parameters]"
  else
    {
      echo ""
      echo "[${APP_NAME}.deploy.parameters]"
      echo "stack_name = \"${APP_NAME}-dev\""
      echo "resolve_s3 = true"
      echo "s3_prefix = \"${APP_NAME}-dev\""
      echo "region = \"ap-south-1\""
      echo "capabilities = \"CAPABILITY_IAM CAPABILITY_AUTO_EXPAND\""
      echo "parameter_overrides = \"ProjectName=\\\"${APP_NAME}\\\" Environment=\\\"dev\\\"\""
      echo "image_repositories = []"
      echo "template_file = \"template.${APP_NAME}.yaml\""
    } >> "$SAMCONFIG"
    echo "  Added [$APP_NAME.deploy.parameters] to samconfig.toml"
  fi
fi

# 3. Scaffold app modules that don't exist yet
for mod in $APP_MODULES_LIST; do
  if [ ! -d "$ROOT/src/app-modules/$mod" ]; then
    echo "  Scaffolding app module: $mod"
    if [ -f "$ROOT/scripts/generate-module.sh" ]; then
      "$ROOT/scripts/generate-module.sh" "$mod" --type app --app "$APP_NAME" || true
    fi
  fi
done

# 4. Compose template and merge GraphQL for this app
if [ -f "$ROOT/scripts/compose-template.sh" ]; then
  bash "$ROOT/scripts/compose-template.sh" --app "$APP_NAME" && echo "  Composed template.${APP_NAME}.yaml"
fi
if [ -f "$ROOT/scripts/merge-graphql.sh" ]; then
  bash "$ROOT/scripts/merge-graphql.sh" --app "$APP_NAME" && echo "  Merged schema.${APP_NAME}.graphql"
fi

echo ""
echo "Done. Next steps:"
echo "  1. Implement app modules under src/app-modules/"
echo "  2. Build: npm run build:app -- APP=$APP_NAME  (or bash scripts/build-app.sh $APP_NAME)"
echo "  3. Deploy: sam deploy --config-env $APP_NAME"
