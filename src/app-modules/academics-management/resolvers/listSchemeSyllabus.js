export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: {
      field: 'listSchemeSyllabus',
      token: ctx.identity?.claims || {},
      arguments: ctx.arguments,
    },
  };
}
export function response(ctx) {
  if (ctx.error) return util.error(ctx.error.message, ctx.error.type);
  if (ctx.result?.error) return util.error(ctx.result.error.message, ctx.result.error.type);
  return ctx.result;
}
