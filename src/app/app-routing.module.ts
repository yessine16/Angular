import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard, authGuard, userGuard } from '../service/AuthGard';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { BooksComponent } from './books/books.component';
import { BookFormComponent } from './book-form/book-form.component';
import { ReadersComponent } from './readers/readers.component';
import { ReaderFormComponent } from './reader-form/reader-form.component';
import { BorrowingsComponent } from './borrowings/borrowings.component';
import { BorrowingFormComponent } from './borrowing-form/borrowing-form.component';
import { BookRequestsComponent } from './book-requests/book-requests.component';
import { BookRequestFormComponent } from './book-request-form/book-request-form.component';

const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'books', component: BooksComponent, canActivate: [authGuard] },
  { path: 'books/create', component: BookFormComponent, canActivate: [adminGuard] },
  { path: 'books/edit/:id', component: BookFormComponent, canActivate: [adminGuard] },
  { path: 'readers', component: ReadersComponent, canActivate: [authGuard] },
  { path: 'readers/create', component: ReaderFormComponent, canActivate: [adminGuard] },
  { path: 'readers/edit/:id', component: ReaderFormComponent, canActivate: [adminGuard] },
  { path: 'borrowings', component: BorrowingsComponent, canActivate: [authGuard] },
  { path: 'borrowings/create', component: BorrowingFormComponent, canActivate: [adminGuard] },
  { path: 'borrowings/edit/:id', component: BorrowingFormComponent, canActivate: [adminGuard] },
  { path: 'requests', component: BookRequestsComponent, canActivate: [authGuard] },
  { path: 'requests/create', component: BookRequestFormComponent, canActivate: [userGuard] },
  { path: '**', redirectTo: 'dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
