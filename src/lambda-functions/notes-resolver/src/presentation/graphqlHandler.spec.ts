import type { AppSyncResolverEvent } from 'aws-lambda';
import type { Note, NoteService } from '../business/noteService';
import { createGraphqlHandler } from './graphqlHandler';
import type { GraphqlHandler } from './graphqlHandler';

const NOTE_ID = '018f47a7-9b9e-7d6c-8b8d-9a1a7f063130';
const NOTE: Note = {
  id: NOTE_ID,
  title: 'Architecture notes',
  content: 'Keep the resolver focused.',
  createdAt: '2026-08-16T10:00:00.000Z',
};

describe('graphqlHandler', () => {
  const get = jest.fn<ReturnType<NoteService['get']>, Parameters<NoteService['get']>>();
  const create = jest.fn<ReturnType<NoteService['create']>, Parameters<NoteService['create']>>();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });
  afterEach(() => jest.restoreAllMocks());

  test('resolves Query.note', async () => {
    get.mockResolvedValue(NOTE);
    await expect(subject()(event('note', { id: NOTE_ID }))).resolves.toEqual(NOTE);
    expect(get).toHaveBeenCalledWith(NOTE_ID);
  });

  test('returns null when Query.note finds no item', async () => {
    get.mockResolvedValue(undefined);
    await expect(subject()(event('note', { id: NOTE_ID }))).resolves.toBeNull();
  });

  test('resolves Mutation.createNote', async () => {
    create.mockResolvedValue(NOTE);
    await expect(
      subject()(event('createNote', { input: { title: NOTE.title, content: NOTE.content } }))
    ).resolves.toEqual(NOTE);
    expect(create).toHaveBeenCalledWith({ title: NOTE.title, content: NOTE.content });
  });

  test('rejects invalid arguments and unsupported fields', async () => {
    await expect(subject()(event('note', { id: 'invalid' }))).rejects.toThrow('valid UUID');
    await expect(subject()(event('deleteNote', {}))).rejects.toThrow('does not support field');
  });

  test('sanitizes unexpected errors', async () => {
    get.mockRejectedValue(new Error('database credentials leaked'));
    await expect(subject()(event('note', { id: NOTE_ID }))).rejects.toThrow('failed unexpectedly');
    expect(console.error).not.toHaveBeenCalledWith(expect.stringContaining('credentials'));
  });

  function subject(): GraphqlHandler {
    return createGraphqlHandler({ get, create });
  }
});

describe('default graphqlHandler composition', () => {
  const originalTableName = process.env.NOTES_TABLE_NAME;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.NOTES_TABLE_NAME;
    jest.spyOn(console, 'info').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalTableName === undefined) delete process.env.NOTES_TABLE_NAME;
    else process.env.NOTES_TABLE_NAME = originalTableName;
  });

  test('requires the DynamoDB table name', async () => {
    const { graphqlHandler } = await import('./graphqlHandler');
    await expect(graphqlHandler(event('deleteNote', {}))).rejects.toThrow(
      'Missing required environment variable NOTES_TABLE_NAME'
    );
  });

  test('creates and reuses the production composition', async () => {
    process.env.NOTES_TABLE_NAME = 'notes-table';
    const { graphqlHandler } = await import('./graphqlHandler');
    await expect(graphqlHandler(event('deleteNote', {}))).rejects.toThrow(
      'does not support field deleteNote'
    );
    await expect(graphqlHandler(event('deleteNote', {}))).rejects.toThrow(
      'does not support field deleteNote'
    );
  });
});

function event(
  fieldName: string,
  argumentsValue: Record<string, unknown>
): AppSyncResolverEvent<Record<string, unknown>> {
  return {
    arguments: argumentsValue,
    info: { fieldName },
  } as unknown as AppSyncResolverEvent<Record<string, unknown>>;
}
