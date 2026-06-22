import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { Borrowing } from '../app/model/borrowing.model';
import { Book } from '../app/model/book.model';
import { BookService } from './book.service';

@Injectable({ providedIn: 'root' })
export class BorrowingService {
  private api = 'http://localhost:3000/borrowings';
  constructor(private http: HttpClient, private bookService: BookService) {}

  getAllBorrowings(): Observable<Borrowing[]> {
    return this.http.get<Borrowing[]>(this.api);
  }

  getBorrowingById(id: number | string): Observable<Borrowing> {
    return this.http.get<Borrowing>(`${this.api}/${id}`);
  }

  AddBorrowing(item: Borrowing): Observable<Borrowing> {
    return this.getAllBorrowings().pipe(
      map(items => Math.max(0, ...items.map(x => Number(x.id)).filter(Number.isFinite)) + 1),
      switchMap(id => this.http.post<Borrowing>(this.api, { ...item, id }))
    );
  }

  editBorrowing(id: number | string, item: Borrowing): Observable<Borrowing> {
    return this.http.put<Borrowing>(`${this.api}/${id}`, item);
  }

  deleteBorrowingById(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  createManaged(item: Borrowing): Observable<Borrowing> {
    const borrowing = this.withAutomaticStatus(item);
    if (!borrowing.bookId || !borrowing.readerId) {
      return throwError(() => new Error('Livre ou lecteur invalide.'));
    }
    return this.bookService.getBookById(borrowing.bookId).pipe(
      switchMap(book => {
        if (this.isActive(borrowing) && book.available < 1) {
          return throwError(() => new Error('Aucun exemplaire disponible pour ce livre.'));
        }
        if (!this.isActive(borrowing)) return this.AddBorrowing(borrowing);
        return this.updateAvailability(book, -1).pipe(
          switchMap(updatedBook => this.AddBorrowing(borrowing).pipe(
            catchError(error => this.updateAvailability(updatedBook, 1).pipe(
              switchMap(() => throwError(() => error))
            ))
          ))
        );
      })
    );
  }

  updateManaged(id: number | string, item: Borrowing): Observable<Borrowing> {
    const borrowing = this.withAutomaticStatus(item);
    return this.getBorrowingById(id).pipe(
      switchMap(previous => forkJoin([
        this.bookService.getBookById(previous.bookId),
        String(previous.bookId) === String(borrowing.bookId)
          ? this.bookService.getBookById(previous.bookId)
          : this.bookService.getBookById(borrowing.bookId)
      ]).pipe(
        switchMap(([previousBook, selectedBook]) => {
          const changes = this.stockChanges(previous, borrowing);
          if ((changes.get(String(borrowing.bookId)) || 0) < 0 && selectedBook.available < 1) {
            return throwError(() => new Error('Aucun exemplaire disponible pour ce livre.'));
          }

          const updates: Observable<Book>[] = [];
          changes.forEach((delta, bookId) => {
            const book = bookId === String(previousBook.id) ? previousBook : selectedBook;
            updates.push(this.updateAvailability(book, delta));
          });
          return (updates.length ? forkJoin(updates) : of([])).pipe(
            switchMap(() => this.editBorrowing(id, borrowing))
          );
        })
      ))
    );
  }

  deleteManaged(item: Borrowing): Observable<void> {
    if (!item.id) return throwError(() => new Error('Emprunt introuvable.'));
    if (!this.isActive(item)) return this.deleteBorrowingById(item.id);
    return this.bookService.getBookById(item.bookId).pipe(
      switchMap(book => this.updateAvailability(book, 1)),
      switchMap(() => this.deleteBorrowingById(item.id!))
    );
  }

  withAutomaticStatus(item: Borrowing): Borrowing {
    if (item.returnDate) return { ...item, status: 'Retourné' };
    const today = new Date().toISOString().slice(0, 10);
    return { ...item, status: item.dueDate < today ? 'En retard' : 'En cours' };
  }

  private isActive(item: Borrowing): boolean {
    return !item.returnDate && item.status !== 'Retourné';
  }

  private stockChanges(previous: Borrowing, next: Borrowing): Map<string, number> {
    const changes = new Map<string, number>();
    if (this.isActive(previous)) changes.set(String(previous.bookId), 1);
    if (this.isActive(next)) changes.set(String(next.bookId), (changes.get(String(next.bookId)) || 0) - 1);
    for (const [bookId, delta] of changes) if (delta === 0) changes.delete(bookId);
    return changes;
  }

  private updateAvailability(book: Book, delta: number): Observable<Book> {
    const available = Math.max(0, Math.min(book.quantity, book.available + delta));
    return this.bookService.editBook(book.id!, { ...book, available });
  }
}


