# form-control-mixin

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

This package is deliberately: framework-agnostic (a mixin, not tied to Lit
or any renderer), small (no bundled polyfill, no assumed rendering layer),
and tested against real Chromium, Firefox, and WebKit engines rather than a
DOM shim.

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

### Built-in validators

`requiredValidator`, `minLengthValidator(n)`, `maxLengthValidator(n)`,
`patternValidator(regex, message?)` &mdash; mirror native `required`,
`minlength`, `maxlength`, and `pattern` semantics. Write your own by
implementing `{ key, message, isValid(host, value) }`.

## Demo

```sh
npm run build
npx http-server . -o /demo/
```

## Status

Early (`0.1.0`). Core mixin + built-in validators + cross-browser test suite
are in place. Not yet published to npm.
