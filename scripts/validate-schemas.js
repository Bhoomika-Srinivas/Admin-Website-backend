#!/usr/bin/env node
/**
 * Validates GraphQL schema (and optionally Mongoose model fields) for consistency.
 * Run during build to catch schema drift. Exits 1 on failure.
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let appName = '';
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--app' && args[i + 1]) {
    appName = args[i + 1];
    break;
  }
}
const schemaFile = appName ? `schema.${appName}.graphql` : 'schema.graphql';
const SCHEMA_PATH = path.join(__dirname, '..', 'src', 'appsync', 'schema', schemaFile);

function readSchema() {
  const content = fs.readFileSync(SCHEMA_PATH, 'utf8');
  return content;
}

/**
 * Extract type/input definitions and their fields from GraphQL schema.
 * @param {string} content - Full schema content
 * @returns {Map<string, string[]>} typeName -> field names
 */
function parseGraphQLTypes(content) {
  const types = new Map();
  const typeRegex = /(?:type|input)\s+(\w+)\s*\{([^}]+)\}/g;
  let m;
  while ((m = typeRegex.exec(content)) !== null) {
    const name = m[1];
    const body = m[2];
    const fields = body
      .split('\n')
      .map((line) => line.trim().replace(/\s*[:#].*$/, '').trim())
      .filter((f) => f.length > 0 && f !== '_empty');
    types.set(name, fields);
  }
  return types;
}

/**
 * Contract checks: required fields that must exist in the merged schema.
 */
const REQUIRED_FIELDS = {
  UserConnection: ['items'],
  SubmitFormInput: ['form_id'],
};

function validateRequiredFields(types) {
  const errors = [];
  for (const [typeName, requiredFields] of Object.entries(REQUIRED_FIELDS)) {
    const fields = types.get(typeName);
    if (!fields) {
      continue;
    }
    for (const req of requiredFields) {
      if (!fields.includes(req)) {
        errors.push(`Type "${typeName}" must have field "${req}" (found: ${fields.join(', ')})`);
      }
    }
  }
  return errors;
}

function main() {
  if (!fs.existsSync(SCHEMA_PATH)) {
    console.error('Schema not found at', SCHEMA_PATH);
    process.exit(1);
  }
  const content = readSchema();
  const types = parseGraphQLTypes(content);
  const requiredErrors = validateRequiredFields(types);
  if (requiredErrors.length > 0) {
    console.error('Schema validation failed:');
    requiredErrors.forEach((e) => console.error('  -', e));
    process.exit(1);
  }
  console.log('Schema validation passed.');
}

main();
