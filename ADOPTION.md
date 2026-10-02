# Adoption

## How you would version and release the change you made to `cw-status-badge`, and what consuming teams would have to do

On a client project at Kinesso I created and maintained a routing library that six product repos consumed. We used semver. A merge to `develop`
triggered a workflow that read the commit message, `feat:` or `fix:`, and decided patch, minor or major from it. Then it published and opened a PR in
each consumer.

Later I realised that each project runs a different Node version, that is why I decided to use yarn with `--ignore-engines`. Without that flag the
workflow failed in the repos nobody was maintaining.

By semver this is a major: removing the booleans in `cw-status-badge` does not compile until teams edit their templates, so the `aria-hidden` fix,
`status` and `size` all go in the same release, because a release takes the version of its most severe change.

On their side most of the migration is automated: they merge the PR and run `ng update`, and the schematic handles the simple cases like
`[isReady]="true"` to `status="ready"`. What is left is writing the mapping once where the status comes from their own data, and checking custom CSS,
because if someone styled the badge from outside the schematic cannot see it.

## What you would document or automate so that adopting it is safe rather than merely possible

I would deploy a live demo page with the components. We did that in Kinesso. A single page where every team can interact with real examples, tab
through them, and hear how they behave with a screen reader. I would also add JSDoc on every public input, so the IDE shows the hints right where a
developer uses the component.

I would also document the semantic tokens carefully. Renaming one can break consumer apps and TypeScript will not warn you about it, so the changelog
should show "before and after" examples for CSS changes, which is what automated scripts cannot catch.

For automation, three things:

- accessibility tests on the rendered components
- a Stylelint rule so the kit cannot read a primitive token or use `::ng-deep` again, because I fixed both by hand here and nothing stops them from
  coming back
- the PR in each consumer has to build before anyone reviews it, because an installation that succeeds only means the kit could be adopted, not that
  it works

## What you would expect to go wrong if two different versions of this kit ended up loaded in the same page

From past experience with module federation, the first thing that breaks is the CSS. Both versions declare the same token names, and CSS matches by
name and not by who wrote the rule, so the last one loaded wins and the other version's components take values they were not built with.

What helps here is that components only read semantic tokens, so there is less to collide, and the kit has no `::ng-deep` anymore, so one version
cannot restyle the other one's DOM. The host should own the tokens and define them once, and the kit should be a shared singleton so there is only one
version on the page.

Another one: two microfrontends showing the same `cw-select` on different versions. The ids come from a counter I added so two selects on one page
would not share them. That works inside one copy of the kit, but each copy has its own counter and both start at one, so with two versions they collide
again. `aria-activedescendant` looks up the whole document and takes the first match, so one select can point at the other version's option. Nothing
shows on screen, only a screen reader notices. Here I would prefix the ids with `APP_ID`.

With Nx this does not even come up, because every app compiles against the same version of the library. Module federation resolves at runtime, so that
guarantee disappears the moment two remotes are deployed at different times.
