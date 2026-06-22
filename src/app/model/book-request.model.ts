export interface BookRequest {
  id?: number | string;
  bookId: number | string;
  readerId: number | string;
  requesterEmail: string;
  requestDate: string;
  note: string;
  status: 'En attente' | 'Approuvée' | 'Refusée' | 'Annulée';
  decisionDate?: string;
}

