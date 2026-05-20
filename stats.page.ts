import { Component } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor, SlicePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StatsService } from '../services/stats.service';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.page.html',
  styleUrls: ['./stats.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, AsyncPipe, NgFor, SlicePipe, RouterLink, RouterLinkActive],
})
export class StatsPage {
  readonly vm$ = combineLatest([this.stats.vm$, this.auth.user$]).pipe(
    map(([stats, user]) => {
      const hours = stats.weeklyHours;
      const max = Math.max(1e-9, ...hours);
      const bars = hours.map((h) => Math.min(100, Math.round((h / max) * 100)));
      const peakBarIndex = lastIndexOfMax(hours);
      const weeklyAvg = hours.reduce((a, b) => a + b, 0) / 7;
      return {
        ...stats,
        stats,
        user,
        bars,
        dayLabels: rolling7DayLabels(),
        peakBarIndex,
        weeklyAvg,
      };
    })
  );

  constructor(
    private readonly stats: StatsService,
    private readonly auth: AuthService
  ) {}

  clampPercent(x: number): number {
    if (!Number.isFinite(x)) return 0;
    return Math.max(0, Math.min(100, x));
  }
}

/** Matches `FocusService.totalStudySecondsLast7Days` order: oldest → newest (today). */
function rolling7DayLabels(): string[] {
  const short = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = startOfDay(new Date());
  const labels: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    labels.push(short[d.getDay()]);
  }
  return labels;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function lastIndexOfMax(values: number[]): number {
  if (!values.length) return 0;
  let max = values[0];
  let idx = 0;
  for (let i = 1; i < values.length; i++) {
    if (values[i] >= max) {
      max = values[i];
      idx = i;
    }
  }
  return idx;
}
