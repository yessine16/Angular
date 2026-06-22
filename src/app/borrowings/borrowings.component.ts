import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { Borrowing } from '../model/borrowing.model';
import { Book } from '../model/book.model';
import { Reader } from '../model/reader.model';
import { BorrowingService } from 'src/service/borrowing.service';
import { BookService } from 'src/service/book.service';
import { ReaderService } from 'src/service/reader.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { AuthService } from 'src/service/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({ selector: 'app-borrowings', templateUrl: './borrowings.component.html', styleUrls: ['./borrowings.component.css'] })
export class BorrowingsComponent implements OnInit {
  displayedColumns: string[] = [];
  items: Borrowing[] = [];
  filtered: Borrowing[] = [];
  books = new Map<string, Book>();
  readers = new Map<string, Reader>();
  constructor(private ES: BorrowingService, private BS: BookService, private RS: ReaderService, private dialog: MatDialog, private snackBar: MatSnackBar, public auth: AuthService) {}
  ngOnInit(): void {
    this.displayedColumns = ['book', 'reader', 'borrowDate', 'dueDate', 'status'];
    if (this.auth.isAdmin()) this.displayedColumns.push('actions');
    this.fetch();
  }
  fetch() {
    forkJoin([this.ES.getAllBorrowings(), this.BS.getAllBooks(), this.RS.getAllReaders()]).subscribe(([items, books, readers]) => {
      const currentItems = items.map(x => this.ES.withAutomaticStatus(x));
      this.items = this.auth.isAdmin()
        ? currentItems
        : currentItems.filter(item => String(item.readerId) === String(this.auth.session?.readerId));
      this.filtered = this.items;
      this.books = new Map(books.map(x => [String(x.id), x]));
      this.readers = new Map(readers.map(x => [String(x.id), x]));
    });
  }
  applyFilter(event: Event) {
    const term = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.filtered = this.items.filter(x => `${this.bookTitle(x.bookId)} ${this.readerName(x.readerId)} ${x.status}`.toLowerCase().includes(term));
  }
  bookTitle(id: number | string): string { return this.books.get(String(id))?.title || 'Livre supprimé'; }
  readerName(id: number | string): string { const x = this.readers.get(String(id)); return x ? `${x.firstName} ${x.lastName}` : 'Lecteur supprimé'; }
  deleteBorrowing(item: Borrowing) {
    this.dialog.open(ConfirmDialogComponent, { data: { title: 'Supprimer l’emprunt', message: 'Voulez-vous supprimer cette opération ?' } })
      .afterClosed().subscribe(ok => {
        if (!ok || !item.id) return;
        this.ES.deleteManaged(item).subscribe({
          next: () => {
            this.snackBar.open('Emprunt supprimé et stock mis à jour.', 'OK', { duration: 3000 });
            this.fetch();
          },
          error: () => this.snackBar.open('Impossible de supprimer cet emprunt.', 'Fermer', { duration: 4000 })
        });
      });
  }

  returnBorrowing(item: Borrowing) {
    if (!item.id || item.status === 'Retourné') return;
    const returned = {
      ...item,
      returnDate: new Date().toISOString().slice(0, 10),
      status: 'Retourné' as const
    };
    this.ES.updateManaged(item.id, returned).subscribe({
      next: () => {
        this.snackBar.open('Retour enregistré et stock restauré.', 'OK', { duration: 3500 });
        this.fetch();
      },
      error: () => this.snackBar.open('Impossible d’enregistrer le retour.', 'Fermer', { duration: 4000 })
    });
  }
}


