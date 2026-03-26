const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { withRetry } = require('./retry');

const client = new EventBridgeClient({ region: process.env.AWS_REGION });
const EVENT_BUS_NAME = process.env.EVENT_BUS_NAME;
const PROJECT_NAME = process.env.PROJECT_NAME || 'myapp';

/**
 * Publish an event to the custom EventBridge bus.
 * @param {string} source - e.g. "tenant-management" (project name is prefixed automatically)
 * @param {string} detailType - e.g. "TenantCreated"
 * @param {Object} detail - Event payload (will be JSON-serialized)
 * @returns {Promise<{ eventId?: string }>}
 */
async function publishEvent(source, detailType, detail) {
  if (!EVENT_BUS_NAME) {
    if (process.env.AWS_SAM_LOCAL || process.env.IS_OFFLINE) {
      return { eventId: 'local' };
    }
    throw new Error('EVENT_BUS_NAME is not set');
  }

  const fullSource = source.includes('.') ? source : `${PROJECT_NAME}.${source}`;
  const response = await withRetry(() =>
    client.send(
      new PutEventsCommand({
        Entries: [
          {
            Source: fullSource,
            DetailType: detailType,
            Detail: typeof detail === 'string' ? detail : JSON.stringify(detail),
            EventBusName: EVENT_BUS_NAME,
            Time: new Date(),
          },
        ],
      })
    )
  );

  const entry = response.Entries?.[0];
  return { eventId: entry?.EventId };
}

module.exports = { publishEvent };
