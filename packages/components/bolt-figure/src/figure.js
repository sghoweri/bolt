import { define } from '@bolt/core/utils';
import {
  withLitHtml,
  html,
  render,
} from '@bolt/core/renderers/renderer-lit-html';
import { convertInitialTags } from '@bolt/core/decorators';

import classNames from 'classnames/bind';

import styles from './figure.scss';

let cx = classNames.bind(styles);

@define
@convertInitialTags('figure') // The first matching tag will have its attributes converted to component props
class BoltFigure extends withLitHtml() {
  static is = 'bolt-figure';

  // https://github.com/WebReflection/document-register-element#upgrading-the-constructor-context
  constructor(self) {
    self = super(self);
    return self;
  }

  render() {
    const classes = cx('c-bolt-figure');

    let renderedFigure;

    const slotMarkup = name => {
      switch (name) {
        case 'media':
          const mediaClasses = cx('c-bolt-figure__media');

          return name in this.slots
            ? html`
                <div class="${mediaClasses}">${this.slot(name)}</div>
              `
            : html`
                <slot name="${name}" />
              `;
        default:
          const captionClasses = cx('c-bolt-figure__caption');

          return html`
            <figcaption class="${captionClasses}">
              ${name in this.slots
                ? this.slot('default')
                : html`
                    <slot />
                  `}
            </figcaption>
          `;
      }
    };

    const innerSlots = [slotMarkup('media'), slotMarkup('default')];

    if (this.rootElement) {
      renderedFigure = this.rootElement.firstChild.cloneNode(true);
      renderedFigure.className += ' ' + classes;
      render(this.slot('default'), renderedFigure);
    } else {
      renderedFigure = html`
        <figure class="${classes}">${innerSlots}</figure>
      `;
    }

    return html`
      ${this.addStyles([styles])} ${renderedFigure}
    `;
  }
}

export { BoltFigure };
