/**
 * SQS-triggered. Dequeues notification jobs and sends via SES (stub - actual SES in prod).
 */
exports.handler = async (event) => {
  const results = [];
  for (const record of event.Records || []) {
    try {
      const body = JSON.parse(record.body || '{}');
      const { notification_id, recipient_email, subject, body_html } = body;
      if (recipient_email) {
        results.push({ notification_id, status: 'sent' });
      }
    } catch (err) {
      results.push({ status: 'failed', error: err.message });
    }
  }
  return { processed: results.length };
};
