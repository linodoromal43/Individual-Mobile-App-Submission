import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, RouterLink],
})
export class LoginPage {
  email = '';
  password = '';
  error: string | null = null;
  loading = false;

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  async onSubmit(): Promise<void> {
    if (this.loading) return;
    this.error = null;
    this.loading = true;
    try {
      const res = await this.auth.login({ email: this.email, password: this.password });
      if (!res.ok) {
        this.error = res.message ?? 'Unable to log in.';
        return;
      }
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } finally {
      this.loading = false;
    }
  }
}
