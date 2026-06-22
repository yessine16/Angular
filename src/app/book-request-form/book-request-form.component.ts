import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { Book } from '../model/book.model';
import { AuthService } from 'src/service/auth.service';
import { BookService } from 'src/service/book.service';
import { BookRequestService } from 'src/service/book-request.service';

@Component({
  selector: 'app-book-request-form',
  templateUrl: './book-request-form.component.html',
  styleUrls: ['./book-request-form.component.css']
})
export class BookRequestFormComponent implements OnInit {
  form!: FormGroup;
  books: Book[] = [];
  saving = false;

  constructor(
    private BS: BookService,
    private DLS: BookRequestService,
    private AS: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    forkJoin([this.BS.getAllBooks(), this.DLS.getAllRequests()]).subscribe(([books, requests]) => {
      const pendingBookIds = new Set(
        requests
          .filter(request =>
            request.requesterEmail === this.AS.session?.email &&
            request.status === 'En attente'
          )
          .map(request => String(request.bookId))
      );
      this.books = books.filter(book => book.available > 0 && !pendingBookIds.has(String(book.id)));
    });
    this.form = new FormGroup({
      bookId: new FormControl('', Validators.required),
      note: new FormControl('', Validators.maxLength(250))
    });
  }

  sub() {
    if (this.form.invalid || !this.AS.session?.readerId) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedBook = this.books.find(book => String(book.id) === String(this.form.value.bookId));
    if (!selectedBook?.id) {
      this.snackBar.open('Veuillez sélectionner un livre valide.', 'Fermer', { duration: 4000 });
      return;
    }

    const request = {
      bookId: selectedBook.id,
      readerId: this.AS.session.readerId,
      requesterEmail: this.AS.session.email,
      requestDate: new Date().toISOString().slice(0, 10),
      note: this.form.value.note || '',
      status: 'En attente' as const
    };

    this.saving = true;
    this.DLS.AddRequest(request).subscribe({
      next: () => {
        this.snackBar.open('Votre demande a été envoyée.', 'OK', { duration: 3000 });
        this.router.navigate(['/requests']);
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Impossible d’envoyer la demande.', 'Fermer', { duration: 4000 });
      }
    });
  }
}

