import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { UserState } from '../models/userStateModel';
import { jwtDecode } from 'jwt-decode';
import { UserJwtModel } from '../models/userJwtModel';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public userState = signal<UserState>({ isLoggedIn: false });

  constructor(private httpClient: HttpClient) {
    this.loadInitialState();
  }

  loadInitialState() {
    const jwt = localStorage.getItem('token');

    if (jwt) {

      const decodedJwt = jwtDecode<UserJwtModel>(jwt);

      this.userState.set({
        isLoggedIn: true,
        user: {
          sub: decodedJwt.sub!,
          roles: decodedJwt.roles || []
        }
      });
      this.scheduleRefresh();
    }
  }

  login(username: string, password: string): Observable<string> {
    return this.httpClient
      .post('http://localhost:8091/authservice/api/auth/login', { username, password }, { responseType: 'text' })
      .pipe(
        tap((response: string) => {
          localStorage.setItem('token', response);
          const decodedJwt = jwtDecode<UserJwtModel>(response);
          console.log('Decoded JWT:', decodedJwt);
          this.userState.set({
            isLoggedIn: true,
            user: {
              sub: decodedJwt.sub!,
              roles: decodedJwt.roles || []
            }
          });
        })
      );
  }


  logout() {
    this.userState.set({ isLoggedIn: false, user: undefined });
    localStorage.removeItem('token');
  }

  private scheduleRefresh(){
    try{
      const jwt = localStorage.getItem('token');
      
      if(jwt){
        const decodedJwt = jwtDecode<UserJwtModel>(jwt);
        const exp = decodedJwt.exp;
        const expiresInMs = exp * 1000 - Date.now();
        
        if(expiresInMs <= 0){
          this.logout();
        }
      }
      
    }catch(error){
      this.logout();
    }
  }
}
