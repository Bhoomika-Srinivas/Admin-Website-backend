/**
 * EventBridge-triggered. Writes all project events to the audit log.
 * Event shape: { source, detail-type, detail: { tenant_id, ... } }
 */
const { connectToDatabase } = require('/opt/nodejs/db/mongo-client');
const { generateId } = require('/opt/nodejs/utils/id-generator');

async function processAuditEvents(event) {
  const AuditEntry = require('../schemas/audit-entry.model');

  const events = Array.isArray(event) ? event : [event];
  const entries = events.map((e) => {
      const detail = e.detail || {};
      const source = e.source || '';
      const detailType = e['detail-type'] || '';
      const action = detailType || detail.action || source.split('.').pop() || 'Unknown';
      return {
        entry_id: generateId(),
        tenant_id: detail.tenant_id || '',
        actor_id: detail.actor_id || detail.user_id || detail.created_by || detail.updated_by,
        actor_email: detail.email,
        action,
        resource_type: detail.resource_type || detailType,
        resource_id: detail.tenant_id || detail.user_id || detail.form_id || detail.resource_id,
        before: detail.before,
        after: detail.after || detail,
        metadata: {
          source,
          detail_type: detailType,
        },
        timestamp: new Date(detail.timestamp || Date.now()),
    };
  });

  if (entries.length > 0) {
    await AuditEntry.insertMany(entries);
  }

  return { success: true, written: entries.length };
}

exports.handler = async (event) => {
  try {
    await connectToDatabase();
    return await processAuditEvents(event);
  } catch (err) {
    const events = Array.isArray(event) ? event : [event];
    const source = events[0]?.source || 'unknown';
    const detailType = events[0]?.['detail-type'] || 'unknown';
    console.error(
      JSON.stringify({
        level: 'error',
        message: err.message,
        source,
        detail_type: detailType,
      })
    );
    throw err;
  }
};
