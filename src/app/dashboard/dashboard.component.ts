import { Component, OnInit } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { forkJoin } from 'rxjs';
import { BookService } from 'src/service/book.service';
import { ReaderService } from 'src/service/reader.service';
import { BorrowingService } from 'src/service/borrowing.service';
import { BookRequestService } from 'src/service/book-request.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  books = 0;
  readers = 0;
  active = 0;
  late = 0;
  pendingRequests = 0;
  doughnut: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Disponibles', 'Empruntés'],
    datasets: [{ data: [0, 0], backgroundColor: ['#2f7d6d', '#f2b84b'] }]
  };
  bar: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ label: 'Livres', data: [], backgroundColor: '#2a5678' }]
  };

  constructor(
    private bookService: BookService,
    private readerService: ReaderService,
    private borrowingService: BorrowingService,
    private requestService: BookRequestService
  ) {}

  ngOnInit(): void {
    forkJoin([
      this.bookService.getAllBooks(),
      this.readerService.getAllReaders(),
      this.borrowingService.getAllBorrowings(),
      this.requestService.getAllRequests()
    ]).subscribe(([books, readers, borrowings, requests]) => {
      this.books = books.length;
      this.readers = readers.length;
      const currentBorrowings = borrowings.map(x => this.borrowingService.withAutomaticStatus(x));
      this.active = currentBorrowings.filter(x => x.status === 'En cours' || x.status === 'En retard').length;
      this.late = currentBorrowings.filter(x => x.status === 'En retard').length;
      this.pendingRequests = requests.filter(x => x.status === 'En attente').length;
      const total = books.reduce((sum, x) => sum + x.quantity, 0);
      const available = books.reduce((sum, x) => sum + x.available, 0);
      this.doughnut = { labels: ['Disponibles', 'Empruntés'], datasets: [{ data: [available, total - available], backgroundColor: ['#2f7d6d', '#f2b84b'] }] };
      const groups = new Map<string, number>();
      books.forEach(x => groups.set(x.category, (groups.get(x.category) || 0) + x.quantity));
      this.bar = { labels: [...groups.keys()], datasets: [{ label: 'Livres', data: [...groups.values()], backgroundColor: '#2a5678' }] };
    });
  }
}
