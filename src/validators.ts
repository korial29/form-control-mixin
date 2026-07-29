import type { FormValue, Validator } from './types.js';

function toStringValue(value: FormValue): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value instanceof File) {
    return value.name;
  }
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
    if (value instanceof FormData) {
      return true;
    }
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

// Same pattern the WHATWG HTML spec uses for `<input type="email">`.
const EMAIL_PATTERN =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/** Mirrors native `type="email"`. Empty values are left to requiredValidator. */
export const emailValidator: Validator = {
  key: 'typeMismatch',
  message: 'Please enter a valid email address.',
  isValid(_host, value) {
    const str = toStringValue(value);
    return str.length === 0 || EMAIL_PATTERN.test(str);
  },
};

/** Mirrors native `type="url"`. Empty values are left to requiredValidator. */
export const urlValidator: Validator = {
  key: 'typeMismatch',
  message: 'Please enter a valid URL.',
  isValid(_host, value) {
    const str = toStringValue(value);
    if (str.length === 0) {
      return true;
    }
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  },
};

/** Parses a numeric field value; non-numeric/empty values are left to other validators. */
function toNumber(value: FormValue): number | null {
  const str = toStringValue(value);
  if (str.length === 0) {
    return null;
  }
  const num = Number(str);
  return Number.isFinite(num) ? num : null;
}

/** Mirrors native `min`. Non-numeric/empty values are left to other validators. */
export function minValidator(min: number): Validator {
  return {
    key: 'rangeUnderflow',
    message: `Value must be greater than or equal to ${min}.`,
    isValid(_host, value) {
      const num = toNumber(value);
      return num === null || num >= min;
    },
  };
}

/** Mirrors native `max`. Non-numeric/empty values are left to other validators. */
export function maxValidator(max: number): Validator {
  return {
    key: 'rangeOverflow',
    message: `Value must be less than or equal to ${max}.`,
    isValid(_host, value) {
      const num = toNumber(value);
      return num === null || num <= max;
    },
  };
}

/**
 * Mirrors native `step`. `base` is the reference point steps are counted
 * from (defaults to 0, like the native attribute without a `min`).
 * Non-numeric/empty values are left to other validators.
 */
export function stepValidator(step: number, base = 0): Validator {
  return {
    key: 'stepMismatch',
    message: `Value must be a multiple of ${step}.`,
    isValid(_host, value) {
      const num = toNumber(value);
      if (num === null) {
        return true;
      }
      const steps = (num - base) / step;
      return Math.abs(steps - Math.round(steps)) < 1e-9;
    },
  };
}
