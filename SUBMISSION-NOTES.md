# Submission notes

**AI usage.** I used Cursor and Copilot. They helped most with the tests and with edge cases.

They also helped with the colors, working out the dark theme values after the contrast script flagged white on `--cw-blue-400`. I used them to
research the CSS part of ADOPTION.md and then checked that against the docs, because the first answer was wrong. One suggestion I turned down was a
refactor of the keyboard handler into a map of actions, because it would have opened the list and moved the selection on the same keypress, and the APG
does not do that so I decided to maintain the switch. The two bugs in DECISIONS.md I found by using the component, one of them with VoiceOver.

**Time spent.** About one day and a half. More than the three hours you expect. Most of it was the select, and most of that was checking it with a
screen reader. That is where the two bugs in DECISIONS.md came from. The tokens and the badge were fast. To fit three hours I would keep the keyboard
and the screen reader work, and cut tests and the badge rework.

**What I would do next.** Search in the select. Right now you can only move with the arrows, so on a long list of reviewers you have to go one name at
a time, and typing the first letters should jump straight to it. Then the overlay positioning, a Stylelint rule to stop primitive tokens and
`::ng-deep` coming back, and accessibility tests running in CI.
A tooltip for the names that do not fit, not the native title, and on arrow focus too, because a keyboard user never hovers.

**A risk I left in.** The popup overflows. If the select sits low on the page the list opens downwards and the bottom of it gets cut off. I would fix it
with proper overlay positioning, the way the Angular CDK Overlay does it, so the list flips above the input when there is no room below. The next test would
put a select at the bottom of a real browser window and expect the list to open upwards. It cannot run in the current suite because jsdom has no layout, so
everything measures zero.
