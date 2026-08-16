export const CREATE_NOTE = `
  mutation CreateNote($input: CreateNoteInput!) {
    createNote(input: $input) {
      id
      title
      createdAt
    }
  }
`;
