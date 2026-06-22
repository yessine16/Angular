import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = 'admin@biblio.tn';
  password = 'admin';
  error = '';
  hide = true;

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    if (this.auth.login(this.email.trim(), this.password)) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Adresse e-mail ou mot de passe incorrect.';
    }
  }
}
