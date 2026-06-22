export interface Borrowing {
  id?: number | string;
  bookId: number | string;
  readerId: number | string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'En cours' | 'Retourné' | 'En retard';
}

