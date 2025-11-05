import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-navbar',
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar {

  username = '';
  token = localStorage.getItem('token');

  constructor(public authService: AuthService) {}

  ngOnInit() {
    this.username = this.authService.userState().user?.sub.toString() || '';
  }

}
