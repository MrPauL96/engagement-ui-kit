import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { Select } from './select';
import type { SelectOption } from './select-option';

/**
 * These tests cover the two invariants the `aria-activedescendant` strategy
 * promises, because both of them fail invisibly: the screen stays correct
 * while the screen reader goes wrong.
 *
 *   1. DOM focus never leaves the combobox.
 *   2. `aria-activedescendant` names a rendered option while the listbox is
 *      open, and nothing once it closes.
 *
 * `expectAccessibleState` re-checks both after every interaction rather than
 * testing them once, so a regression surfaces in whichever test introduced it.
 */

const OPTIONS: readonly SelectOption[] = [
  { value: 'ana', label: 'Ana Ruiz', description: 'Engagement partner' },
  { value: 'chen', label: 'Chen Wei', description: 'Quality reviewer', disabled: true },
  { value: 'zoe', label: 'Zoe Kaplan', description: 'Concurring partner' },
];

@Component({
  imports: [Select, ReactiveFormsModule],
  template: `<cw-select label="Reviewer" [options]="options()" [formControl]="control" />`,
})
class HostComponent {
  readonly options = signal(OPTIONS);
  readonly control = new FormControl<string | null>(null);
}

async function setup() {
  TestBed.configureTestingModule({ imports: [HostComponent] });

  const fixture = TestBed.createComponent(HostComponent);
  await fixture.whenStable();

  const root = fixture.nativeElement as HTMLElement;
  const trigger = root.querySelector<HTMLElement>('[role="combobox"]')!;
  trigger.focus();

  const options = () => Array.from(root.querySelectorAll<HTMLElement>('[role="option"]'));
  const option = (label: string) => options().find((el) => el.textContent?.includes(label))!;
  const isExpanded = () => trigger.getAttribute('aria-expanded') === 'true';

  function expectAccessibleState(): void {
    expect(document.activeElement).toBe(trigger);

    const activeDescendantId = trigger.getAttribute('aria-activedescendant');

    if (!isExpanded()) {
      expect(activeDescendantId).toBeNull();
      expect(root.querySelector('[role="listbox"]')).toBeNull();
      return;
    }

    expect(activeDescendantId).not.toBeNull();
    expect(root.querySelector(`#${activeDescendantId}`)).not.toBeNull();
  }

  async function press(key: string): Promise<void> {
    trigger.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await fixture.whenStable();
    expectAccessibleState();
  }

  async function clickOption(label: string): Promise<void> {
    option(label).click();
    await fixture.whenStable();
    expectAccessibleState();
  }

  return {
    fixture,
    trigger,
    control: fixture.componentInstance.control,
    options,
    option,
    isExpanded,
    press,
    clickOption,
    expectAccessibleState,
  };
}

