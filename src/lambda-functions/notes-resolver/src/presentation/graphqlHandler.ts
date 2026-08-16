import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import type { AppSyncResolverEvent } from 'aws-lambda';
import { NoteService } from '../business/noteService';
import type { Note } from '../business/noteService';
import { DynamoNoteRepository } from '../data/noteRepository';
import { GraphqlRequestError } from './errors';
import { parseCreateNoteInput, parseNoteId } from './validation';

type NotesApi = Pick<NoteService, 'create' | 'get'>;
type NotesEvent = AppSyncResolverEvent<Record<string, unknown>>;
export type GraphqlHandler = (event: NotesEvent) => Promise<Note | null>;

let defaultHandler: GraphqlHandler | undefined;

export async function graphqlHandler(event: NotesEvent): Promise<Note | null> {
  defaultHandler ??= createGraphqlHandler(createNoteService());
  return defaultHandler(event);
}

export function createGraphqlHandler(service: NotesApi): GraphqlHandler {
  return async (event: NotesEvent): Promise<Note | null> => {
    const fieldName = event.info.fieldName;
    console.info(JSON.stringify({ level: 'info', message: 'resolver.received', fieldName }));

    try {
      if (fieldName === 'note') {
        return (await service.get(parseNoteId(event.arguments))) ?? null;
      }
      if (fieldName === 'createNote') {
        return service.create(parseCreateNoteInput(event.arguments));
      }
      throw new GraphqlRequestError(
        'UNSUPPORTED_FIELD',
        `The resolver does not support field ${fieldName}`
      );
    } catch (error) {
      if (error instanceof GraphqlRequestError) throw error;
      console.error(
        JSON.stringify({
          level: 'error',
          message: 'resolver.failed',
          fieldName,
          errorType: error instanceof Error ? error.name : 'UnknownError',
        })
      );
      throw new Error('The resolver failed unexpectedly');
    }
  };
}

function createNoteService(): NoteService {
  const documentClient = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
    marshallOptions: { removeUndefinedValues: true },
  });
  return new NoteService(
    new DynamoNoteRepository(documentClient, requiredEnvironment('NOTES_TABLE_NAME'))
  );
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}
