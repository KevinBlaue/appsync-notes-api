import type { GraphqlResponse } from '../client';

export function requireData<T>(response: GraphqlResponse<T>): T {
  if (response.errors?.length) {
    throw new Error(`GraphQL returned ${response.errors.length} error(s)`);
  }
  if (!response.data) {
    throw new Error('GraphQL response does not contain data');
  }
  return response.data;
}
