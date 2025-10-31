import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  loginForm!: FormGroup;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.buildForm();

    if (this.authService.userState().isLoggedIn) {
      this.router.navigateByUrl('/b2c');
    }
  }

  buildForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required, Validators.minLength(2)]],
      password: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.valid) {
      const { username, password } = this.loginForm.value;
      
      this.authService.login(username?.toString().trim(), password?.toString().trim()).subscribe({
        next: () => {
          this.router.navigateByUrl("/");
        },
        error: (err) => {
          alert('Login failed. Check credentials and try again.');
        }
      });
    }
  }
}