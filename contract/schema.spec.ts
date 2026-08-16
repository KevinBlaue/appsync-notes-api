import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('GraphQL contract', () => {
  const source = readFileSync(join(__dirname, 'schema.graphql'), 'utf8');

  test('defines one query and one mutation', () => {
    expect(source).toMatch(/type Query\s*{\s*note\(id: ID!\): Note\s*}/);
    expect(source).toMatch(/type Mutation\s*{\s*createNote\(input: CreateNoteInput!\): Note!\s*}/);
  });

  test('contains no employer-specific names or dependency update automation', () => {
    const forbiddenTerms = [
      ['fiel', 'mann'].join(''),
      ['free', 'net'].join(''),
      ['dependa', 'bot'].join(''),
      ['reno', 'vate'].join(''),
    ];
    for (const term of forbiddenTerms) {
      expect(source.toLowerCase()).not.toContain(term);
    }
  });
});
