import 'lit-toast/lit-toast.js';
import { Config, getCurrentConfiguration } from '../configuration';
import { LitElement, TemplateResult, css, html } from 'lit';
import { optionsCss } from './css';
import { optionsHtml } from './html';
import { until } from 'lit/directives/until.js';

export class OptionsForm extends LitElement {
  private content: Promise<TemplateResult> = this.fetchAndRender();

  _options?: Config;

  render() {
    return html`${until(this.content)}<lit-toast></lit-toast>`;
  }

  async fetchAndRender() {
    this._options = await getCurrentConfiguration();
    return optionsHtml(this);
  }

  static styles = optionsCss;

  _saveOptions(event: Event) {
    // Since options is populated during render, it must be non null now.
    if (this._options == null) {
      throw new TypeError('options object should not be null.');
    }
    // Save these values for convenience since we need to type them as their
    // actual types.
    const target = event.target as HTMLInputElement;
    const key = target.name as keyof Config;
    // kanjiInfo is special since its value is another object.
    if (key === 'kanjiInfo') {
      this._options.kanjiInfo.find(
        (info) => info.code === target.value
      )!.shouldDisplay = target.checked;
    }
    // popupLocation is special since its a drop down whose values are
    // numbers instead of text.
    else if (key === 'popupLocation') {
      this._options.popupLocation = parseInt(target.value);
    } else {
      // Switch on the top of form element such that we can set the
      // value with te proper type.
      switch (target.type) {
        case 'number':
          assertObjOfKeyIsType(this._options, key, 'number');
          const prevValue = this._options[key];
          this._options[key] = safeParseInt(target.value, prevValue);
          break;
        case 'checkbox':
          assertObjOfKeyIsType(this._options, key, 'boolean');
          this._options[key] = target.checked;
          break;
        case 'select-one':
        case 'radio':
          assertObjOfKeyIsType(this._options, key, 'string');
          this._options[key] = target.value;
          break;
        default:
          console.error(`Unexpected input type in options: ${target.type}`);
      }
    }
    chrome.storage.sync.set(this._options, () => this.showToast());
  }

  private showToast() {
    this.shadowRoot!.querySelector('lit-toast')!.show('Saved', 2500);
  }
}

function safeParseInt(val: string, fallback: number) {
  let intVal = fallback;
  try {
    intVal = parseInt(val);
  } catch {
    console.error(`Failed to parse int value: ${val}`);
    return intVal;
  }
  return intVal;
}
customElements.define('options-form', OptionsForm);

type GenericConfigValueTypes = {
  number: number;
  string: string;
  boolean: boolean;
};

// Good explanation of how this works at:
// https://artsy.github.io/blog/2018/11/21/conditional-types-in-typescript/
type KeyAssignableTo<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

function assertObjOfKeyIsType<T, P extends keyof GenericConfigValueTypes>(
  obj: T,
  key: keyof T,
  type: P
): asserts key is KeyAssignableTo<T, GenericConfigValueTypes[P]> {
  if (typeof obj[key] !== type) {
    throw TypeError(
      `Expected obj key ${
        obj[key]
      } to have type: ${type} but it actually was ${typeof obj[key]}`
    );
  }
}

// TODO(https://github.com/Victor-Bernabe/lit-toast/issues/2):
// Remove this if the component supports types directly.
interface LitToast {
  show(text: string, duration: number): Promise<void>;
}
declare global {
  interface HTMLElementTagNameMap {
    'lit-toast': LitToast;
  }
}
