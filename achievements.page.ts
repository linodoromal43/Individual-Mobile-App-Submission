import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Location } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { AuthService } from '../services/auth.service';
import { FocusService } from '../services/focus.service';
import { focusRankFromHours } from '../services/focus-rank';
import { TasksService } from '../services/tasks.service';
import { Subscription } from 'rxjs';

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
}

// Rank tiers — use shared `FOCUS_RANK_TIERS` / `focusRankFromHours` in `focus-rank.ts`

// Milestone tiers
const MILESTONE_TIERS = [
  { name: 'APPRENTICE', minHours: 0 },
  { name: 'SCHOLAR', minHours: 10 },
  { name: 'MASTER', minHours: 30 },
  { name: 'LEGEND', minHours: 100 },
];

@Component({
  selector: 'app-achievements',
  templateUrl: './achievements.page.html',
  styleUrls: ['./achievements.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule],
})
export class AchievementsPage implements OnInit, OnDestroy {
  currentRank = 'Novice';
  level = 0;
  milestone = 'APPRENTICE';
  milestoneProgress = 0;
  earnedDate = 'N/A';
  totalFocusHours = 0;
  studyStreakDays = 0;

  badges: Badge[] = [
    { id: '1', title: 'Deep Diver', description: '5+ hours focused sessions', icon: 'waves', color: 'blue', earned: false },
    { id: '2', title: 'Early Bird', description: 'Start before 6:00 AM', icon: 'wb_sunny', color: 'pink', earned: false },
    { id: '3', title: 'Focus Master', description: '50 total hours logged', icon: 'target', color: 'purple', earned: false },
    { id: '4', title: 'Study Buddy', description: 'Complete 10 group sessions', icon: 'people', color: 'gray', earned: false },
    { id: '5', title: 'Night Owl', description: 'Focus past midnight', icon: 'dark_mode', color: 'gray', earned: false },
    { id: '6', title: 'Hot Streak', description: '7 day study streak', icon: 'local_fire_department', color: 'orange', earned: false },
    { id: '7', title: 'Bookworm', description: '50 resources reviewed', icon: 'menu_book', color: 'gray', earned: false },
    { id: '8', title: 'Quick Learner', description: 'Finish quiz in 5m', icon: 'bolt', color: 'gray', earned: false },
  ];

  private subscriptions: Subscription[] = [];

  constructor(
    private readonly location: Location,
    private readonly auth: AuthService,
    private readonly focus: FocusService,
    private readonly tasks: TasksService
  ) {}

  ngOnInit(): void {
    this.calculateAchievements();

    // Subscribe to focus logs changes
    this.subscriptions.push(
      this.focus.logs$.subscribe(() => {
        this.calculateAchievements();
      })
    );

    // Subscribe to auth user changes
    this.subscriptions.push(
      this.auth.user$.subscribe((user) => {
        if (user) {
          this.studyStreakDays = user.studyStreakDays;
          this.calculateAchievements();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  private calculateAchievements(): void {
    const totalSeconds = this.focus.totalStudySeconds();
    this.totalFocusHours = totalSeconds / 3600;

    // Calculate rank based on total hours
    this.currentRank = focusRankFromHours(this.totalFocusHours);

    // Calculate level (1 level per 2 hours of focus, starting from 0)
    this.level = Math.floor(this.totalFocusHours / 2);

    // Calculate milestone
    const milestoneResult = this.calculateMilestone(this.totalFocusHours);
    this.milestone = milestoneResult.name;
    this.milestoneProgress = milestoneResult.progress;

    // Calculate badges
    this.calculateBadges();

    // Set earned date based on user creation
    const user = this.auth.user;
    if (user && user.createdAt) {
      const createdDate = new Date(user.createdAt);
      this.earnedDate = createdDate.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: '2-digit',
      });
    } else {
      this.earnedDate = 'N/A';
    }
  }

  private calculateMilestone(hours: number): { name: string; progress: number } {
    let currentTier = MILESTONE_TIERS[0];
    let nextTier: (typeof MILESTONE_TIERS)[number] | null = null;

    for (let i = 0; i < MILESTONE_TIERS.length; i++) {
      if (hours >= MILESTONE_TIERS[i].minHours) {
        currentTier = MILESTONE_TIERS[i];
        nextTier = MILESTONE_TIERS[i + 1] || null;
      }
    }

    if (!nextTier) {
      return { name: currentTier.name, progress: 100 };
    }

    const range = nextTier.minHours - currentTier.minHours;
    const progress = hours - currentTier.minHours;
    const percentage = Math.min(100, Math.round((progress / range) * 100));

    return { name: currentTier.name, progress: percentage };
  }

  private calculateBadges(): void {
    const logs = this.focus.logs;
    const totalHours = this.totalFocusHours;

    // Deep Diver: 5+ hours focused sessions
    const deepDiver = this.badges.find((b) => b.id === '1');
    if (deepDiver) {
      deepDiver.earned = totalHours >= 5;
    }

    // Early Bird: Start before 6:00 AM
    const earlyBird = this.badges.find((b) => b.id === '2');
    if (earlyBird) {
      earlyBird.earned = logs.some((log) => {
        const startedAt = new Date(log.startedAt);
        return startedAt.getHours() < 6;
      });
    }

    // Focus Master: 50 total hours logged
    const focusMaster = this.badges.find((b) => b.id === '3');
    if (focusMaster) {
      focusMaster.earned = totalHours >= 50;
    }

    // Study Buddy: Complete 10 group sessions (not implemented yet, always false)
    const studyBuddy = this.badges.find((b) => b.id === '4');
    if (studyBuddy) {
      studyBuddy.earned = false;
    }

    // Night Owl: Focus past midnight (between 12 AM and 4 AM)
    const nightOwl = this.badges.find((b) => b.id === '5');
    if (nightOwl) {
      nightOwl.earned = logs.some((log) => {
        const startedAt = new Date(log.startedAt);
        const hour = startedAt.getHours();
        return hour >= 0 && hour < 4;
      });
    }

    // Hot Streak: 7 day study streak
    const hotStreak = this.badges.find((b) => b.id === '6');
    if (hotStreak) {
      hotStreak.earned = this.studyStreakDays >= 7;
    }

    // Bookworm: 50 resources reviewed (not implemented yet, always false)
    const bookworm = this.badges.find((b) => b.id === '7');
    if (bookworm) {
      bookworm.earned = false;
    }

    // Quick Learner: Finish quiz in 5m (not implemented yet, always false)
    const quickLearner = this.badges.find((b) => b.id === '8');
    if (quickLearner) {
      quickLearner.earned = false;
    }
  }

  goBack(): void {
    this.location.back();
  }

  getFontVariationSettings(earned: boolean): string {
    return earned ? "'FILL' 1" : "'FILL' 0";
  }
}
