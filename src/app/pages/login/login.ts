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
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: new FormControl('', [Validators.required, Validators.minLength(2)]),
      password: new FormControl('', [Validators.required, Validators.minLength(2)])
    });

    if (this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/b2c');
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onLogin() {
    if (this.loginForm.invalid) return;

    const { username, password } = this.loginForm.value;
    if (this.auth.login(username?.toString().trim(), password?.toString().trim())) {
      const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/b2c';
      this.router.navigateByUrl(returnUrl);
    } else {
      alert('Wrong username or password. Please try again');
    }
  }
}