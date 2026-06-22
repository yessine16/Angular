import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Book } from '../app/model/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private api = 'http://localhost:3000/books';
  constructor(private http: HttpClient) {}

  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.api);
  }

  getBookById(id: number | string): Observable<Book> {
    return this.http.get<Book>(`${this.api}/${id}`);
  }

  AddBook(book: Book): Observable<Book> {
    return this.getAllBooks().pipe(
      map(items => Math.max(0, ...items.map(x => Number(x.id)).filter(Number.isFinite)) + 1),
      switchMap(id => this.http.post<Book>(this.api, { ...book, id }))
    );
  }

  editBook(id: number | string, book: Book): Observable<Book> {
    return this.http.put<Book>(`${this.api}/${id}`, book);
  }

  deleteBookById(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
