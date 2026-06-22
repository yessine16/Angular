import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { finalize, forkJoin, switchMap, throwError } from 'rxjs';
import { Book } from '../model/book.model';
import { BookRequest } from '../model/book-request.model';
import { Reader } from '../model/reader.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AuthService } from 'src/service/auth.service';
import { BookService } from 'src/service/book.service';
import { ReaderService } from 'src/service/reader.service';
import { BorrowingService } from 'src/service/borrowing.service';
import { BookRequestService } from 'src/service/book-request.service';

@Component({
  selector: 'app-book-requests',
  templateUrl: './book-requests.component.html',
  styleUrls: ['./book-requests.component.css']
})
export class BookRequestsComponent implements OnInit {
  displayedColumns: string[] = [];
  requests: BookRequest[] = [];
  filtered: BookRequest[] = [];
  books = new Map<string, Book>();
  readers = new Map<string, Reader>();
  processingId: number | string | null = null;
  searchTerm = '';
  statusFilter = 'Tous';

  constructor(
    private DLS: BookRequestService,
    private BS: BookService,
    private RS: ReaderService,
    private ES: BorrowingService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    public auth: AuthService
  ) {}

  ngOnInit() {
    this.displayedColumns = ['book', 'reader', 'requestDate', 'note', 'status'];
    this.displayedColumns.push('actions');
    this.fetch();
  }

  fetch() {
    forkJoin([
      this.DLS.getAllRequests(),
      this.BS.getAllBooks(),
      this.RS.getAllReaders()
    ]).subscribe(([requests, books, readers]) => {
      const visible = this.auth.isAdmin()
        ? requests
        : requests.filter(request => request.requesterEmail === this.auth.session?.email);
      this.requests = visible;
      this.filtered = visible;
      this.books = new Map(books.map(book => [String(book.id), book]));
      this.readers = new Map(readers.map(reader => [String(reader.id), reader]));
    });
  }

  applyFilter(event: Event) {
    this.searchTerm = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filterRequests();
  }

  applyStatusFilter(status: string) {
    this.statusFilter = status;
    this.filterRequests();
  }

  countByStatus(status: BookRequest['status']): number {
    return this.requests.filter(request => request.status === status).length;
  }

  private filterRequests() {
    this.filtered = this.requests.filter(request => {
      const matchesText = `${this.bookTitle(request.bookId)} ${this.readerName(request.readerId)} ${request.status}`
        .toLowerCase().includes(this.searchTerm);
      const matchesStatus = this.statusFilter === 'Tous' || request.status === this.statusFilter;
      return matchesText && matchesStatus;
    });
  }

  isValidRequest(request: BookRequest): boolean {
    return !!request.bookId && !!request.readerId &&
      this.books.has(String(request.bookId)) &&
      this.readers.has(String(request.readerId));
  }
  approve(request: BookRequest) {
    if (!request.id || request.status !== 'En attente') return;
    if (!request.bookId || !request.readerId) {
      this.snackBar.open('Cette demande est invalide. Supprimez-la puis demandez à l’utilisateur de la recréer.', 'Fermer', { duration: 6000 });
      return;
    }

    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 86400000);
    this.processingId = request.id;

    forkJoin([
      this.BS.getBookById(request.bookId),
      this.RS.getReaderById(request.readerId),
      this.ES.getAllBorrowings()
    ]).pipe(
      switchMap(([book, reader, borrowings]) => {
        if (book.available < 1) {
          return throwError(() => new Error(`Le livre « ${book.title} » n’est plus disponible.`));
        }

        const duplicate = borrowings
          .map(item => this.ES.withAutomaticStatus(item))
          .some(item =>
            String(item.bookId) === String(book.id) &&
            String(item.readerId) === String(reader.id) &&
            item.status !== 'Retourné'
          );
        if (duplicate) {
          return throwError(() => new Error('Ce lecteur possède déjà un emprunt actif pour ce livre.'));
        }

        return this.ES.createManaged({
          bookId: book.id!,
          readerId: reader.id!,
          borrowDate: today.toISOString().slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          status: 'En cours'
        });
      }),
      switchMap(() => this.DLS.editRequest(request.id!, {
        ...request,
        status: 'Approuvée',
        decisionDate: today.toISOString().slice(0, 10)
      })),
      finalize(() => this.processingId = null)
    ).subscribe({
      next: () => {
        this.snackBar.open('Demande approuvée et emprunt créé.', 'OK', { duration: 3500 });
        this.fetch();
      },
      error: error => this.snackBar.open(error?.message || 'Impossible d’approuver la demande.', 'Fermer', { duration: 6000 })
    });
  }
  reject(request: BookRequest) {
    this.changeStatus(request, 'Refusée', 'Demande refusée.');
  }

  cancel(request: BookRequest) {
    this.changeStatus(request, 'Annulée', 'Demande annulée.');
  }

  deleteRequest(request: BookRequest) {
    if (!request.id) return;
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Supprimer la demande', message: 'Voulez-vous supprimer définitivement cette demande ?' }
    }).afterClosed().subscribe(result => {
      if (result) this.DLS.deleteRequestById(request.id!).subscribe(() => this.fetch());
    });
  }

  bookTitle(id: number | string): string {
    return this.books.get(String(id))?.title || 'Livre supprimé';
  }

  readerName(id: number | string): string {
    const reader = this.readers.get(String(id));
    return reader ? `${reader.firstName} ${reader.lastName}` : 'Lecteur supprimé';
  }

  private changeStatus(request: BookRequest, status: 'Refusée' | 'Annulée', message: string) {
    if (!request.id || request.status !== 'En attente') return;
    this.DLS.editRequest(request.id, {
      ...request,
      status,
      decisionDate: new Date().toISOString().slice(0, 10)
    }).subscribe(() => {
      this.snackBar.open(message, 'OK', { duration: 3000 });
      this.fetch();
    });
  }
}



