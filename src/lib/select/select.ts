import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type { SelectOption } from './select-option';

export const Key = {
  ArrowDown: 'ArrowDown',
  ArrowUp: 'ArrowUp',
  Home: 'Home',
  End: 'End',
  Enter: 'Enter',
  Space: ' ',
  Tab: 'Tab',
  Escape: 'Escape',
} as const;

@Component({
  selector: 'cw-select',
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(focusout)': 'onFocusOut($event)' },
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Select), multi: true }],
})
export class Select implements ControlValueAccessor {
  readonly label = input.required<string>();
  readonly options = input.required<readonly SelectOption[]>();
  readonly placeholder = input('Select an option');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly uid = Math.random().toString(36).slice(2, 9);

  protected readonly labelId = `cw-select-${this.uid}-label`;
  protected readonly listboxId = `cw-select-${this.uid}-listbox`;

  private readonly selectedValue = signal<string | null>(null);
  protected readonly disabled = signal(false);
  protected readonly expanded = signal(false);
  protected readonly activeIndex = signal(-1);

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  protected readonly selectedLabel = computed(() => {
    const selectedValue = this.selectedValue();

    return this.options().find((item) => item.value === selectedValue)?.label ?? null;
  });

  protected readonly activeDescendantId = computed(() => {
    const index = this.activeIndex();

    return index < 0 ? null : this.optionId(index);
  });

  writeValue(value: string | null): void {
    this.selectedValue.set(value);
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected optionId(index: number): string {
    return `cw-select-${this.uid}-option-${index}`;
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) return;

    this.selectedValue.set(option.value);
    this.onChange(option.value);
    this.close();
  }

  protected toggle(): void {
    if (this.disabled()) return;

    if (this.expanded()) this.close();
    else this.open();
  }

  protected onFocusOut(event: FocusEvent): void {
    const nextFocusedElement = event.relatedTarget as Node | null;
    if (nextFocusedElement && this.host.nativeElement.contains(nextFocusedElement)) return;

    this.close();
    this.onTouched();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;

    const isOpen = this.expanded();

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
    const selectedValue = this.selectedValue();
    const selectedIndex = this.options().findIndex((item) => item.value === selectedValue);

    this.activeIndex.set(this.options().length === 0 ? -1 : Math.max(selectedIndex, 0));
    this.expanded.set(true);
  }

  private close(): void {
    this.expanded.set(false);
    this.activeIndex.set(-1);
  }

  private moveTo(index: number): void {
    const lastIndex = this.options().length - 1;
    if (lastIndex < 0) return;

    this.activeIndex.set(Math.min(Math.max(index, 0), lastIndex));
  }

  private moveBy(delta: number): void {
    this.moveTo(this.activeIndex() + delta);
  }

  private selectActiveOption(): void {
    const option = this.options()[this.activeIndex()];
    if (option) this.selectOption(option);
  }
}
