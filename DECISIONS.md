# Decisions

## Reviewer picker

**ControlValueAccessor, not the FormControl as an input.** The disabled state
decided it: with the control passed in, nothing tells me when someone calls
`disable()`. And a kit component shouldn't force every consumer onto reactive
forms. Costs four methods and a provider.

**`value: string`, not a generic.** The control is `FormControl<string | null>`
and form values are strings anyway. A type parameter would have travelled
through the class, the template and the tests for nothing.

**`disabled`, not `unavailable`.** The fixtures speak audit, the kit speaks UI,
and the `.map()` in `app.ts` is the border. The reason changes but the effect
doesn't: leave, independence conflict, already reviewed — all arrive as
`disabled: true`.

**Role in its own field, not glued onto the label.** I had it concatenated at
first. Changed it after reading the APG warning about long option names. An
accessible name is the joined text content, so splitting it visually does
nothing on its own — it has to be `aria-describedby`.

**Keyboard is the APG select-only combobox.** Two things I checked because
they surprised me: Tab commits the active option, which native `<select>`
doesn't do, and Home/End work with the list closed.

**Arrows don't skip unavailable reviewers.** Moving focus is how screen reader
users find what's there, so an option you can't reach is one you never learn
exists. The CDK and Headless UI skip them by default — I'm on the less common
side here on purpose.

**Clamps at the ends, doesn't wrap.** Holding a key gets you to the first or
last reviewer without watching the screen.

**Left out:** typeahead, Page Up/Down, Alt+Up.

**`aria-activedescendant`, not a roving tabindex.** Focus never leaves the
trigger, so there's nothing to restore when the list closes and the easiest
bug in this component can't happen. The price is that scrolling is my job, and
that part isn't finished.

**`focusout` on the host, no `document` listener.** Clicking empty space moves
focus to `<body>`, so one handler covers clicking away, tabbing away and
clicking another control. `blur` doesn't bubble, so it never reaches the host.

**No CDK.** `ActiveDescendantKeyManager` does most of this. Using it would
have handed over the part being assessed.

## Tokens

**Components read the semantic layer only.** A theme block holds token
declarations and nothing else. The day it needs
`.cw-theme-dark .cw-select__option`, the layer has failed.

**Added `--cw-z-raised` and `--cw-z-popup`.** The primitives file allows adding
what's genuinely missing. There was no z-index scale and a popup can't exist
without one. Only thing I added.

**Themes are classes, not `:root`.** `:root` is `<html>` and can't nest, so
tokens there mean the workbench can only ever show one theme. As a class, any
container can carry one.

**`color-scheme` in each theme block.** The listbox scrolls. Without it the
dark popup gets a light scrollbar.

**Dark isn't light with darker colours.** White on `--cw-blue-400` is 3.68:1
and fails AA, so the active row inverts instead: light blue surface, dark
text, 9.65:1, sitting 7.56:1 off the popup behind it.

**Active + unavailable needed its own rule.** The disabled grey on the active
background is 2.64:1 — unreadable. It switches to 5.14:1. Not an edge case:
the arrows don't skip those options, so you land on them constantly.

**Found in the supplied palette:** `--cw-border-default` draws a 1.35:1 border
in the light theme, where 1.4.11 wants 3:1 on a control boundary. Recording it
rather than quietly changing it. One line in the semantic layer fixes it.

## Where sources disagree

`aria-selected` in a single-select listbox. The APG example puts it on the
active option only; the CDK and an open Radix issue say it should follow
selection rather than focus. I went with the APG because it's the reference
for this exact pattern. It isn't settled, and I'd want a screen reader test
before arguing it harder.

## Known gaps

- The active option doesn't scroll into view. The APG calls this essential.
  First thing I'd fix.
- The popup doesn't flip when there's no room below it.
- Outside-click relies on focus moving, so Safari and scrollbar clicks miss.
- Closing on `focusout` assumes the listbox lives inside the host, since the
  check is `host.nativeElement.contains(...)`. If it ever moves into an overlay
  or a portal, that check has to cover both nodes instead.
- No typeahead. Next test I'd write, next behaviour I'd add.
