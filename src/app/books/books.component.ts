import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Book } from '../model/book.model';
import { Borrowing } from '../model/borrowing.model';
import { Reader } from '../model/reader.model';
import { BookService } from 'src/service/book.service';
import { BorrowingService } from 'src/service/borrowing.service';
import { ReaderService } from 'src/service/reader.service';
import { AuthService } from 'src/service/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';

@Component({ selector: 'app-books', templateUrl: './books.component.html', styleUrls: ['./books.component.css'] })
export class BooksComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Book>([]);
  borrowings: Borrowing[] = [];
  readers = new Map<string, Reader>();
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private BS: BookService,
    private ES: BorrowingService,
    private RS: ReaderService,
    private dialog: MatDialog,
    public auth: AuthService
  ) {}
  ngOnInit() {
    this.displayedColumns = ['isbn', 'title', 'author', 'category', 'quantity', 'available', 'readers'];
    if (this.auth.isAdmin()) this.displayedColumns.push('actions');
    this.fetch();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  fetch() {
    forkJoin([
      this.BS.getAllBooks(),
      this.ES.getAllBorrowings(),
      this.RS.getAllReaders()
    ]).subscribe(([books, borrowings, readers]) => {
      this.dataSource.data = books;
      this.borrowings = borrowings;
      this.readers = new Map(readers.map(reader => [String(reader.id), reader]));
    });
  }
  getReadersByBook(bookId: number | string | undefined): string[] {
    return this.borrowings
      .filter(borrowing => String(borrowing.bookId) === String(bookId))
      .map(borrowing => this.readers.get(String(borrowing.readerId)))
      .filter((reader): reader is Reader => !!reader)
      .map(reader => `${reader.firstName} ${reader.lastName}`);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
  deleteBook(book: Book) {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer le livre', message: `Voulez-vous supprimer « ${book.title} » ?` } })
      .afterClosed().subscribe(result => {
        if (result && book.id) {
          this.BS.deleteBookById(book.id).subscribe(() => this.fetch());
        }
      });
  }
}

