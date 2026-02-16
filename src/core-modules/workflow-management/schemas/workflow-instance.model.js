const mongoose = require('mongoose');

const workflowInstanceSchema = new mongoose.Schema(
  {
    instance_id: { type: String, required: true },
    workflow_id: { type: String, required: true, index: true },
    tenant_id: { type: String, required: true, index: true },
    trigger_event: mongoose.Schema.Types.Mixed,
    current_step_id: String,
    state: { type: String, enum: ['running', 'paused', 'completed', 'failed', 'cancelled'], default: 'running' },
    context: mongoose.Schema.Types.Mixed,
    history: [{ step_id: String, action: String, actor_id: String, timestamp: Date, notes: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.WorkflowInstance || mongoose.model('WorkflowInstance', workflowInstanceSchema);
