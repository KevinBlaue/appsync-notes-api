import { NoteService } from './noteService';
import type { NoteRepository } from './noteService';

const NOTE = {
  id: '018f47a7-9b9e-7d6c-8b8d-9a1a7f063130',
  title: 'Architecture notes',
  content: 'Keep the resolver focused.',
  createdAt: '2026-08-16T10:00:00.000Z',
};

describe('NoteService', () => {
  test('creates and persists a note', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const service = new NoteService(
      { save, get: jest.fn() } as NoteRepository,
      () => NOTE.id,
      () => new Date(NOTE.createdAt)
    );

    await expect(service.create({ title: NOTE.title, content: NOTE.content })).resolves.toEqual(
      NOTE
    );
    expect(save).toHaveBeenCalledWith(NOTE);
  });

  test('omits absent optional content', async () => {
    const save = jest.fn().mockResolvedValue(undefined);
    const service = new NoteService(
      { save, get: jest.fn() } as NoteRepository,
      () => NOTE.id,
      () => new Date(NOTE.createdAt)
    );

    await expect(service.create({ title: NOTE.title })).resolves.toEqual({
      id: NOTE.id,
      title: NOTE.title,
      createdAt: NOTE.createdAt,
    });
  });

  test('retrieves a note through the repository', async () => {
    const get = jest.fn().mockResolvedValue(NOTE);
    const service = new NoteService({ get, save: jest.fn() } as NoteRepository);
    await expect(service.get(NOTE.id)).resolves.toEqual(NOTE);
    expect(get).toHaveBeenCalledWith(NOTE.id);
  });
});
