import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { Note, NoteRepository as Repository } from '../business/noteService';

export class DynamoNoteRepository implements Repository {
  constructor(
    private readonly client: DynamoDBDocumentClient,
    private readonly tableName: string
  ) {}

  async get(id: string): Promise<Note | undefined> {
    const response = await this.client.send(
      new GetCommand({ TableName: this.tableName, Key: { id }, ConsistentRead: false })
    );
    return response.Item ? toNote(response.Item) : undefined;
  }

  async save(note: Note): Promise<void> {
    await this.client.send(
      new PutCommand({
        TableName: this.tableName,
        Item: note,
        ConditionExpression: 'attribute_not_exists(id)',
      })
    );
  }
}

function toNote(value: Record<string, unknown>): Note {
  const id = requiredString(value, 'id');
  const title = requiredString(value, 'title');
  const createdAt = requiredString(value, 'createdAt');
  const content = optionalString(value, 'content');
  return { id, title, ...(content ? { content } : {}), createdAt };
}

function requiredString(record: Record<string, unknown>, key: string): string {
  const value = record[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new Error(`Stored note is missing ${key}`);
  }
  return value;
}

function optionalString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
