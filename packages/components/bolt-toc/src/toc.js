import { customElement, BoltElement, html, unsafeCSS } from '@bolt/element';
import { getUniqueId, IS_DEV } from '@bolt/core-v3.x/utils';
import classNames from 'classnames/bind';
import { withContext } from 'wc-context';
import { getBounds, getCurrentPosition } from './waypoint';
import tocStyles from './toc.scss';
import schema from '../toc.schema';

let cx = classNames.bind(tocStyles);

// @todo: refactor into core-v3
let passiveIfSupported = false;

// https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#Improving_scrolling_performance_with_passive_listeners
try {
  window.addEventListener(
    'test',
    null,
    Object.defineProperty({}, 'passive', {
      // eslint-disable-next-line getter-return
      get() {
        // @ts-ignore
        passiveIfSupported = { passive: true };
      },
    }),
  );
} catch (err) {}

/*
 * 2. role="list": declares that an element is a list.
 * 3. Aria lists reference: https://www.scottohara.me/blog/2018/05/26/aria-lists.html
 */

@customElement('bolt-toc')
class BoltToc extends withContext(BoltElement) {
  static get properties() {
    return {
      header: String,
      uuid: String,
      scrollOffset: {
        attribute: 'scroll-offset',
        type: Number,
      },
      scrollOffsetSelector: {
        attribute: 'scroll-offset-selector',
        type: String,
      },
      sticky: {
        attribute: 'sticky',
        type: Boolean,
      },
    };
  }

  constructor() {
    super();

    this.uuid =
      this.uuid || bolt.config.env === 'test' ? '12345' : getUniqueId();

    // These are fixed for now, make into props if necessary
    this.boundaryTop = 0;
    this.boundaryBottom = '75%';
  }

  static get styles() {
    return [unsafeCSS(tocStyles)];
  }

  // Set to `true` to display waypoint boundary on screen
  static debug = false;

  static get providedContexts() {
    return {
      activeItem: { value: null },
      scrollOffsetSelector: { value: null },
      scrollOffset: { value: null },
    };
  }

