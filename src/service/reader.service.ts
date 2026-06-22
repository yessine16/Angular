import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { Reader } from '../app/model/reader.model';

@Injectable({ providedIn: 'root' })
export class ReaderService {
  private api = 'http://localhost:3000/readers';
  constructor(private http: HttpClient) {}

  getAllReaders(): Observable<Reader[]> {
    return this.http.get<Reader[]>(this.api);
  }

  getReaderById(id: number | string): Observable<Reader> {
    return this.http.get<Reader>(`${this.api}/${id}`);
  }

  AddReader(reader: Reader): Observable<Reader> {
    return this.getAllReaders().pipe(
      map(items => Math.max(0, ...items.map(x => Number(x.id)).filter(Number.isFinite)) + 1),
      switchMap(id => this.http.post<Reader>(this.api, { ...reader, id }))
    );
  }

  editReader(id: number | string, reader: Reader): Observable<Reader> {
    return this.http.put<Reader>(`${this.api}/${id}`, reader);
  }

  deleteReaderById(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
