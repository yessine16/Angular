import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Reader } from '../model/reader.model';
import { Book } from '../model/book.model';
import { Borrowing } from '../model/borrowing.model';
import { ReaderService } from 'src/service/reader.service';
import { BookService } from 'src/service/book.service';
import { BorrowingService } from 'src/service/borrowing.service';
import { AuthService } from 'src/service/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';

@Component({ selector: 'app-readers', templateUrl: './readers.component.html', styleUrls: ['./readers.component.css'] })
export class ReadersComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = [];
  dataSource = new MatTableDataSource<Reader>([]);
  borrowings: Borrowing[] = [];
  books = new Map<string, Book>();
  @ViewChild(MatPaginator) paginator!: MatPaginator; @ViewChild(MatSort) sort!: MatSort;
  constructor(
    private RS: ReaderService,
    private BS: BookService,
    private ES: BorrowingService,
    private dialog: MatDialog,
    public auth: AuthService
  ) {}
  ngOnInit() {
    this.displayedColumns = ['name', 'email', 'phone', 'registrationDate', 'books'];
    if (this.auth.isAdmin()) this.displayedColumns.push('actions');
    this.fetch();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  fetch() {
    forkJoin([
      this.RS.getAllReaders(),
      this.ES.getAllBorrowings(),
      this.BS.getAllBooks()
    ]).subscribe(([readers, borrowings, books]) => {
      this.dataSource.data = readers;
      this.borrowings = borrowings;
      this.books = new Map(books.map(book => [String(book.id), book]));
    });
  }
  getBooksByReader(readerId: number | string | undefined): string[] {
    return this.borrowings
      .filter(borrowing => String(borrowing.readerId) === String(readerId))
      .map(borrowing => this.books.get(String(borrowing.bookId)))
      .filter((book): book is Book => !!book)
      .map(book => book.title);
  }
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }
  deleteReader(reader: Reader) {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer le lecteur', message: `Voulez-vous supprimer ${reader.firstName} ${reader.lastName} ?` } })
      .afterClosed().subscribe(result => {
        if (result && reader.id) {
          this.RS.deleteReaderById(reader.id).subscribe(() => this.fetch());
        }
      });
  }
}

