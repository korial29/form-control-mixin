import type { FormValue, Validator } from './types.js';

function toStringValue(value: FormValue): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (value instanceof File) return value.name;
  return '';
}

/**
 * Mirrors native `required`: fails when the value is empty.
 * Does not apply to FormData values (e.g. multi-part values), which are
 * always considered present.
 */
export const requiredValidator: Validator = {
  key: 'valueMissing',
  message: 'Please fill out this field.',
  isValid(_host, value) {
    if (value instanceof FormData) return true;
    return toStringValue(value).length > 0;
  },
};

/** Mirrors native `minlength`. Empty values are left to requiredValidator. */
export function minLengthValidator(minLength: number): Validator {
  return {
    key: 'tooShort',
    message: `Please use at least ${minLength} characters.`,
    isValid(_host, value) {
      const str = toStringValue(value);
      return str.length === 0 || str.length >= minLength;
    },
  };
}

/** Mirrors native `maxlength`. */
export function maxLengthValidator(maxLength: number): Validator {
  return {
    key: 'tooLong',
    message: `Please use no more than ${maxLength} characters.`,
    isValid(_host, value) {
      return toStringValue(value).length <= maxLength;
    },
  };
}

/** Mirrors native `pattern`. Empty values are left to requiredValidator. */
export function patternValidator(
  pattern: RegExp,
  message = 'Please match the requested format.',
): Validator {
  return {
    key: 'patternMismatch',
    message,
    isValid(_host, value) {
      const str = toStringValue(value);
      return str.length === 0 || pattern.test(str);
    },
  };
}
