import { Component, OnInit, signal } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { combineLatest, map } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { FocusService } from '../services/focus.service';
import { StatsService } from '../services/stats.service';
import { TasksService } from '../services/tasks.service';
import type { StudifyTask } from '../services/types';

interface Quote {
  q: string;
  a: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner, CommonModule, AsyncPipe, NgFor, RouterLink, RouterLinkActive],
})
export class HomePage implements OnInit {
  readonly vm$ = combineLatest([
    this.auth.user$,
    this.focus.timer$,
    this.stats.vm$,
    this.tasks.tasks$,
  ]).pipe(
    map(([user, timer, stats, tasks]) => {
      const upcoming = this.tasks.getUpcoming(6);
      const focusTask = this.tasks.getTodayFocusTask();
      const focusTopic = focusTask?.title ?? timer.topic;
      const plannedSessions = focusTask?.sessionsCount ?? timer.sessionTarget;
      const topicMatchesTimer = !!focusTask && timer.topic === focusTask.title;
      const sessionSummary = topicMatchesTimer
        ? `Session ${timer.sessionIndex} of ${timer.sessionTarget}`
        : `${plannedSessions} session${plannedSessions === 1 ? '' : 's'} planned`;
      return {
        user,
        timer,
        stats,
        upcoming,
        focusTask,
        focusTopic,
        sessionSummary,
        streakDays: user?.studyStreakDays ?? 0,
        tasksPendingToday: tasks.filter((t) => !t.completed).length,
      };
    })
  );

  // Quote state
  quotes = signal<Quote[]>([]);
  currentQuote = signal<Quote | null>(null);
  quoteLoading = signal(true);
  private quoteIndex = 0;

  constructor(
    private readonly auth: AuthService,
    private readonly focus: FocusService,
    private readonly stats: StatsService,
    private readonly tasks: TasksService,
    private readonly http: HttpClient
  ) {}

  ngOnInit() {
    this.loadQuotes();
  }

  private loadQuotes() {
    this.quoteLoading.set(true);
    this.http.get<Quote[]>('/zenquotes/api/quotes').subscribe({
      next: (data) => {
        this.quotes.set(data);
        this.quoteIndex = 0;
        this.currentQuote.set(data[0] ?? null);
        this.quoteLoading.set(false);
      },
      error: () => {
        this.quoteLoading.set(false);
      },
    });
  }

  nextQuote() {
    const list = this.quotes();
    if (!list.length) return;
    this.quoteIndex = (this.quoteIndex + 1) % list.length;
    this.currentQuote.set(list[this.quoteIndex]);
  }

  firstName(fullName?: string | null): string {
    const name = (fullName ?? '').trim();
    if (!name) return 'Scholar';
    return name.split(' ')[0] || 'Scholar';
  }

  formatMmSs(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  dueLabel(dueAt?: string): string {
    if (!dueAt) return '';
    const ms = Date.parse(dueAt) - Date.now();
    const days = Math.ceil(ms / 86400000);
    if (days <= 0) return 'Due today';
    if (days === 1) return '1d left';
    return `${days}d left`;
  }

  focusQueryParams(focusTask: StudifyTask | null): Record<string, string> {
    return focusTask ? { taskId: focusTask.id } : {};
  }
}
