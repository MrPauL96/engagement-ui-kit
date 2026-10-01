import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select, StatusBadge, type SelectOption, type StatusBadgeStatus } from '../lib/public-api';
import {
  CHANGE_GROUPS,
  ENGAGEMENTS,
  REVIEWERS,
  type EngagementStatus,
} from './data/engagement-fixtures';

/**
 * The audit domain's status codes, translated into the kit's vocabulary.
 *
 * The label is part of the translation now that the badge exposes it: screen
 * readers spell all-caps tokens out letter by letter.
 */
const BADGE: Record<EngagementStatus, { status: StatusBadgeStatus; label: string }> = {
  READY: { status: 'ready', label: 'Ready' },
  PROCESSING: { status: 'processing', label: 'Processing' },
  ERROR: { status: 'error', label: 'Error' },
};

/**
 * The workbench: a consumer of the kit in `src/lib`.
 *
 * It exists so components can be built, demonstrated and reviewed in a running
 * application. Change it freely — it is a consumer, not part of the kit.
 */
@Component({
  selector: 'app-root',
  imports: [ReactiveFormsModule, StatusBadge, Select],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  host: {
    '[class.cw-theme-light]': 'theme() === "light"',
    '[class.cw-theme-dark]': 'theme() === "dark"',
  },
})
export class App {
  protected readonly theme = signal<'light' | 'dark'>('light');

  protected readonly engagements = ENGAGEMENTS.map((engagement) => ({
    ...engagement,
    badge: BADGE[engagement.status],
  }));
  protected readonly reviewers = REVIEWERS;
  protected readonly changeGroups = CHANGE_GROUPS;

  /** A form control for the reviewer filter, ready for a form-integrated control. */
  protected readonly reviewerId = new FormControl<string | null>(null);

  protected readonly reviewerOptions: readonly SelectOption[] = REVIEWERS.map((reviewer) => ({
    value: reviewer.id,
    label: reviewer.name,
    description: reviewer.role,
    disabled: reviewer.unavailable,
  }));

  protected toggleTheme(): void {
    this.theme.update((current) => (current === 'light' ? 'dark' : 'light'));
  }
}
