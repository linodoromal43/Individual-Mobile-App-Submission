import { Component } from '@angular/core';
import { AsyncPipe, CommonModule, NgFor } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { map } from 'rxjs';
import { TasksService } from '../services/tasks.service';
import type { StudifyTask, TaskCategory, TaskPriority } from '../services/types';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, AsyncPipe, NgFor, RouterLink, RouterLinkActive],
})
export class TasksPage {
  readonly vm$ = this.tasks.tasks$.pipe(
    map((all) => {
      const byCategory: Record<TaskCategory, StudifyTask[]> = {
        Academic: [],
        Personal: [],
        Extra: [],
      };
      for (const t of all) byCategory[t.category].push(t);
      const pendingCount = all.filter((t) => !t.completed).length;
      const academicRemaining = byCategory.Academic.filter((t) => !t.completed).length;
      return { all, byCategory, pendingCount, academicRemaining };
    })
  );

  showEditor = false;
  editingId: string | null = null;

  title = '';
  description = '';
  category: TaskCategory = 'Academic';
  priority: TaskPriority = 'mid';
  dueAtLocal = '';
  sessionsCount = 4;

  constructor(private readonly tasks: TasksService) {}

  openNew(): void {
    this.editingId = null;
    this.title = '';
    this.description = '';
    this.category = 'Academic';
    this.priority = 'mid';
    this.dueAtLocal = '';
    this.sessionsCount = 4;
    this.showEditor = true;
  }

  openEdit(task: StudifyTask): void {
    this.editingId = task.id;
    this.title = task.title;
    this.description = task.description ?? '';
    this.category = task.category;
    this.priority = task.priority;
    this.dueAtLocal = task.dueAt ? toLocalInput(task.dueAt) : '';
    this.sessionsCount = task.sessionsCount ?? 4;
    this.showEditor = true;
  }

  closeEditor(): void {
    this.showEditor = false;
  }

  async save(): Promise<void> {
    const dueAt = this.dueAtLocal ? new Date(this.dueAtLocal).toISOString() : undefined;
    const existing = this.editingId ? this.tasks.snapshot.find((t) => t.id === this.editingId) : undefined;
    await this.tasks.upsert({
      id: this.editingId ?? undefined,
      title: this.title,
      description: this.description,
      category: this.category,
      priority: this.priority,
      dueAt,
      sessionsCount: Number(this.sessionsCount) || 4,
      completed: existing?.completed ?? false,
      completedAt: existing?.completedAt,
    });
    this.showEditor = false;
  }

  async toggle(task: StudifyTask): Promise<void> {
    await this.tasks.toggleComplete(task.id);
  }

  async remove(task: StudifyTask): Promise<void> {
    await this.tasks.remove(task.id);
  }

  async removeEditing(): Promise<void> {
    if (!this.editingId) return;
    await this.tasks.remove(this.editingId);
  }

  dueLabel(dueAt?: string): string {
    if (!dueAt) return '';
    const ms = Date.parse(dueAt) - Date.now();
    const days = Math.ceil(ms / 86400000);
    if (days <= 0) return 'Due today';
    if (days === 1) return 'Tomorrow';
    return `${days}d left`;
  }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}
