import { parseCreateNoteInput, parseNoteId } from './validation';

const NOTE_ID = '018f47a7-9b9e-7d6c-8b8d-9a1a7f063130';

describe('GraphQL argument validation', () => {
  test('normalizes valid create-note input', () => {
    expect(parseCreateNoteInput({ input: { title: ' Notes ', content: ' Content ' } })).toEqual({
      title: 'Notes',
      content: 'Content',
    });
    expect(parseCreateNoteInput({ input: { title: 'Notes' } })).toEqual({ title: 'Notes' });
  });

  test.each([
    {},
    { input: null },
    { input: { title: '' } },
    { input: { title: 'x'.repeat(121) } },
    { input: { title: 'Notes', content: 'x'.repeat(2_001) } },
  ])('rejects invalid mutation arguments', (argumentsValue) => {
    expect(() => parseCreateNoteInput(argumentsValue)).toThrow('INVALID_ARGUMENT');
  });

  test('accepts a UUID note id', () => {
    expect(parseNoteId({ id: NOTE_ID })).toBe(NOTE_ID);
  });

  test.each([{}, { id: '' }, { id: 'not-a-uuid' }])(
    'rejects an invalid query id',
    (argumentsValue) => {
      expect(() => parseNoteId(argumentsValue)).toThrow('valid UUID');
    }
  );
});
