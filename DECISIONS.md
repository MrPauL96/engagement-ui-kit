# Decisions

## ControlValueAccessor, not the FormControl as an input

ControlValueAccessor can be overkill sometimes, but there are moments where you need it and this kit is one. It has to be reusable, and the consumer
should not subscribe to form changes just to find out the control is disabled. The component hears that itself.

The other way around forces reactive forms on everyone. With CVA it also works with `ngModel`, and `formControlName` works without the component knowing
anything about the form.

Angular 21 ships `FormValueControl` as the replacement for this interface, but it is marked experimental. A kit component that other teams depend on
should not sit on an experimental API, and moving later costs them nothing, because both work with `formControlName`.

It also decides who finds out what. `setDisabledState` is the only way the component hears that the form disabled it. Without that, a control can be
disabled in the form and still be open and clickable on screen, and nothing inside the component can notice. That is what happened to me: disabling with
the list open left it open, Escape did nothing, and the options still worked.

## aria-activedescendant, not a roving tabindex

The APG says that for a combobox the DOM focus should stay in the combobox, and that is what the component does. The options are marked with
`aria-activedescendant` and they never get the focus.

I chose this over a roving tabindex because of focus restoration. With a roving tabindex the focus really moves into the options, and then you need to
return it to the combobox every time the list closes (Escape, selection, Tab, clicking outside). When that fails the keyboard user is lost, and it goes
unnoticed because the visual state looks normal.

But this has a cost, and the APG says it too: with a roving tabindex the browser scrolls the focused option into view for you. Here it does not, so the
component does it with `afterRenderEffect` and `scrollIntoView`. The browser also does not draw a focus outline on the active option, so the CSS is the only
indicator left. That is why the active row is a filled background and not a thin border, because I checked the contrast against the popup and a border
did not give me enough.

One more thing: I track the active option by value and look its position up again. If the list changes while the menu is open it stays on the same
reviewer instead of pointing at nothing.

Keyboard navigation does not skip unavailable reviewers. `aria-disabled` marks them so a screen reader announces they exist, and `selectOption` is what
refuses the choice. Skipping would hide them, and it also breaks at the ends of the list, where the last reviewer in the data happens to be one of them.

## Components only read semantic tokens

Components read semantic tokens, never primitives. Light sits on `:root` as the default, and both themes are also classes, so any part of the page can
carry its own theme.

I checked the colours with a script instead of trusting my eyes. White on `--cw-blue-400` came out at 3.68:1, which fails AA, so in the dark theme I did
not just darken the active row, I inverted it to dark text on light blue.

The one I did not touch is `--cw-border-default`. It only gives 1.35:1 against the page, too soft for a control border, but it came with the palette so I am
flagging it here instead of changing it behind someone's back.

## The arrows do not select, Enter, Space and Tab do

Some dropdowns select whatever the arrows land on, and in a single select that is not crazy, there is only one value so you could argue the selection
follows the focus. I did not want that here. Checked the APG's reference code (`select-only.js`) and saw they keep `aria-activedescendant` strictly for
arrow navigation, while `aria-selected` only gets written when you actually commit the choice.

I had it wrong at the start and the screen looked fine, so I only found it with VoiceOver. Going down the list it announced every option as selected. I had
bound the attribute to the active index, which is where the arrows are, instead of the option you actually picked:

```html
<!-- before -->
[attr.aria-selected]="i === activeIndex() ? 'true' : null"

<!-- after -->
[attr.aria-selected]="option.value === selectedValue()"
```

The `null` was half the problem too. It took the attribute off the other options, so the list never said which one was chosen, it only lied about the one
under the arrows. With a boolean, one says true and the rest say false. It has a test now because the screen looks the same either way.

## The badge takes a status and a size, not five booleans

Using it meant repeating the same comparison in every template:

```html
[isReady]="engagement.status === 'READY'"
[isProcessing]="engagement.status === 'PROCESSING'"
[isError]="engagement.status === 'ERROR'"
```

Now it is just `[status]="engagement.badge.status"`. I did the exact same thing with `size`, replacing `isSmall` and `isLarge`.

For anyone consuming the kit, this means dealing with two attributes instead of five, and the exact same two for every status so nobody has to guess.
The IDE autocomplete handles the valid values; before this, you had to literally open the component file just to check what booleans existed. If you
forgot one, it would render a badge with zero state and zero warnings.

Now `status` is required, so it fails at compile time if you miss it. Plus, whenever we add a fourth status later, their templates will just work, and
medium size finally has a proper name instead of being "whatever happens when no flag is set".

On the CSS side, the stylesheet had `::ng-deep .engagement-row .badge`, which was the library styling an app class unscoped. How much room there is
between a badge and the row around it is the row's decision, not the kit's, so I deleted it.

This is a breaking change for anyone already using the badge, and ADOPTION.md says how I would ship it.
