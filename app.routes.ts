import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'splash',
    loadComponent: () => import('./splash/splash.page').then((m) => m.SplashPage),
  },
  {
    path: 'home',
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
    canMatch: [authGuard],
  },
  {
    path: '',
    redirectTo: 'splash',
    pathMatch: 'full',
  },
  {
    path: 'tasks',
    loadComponent: () => import('./tasks/tasks.page').then((m) => m.TasksPage),
    canMatch: [authGuard],
  },
  {
    path: 'focus',
    loadComponent: () => import('./focus/focus.page').then((m) => m.FocusPage),
    canMatch: [authGuard],
  },
  {
    path: 'stats',
    loadComponent: () => import('./stats/stats.page').then((m) => m.StatsPage),
    canMatch: [authGuard],
  },
  {
    path: 'profile',
    loadComponent: () => import('./profile/profile.page').then((m) => m.ProfilePage),
    canMatch: [authGuard],
  },
  {
    path: 'ai-study',
    loadComponent: () => import('./ai-study/ai-study.page').then((m) => m.AiStudyPage),
    canMatch: [authGuard],
  },
  {
    path: 'about',
    loadComponent: () => import('./about/about.page').then((m) => m.AboutPage),
    canMatch: [authGuard],
  },
  {
    path: 'achievements',
    loadComponent: () => import('./achievements/achievements.page').then((m) => m.AchievementsPage),
    canMatch: [authGuard],
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
    canMatch: [guestGuard],
  },
  {
    path: 'signup',
    loadComponent: () => import('./signup/signup.page').then((m) => m.SignupPage),
    canMatch: [guestGuard],
  },
];
