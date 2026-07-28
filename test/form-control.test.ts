import { expect } from '@esm-bundle/chai';
import { FormControlMixin, requiredValidator, minLengthValidator } from '../src/index.js';

class TestInput extends FormControlMixin(HTMLElement, {
  validators: [requiredValidator, minLengthValidator(3)],
}) {
  value = '';

  connectedCallback(): void {
    this.requestValidation();
  }

  formResetCallback(): void {
    this.value = '';
    this.requestValidation();
  }
}

if (!customElements.get('test-input')) {
  customElements.define('test-input', TestInput);
}

function renderInForm(): { form: HTMLFormElement; input: TestInput } {
  const form = document.createElement('form');
  const input = document.createElement('test-input') as TestInput;
  input.setAttribute('name', 'nickname');
  form.appendChild(input);
  document.body.appendChild(form);
  return { form, input };
}

describe('FormControlMixin', () => {
  afterEach(() => {
    document.querySelectorAll('form').forEach(f => f.remove());
  });

  it('marks the class as form-associated', () => {
    expect((TestInput as unknown as { formAssociated: boolean }).formAssociated).to.be.true;
  });

  it('reports valueMissing when empty and required', () => {
    const { input } = renderInForm();
    expect(input.validity.valid).to.be.false;
    expect(input.validity.valueMissing).to.be.true;
  });

  it('reports tooShort below the configured minlength', () => {
    const { input } = renderInForm();
    input.value = 'ab';
    input.requestValidation();
    expect(input.validity.valid).to.be.false;
    expect(input.validity.tooShort).to.be.true;
  });

  it('becomes valid once constraints are satisfied', () => {
    const { input } = renderInForm();
    input.value = 'abcd';
    input.requestValidation();
    expect(input.validity.valid).to.be.true;
  });

  it('submits its value as part of the native FormData', () => {
    const { form, input } = renderInForm();
    input.value = 'abcd';
    input.requestValidation();
    const data = new FormData(form);
    expect(data.get('nickname')).to.equal('abcd');
  });

  it('resets alongside the native form', () => {
    const { form, input } = renderInForm();
    input.value = 'abcd';
    input.requestValidation();
    form.reset();
    expect(input.value).to.equal('');
    expect(input.validity.valueMissing).to.be.true;
  });

  it('exposes the owning form via .form', () => {
    const { form, input } = renderInForm();
    expect(input.form).to.equal(form);
  });
});
