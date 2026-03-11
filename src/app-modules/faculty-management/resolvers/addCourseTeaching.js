export function request(ctx) {
  return {
    operation: 'Invoke',
    payload: {
      field: 'addCourseTeaching',
      token: ctx.identity?.claims || {},
      arguments: ctx.arguments,
    },
  };
}

export function response(ctx) {
  if (ctx.error) {
    return util.error(ctx.error.message, ctx.error.type);
  }
  return ctx.result;
}
