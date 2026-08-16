import { type Context, type LambdaRequest, util } from '@aws-appsync/utils';

interface CreateNoteArguments {
  input: {
    title: string;
    content?: string | null;
  };
}

export function request(ctx: Context<CreateNoteArguments>): LambdaRequest {
  return {
    operation: 'Invoke',
    payload: {
      arguments: ctx.args,
      info: { fieldName: 'createNote' },
    },
  };
}

export function response(ctx: Context): unknown {
  if (ctx.error) {
    console.error(
      JSON.stringify({
        level: 'error',
        message: 'resolver.invoke_failed',
        errorType: ctx.error.type,
      })
    );
    util.error('The Lambda resolver failed', ctx.error.type);
  }
  return ctx.result;
}
