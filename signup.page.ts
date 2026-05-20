import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, RouterLink],
})
export class SignupPage {
  fullName = '';
  email = '';
  password = '';
  course = '';
  year = '';
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
      if (!this.fullName.trim()) {
        this.error = 'Please enter your full name.';
        return;
      }
      if (this.password.length < 6) {
        this.error = 'Password must be at least 6 characters.';
        return;
      }
      if (!this.course.trim()) {
        this.error = 'Please enter your course.';
        return;
      }
      if (!this.year) {
        this.error = 'Please select your year.';
        return;
      }
      await this.auth.signup({ fullName: this.fullName, email: this.email, password: this.password, course: this.course, year: this.year });
      await this.router.navigateByUrl('/home', { replaceUrl: true });
    } finally {
      this.loading = false;
    }
  }
}
