/**
 * Public resolver for admissions enquiry
 * Passes identity info for rate limiting (sourceIp)
 */
export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: {
      field: 'submitAdmissionsEnquiry',
      token: ctx.identity?.claims || {},
      identity: ctx.identity || {}, // Pass full identity including sourceIp
      arguments: ctx.arguments,
    },
  }
}

export function response(ctx) {
  if (ctx.error) return util.error(ctx.error.message, ctx.error.type)
  if (ctx.result?.error) return util.error(ctx.result.error.message, ctx.result.error.type)
  return ctx.result
}
