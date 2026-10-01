import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type StatusBadgeStatus = 'ready' | 'processing' | 'error';
export type StatusBadgeSize = 'sm' | 'md' | 'lg';

/**
 * Shows the processing state of an engagement.
 *
 * Usage:
 * ```html
 * <cw-status-badge status="ready" label="Ready" />
 * ```
 */
@Component({
  selector: 'cw-status-badge',
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  readonly status = input.required<StatusBadgeStatus>(); // drives the dot colour only; the label carries the meaning
  readonly label = input.required<string>(); // visible and announced. avoid all caps: readers spell those out
  readonly size = input<StatusBadgeSize>('md'); // scales text and padding; the dot follows in em
  readonly tooltip = input<string>(); // native title: not reachable by keyboard or touch, so never put meaning here
}
