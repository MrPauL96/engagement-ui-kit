/** One choice in a `cw-select`. */
export interface SelectOption {
  value: string; // identifies the option. must be unique in the list, and is the control's value
  label: string; // the option's accessible name. keep it short: it is announced on every move
  description?: string; // secondary text, exposed as a description rather than part of the name
  disabled?: boolean; // shown but not selectable. the arrow keys still reach it, so it stays discoverable
}
