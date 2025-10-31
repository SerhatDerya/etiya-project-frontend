import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {

  constructor(
    private authService: AuthService
  ) {}

  logOut() {
    this.authService.logout();
  }
}
