import { randomUUID } from 'node:crypto';

export interface Note {
  id: string;
  title: string;
  content?: string;
  createdAt: string;
}

export interface CreateNoteInput {
  title: string;
  content?: string;
}

export interface NoteRepository {
  get(id: string): Promise<Note | undefined>;
  save(note: Note): Promise<void>;
}

export class NoteService {
  constructor(
    private readonly repository: NoteRepository,
    private readonly createId: () => string = randomUUID,
    private readonly now: () => Date = () => new Date()
  ) {}

  get(id: string): Promise<Note | undefined> {
    return this.repository.get(id);
  }

  async create(input: CreateNoteInput): Promise<Note> {
    const note: Note = {
      id: this.createId(),
      title: input.title,
      ...(input.content ? { content: input.content } : {}),
      createdAt: this.now().toISOString(),
    };
    await this.repository.save(note);
    return note;
  }
}
