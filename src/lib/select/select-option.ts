/**
 * Represents a single selectable option within a `cw-select` component.
 */
export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}