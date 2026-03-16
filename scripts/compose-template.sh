#!/usr/bin/env bash
# Composes template.yaml from app-config.yaml and stacks/*.yaml fragments.
# Run from project root. Run before sam build when using composed template.
# Usage: ./scripts/compose-template.sh [--app <app-name>]
#   Without --app: use app-config.yaml, output template.yaml
#   With --app campus-erp: use app-configs/campus-erp.yaml, output template.campus-erp.yaml

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STACKS="${ROOT}/stacks"
INFRA="${STACKS}/infrastructure.yaml"

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
  OUT="${ROOT}/template.${APP_NAME}.yaml"
else
  APP_CONFIG="${ROOT}/app-config.yaml"
  OUT="${ROOT}/template.yaml"
fi

# Map core module name -> Lambda logical ID for AppSyncServiceRole
get_core_lambda_id() {
  case "$1" in
    tenant-management) echo "TenantFunction" ;;
    user-management) echo "UserFunction" ;;
    audit-log) echo "AuditQueryFunction" ;;
    notification-management) echo "NotificationFunction" ;;
    storage-management) echo "StorageFunction" ;;
    form-management) echo "FormFunction" ;;
    workflow-management) echo "WorkflowFunction" ;;
    *) echo "" ;;
  esac
}

# Map app module name (e.g. admission) -> Lambda logical ID (e.g. AdmissionFunction)
# Convention: first segment PascalCase + "Function", with explicit overrides for multi-segment names
get_app_lambda_id() {
  case "$1" in
    department-management) echo "DepartmentFunction" ;;
    dept-info-management) echo "DeptInfoFunction" ;;
    dept-people-management) echo "DeptPeopleFunction" ;;
    dept-research-management) echo "DeptResearchFunction" ;;
    dept-academics-management) echo "DeptAcademicsFunction" ;;
    dept-activities-management) echo "DeptActivitiesFunction" ;;
    dept-branding-management) echo "DeptBrandingFunction" ;;
    *)
      local name="$1"
      local first="${name%%-*}"
      echo "$(echo "$first" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')Function"
      ;;
  esac
}

if [ ! -f "$APP_CONFIG" ]; then
  if [ -n "$APP_NAME" ]; then
    echo "Error: $APP_CONFIG not found. Run init-app.sh $APP_NAME or create the config."
  else
    echo "Error: app-config.yaml not found. Run init-project.sh or create app-config.yaml."
  fi
  exit 1
fi

# Read project_name from config for Parameters default
PROJECT_NAME_DEFAULT="myapp"
if [ -f "$APP_CONFIG" ]; then
  pn=$(awk '/^project_name:/ {gsub(/^project_name:[[:space:]]*/,""); sub(/[[:space:]]*#.*/,""); print; exit}' "$APP_CONFIG")
  [ -n "$pn" ] && PROJECT_NAME_DEFAULT="$pn"
fi

if [ ! -f "$INFRA" ]; then
  echo "Error: stacks/infrastructure.yaml not found."
  exit 1
fi

# Schema file to inline (run merge-graphql.sh first)
SCHEMA_DIR="${ROOT}/src/appsync/schema"
if [ -n "$APP_NAME" ]; then
  SCHEMA_FILE="${SCHEMA_DIR}/schema.${APP_NAME}.graphql"
else
  SCHEMA_FILE="${SCHEMA_DIR}/schema.graphql"
fi
if [ ! -f "$SCHEMA_FILE" ]; then
  echo "Error: Schema file $SCHEMA_FILE not found. Run ./scripts/merge-graphql.sh $([ -n "$APP_NAME" ] && echo "--app $APP_NAME") first."
  exit 1
fi

# Parse app-config.yaml for core_modules and app_modules (simple line-based)
get_core_list() {
  awk '/^core_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"
}
get_app_list() {
  awk '/^app_modules:/ {p=1; next} /^[a-zA-Z]/ && !/^  / {p=0} p && /^  - / {gsub(/^  - /,""); gsub(/#.*/,""); sub(/ *$/,""); if ($0) print}' "$APP_CONFIG"
}

echo "Composing $OUT from $APP_CONFIG and stacks/"

# Build list of Lambda ARNs for AppSyncServiceRole
LAMBDA_IDS=""
while IFS= read -r mod; do
  [ -z "$mod" ] && continue
  id=$(get_core_lambda_id "$mod")
  [ -n "$id" ] && LAMBDA_IDS="${LAMBDA_IDS} ${id}"
done <<< "$(get_core_list)"

