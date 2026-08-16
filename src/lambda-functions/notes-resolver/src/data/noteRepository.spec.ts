import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { DynamoNoteRepository } from './noteRepository';

const NOTE = {
  id: '018f47a7-9b9e-7d6c-8b8d-9a1a7f063130',
  title: 'Architecture notes',
  content: 'Keep the resolver focused.',
  createdAt: '2026-08-16T10:00:00.000Z',
};

describe('DynamoNoteRepository', () => {
  test('loads a note by id', async () => {
    const commands: unknown[] = [];
    const send = recordingSend(commands, { Item: NOTE });
    const repository = subject(send);
    await expect(repository.get(NOTE.id)).resolves.toEqual(NOTE);
    expect(commands[0]).toBeInstanceOf(GetCommand);
  });

  test('returns undefined when no note exists', async () => {
    const repository = subject(recordingSend([], {}));
    await expect(repository.get(NOTE.id)).resolves.toBeUndefined();
  });

  test('rejects malformed stored notes', async () => {
    const repository = subject(recordingSend([], { Item: { id: NOTE.id } }));
    await expect(repository.get(NOTE.id)).rejects.toThrow('Stored note is missing');
  });

  test('persists a note with an id uniqueness condition', async () => {
    const commands: unknown[] = [];
    const send = recordingSend(commands, {});
    await subject(send).save(NOTE);
    const command = commands[0];
    expect(command).toBeInstanceOf(PutCommand);
    if (!(command instanceof PutCommand)) {
      throw new Error('Expected a PutCommand');
    }
    expect(command.input).toMatchObject({
      TableName: 'notes-table',
      Item: NOTE,
      ConditionExpression: 'attribute_not_exists(id)',
    });
  });
});

type Send = (command: unknown) => Promise<Record<string, unknown>>;

function recordingSend(commands: unknown[], response: Record<string, unknown>): Send {
  return async (command: unknown) => {
    commands.push(command);
    return Promise.resolve(response);
  };
}

function subject(send: Send): DynamoNoteRepository {
  return new DynamoNoteRepository({ send } as unknown as DynamoDBDocumentClient, 'notes-table');
}
