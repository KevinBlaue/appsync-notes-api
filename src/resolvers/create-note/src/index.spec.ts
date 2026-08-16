import type { Context } from '@aws-appsync/utils';
import { request, response } from './index';

jest.mock('@aws-appsync/utils', () => ({
  util: {
    error: jest.fn((message: string, type: string) => {
      throw new Error(`[${type}] ${message}`);
    }),
  },
}));

describe('createNote AppSync function', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation());
  afterEach(() => jest.restoreAllMocks());

  test('maps GraphQL arguments to the Lambda resolver event', () => {
    const argumentsValue = {
      input: { title: 'Architecture notes', content: 'Keep the resolver focused.' },
    };
    const ctx = {
      args: argumentsValue,
    } as unknown as Parameters<typeof request>[0];

    expect(request(ctx)).toEqual({
      operation: 'Invoke',
      payload: {
        arguments: argumentsValue,
        info: { fieldName: 'createNote' },
      },
    });
  });

  test('returns the Lambda result', () => {
    const result = { id: '018f47a7-9b9e-7d6c-8b8d-9a1a7f063130' };
    expect(response({ result } as unknown as Context)).toBe(result);
  });

  test('maps invocation errors without exposing their message', () => {
    const ctx = {
      error: { type: 'LambdaError', message: 'internal details' },
    } as unknown as Context;
    expect(() => response(ctx)).toThrow('[LambdaError] The Lambda resolver failed');
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('internal details'));
  });
});
