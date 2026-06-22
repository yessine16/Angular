import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from 'src/service/book.service';

@Component({
  selector: 'app-book-form',
  templateUrl: './book-form.component.html',
  styleUrls: ['./book-form.component.css']
})
export class BookFormComponent implements OnInit {
  idcourant!: string;
  form!: FormGroup;
  categories = ['Roman', 'Science', 'Histoire', 'Informatique', 'Jeunesse', 'Développement personnel'];

  constructor(
    private BS: BookService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.idcourant = this.activatedRoute.snapshot.params['id'];
    if (this.idcourant) {
      this.BS.getBookById(this.idcourant).subscribe(response => {
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

    const request = this.idcourant
      ? this.BS.editBook(this.idcourant, this.form.value)
      : this.BS.AddBook(this.form.value);

    request.subscribe(() => {
      this.router.navigate(['/books']);
    });
  }

  private initForm(book?: any) {
    this.form = new FormGroup({
      isbn: new FormControl(book?.isbn || '', Validators.required),
      title: new FormControl(book?.title || '', Validators.required),
      author: new FormControl(book?.author || '', Validators.required),
      category: new FormControl(book?.category || '', Validators.required),
      publicationYear: new FormControl(book?.publicationYear || new Date().getFullYear(), [Validators.required, Validators.min(1000)]),
      quantity: new FormControl(book?.quantity || 1, [Validators.required, Validators.min(1)]),
      available: new FormControl(book?.available ?? 1, [Validators.required, Validators.min(0)])
    });
  }
}