while IFS= read -r mod; do
  [ -z "$mod" ] && continue
  if [ -f "${STACKS}/app/${mod}.yaml" ]; then
    id=$(get_app_lambda_id "$mod")
    LAMBDA_IDS="${LAMBDA_IDS} ${id}"
  fi
done <<< "$(get_app_list)"

# Write template header
{
  echo "AWSTemplateFormatVersion: '2010-09-09'"
  echo "Transform: AWS::Serverless-2016-10-31"
  echo ""
  echo "Parameters:"
  echo "  ProjectName:"
  echo "    Type: String"
  echo "    Default: $PROJECT_NAME_DEFAULT"
  echo "  Environment:"
  echo "    Type: String"
  echo "    AllowedValues: [dev, staging, prod]"
  echo "    Default: dev"
  echo ""
  echo "Globals:"
  echo "  Function:"
  echo "    Runtime: nodejs20.x"
  echo "    Timeout: 30"
  echo "    Environment:"
  echo "      Variables:"
  echo "        STAGE: !Ref Environment"
  echo "        PROJECT_NAME: !Ref ProjectName"
  echo "        EVENT_BUS_NAME: !Ref AppEventBus"
  echo "        MONGODB_SSM_PARAM_NAME: !Sub '/\${ProjectName}/\${Environment}/mongodb/uri'"
  echo "        MONGODB_DB_NAME: !Sub '\${ProjectName}_\${Environment}'"
  echo ""
  echo "Resources:"
  # Inline the GraphQL schema so CloudFormation always sees a change when schema content changes (DefinitionS3Location would not trigger updates)
  awk -v schema_file="$SCHEMA_FILE" '
    /Definition: INLINE_SCHEMA_PLACEHOLDER/ {
      print "      Definition: |"
      while ((getline line < schema_file) > 0) { print "        " line }
      close(schema_file)
      next
    }
    { print }
  ' "$INFRA"

  # Append each enabled core module fragment
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    frag="${STACKS}/core/${mod}.yaml"
    if [ -f "$frag" ]; then
      cat "$frag"
    fi
  done <<< "$(get_core_list)"

  # Append each enabled app module fragment
  while IFS= read -r mod; do
    [ -z "$mod" ] && continue
    frag="${STACKS}/app/${mod}.yaml"
    if [ -f "$frag" ]; then
      cat "$frag"
    fi
  done <<< "$(get_app_list)"

  # AppSyncServiceRole with dynamic Resource list
  echo "  AppSyncServiceRole:"
  echo "    Type: AWS::IAM::Role"
  echo "    Properties:"
  echo "      AssumeRolePolicyDocument:"
  echo "        Version: '2012-10-17'"
  echo "        Statement:"
  echo "          - Effect: Allow"
  echo "            Principal:"
  echo "              Service: appsync.amazonaws.com"
  echo "            Action: sts:AssumeRole"
  echo "      Policies:"
  echo "        - PolicyName: InvokeModuleLambdas"
  echo "          PolicyDocument:"
  echo "            Version: '2012-10-17'"
  echo "            Statement:"
  echo "              - Effect: Allow"
  echo "                Action: lambda:InvokeFunction"
  echo "                Resource:"
  if [ -z "${LAMBDA_IDS}" ] || [ -z "$(echo "$LAMBDA_IDS" | tr -d ' ')" ]; then
    echo "                  - !Sub 'arn:aws:lambda:\${AWS::Region}:\${AWS::AccountId}:function:no-module-lambdas'"
  else
    for id in $LAMBDA_IDS; do
      echo "                  - !GetAtt ${id}.Arn"
    done
  fi
  echo ""
  echo "Outputs:"
  echo "  CognitoUserPoolId:"
  echo "    Value: !Ref CognitoUserPool"
  echo "  CognitoUserPoolClientId:"
  echo "    Value: !Ref CognitoUserPoolClient"
  echo "  AppSyncApiUrl:"
  echo "    Value: !GetAtt AppSyncApi.GraphQLUrl"
  echo "  AppSyncApiId:"
  echo "    Value: !GetAtt AppSyncApi.ApiId"
  echo "  SQSQueueUrl:"
  echo "    Value: !GetAtt AppQueue.QueueUrl"
  echo "  S3BucketName:"
  echo "    Value: !Ref AppBucket"
  echo "  EventBusName:"
  echo "    Value: !Ref AppEventBus"
} > "$OUT.tmp"

mv "$OUT.tmp" "$OUT"
echo "Done. $OUT written"
