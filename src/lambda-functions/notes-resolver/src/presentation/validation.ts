import type { CreateNoteInput } from '../business/noteService';
import { GraphqlRequestError } from './errors';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function parseNoteId(argumentsValue: Record<string, unknown>): string {
  const id = argumentsValue.id;
  if (typeof id !== 'string' || !UUID_PATTERN.test(id)) {
    throw new GraphqlRequestError('INVALID_ARGUMENT', 'id must be a valid UUID');
  }
  return id;
}

export function parseCreateNoteInput(argumentsValue: Record<string, unknown>): CreateNoteInput {
  const input = argumentsValue.input;
  if (!isRecord(input)) {
    throw new GraphqlRequestError('INVALID_ARGUMENT', 'input must be an object');
  }

  const title = normalizedString(input.title);
  if (!title || title.length > 120) {
    throw new GraphqlRequestError(
      'INVALID_ARGUMENT',
      'title must contain between 1 and 120 characters'
    );
  }

  const content = normalizedString(input.content);
  if (content && content.length > 2_000) {
    throw new GraphqlRequestError(
      'INVALID_ARGUMENT',
      'content must contain at most 2000 characters'
    );
  }
  return { title, ...(content ? { content } : {}) };
}

function normalizedString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
