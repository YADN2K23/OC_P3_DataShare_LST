import { Component, OnInit } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements OnInit {
  email = '';
  password = '';
  isLoading = false;
  error = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    if (this.authService.hasToken()) {
      this.router.navigate(['/my-space']);
      return;
    }

    this.authService.ensureAuthenticated().subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.router.navigate(['/my-space']);
      }
    });
  }

  onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Email et mot de passe requis';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.router.navigate(['/my-space']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.error = 'Email ou mot de passe incorrect';
        this.isLoading = false;
      },
    });
  }
}
