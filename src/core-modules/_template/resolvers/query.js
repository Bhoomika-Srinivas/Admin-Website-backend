/**
 * AppSync JS resolver - request/response for a Query field.
 * Export: export function request(ctx) { ... }  export function response(ctx) { ... }
 */
export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: {
      field: ctx.info.fieldName,
      token: ctx.identity?.claims || {},
      arguments: ctx.arguments,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  if (ctx.result?.error) return util.error(ctx.result.error.message, ctx.result.error.type);
  return ctx.result;
}
