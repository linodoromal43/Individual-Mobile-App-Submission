import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class SplashPage implements OnInit, OnDestroy {
  progress = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.simulateProgress();
    this.checkAuthAndNavigate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private simulateProgress(): void {
    const interval = setInterval(() => {
      if (this.progress < 90) {
        this.progress += Math.random() * 30;
        if (this.progress > 90) this.progress = 90;
      }
    }, 500);

    this.destroy$.subscribe(() => clearInterval(interval));
  }

  private checkAuthAndNavigate(): void {
    setTimeout(() => {
      this.progress = 100;
      setTimeout(() => {
        const isAuth = !!localStorage.getItem('auth_token');
        if (isAuth) {
          this.router.navigateByUrl('/home', { replaceUrl: true });
        } else {
          this.router.navigateByUrl('/login', { replaceUrl: true });
        }
      }, 500);
    }, 3000);
  }
}
