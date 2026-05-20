import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AiService, StudyFlashcard, StudyQuizQuestion } from '../services/ai.service';

type ToolMode = 'summary' | 'flashcards' | 'quiz' | 'explain' | 'chat';

@Component({
  selector: 'app-ai-study',
  standalone: true,
  templateUrl: './ai-study.page.html',
  styleUrls: ['./ai-study.page.scss'],
  imports: [IonContent, CommonModule, FormsModule, RouterLink, RouterLinkActive],
})
export class AiStudyPage {
  notes = '';
  chatQuestion = '';
  mode: ToolMode = 'summary';

  loading = false;
  error = '';
  textResult = '';
  flashcards: StudyFlashcard[] = [];
  quiz: StudyQuizQuestion[] = [];

  constructor(private readonly ai: AiService) {}

  setMode(mode: ToolMode): void {
    this.mode = mode;
    this.error = '';
    this.textResult = '';
    this.flashcards = [];
    this.quiz = [];
  }

  async run(): Promise<void> {
    this.error = '';
    this.textResult = '';
    this.flashcards = [];
    this.quiz = [];

    if (!this.notes.trim()) {
      this.error = 'Please paste lesson notes first.';
      return;
    }

    this.loading = true;
    try {
      if (this.mode === 'summary') {
        this.textResult = await this.ai.summarize(this.notes);
      } else if (this.mode === 'explain') {
        this.textResult = await this.ai.explainSimply(this.notes);
      } else if (this.mode === 'flashcards') {
        this.flashcards = await this.ai.generateFlashcards(this.notes);
        if (this.flashcards.length === 0) {
          this.error = 'No flashcards returned. Try adding more detailed notes.';
        }
      } else if (this.mode === 'quiz') {
        this.quiz = await this.ai.generateQuiz(this.notes);
        if (this.quiz.length === 0) {
          this.error = 'No quiz items returned. Try adding more detailed notes.';
        }
      } else {
        if (!this.chatQuestion.trim()) {
          this.error = 'Type a question for tutor chat.';
          return;
        }
        this.textResult = await this.ai.tutorChat(this.notes, this.chatQuestion);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'AI request failed. Please try again.';
    } finally {
      this.loading = false;
    }
  }
}
