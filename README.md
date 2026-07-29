# form-control-mixin

[![npm version](https://img.shields.io/npm/v/form-control-mixin.svg)](https://www.npmjs.com/package/form-control-mixin)
[![npm downloads](https://img.shields.io/npm/dm/form-control-mixin.svg)](https://www.npmjs.com/package/form-control-mixin)
[![bundle size](https://img.shields.io/bundlephobia/minzip/form-control-mixin)](https://bundlephobia.com/package/form-control-mixin)
[![license](https://img.shields.io/npm/l/form-control-mixin.svg)](LICENSE)

A small, framework-agnostic mixin for building **form-associated custom
elements** on top of the native [`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals) API.

Wrap any class extending `HTMLElement` &mdash; a plain custom element, a
`LitElement`, a Stencil or FAST base class &mdash; and it will participate in
native `<form>` submission, validation, and reset, without you having to
touch `ElementInternals` directly.

```ts
import { FormControlMixin, requiredValidator, minLengthValidator } from 'form-control-mixin';

class MyInput extends FormControlMixin(HTMLElement, {
  validators: [requiredValidator, minLengthValidator(3)],
}) {
  value = '';

  connectedCallback() {
    this.requestValidation();
  }

  formResetCallback() {
    this.value = '';
    this.requestValidation();
  }
}

customElements.define('my-input', MyInput);
```

```html
<form>
  <my-input name="nickname"></my-input>
  <button>Submit</button>
</form>
```

`new FormData(form).get('nickname')` and native constraint validation UI
(`:invalid`, `reportValidity()`, browser validation bubbles) work out of the box.

## What you get

- **No framework, no renderer.** It's a mixin over `HTMLElement`, so it works
  in a plain custom element, Lit, Stencil, FAST — and the resulting element
  drops into React, Vue, Angular, Svelte or plain HTML like any other custom
  element.
- **~3 KB gzipped, zero runtime dependencies.** No bundled polyfill, no
  assumed rendering layer.
- **TypeScript types shipped** (`dist/index.d.ts`), ESM only.
- **Nine built-in validators** mirroring native constraint semantics, plus a
  three-property interface for your own.
- **`:state()` styling out of the box** — `valid`, `invalid`, `touched`,
  `dirty` exposed as custom states, no attribute reflection.
- **Tested on real engines.** The suite runs in Chromium, Firefox and WebKit
  via Playwright, not a DOM shim.

## Demo

Live: **https://korial29.github.io/form-control-mixin/demo/**

Locally:

```sh
npm run dev
```

## Why this exists

Form-associated custom elements have been broadly supported since 2023
(Chromium, Firefox, Safari 16+), but the plumbing around `ElementInternals`
&mdash; wiring up value sync, validity flags, reset/disable/restore
callbacks &mdash; is boilerplate every design system ends up rewriting.

An attempt at solving this generically already exists,
[`@open-wc/form-control`](https://www.npmjs.com/package/@open-wc/form-control),
but it hasn't seen a release in about three years and never settled on a
finished API. Bigger component libraries (Shoelace, Ionic, FAST) solved the
same problem, but only inside their own codebase &mdash; not as something you
can install if you're building your own design system.

So this fills the gap: the `ElementInternals` plumbing, on its own, installable.

## Install

```sh
npm install form-control-mixin
```

## API

### `FormControlMixin(SuperClass, config?)`

- `SuperClass` &mdash; any class extending `HTMLElement`.
- `config.valueProperty` &mdash; name of the host property holding the
  current value. Defaults to `"value"`.
- `config.validators` &mdash; ordered list of `Validator` objects. The first
  one that fails wins and sets the matching `ValidityStateFlags` key.

The mixin adds `internals`, `form`, `validity`, `validationMessage`,
`willValidate`, `checkValidity()`, `reportValidity()`, `setValidity()`, and
`requestValidation()` (re-runs validators and syncs the form value). It also
declares (empty, override-friendly) `formAssociatedCallback`,
`formDisabledCallback`, `formResetCallback`, and
`formStateRestoreCallback` hooks.

### Custom states

`requestValidation()` also keeps `internals.states` (a
[`CustomStateSet`](https://developer.mozilla.org/en-US/docs/Web/API/CustomStateSet))
in sync, so any consumer can style the host from the outside with the
[`:state()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:state) pseudo-class
&mdash; no attribute reflection needed:

```css
my-input:state(invalid) {
  outline: 2px solid crimson;
}
my-input:state(touched):state(invalid) {
  /* only after the user has actually interacted with the field */
}
```

- `valid` / `invalid` &mdash; mirrors `validity.valid`.
- `touched` &mdash; set on the first `focusout` of the host (or any shadow-DOM
  descendant); cleared by `formResetCallback` (call `super.formResetCallback()`
  if you override it, to keep this in sync).
- `dirty` &mdash; set once the value diverges from the value seen on the first
  `requestValidation()` call; needs no explicit reset since it's recomputed
  every call &mdash; a `formResetCallback` override that resets the value and
  calls `requestValidation()` clears it automatically.

### Built-in validators

`requiredValidator`, `minLengthValidator(n)`, `maxLengthValidator(n)`,
`patternValidator(regex, message?)`, `emailValidator`, `urlValidator`,
`minValidator(n)`, `maxValidator(n)`, `stepValidator(step, base?)` &mdash;
mirror native `required`, `minlength`, `maxlength`, `pattern`,
`type="email"`, `type="url"`, `min`, `max`, and `step` semantics. Write your
own by implementing `{ key, message, isValid(host, value) }`.

## Contributing

Single-branch model on `master` (same conventions as
[`lit-pdf-viewer`](https://github.com/korial29/lit-pdf-viewer)):

- Branch off `master` (`feature/*`, `fix/*`, `chore/*`), open the PR back into `master`.
- Add exactly one release label: `release:major`, `release:minor`, `release:patch`,
  or `release:skip`. Enforced by `pr-validation.yml`.
- Merging a `release:*` PR (not `skip`) proposes a release via `release.yml` — tag,
  npm publish, GitHub Release — gated behind a manual approval (`release`
  environment). `package.json`'s `version` is just a baseline; the real next
  version comes from the latest git tag.

Before opening a PR: `npm run lint && npm run build && npm run test:ci` (exactly
what CI runs).

## Status

Published on npm and in use. The core mixin, the built-in validators, the custom
states and the cross-browser test suite are in place; the API is not expected to
churn from here.

## License

[MIT](LICENSE) © Ludovic Dupont
