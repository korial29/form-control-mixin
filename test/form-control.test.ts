import { expect } from '@esm-bundle/chai';
import { FormControlMixin, requiredValidator, minLengthValidator } from '../src/index.js';

class TestInput extends FormControlMixin(HTMLElement, {
  validators: [requiredValidator, minLengthValidator(3)],
}) {
  value = '';
  disabledCalls: boolean[] = [];
  restoredState: string | FormData | null = null;
  restoredMode: 'restore' | 'autocomplete' | null = null;

  connectedCallback(): void {
    this.requestValidation();
  }

  formResetCallback(): void {
    super.formResetCallback();
    this.value = '';
    this.requestValidation();
  }

  formDisabledCallback(disabled: boolean): void {
    this.disabledCalls.push(disabled);
  }

  formStateRestoreCallback(
    state: string | FormData | null,
    mode: 'restore' | 'autocomplete',
  ): void {
    this.restoredState = state;
    this.restoredMode = mode;
    if (typeof state === 'string') {
      this.value = state;
      this.requestValidation();
    }
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

  it('calls formDisabledCallback when an ancestor fieldset is disabled', () => {
    const form = document.createElement('form');
    const fieldset = document.createElement('fieldset');
    const input = document.createElement('test-input') as TestInput;
    input.setAttribute('name', 'nickname');
    fieldset.appendChild(input);
    form.appendChild(fieldset);
    document.body.appendChild(form);

    fieldset.disabled = true;
    expect(input.disabledCalls).to.deep.equal([true]);

    fieldset.disabled = false;
    expect(input.disabledCalls).to.deep.equal([true, false]);
  });

  // The browser only invokes formStateRestoreCallback for real bfcache
  // navigations or autofill, neither of which is reproducible in this test
  // harness. Invoking it directly still proves the override contract works:
  // the mixin's default is a no-op, so a subclass relies on its own override
  // being called with the state/mode it receives.
  it('restores value via formStateRestoreCallback', () => {
    const { input } = renderInForm();
    input.formStateRestoreCallback('abcd', 'restore');
    expect(input.restoredState).to.equal('abcd');
    expect(input.restoredMode).to.equal('restore');
    expect(input.value).to.equal('abcd');
    expect(input.validity.valid).to.be.true;
  });

  describe('custom states', () => {
    it('reflects validity as :state(valid) / :state(invalid)', () => {
      const { input } = renderInForm();
      expect(input.internals.states.has('invalid')).to.be.true;
      expect(input.internals.states.has('valid')).to.be.false;

      input.value = 'abcd';
      input.requestValidation();
      expect(input.internals.states.has('valid')).to.be.true;
      expect(input.internals.states.has('invalid')).to.be.false;
    });

    it('sets :state(dirty) once the value diverges from its baseline, clears it on reset', () => {
      const { form, input } = renderInForm();
      expect(input.internals.states.has('dirty')).to.be.false;

      input.value = 'abcd';
      input.requestValidation();
      expect(input.internals.states.has('dirty')).to.be.true;

      form.reset();
      expect(input.internals.states.has('dirty')).to.be.false;
    });

    it('sets :state(touched) on focusout and clears it on form reset', () => {
      const { form, input } = renderInForm();
      expect(input.internals.states.has('touched')).to.be.false;

      input.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
      expect(input.internals.states.has('touched')).to.be.true;

      form.reset();
      expect(input.internals.states.has('touched')).to.be.false;
    });
  });
});