describe('Select', () => {
  const scrollIntoView = vi.fn();

  beforeAll(() => {
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  beforeEach(() => {
    TestBed.resetTestingModule();
    scrollIntoView.mockClear();
  });

  it('focus stays on the combobox whichever way the list is opened and closed', async () => {
    const { trigger, control, press, clickOption } = await setup();

    await press('ArrowDown');
    await press('ArrowDown');
    await press('End');
    await press('Home');
    await press('Escape');

    await press('ArrowDown');
    await press('Enter');

    await press('ArrowDown');
    await clickOption('Zoe Kaplan');

    expect(document.activeElement).toBe(trigger);
    expect(control.value).toBe('zoe');
  });

  it('prevents the listbox mousedown, which is what keeps a click from blurring the combobox', async () => {
    const { fixture, press } = await setup();

    await press('ArrowDown');

    const listbox = (fixture.nativeElement as HTMLElement).querySelector('[role="listbox"]')!;
    const mousedown = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
    listbox.dispatchEvent(mousedown);

    expect(mousedown.defaultPrevented).toBe(true);
  });

  it('moves aria-activedescendant with the arrow keys and drops it on close', async () => {
    const { trigger, options, press } = await setup();

    await press('ArrowDown');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[0].id);

    await press('ArrowDown');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[1].id);

    await press('Escape');
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
  });

  it('opens on Home and End while closed, which a native select does not do', async () => {
    const { trigger, options, isExpanded, press } = await setup();

    await press('End');

    expect(isExpanded()).toBe(true);
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[2].id);

    await press('Escape');
    await press('Home');

    expect(isExpanded()).toBe(true);
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('resolves aria-activedescendant at both ends of a list of several hundred options', async () => {
    const many: SelectOption[] = Array.from({ length: 500 }, (_, i) => ({
      value: `user-${i}`,
      label: `Reviewer ${i}`,
    }));

    const { fixture, trigger, options, press } = await setup();

    fixture.componentInstance.options.set(many);
    await fixture.whenStable();

    await press('End');
    expect(options()).toHaveLength(500);
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[499].id);

    await press('Home');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  it('names each option after the reviewer, keeping the role as a separate description', async () => {
    const { fixture, options, press } = await setup();

    await press('ArrowDown');

    const root = fixture.nativeElement as HTMLElement;
    const option = options()[1];
    const name = root.querySelector(`#${option.getAttribute('aria-labelledby')}`);
    const description = root.querySelector(`#${option.getAttribute('aria-describedby')}`);

    expect(name?.textContent?.trim()).toBe('Chen Wei');
    expect(description?.textContent?.trim()).toBe('Quality reviewer');
  });

  it('scrolls the option the arrow keys reached into view', async () => {
    const { options, press } = await setup();

    await press('ArrowDown');
    await press('End');

    expect(scrollIntoView.mock.instances.at(-1)).toBe(options()[2]);
    expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' });
  });

  // the bug VoiceOver caught: every option announced as selected while the screen looked fine
  it('does not mark an option as selected just because the arrow keys reached it', async () => {
    const { control, options, option, press } = await setup();

    await press('ArrowDown');
    await press('ArrowDown');
    await press('ArrowDown');

    expect(options().map((el) => el.getAttribute('aria-selected'))).toEqual([
      'false',
      'false',
      'false',
    ]);

    await press('Enter');
    expect(control.value).toBe('zoe');

    await press('ArrowDown');
    await press('Home');

    expect(option('Zoe Kaplan').getAttribute('aria-selected')).toBe('true');
    expect(option('Ana Ruiz').getAttribute('aria-selected')).toBe('false');
  });

  it('never selects an unavailable reviewer, by keyboard or by click', async () => {
    const { control, isExpanded, press, clickOption } = await setup();

    await press('ArrowDown');
    await press('ArrowDown');

    await press('Enter');
    expect(control.value).toBeNull();
    expect(isExpanded()).toBe(true);

    await clickOption('Chen Wei');
    expect(control.value).toBeNull();
    expect(isExpanded()).toBe(true);
  });

  it('closes on Tab with an unavailable option active, leaving no orphan listbox', async () => {
    // selectOption returns early for an unavailable option, so Tab cannot rely
    // on it to close the popup and calls close() itself.
    const { control, isExpanded, press } = await setup();

    await press('ArrowDown');
    await press('ArrowDown');
    await press('Tab');

    expect(isExpanded()).toBe(false);
    expect(control.value).toBeNull();
  });

  it('stays on the same reviewer when the option list is reordered while open', async () => {
    const { fixture, trigger, options, press } = await setup();

    await press('ArrowDown');
    await press('End');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[2].id);

    fixture.componentInstance.options.set([OPTIONS[2], OPTIONS[0], OPTIONS[1]]);
    await fixture.whenStable();

    expect(options()[0].textContent).toContain('Zoe Kaplan');
    expect(trigger.getAttribute('aria-activedescendant')).toBe(options()[0].id);
  });

  // the fixtures warn that other data may be used during review, so the list can shrink under us
  it('never points aria-activedescendant at an option removed while the listbox was open', async () => {
    const { fixture, press, expectAccessibleState } = await setup();

    await press('ArrowDown');
    await press('End');

    fixture.componentInstance.options.set(OPTIONS.slice(0, 1));
    await fixture.whenStable();

    expectAccessibleState();
  });

  it('closes the listbox when the form disables the control while it is open', async () => {
    const { fixture, trigger, isExpanded, press } = await setup();

    await press('ArrowDown');
    expect(isExpanded()).toBe(true);

    fixture.componentInstance.control.disable();
    await fixture.whenStable();

    expect(isExpanded()).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
  });

  // touched must not fire on open, and the workbench prints it, so that mistake shows up live
  it('closes and marks the control touched when focus leaves the component', async () => {
    const { fixture, trigger, control, isExpanded, press } = await setup();

    await press('ArrowDown');
    expect(control.touched).toBe(false);

    trigger.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));
    await fixture.whenStable();

    expect(isExpanded()).toBe(false);
    expect(control.touched).toBe(true);
  });
});
