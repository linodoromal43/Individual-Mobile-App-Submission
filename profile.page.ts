import { Component } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { FocusService } from '../services/focus.service';
import { TasksService } from '../services/tasks.service';
import { focusRankFromHours } from '../services/focus-rank';

interface ProfileBadge {
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  colorClass: string;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, AsyncPipe, NgFor, RouterLink, RouterLinkActive],
})
export class ProfilePage {
  readonly vm$ = combineLatest([this.auth.user$, this.settings.state$, this.focus.logs$, this.tasks.tasks$]).pipe(
    map(([user, settings, focusLogs, tasks]) => {
      const totalHours = focusLogs.reduce((sum: number, log: { durationSeconds: number }) => sum + log.durationSeconds, 0) / 3600;
      const completedTasks = tasks.filter((t: { completed: boolean }) => t.completed).length;
      const focusLevelLabel = focusRankFromHours(totalHours);

      const badges: ProfileBadge[] = [
        {
          title: 'Early Bird',
          description: 'Studied before 7 AM for 5 days',
          icon: 'wb_sunny',
          earned: totalHours >= 1,
          colorClass: 'prim'
        },
        {
          title: 'Focus King',
          description: Math.floor(totalHours) + '+ hours focused',
          icon: 'local_fire_department',
          earned: totalHours >= 10,
          colorClass: 'sec'
        },
        {
          title: 'Night Owl',
          description: 'Complete 10 midnight sessions',
          icon: 'dark_mode',
          earned: false,
          colorClass: 'mute'
        },
        {
          title: 'Task Master',
          description: completedTasks + ' tasks completed',
          icon: 'military_tech',
          earned: completedTasks >= 5,
          colorClass: 'mute'
        },
      ];

      return { user, settings, badges, totalHours, completedTasks, focusLevelLabel };
    })
  );

  constructor(
    private readonly auth: AuthService,
    private readonly settings: SettingsService,
    private readonly focus: FocusService,
    private readonly tasks: TasksService,
    private readonly router: Router
  ) {}

  async toggleNotifications(): Promise<void> {
    await this.settings.patch({ smartNotifications: !this.settings.snapshot.smartNotifications });
  }

  async setTheme(theme: 'light' | 'dark'): Promise<void> {
    await this.settings.setTheme(theme);
  }

  async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }

  async viewAllAchievements(): Promise<void> {
    await this.router.navigateByUrl('/achievements');
  }

  getFillStyle(earned: boolean): string {
    return earned ? "'FILL' 1" : "'FILL' 0";
  }
}
