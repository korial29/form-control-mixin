/** A value that can be attached to a form via ElementInternals.setFormValue(). */
export type FormValue = string | File | FormData | null;

/**
 * A single validation rule. Validators run in the order they were registered;
 * the first one that fails wins and sets the corresponding ValidityState flag.
 */
export interface Validator<Host extends HTMLElement = HTMLElement> {
  /** Key of ValidityStateFlags this validator controls (e.g. "valueMissing", "tooShort"). */
  key: string;
  /** Static message, or a function computing a message from the host element. */
  message: string | ((host: Host) => string);
  /** Return true when the current value is valid for this rule. */
  isValid(host: Host, value: FormValue): boolean;
}

/** Minimal shape expected from a host element using FormControlMixin. */
export interface FormControlHost extends HTMLElement {
  value: FormValue;
}
