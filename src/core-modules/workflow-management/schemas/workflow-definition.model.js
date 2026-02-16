const mongoose = require('mongoose');

const workflowStepSchema = new mongoose.Schema({
  step_id: String,
  type: { type: String, enum: ['approval', 'notification', 'action', 'condition', 'delay'] },
  config: mongoose.Schema.Types.Mixed,
  next_step_id: String,
  on_reject_step_id: String,
}, { _id: false });

const workflowDefinitionSchema = new mongoose.Schema(
  {
    workflow_id: { type: String, required: true },
    tenant_id: { type: String, required: true, index: true },
    name: { type: String, required: true },
    trigger: { event_source: String, event_type: String, conditions: mongoose.Schema.Types.Mixed },
    steps: [workflowStepSchema],
    status: { type: String, enum: ['draft', 'active', 'disabled'], default: 'draft' },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

module.exports = mongoose.models.WorkflowDefinition || mongoose.model('WorkflowDefinition', workflowDefinitionSchema);
