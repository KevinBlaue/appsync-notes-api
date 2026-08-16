import { Client } from './client';

describe('Canary Client', () => {
  test('creates an AppSync request with an API key', () => {
    const request = new Client(
      'https://example.invalid/graphql',
      'test-key',
      'appsync-notes-canary'
    ).createRequest('query Note($id: ID!) { note(id: $id) { id } }', { id: 'note-id' });

    expect(request).toMatchObject({
      hostname: 'example.invalid',
      method: 'POST',
      path: '/graphql',
      protocol: 'https:',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'appsync-notes-canary',
        'x-api-key': 'test-key',
      },
    });
    expect(JSON.parse(request.body)).toEqual({
      query: 'query Note($id: ID!) { note(id: $id) { id } }',
      variables: { id: 'note-id' },
    });
  });
});
