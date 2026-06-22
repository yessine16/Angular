export interface Book {
  id?: number | string;
  isbn: string;
  title: string;
  author: string;
  category: string;
  publicationYear: number;
  quantity: number;
  available: number;
}
