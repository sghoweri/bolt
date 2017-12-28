import Drift from 'drift-zoom';
import {
  h,
  render,
  define,
  props,
  withComponent,
  withPreact,
  css,
  spacingSizes
} from '@bolt/core';


/* From Modernizr */
function whichAnimationEvent() {
  let t;
  let el = document.createElement('fakeelement');

  const animations = {
    'animation': 'animationend',
    'OAnimation': 'oAnimationEnd',
    'MozAnimation': 'animationend',
    'WebkitAnimation': 'webkitAnimationEnd'
  }

  for (t in animations) {
    if (el.style[t] !== undefined) {
      return animations[t];
    }
  }
}
const animationEvent = whichAnimationEvent();


class BoltDeviceViewer extends withComponent(withPreact()) {
  static props = {
    // name: props.string,
  }

  renderCallback({ props }) {
    const classes = css(
      'c-bolt-image-magnifier'
    );

    return (
      <div className={classes}>
        <slot />
      </div>
    )
  }

  connectedCallback() {
    var drift = new Drift(this.querySelector('.js-bolt-device-viewer-screen'), {
    // drift.setZoomImageURL(driftZoomImageUrl);
        containInline: false,
        inlinePane: true,
        namespace: 'c-bolt',
        showWhitespaceAtEdges: false,
        sourceAttribute: 'data-zoom',
      });
    }
  }
}

customElements.define('bolt-device-viewer', BoltDeviceViewer);




class BoltDeviceScreen extends withComponent(withPreact()) {
  static props = {
  }


  /**
     * `_screenElem` returns the screen element inside the device viewer
     */
  _screenElem() {
    return this;
  }

  /**
     * `_iconElem` returns the bolt icon element inside the device viewer
     */
  _iconElem() {
    return this.querySelector('bolt-icon');
  }


  _mouseEnter(event) {
    const screenElem = this._screenElem();
    const iconElem = this._iconElem();

    screenElem.classList.add('is-mouse-entering');
    screenElem.classList.remove('is-mouse-leaving');
  }

  _mouseLeave(event) {
    const screenElem = this._screenElem();
    const iconElem = this._iconElem();

    screenElem.classList.remove('is-mouse-entering');
    screenElem.classList.add('is-mouse-leaving');

    animationEvent && iconElem.addEventListener(animationEvent, animationLeaveFunction);

    function animationLeaveFunction(event) {
      setTimeout(function(){
        iconElem.removeEventListener(animationEvent, animationLeaveFunction);
        screenElem.classList.remove('is-mouse-leaving');
      }, 1000);
    }
  }


  renderCallback() {
    return (
      <slot />
    )
  }

  connectedCallback() {
    const driftZoomImageUrl = this.querySelector('img').getAttribute('data-zoom');
    this.setAttribute('data-zoom', driftZoomImageUrl);
    this.addEventListener('mouseenter', this._mouseEnter);
    this.addEventListener('mouseleave', this._mouseLeave);
  }

  /**
     * `disconnectedCallback()` fires when the element is removed from the DOM.
     * It's a good place to do clean up work like releasing references and
     * removing event listeners.
     */
  disconnectedCallback() {
    this.removeEventListener('mouseenter', this._mouseEnter);
    this.removeEventListener('mouseleave', this._mouseLeave);
  }
}

customElements.define('bolt-device-screen', BoltDeviceScreen);
