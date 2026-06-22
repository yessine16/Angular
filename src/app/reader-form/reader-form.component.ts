import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReaderService } from 'src/service/reader.service';

@Component({
  selector: 'app-reader-form',
  templateUrl: './reader-form.component.html',
  styleUrls: ['./reader-form.component.css']
})
export class ReaderFormComponent implements OnInit {
  idcourant!: string;
  form!: FormGroup;

  constructor(
    private RS: ReaderService,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit() {
    this.idcourant = this.activatedRoute.snapshot.params['id'];
    if (this.idcourant) {
      this.RS.getReaderById(this.idcourant).subscribe(response => {
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
      ? this.RS.editReader(this.idcourant, this.form.value)
      : this.RS.AddReader(this.form.value);

    request.subscribe(() => {
      this.router.navigate(['/readers']);
    });
  }

  private initForm(reader?: any) {
    this.form = new FormGroup({
      firstName: new FormControl(reader?.firstName || '', Validators.required),
      lastName: new FormControl(reader?.lastName || '', Validators.required),
      email: new FormControl(reader?.email || '', [Validators.required, Validators.email]),
      phone: new FormControl(reader?.phone || '', Validators.required),
      registrationDate: new FormControl(reader?.registrationDate || new Date().toISOString().slice(0, 10), Validators.required)
    });
  }
}
