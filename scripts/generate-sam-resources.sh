#!/usr/bin/env bash
# Emits a YAML snippet for Lambda + DataSource + Resolvers for a module. Paste into template.yaml.
# Usage: ./scripts/generate-sam-resources.sh <module-name>
# Example: ./scripts/generate-sam-resources.sh my-feature

set -e
if [ -z "$1" ]; then
  echo "Usage: $0 <module-name>"
  echo "Example: $0 form-management"
  exit 1
fi

NAME="$1"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [ -d "$ROOT/src/core-modules/$NAME" ]; then
  MODULE_DIR="$ROOT/src/core-modules/$NAME"
  CODE_URI_PREFIX="src/core-modules"
elif [ -d "$ROOT/src/app-modules/$NAME" ]; then
  MODULE_DIR="$ROOT/src/app-modules/$NAME"
  CODE_URI_PREFIX="src/app-modules"
else
  echo "Error: module not found at src/core-modules/$NAME or src/app-modules/$NAME"
  exit 1
fi
RESOLVERS_DIR="$MODULE_DIR/resolvers"

# PascalCase prefix from module name (e.g. form-management -> Form, user-management -> User)
first_segment="${NAME%%-*}"
PREFIX=$(echo "$first_segment" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
# Lambda short name (e.g. form-management -> form, audit-log -> audit)
SHORT="${first_segment}"

echo "# Paste the following into template.yaml (e.g. before AppSyncServiceRole)"
echo "# Module: $NAME — Prefix: $PREFIX"
echo ""

# Lambda (default: handler.handler; no EventBridge policy by default — add if module publishes events)
echo "  ${PREFIX}Function:"
echo "    Type: AWS::Serverless::Function"
echo "    Properties:"
echo "      FunctionName: !Sub '\${ProjectName}-${SHORT}-\${Environment}'"
echo "      CodeUri: ${CODE_URI_PREFIX}/${NAME}/"
echo "      Handler: functions/handler.handler"
echo "      Layers:"
echo "        - !Ref CommonLayer"
echo "        - !Ref PackagesLayer"
echo "      Policies:"
echo "        - EventBridgePutEventsPolicy:"
echo "            EventBusName: !Ref AppEventBus"
echo "        - SSMParameterReadPolicy:"
echo "            ParameterName: !Sub '\${ProjectName}/\${Environment}/*'"
echo "      Tags:"
echo "        Environment: !Ref Environment"
echo "        ModuleName: ${NAME}"
echo "        ManagedBy: CloudFormation"
echo ""
echo "  ${PREFIX}DataSource:"
echo "    Type: AWS::AppSync::DataSource"
echo "    Properties:"
echo "      ApiId: !GetAtt AppSyncApi.ApiId"
echo "      Name: ${PREFIX}DataSource"
echo "      Type: AWS_LAMBDA"
echo "      ServiceRoleArn: !GetAtt AppSyncServiceRole.Arn"
echo "      LambdaConfig:"
echo "        LambdaFunctionArn: !GetAtt ${PREFIX}Function.Arn"
echo ""

# Resolvers from resolver files
for f in "$RESOLVERS_DIR"/*.js; do
  [ -f "$f" ] || continue
  base=$(basename "$f" .js)
  # camelCase to PascalCase for resolver logical ID (e.g. getForm -> GetForm)
  field_pascal=$(echo "$base" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')
  if [[ "$base" == get* ]] || [[ "$base" == list* ]]; then
    type_name="Query"
  else
    type_name="Mutation"
  fi
  echo "  ${PREFIX}${field_pascal}Resolver:"
  echo "    Type: AWS::AppSync::Resolver"
  echo "    DependsOn: AppSyncSchema"
  echo "    Properties:"
  echo "      ApiId: !GetAtt AppSyncApi.ApiId"
  echo "      TypeName: $type_name"
  echo "      FieldName: $base"
  echo "      DataSourceName: !GetAtt ${PREFIX}DataSource.Name"
  echo "      Kind: UNIT"
  echo "      Runtime:"
  echo "        Name: APPSYNC_JS"
  echo "        RuntimeVersion: 1.0.0"
  echo "      CodeS3Location: ${CODE_URI_PREFIX}/${NAME}/resolvers/${base}.js"
  echo ""
done

echo "# Remember to add !GetAtt ${PREFIX}Function.Arn to AppSyncServiceRole Policies.InvokeModuleLambdas.Resource"
