import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { BookRequest } from 'src/app/model/book-request.model';

@Injectable({
  providedIn: 'root'
})
export class BookRequestService {
  private api = 'http://localhost:3000/bookRequests';

  constructor(private http: HttpClient) {}

  getAllRequests(): Observable<BookRequest[]> {
    return this.http.get<BookRequest[]>(this.api);
  }

  getRequestById(id: number | string): Observable<BookRequest> {
    return this.http.get<BookRequest>(`${this.api}/${id}`);
  }

  AddRequest(request: BookRequest): Observable<BookRequest> {
    if (!request.bookId || !request.readerId) {
      return throwError(() => new Error('Le livre et le lecteur sont obligatoires.'));
    }
    return this.getAllRequests().pipe(
      map(items => Math.max(0, ...items.map(x => Number(x.id)).filter(Number.isFinite)) + 1),
      switchMap(id => this.http.post<BookRequest>(this.api, { ...request, id }))
    );
  }

  editRequest(id: number | string, request: BookRequest): Observable<BookRequest> {
    return this.http.put<BookRequest>(`${this.api}/${id}`, request);
  }

  deleteRequestById(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}