  /* [1] */
  connectedCallback() {
    super.connectedCallback && super.connectedCallback();

    this.addEventListener('toc:activate', this.onActivate);

    this.updateWaypoints = this.updateWaypoints.bind(this);
    window.addEventListener('scroll', this.updateWaypoints, passiveIfSupported);
    window.addEventListener('resize', this.updateWaypoints, passiveIfSupported);

    // Listen for smooth-scroll events
    this.logScrollEvent = this.logScrollEvent.bind(this);
    document.addEventListener('scrollStart', this.logScrollEvent, false);
    document.addEventListener('scrollStop', this.logScrollEvent, false);
    document.addEventListener('scrollCancel', this.logScrollEvent, false);

    // Dislay waypoint boundaries on screen if debug is `true` (only ever IN_DEV!)
    if (IS_DEV && BoltToc.debug && !BoltToc.debuggerAdded) {
      this.addWaypointDebugger();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback && super.disconnectedCallback();

    this.removeEventListener('toc:activate', this.onActivate);

    window.removeEventListener(
      'scroll',
      this.updateWaypoints,
      passiveIfSupported,
    );
    window.removeEventListener(
      'resize',
      this.updateWaypoints,
      passiveIfSupported,
    );

    document.removeEventListener('scrollStart', this.logScrollEvent, false);
    document.removeEventListener('scrollStop', this.logScrollEvent, false);
    document.removeEventListener('scrollCancel', this.logScrollEvent, false);
  }

  addWaypointDebugger() {
    const marker = document.createElement('div');
    marker.setAttribute(
      'style',
      `position: fixed; bottom: ${this.boundaryBottom}; top: ${this.boundaryTop}; width: 100%; border: 1px solid red; opacity: 0.5; pointer-events: none;`,
    );
    document.body.appendChild(marker);
    BoltToc.debuggerAdded = true;
  }

  get items() {
    return this.querySelectorAll('bolt-toc-item');
  }

  get itemData() {
    let triggers = [];
    let targets = [];

    this.items.forEach(item => {
      if (item.target) {
        triggers.push(item);
        targets.push(item.target);
      }
    });
    return {
      triggers,
      targets,
    };
  }

  // Smooth scroll events triggered by clicking menu items
  logScrollEvent(event) {
    if (event.type === 'scrollStart') {
      this.scrolling = true;
    } else if (event.type === 'scrollStop' || event.type === 'scrollCancel') {
      // Wait before unsetting the scrolling flag as waypoint events may fire
      // at same time as `scrollStop` event, avoids race condition
      setTimeout(() => {
        this.scrolling = false;
      }, 100);
    }
  }

  onActivate(event) {
    if (event?.detail?.activeItem) {
      this.activeItem = event.detail.activeItem;
      this.updateContext();
    }
  }

  updateContext() {
    this.updateProvidedContext('activeItem', this.activeItem);
    this.updateProvidedContext('scrollOffset', this.scrollOffset);
    this.updateProvidedContext(
      'scrollOffsetSelector',
      this.scrollOffsetSelector,
    );
  }

  updateWaypoints() {
    const update = target => {
      if (!target || this.scrolling) return;

      const trigger = this.getMatchingItem(target);
      const bounds = getBounds(
        target,
        window,
        this.boundaryTop,
        this.boundaryBottom,
      );
      const currentPosition = getCurrentPosition(bounds);

      // store data on `trigger` not `target`, `trigger` is a Bolt component and `target` could be anything
      const previousPosition = trigger._previousPosition;

      // Save previous position as early as possible to prevent cycles
      trigger._previousPosition = currentPosition;

      // We could return here if we were listening on each item rather than iterating over an array of items.
      // The latter, while reducing scroll jank, can cause a race condition when scrolling rapidly where the
      // `activeItem` is not properly set. So, let the code below always execute to avoid that race condition.
      // if (previousPosition === currentPosition) return;

      const callbackArg = {
        target,
        currentPosition,
        previousPosition,
        waypointTop: bounds.waypointTop,
        waypointBottom: bounds.waypointBottom,
        viewportTop: bounds.viewportTop,
        viewportBottom: bounds.viewportBottom,
      };

      this.onPositionChange(callbackArg);

      if (currentPosition === 'inside') {
        this.onEnter(callbackArg);
      } else if (previousPosition === 'inside') {
        this.onLeave(callbackArg);
      }
    };

    this.waypointData?.targets.forEach(target => {
      update(target);
    });
  }

  getMatchingItem(target, shift = 0) {
    const index = this.waypointData.targets.indexOf(target) + shift;

    if (index !== -1) {
      return this.waypointData.triggers[index];
    }
  }

  onEnter({ target }) {
    // Fires when waypoint enters the boundary
    const item = this.getMatchingItem(target);

    if (item && item !== this.activeItem) {
      this.activeItem = item;
      this.updateContext();
    }
  }

  onLeave({ target, currentPosition, previousPosition }) {
    // Fires when waypoint leaves the boundary
  }

  onPositionChange({ target, currentPosition, previousPosition }) {
    if (this.sticky) {
      // auto-adjust a sticky parent's offset automatically
      this.scrollElem =
        this.scrollElem ||
        (this.scrollOffsetSelector &&
          document.querySelector(this.scrollOffsetSelector));
      if (this.scrollElem) {
        if (this.scrollElem.offsetHeight) {
          this.style.top = `${this.scrollElem.offsetHeight +
            (this.scrollOffset || 0)}px`;
        }
      }
    }

    // If `activeItem` is undefined (could be first load), use the first item
    // with position 'below' to get the previous item, which is assumed to be
    // the most visible section
    if (!this.activeItem) {
      if (currentPosition === 'below') {
        let item = this.getMatchingItem(target, -1);
        if (item) {
          this.activeItem = item;
          this.updateContext();
        }
      }
    }
  }

  firstUpdated() {
    // @todo: add mutation observer if we want this to update when items added or removed
    this.waypointData = this.itemData;
    this.updateWaypoints();

    // Returns first active item or undefined
    this.activeItem = Array.from(this.items).find(item => item.active);
    this.updateContext();
  }

  render() {
    return html`
      <nav
        class="${cx(`c-bolt-toc`)}"
        aria-labelledby="js-bolt-toc-${this.uuid}"
      >
        <h2
          class="${cx(`c-bolt-toc__header`, {
            [`c-bolt-toc__header--hidden`]: !this.header,
          })}"
          id="js-bolt-toc-${this.uuid}"
        >
          ${this.header ? this.header : 'Table of Contents'}
        </h2>
        <div class="${cx(`c-bolt-toc__list`)}" role="list">
          ${this.slotify('default')}
        </div>
      </nav>
    `;
  }
}

export { BoltToc };
