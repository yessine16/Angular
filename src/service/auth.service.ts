import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

export type UserRole = 'admin' | 'user';

export interface AuthSession {
  email: string;
  name: string;
  role: UserRole;
  readerId?: number;
}

interface LocalAccount extends AuthSession {
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'bibliotheque_session';
  private readonly accounts: LocalAccount[] = [
    { email: 'admin@biblio.tn', password: 'admin', name: 'Administrateur', role: 'admin' as UserRole },
    { email: 'user@biblio.tn', password: 'user', name: 'Youssef Gharbi', role: 'user' as UserRole, readerId: 4 }
  ];

  constructor(private router: Router) {}

  login(email: string, password: string): boolean {
    const account = this.accounts.find(x => x.email === email && x.password === password);
    if (!account) return false;

    const session: AuthSession = {
      email: account.email,
      name: account.name,
      role: account.role,
      readerId: account.readerId
    };
    localStorage.setItem(this.key, JSON.stringify(session));
    return true;
  }

  logout(): void {
    localStorage.removeItem(this.key);
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.session !== null;
  }

  isAdmin(): boolean {
    return this.session?.role === 'admin';
  }

  get session(): AuthSession | null {
    const value = localStorage.getItem(this.key);
    if (!value) return null;

    try {
      return JSON.parse(value) as AuthSession;
    } catch {
      localStorage.removeItem(this.key);
      return null;
    }
  }
}
