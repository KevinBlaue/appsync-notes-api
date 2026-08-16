import { Client } from './client';
import { CREATE_NOTE, GET_NOTE } from './tests';
import { requireData } from './validators/response';

interface NoteData {
  id: string;
  title: string;
  createdAt: string;
}

export async function apiTest(): Promise<void> {
  const endpoint = requiredEnvironment('GRAPHQL_URL');
  const apiKey = requiredEnvironment('GRAPHQL_API_KEY');
  const client = new Client(endpoint, apiKey, 'appsync-notes-canary');
  const title = `Synthetic note ${Date.now()}`;

  const created = requireData(
    await client.execute<{ createNote: NoteData }>(CREATE_NOTE, { input: { title } })
  ).createNote;
  if (created.title !== title) throw new Error('Mutation returned an unexpected title');

  const loaded = requireData(
    await client.execute<{ note: NoteData | null }>(GET_NOTE, { id: created.id })
  ).note;
  if (!loaded || loaded.id !== created.id) throw new Error('Query did not return the created note');
}

function requiredEnvironment(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}
