import type { FormValue, Validator } from './types.js';

type Constructor<T = object> = new (...args: any[]) => T;

// Sentinel distinguishing "no value observed yet" from a legitimate `null`
// value, used to capture the dirty-tracking baseline on the first
// requestValidation() call (constructor time is too early: subclass field
// initializers, e.g. `value = ''`, run after `super(...)` returns).
const NO_BASELINE = Symbol('no-baseline');

export interface FormControlConfig {
  /** Name of the host property holding the current form value. Defaults to "value". */
  valueProperty?: string;
  /** Validators to run, in registration order, whenever validity is recomputed. */
  validators?: Validator[];
}

/**
 * Everything FormControlMixin adds on top of the base class. Exported so
 * consumers can type host elements without repeating the mixin's shape.
 */
export interface FormControlInterface {
  readonly internals: ElementInternals;
  readonly form: HTMLFormElement | null;
  readonly validity: ValidityState;
  readonly validationMessage: string;
  readonly willValidate: boolean;
  checkValidity(): boolean;
  reportValidity(): boolean;
  setValidity(flags: Partial<ValidityStateFlags>, message?: string, anchor?: HTMLElement): void;
  /** Re-runs all configured validators and syncs the form value + validity. */
  requestValidation(): void;
  formAssociatedCallback(form: HTMLFormElement | null): void;
  formDisabledCallback(disabled: boolean): void;
  formResetCallback(): void;
  formStateRestoreCallback(state: string | FormData | null, mode: 'restore' | 'autocomplete'): void;
}

/**
 * Wraps `SuperClass` (a plain `HTMLElement`, a `LitElement`, or anything else
 * extending `HTMLElement`) with the plumbing needed to participate in native
 * HTML forms via `ElementInternals`.
 *
 * Deliberately framework-agnostic: it only touches `HTMLElement` APIs, so the
 * exact same mixin works whether or not the host happens to use Lit.
 *
 * @example
 * ```ts
 * class MyInput extends FormControlMixin(HTMLElement, {
 *   validators: [requiredValidator, minLengthValidator(3)],
 * }) {
 *   static observedAttributes = ['value'];
 *   value = '';
 *
 *   connectedCallback() {
 *     this.requestValidation();
 *   }
 * }
 * ```
 */
export function FormControlMixin<T extends Constructor<HTMLElement>>(
  SuperClass: T,
  config: FormControlConfig = {},
): T & Constructor<FormControlInterface> {
  const valueProperty = config.valueProperty ?? 'value';
  const validators = config.validators ?? [];

  class FormControl extends SuperClass implements FormControlInterface {
    static readonly formAssociated = true;

    #internals: ElementInternals;
    #baseline: FormValue | typeof NO_BASELINE = NO_BASELINE;

    constructor(...args: any[]) {
      super(...args);
      this.#internals = this.attachInternals();
      // `focusout` (unlike `focus`/`blur`) bubbles and is composed, so this
      // fires regardless of whether the host itself or a shadow-DOM
      // descendant holds focus.
      this.addEventListener('focusout', () => {
        this.#internals.states.add('touched');
      });
    }

    get internals(): ElementInternals {
      return this.#internals;
    }

    get form(): HTMLFormElement | null {
      return this.#internals.form;
    }

    get validity(): ValidityState {
      return this.#internals.validity;
    }

    get validationMessage(): string {
      return this.#internals.validationMessage;
    }

    get willValidate(): boolean {
      return this.#internals.willValidate;
    }

    checkValidity(): boolean {
      return this.#internals.checkValidity();
    }

    reportValidity(): boolean {
      return this.#internals.reportValidity();
    }

    setValidity(flags: Partial<ValidityStateFlags>, message?: string, anchor?: HTMLElement): void {
      const hasFlags = Object.values(flags).some(Boolean);
      // `anchor` is only forwarded when explicitly given: per spec, a
      // non-null anchor must be a shadow-including descendant of the host,
      // and the host itself does not qualify. Omitting it entirely (rather
      // than defaulting to `this`) avoids a NotFoundError in every browser.
      if (anchor) {
        this.#internals.setValidity(
          flags as ValidityStateFlags,
          hasFlags ? message : undefined,
          anchor,
        );
      } else {
        this.#internals.setValidity(flags as ValidityStateFlags, hasFlags ? message : undefined);
      }
    }

    requestValidation(): void {
      const value = (this as unknown as Record<string, FormValue>)[valueProperty] ?? null;
      this.#internals.setFormValue(value);

      let matched = false;
      for (const validator of validators) {
        if (!validator.isValid(this as unknown as HTMLElement, value)) {
          const message =
            typeof validator.message === 'function'
              ? validator.message(this as unknown as HTMLElement)
              : validator.message;
          this.setValidity({ [validator.key]: true } as Partial<ValidityStateFlags>, message);
          matched = true;
          break;
        }
      }

      if (!matched) {
        this.setValidity({});
      }

      this.#syncCustomStates(value);
    }

    /**
     * Keeps `internals.states` in sync so consumers can style the host from
     * outside via `:state(valid)`, `:state(invalid)`, `:state(touched)`, and
     * `:state(dirty)` &mdash; no attribute reflection required.
     *
     * `dirty` compares against the value seen on the first call, since a
     * subclass's own field initializers (e.g. `value = ''`) run after
     * `super()` returns and are therefore not visible from the constructor.
     */
    #syncCustomStates(value: FormValue): void {
      const states = this.#internals.states;

      if (this.validity.valid) {
        states.add('valid');
        states.delete('invalid');
      } else {
        states.add('invalid');
        states.delete('valid');
      }

      if (this.#baseline === NO_BASELINE) {
        this.#baseline = value;
      }
      states[value === this.#baseline ? 'delete' : 'add']('dirty');
    }

    /** Override to react when the element is (dis)associated from a form. */
    formAssociatedCallback(_form: HTMLFormElement | null): void {}

    /** Override to reflect a disabled ancestor `<fieldset>` on the host. */
    formDisabledCallback(_disabled: boolean): void {}

    /**
     * Override to reset the host's own value property on form reset.
     * Clears the `touched` custom state; call `super.formResetCallback()`
     * first if you override this to keep that behavior. `dirty` needs no
     * such call &mdash; it's recomputed from scratch on the next
     * `requestValidation()`, which a `formResetCallback` override typically
     * calls anyway.
     */
    formResetCallback(): void {
      this.#internals.states.delete('touched');
    }

    /** Override to restore value on bfcache navigation / autofill. */
    formStateRestoreCallback(
      _state: string | FormData | null,
      _mode: 'restore' | 'autocomplete',
    ): void {}
  }

  return FormControl as unknown as T & Constructor<FormControlInterface>;
}
