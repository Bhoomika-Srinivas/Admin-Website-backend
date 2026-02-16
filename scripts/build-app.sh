#!/usr/bin/env bash
# Build a single app: compose template, merge GraphQL, validate schema, sam build.
# Usage: ./scripts/build-app.sh <app-name>
# Example: ./scripts/build-app.sh campus-erp

set -e
APP="${APP:-$1}"
if [ -z "$APP" ]; then
  echo "Usage: $0 <app-name>  OR  APP=<app-name> $0"
  echo "Example: $0 campus-erp  OR  APP=campus-erp npm run build:app"
  exit 1
fi
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Building app: $APP"
bash "$ROOT/scripts/merge-graphql.sh" --app "$APP"
bash "$ROOT/scripts/compose-template.sh" --app "$APP"
node "$ROOT/scripts/validate-schemas.js" --app "$APP"
sam build -t "template.${APP}.yaml"
echo "Done. Deploy with: sam deploy --config-env $APP"
