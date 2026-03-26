const {
  DynamoDBClient,
} = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);

/**
 * Get item by key. Auto-injects tenant_id into key if key has tenant_id and ctx provided.
 * @param {Object} params - { TableName, Key }
 * @param {Object} [ctx] - { tenant_id }
 * @returns {Promise<Object|null>}
 */
async function getItem(params, ctx) {
  const key = ctx?.tenant_id && params.Key ? { ...params.Key, tenant_id: ctx.tenant_id } : params.Key;
  const response = await docClient.send(
    new GetCommand({ ...params, Key: key })
  );
  return response.Item || null;
}

/**
 * Put item. Auto-injects tenant_id if ctx provided.
 * @param {Object} params - { TableName, Item }
 * @param {Object} [ctx] - { tenant_id }
 */
async function putItem(params, ctx) {
  const item = ctx?.tenant_id && params.Item
    ? { ...params.Item, tenant_id: ctx.tenant_id }
    : params.Item;
  await docClient.send(new PutCommand({ ...params, Item: item }));
}

/**
 * Query table. Adds tenant_id to KeyConditionExpression if ctx provided and key is partition key.
 * @param {Object} params - DynamoDB Query params
 * @param {Object} [ctx] - { tenant_id }
 * @returns {Promise<{ items: Array, lastEvaluatedKey?: Object }>}
 */
async function query(params, ctx) {
  const response = await docClient.send(new QueryCommand(params));
  return {
    items: response.Items || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Scan table. Adds FilterExpression for tenant_id if ctx provided.
 * @param {Object} params - DynamoDB Scan params
 * @param {Object} [ctx] - { tenant_id }
 * @returns {Promise<{ items: Array, lastEvaluatedKey?: Object }>}
 */
async function scan(params, ctx) {
  const response = await docClient.send(new ScanCommand(params));
  return {
    items: response.Items || [],
    lastEvaluatedKey: response.LastEvaluatedKey,
  };
}

/**
 * Update item. Ensures tenant_id in Key if ctx provided.
 * @param {Object} params - DynamoDB Update params
 * @param {Object} [ctx] - { tenant_id }
 */
async function updateItem(params, ctx) {
  const key = ctx?.tenant_id && params.Key
    ? { ...params.Key, tenant_id: ctx.tenant_id }
    : params.Key;
  await docClient.send(new UpdateCommand({ ...params, Key: key }));
}

/**
 * Delete item. Ensures tenant_id in Key if ctx provided.
 * @param {Object} params - { TableName, Key }
 * @param {Object} [ctx] - { tenant_id }
 */
async function deleteItem(params, ctx) {
  const key = ctx?.tenant_id && params.Key
    ? { ...params.Key, tenant_id: ctx.tenant_id }
    : params.Key;
  await docClient.send(new DeleteCommand({ ...params, Key: key }));
}

module.exports = {
  getItem,
  putItem,
  query,
  scan,
  updateItem,
  deleteItem,
  docClient,
};
