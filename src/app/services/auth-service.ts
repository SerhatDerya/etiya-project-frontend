import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormsModule } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(!!localStorage.getItem('isLoggedIn'));

  isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  getLoggedIn$() {
    return this.loggedIn$.asObservable();
  }

  login(username: string, password: string): boolean {
    if (username === 'user' && password === 'pass') {
      localStorage.setItem('isLoggedIn', '1');
      this.loggedIn$.next(true);
      return true;
    }
    return false;
  }

  logout(): void {
    localStorage.removeItem('isLoggedIn');
    this.loggedIn$.next(false);
  }
  
}
