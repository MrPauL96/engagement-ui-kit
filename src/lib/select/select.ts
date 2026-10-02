import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { SelectOption } from './select-option';

const Key = {
  ArrowDown: 'ArrowDown',
  ArrowUp: 'ArrowUp',
  Home: 'Home',
  End: 'End',
  Enter: 'Enter',
  Space: ' ',
  Tab: 'Tab',
  Escape: 'Escape',
} as const;

/**
 * Picks one option from a list, following the WAI-ARIA select-only combobox
 * pattern. Registers as a form control, so it works with `formControlName`.
 *
 * Usage:
 * ```html
 * <cw-select label="Reviewer" [options]="reviewers" [formControl]="reviewerId" />
 * ```
 */
@Component({
  selector: 'cw-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(focusout)': 'onFocusOut($event)' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select implements ControlValueAccessor {
  readonly label = input.required<string>(); // required: the control has no other accessible name
  readonly options = input.required<readonly SelectOption[]>(); // values must be unique: they identify an option
  readonly placeholder = input('Select an option'); // shown in the trigger while nothing is selected

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly listbox = viewChild<ElementRef<HTMLUListElement>>('listbox');

  private readonly uid = Select.nextUid();

  protected readonly labelId = `${this.uid}-label`;
  protected readonly listboxId = `${this.uid}-listbox`;

  protected readonly selectedValue = signal<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly expanded = signal(false);
  private readonly navigatedValue = signal<string | null>(null);

  protected readonly activeIndex = computed(() => {
    const navigatedValue = this.navigatedValue();
    const options = this.options();

    if (navigatedValue === null) return -1;

    const index = options.findIndex((item) => item.value === navigatedValue);
    if (index !== -1) return index;

    // the option was removed while the listbox was open
    return options.length > 0 ? 0 : -1;
  });

  protected readonly selectedLabel = computed(() => {
    const selectedValue = this.selectedValue();

    return this.options().find((item) => item.value === selectedValue)?.label ?? null;
  });

  protected readonly activeDescendantId = computed(() => {
    const index = this.activeIndex();

    return index < 0 ? null : this.optionId(index);
  });

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private static uidCounter = 0;

  constructor() {
    afterRenderEffect(() => this.scrollActiveOptionIntoView());
  }

  writeValue(value: string | null | undefined): void {
    this.selectedValue.set(value ?? null);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);

    if (isDisabled) this.close();
  }

  protected optionId(index: number): string {
    return `${this.uid}-option-${index}`;
  }

  protected optionLabelId(index: number): string {
    return `${this.optionId(index)}-label`;
  }

  protected optionDescriptionId(index: number): string {
    return `${this.optionId(index)}-description`;
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) return;

    if (this.selectedValue() !== option.value) {
      this.selectedValue.set(option.value);
      this.onChange(option.value);
    }

    this.close();
  }

  protected toggle(): void {
    if (this.disabled()) return;

    if (this.expanded()) this.close();
    else this.open();
  }

  // the listbox calls preventDefault on mousedown, so clicking an option never reaches here
  protected onFocusOut(event: FocusEvent): void {
    const nextFocusedElement = <Node | null> event.relatedTarget;
    if (nextFocusedElement && this.host.nativeElement.contains(nextFocusedElement)) return;

    this.close();
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const isOpen = this.expanded();

    // `break` reaches the preventDefault() below, `return` leaves the key to the browser
    switch (event.key) {
      case Key.ArrowDown:
        if (isOpen) this.moveBy(1);
        else this.open();
        break;

      case Key.ArrowUp:
        if (isOpen) this.moveBy(-1);
        else this.open();
        break;

      case Key.Home:
        if (!isOpen) this.open();
        this.moveTo(0);
        break;

      case Key.End:
        if (!isOpen) this.open();
        this.moveTo(this.options().length - 1);
        break;

      case Key.Enter:
      case Key.Space:
        if (isOpen) this.selectActiveOption();
        else this.open();
        break;

      case Key.Escape:
        if (!isOpen) return;
        this.close();
        break;

      case Key.Tab:
        if (isOpen) {
          this.selectActiveOption();
          this.close();
        }
        return;

      default:
        return;
    }

    event.preventDefault();
  }

  private open(): void {
    const options = this.options();
    const selectedValue = this.selectedValue();
    const validValue = options.find((item) => item.value === selectedValue)?.value;

    this.navigatedValue.set(validValue ?? options[0]?.value ?? null);
    this.expanded.set(true);
  }

  private close(): void {
    this.expanded.set(false);
    this.navigatedValue.set(null);
  }

  private moveTo(index: number): void {
    const options = this.options();
    const lastIndex = options.length - 1;
    if (lastIndex < 0) return;

    const targetIndex = Math.min(Math.max(index, 0), lastIndex);

    this.navigatedValue.set(options[targetIndex].value);
  }

  private moveBy(delta: number): void {
    this.moveTo(this.activeIndex() + delta);
  }

  private selectActiveOption(): void {
    const option = this.options()[this.activeIndex()];
    if (option) this.selectOption(option);
  }

  private static nextUid(): string {
    Select.uidCounter += 1;

    return `cw-select-${Select.uidCounter}`;
  }

  private scrollActiveOptionIntoView(): void {
    const index = this.activeIndex();
    const listbox = this.listbox()?.nativeElement;

    listbox?.children.item(index)?.scrollIntoView({ block: 'nearest' });
  }
}
