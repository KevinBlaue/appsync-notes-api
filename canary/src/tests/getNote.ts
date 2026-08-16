export const GET_NOTE = `
  query Note($id: ID!) {
    note(id: $id) {
      id
      title
      createdAt
    }
  }
`;
