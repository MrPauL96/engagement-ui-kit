import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { StatusBadge } from './status-badge';

/**
 * The badge arrived with `aria-hidden="true"` on its text, which left it with
 * no accessible name and made the dot's colour the only carrier of meaning.
 * That is the one thing here worth a test: it is a single attribute, it is
 * invisible on screen, and putting it back would look like a no-op in review.
 */

@Component({
  imports: [StatusBadge],
  template: `<cw-status-badge status="processing" label="Processing" />`,
})
class HostComponent {}

describe('StatusBadge', () => {
  beforeEach(() => {
    TestBed.resetTestingModule();
  });

  it('exposes its label instead of leaving the colour to carry the meaning', async () => {
    TestBed.configureTestingModule({ imports: [HostComponent] });

    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    const hidden = Array.from(host.querySelectorAll('[aria-hidden="true"]'));

    expect(host.textContent).toContain('Processing');
    expect(hidden.some((el) => el.textContent?.includes('Processing'))).toBe(false);
  });
});
