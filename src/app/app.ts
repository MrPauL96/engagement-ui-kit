import { Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Select, StatusBadge, type SelectOption } from '../lib/public-api';
import { CHANGE_GROUPS, ENGAGEMENTS, REVIEWERS } from './data/engagement-fixtures';

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

  protected readonly engagements = ENGAGEMENTS;
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
