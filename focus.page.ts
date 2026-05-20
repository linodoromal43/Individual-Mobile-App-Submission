import { Component, OnDestroy, OnInit } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { combineLatest, distinctUntilChanged, EMPTY, map, Subject, switchMap, takeUntil } from 'rxjs';
import { FocusService } from '../services/focus.service';
import { SettingsService } from '../services/settings.service';
import { TasksService } from '../services/tasks.service';

@Component({
  selector: 'app-focus',
  templateUrl: './focus.page.html',
  styleUrls: ['./focus.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, AsyncPipe, RouterLink, RouterLinkActive],
})
export class FocusPage implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  readonly vm$ = combineLatest([this.focus.timer$, this.settings.state$]).pipe(
    map(([timer, settings]) => {
      const progress = 1 - timer.remainingSeconds / Math.max(1, timer.durationSeconds);
      const circumference = 2 * Math.PI * 46;
      const dashOffset = circumference * (1 - progress);
      const sessionSlots = Array.from({ length: timer.sessionTarget }, (_, i) => i + 1);
      return { timer, settings, progress, circumference, dashOffset, sessionSlots };
    })
  );

  private readonly audioOptions = ['Deep Lo-fi Beats', 'Rain + White Noise', 'Library Ambience'];

  constructor(
    private readonly focus: FocusService,
    private readonly settings: SettingsService,
    private readonly route: ActivatedRoute,
    private readonly tasks: TasksService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(
        switchMap((params) => {
          const id = params.get('taskId');
          if (!id) return EMPTY;
          return this.tasks.tasks$.pipe(map((all) => all.find((t) => t.id === id && !t.completed)));
        }),
        distinctUntilChanged(
          (a, b) =>
            a?.id === b?.id && a?.sessionsCount === b?.sessionsCount && a?.title === b?.title
        ),
        takeUntil(this.destroy$)
      )
      .subscribe((task) => {
        if (task) {
          this.focus.syncFromTask({
            title: task.title,
            sessionsCount: task.sessionsCount ?? 4,
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  formatMmSs(totalSeconds: number): string {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  toggleRunning(): void {
    this.focus.toggleRunning();
  }

  reset(): void {
    this.focus.reset();
  }

  skip(): void {
    this.focus.skipNextSession();
  }

  async toggleFatigue(): Promise<void> {
    await this.settings.patch({ fatigueDetection: !this.settings.snapshot.fatigueDetection });
  }

  changeAudio(): void {
    const cur = this.settings.snapshot.focusAudioLabel;
    const idx = this.audioOptions.indexOf(cur);
    const next = this.audioOptions[(idx + 1 + this.audioOptions.length) % this.audioOptions.length];
    this.settings.patch({ focusAudioLabel: next });
  }

  addTime(): void {
    this.focus.addMinutes(5);
  }

  subtractTime(): void {
    this.focus.subtractMinutes(5);
  }
}
