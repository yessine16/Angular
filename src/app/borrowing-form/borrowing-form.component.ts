import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { forkJoin } from 'rxjs';
import { Book } from '../model/book.model';
import { Reader } from '../model/reader.model';
import { BookService } from 'src/service/book.service';
import { ReaderService } from 'src/service/reader.service';
import { BorrowingService } from 'src/service/borrowing.service';

@Component({
  selector: 'app-borrowing-form',
  templateUrl: './borrowing-form.component.html',
  styleUrls: ['./borrowing-form.component.css']
})
export class BorrowingFormComponent implements OnInit {
  idcourant!: string;
  form!: FormGroup;
  books: Book[] = [];
  readers: Reader[] = [];
  saving = false;

  constructor(
    private BS: BookService,
    private RS: ReaderService,
    private ES: BorrowingService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.idcourant = this.activatedRoute.snapshot.params['id'];
    forkJoin([this.BS.getAllBooks(), this.RS.getAllReaders()]).subscribe(([books, readers]) => {
      this.books = books;
      this.readers = readers;
    });

    if (this.idcourant) {
      this.ES.getBorrowingById(this.idcourant).subscribe(response => {
        this.initForm(response);
      });
    } else {
      this.initForm();
    }
  }

  sub() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.form.value.dueDate < this.form.value.borrowDate) {
      this.snackBar.open('La date de retour doit être postérieure à la date d’emprunt.', 'Fermer', { duration: 4000 });
      return;
    }

    const borrowing = this.ES.withAutomaticStatus({
      ...this.form.value,
      bookId: this.form.value.bookId,
      readerId: this.form.value.readerId,
      returnDate: this.form.value.returnDate || undefined
    });

    const request = this.idcourant
      ? this.ES.updateManaged(this.idcourant, borrowing)
      : this.ES.createManaged(borrowing);

    this.saving = true;
    request.subscribe({
      next: () => {
        this.snackBar.open(this.idcourant ? 'Emprunt modifié avec succès.' : 'Emprunt ajouté avec succès.', 'OK', { duration: 3000 });
        this.router.navigate(['/borrowings']);
      },
      error: error => {
        this.saving = false;
        this.snackBar.open(error?.message || 'Une erreur est survenue.', 'Fermer', { duration: 5000 });
      }
    });
  }

  private initForm(borrowing?: any) {
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 86400000);
    this.form = new FormGroup({
      bookId: new FormControl(borrowing?.bookId || '', Validators.required),
      readerId: new FormControl(borrowing?.readerId || '', Validators.required),
      borrowDate: new FormControl(borrowing?.borrowDate || today.toISOString().slice(0, 10), Validators.required),
      dueDate: new FormControl(borrowing?.dueDate || dueDate.toISOString().slice(0, 10), Validators.required),
      returnDate: new FormControl(borrowing?.returnDate || ''),
      status: new FormControl(borrowing?.status || 'En cours', Validators.required)
    });
  }
}

