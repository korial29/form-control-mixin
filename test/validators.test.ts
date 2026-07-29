import { expect } from '@esm-bundle/chai';
import {
  emailValidator,
  urlValidator,
  minValidator,
  maxValidator,
  stepValidator,
} from '../src/index.js';

const host = document.createElement('div');

describe('emailValidator', () => {
  it('accepts empty values (left to requiredValidator)', () => {
    expect(emailValidator.isValid(host, '')).to.be.true;
  });

  it('accepts a well-formed address', () => {
    expect(emailValidator.isValid(host, 'ada@example.com')).to.be.true;
  });

  it('rejects a malformed address', () => {
    expect(emailValidator.isValid(host, 'not-an-email')).to.be.false;
  });
});

describe('urlValidator', () => {
  it('accepts empty values (left to requiredValidator)', () => {
    expect(urlValidator.isValid(host, '')).to.be.true;
  });

  it('accepts an absolute URL', () => {
    expect(urlValidator.isValid(host, 'https://example.com/path')).to.be.true;
  });

  it('rejects a non-URL string', () => {
    expect(urlValidator.isValid(host, 'not a url')).to.be.false;
  });
});

describe('minValidator', () => {
  const validator = minValidator(10);

  it('accepts empty values (left to other validators)', () => {
    expect(validator.isValid(host, '')).to.be.true;
  });

  it('accepts a value at or above the minimum', () => {
    expect(validator.isValid(host, '10')).to.be.true;
    expect(validator.isValid(host, '15')).to.be.true;
  });

  it('rejects a value below the minimum', () => {
    expect(validator.isValid(host, '9')).to.be.false;
  });
});

describe('maxValidator', () => {
  const validator = maxValidator(10);

  it('accepts a value at or below the maximum', () => {
    expect(validator.isValid(host, '10')).to.be.true;
    expect(validator.isValid(host, '5')).to.be.true;
  });

  it('rejects a value above the maximum', () => {
    expect(validator.isValid(host, '11')).to.be.false;
  });
});

describe('stepValidator', () => {
  it('accepts multiples of the step from the default base of 0', () => {
    const validator = stepValidator(5);
    expect(validator.isValid(host, '15')).to.be.true;
    expect(validator.isValid(host, '17')).to.be.false;
  });

  it('counts steps from a custom base', () => {
    const validator = stepValidator(5, 2);
    expect(validator.isValid(host, '12')).to.be.true;
    expect(validator.isValid(host, '14')).to.be.false;
  });
});
