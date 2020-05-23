/* eslint-disable no-await-in-loop */
import {
  render,
  stopServer,
  renderWC,
  html,
  vrtDefaultConfig as vrtConfig,
} from '../../../testing/testing-helpers';

const { readYamlFileSync } = require('@bolt/build-tools/utils/yaml');
const { join } = require('path');
const schema = readYamlFileSync(join(__dirname, '../modal.schema.yml'));
const { width, spacing, theme, scroll } = schema.properties;

const vrtDefaultConfig = Object.assign(vrtConfig, {
  failureThreshold: '0.02',
  customDiffConfig: {
    includeAA: true,
  },
  allowSizeMismatch: true,
});

const timeout = 120000;

// Currently, the only important breakpoints to test are 'small' and 'large'
const viewportSizes = [
  {
    size: 'large',
    width: 1024,
    height: 768,
  },
  {
    size: 'small',
    width: 320,
    height: 568,
  },
];

const modalContent = [
  {
    name: 'Simple usage',
    content: `<bolt-text>Default slot.</bolt-text>`,
  },
  {
    name: 'Long content usage',
    content: `
      <bolt-text subheadline font-size="xlarge">This is very long content.</bolt-text>
      <bolt-image src="/fixtures/1200x2500.jpg" alt="Placeholder"></bolt-image>
    `,
  },
];

describe('<bolt-modal> Component', () => {
  let page;

  beforeEach(async () => {
    await page.evaluate(() => {
      document.body.innerHTML = '';
    });
  }, timeout);

  beforeAll(async () => {
    page = await global.__BROWSER__.newPage();
    await page.goto('http://127.0.0.1:4444/', {
      timeout: 0,
    });
  }, timeout);

  afterAll(async () => {
    await stopServer();
    await page.close();
  }, timeout);

  test('basic usage', async () => {
    const results = await render('@bolt-components-modal/modal.twig', {
      content: 'This is a modal',
    });
    expect(results.ok).toBe(true);
    expect(results.html).toMatchSnapshot();
  });

  width.enum.forEach(async widthChoice => {
    test(`modal width: ${widthChoice}`, async () => {
      const results = await render('@bolt-components-modal/modal.twig', {
        width: widthChoice,
        content: 'This is a modal',
      });
      expect(results.ok).toBe(true);
      expect(results.html).toMatchSnapshot();
    });
  });

  spacing.enum.forEach(async spacingChoice => {
    test(`modal spacing: ${spacingChoice}`, async () => {
      const results = await render('@bolt-components-modal/modal.twig', {
        spacing: spacingChoice,
        content: 'This is a modal',
      });
      expect(results.ok).toBe(true);
      expect(results.html).toMatchSnapshot();
    });
  });

  theme.enum.forEach(async themeChoice => {
    test(`modal theme: ${themeChoice}`, async () => {
      const results = await render('@bolt-components-modal/modal.twig', {
        theme: themeChoice,
        content: 'This is a modal',
      });
      expect(results.ok).toBe(true);
      expect(results.html).toMatchSnapshot();
    });
  });

  scroll.enum.forEach(async scrollChoice => {
    test(`modal scroll: ${scrollChoice}`, async () => {
      const results = await render('@bolt-components-modal/modal.twig', {
        scroll: scrollChoice,
        content: 'This is a modal',
      });
      expect(results.ok).toBe(true);
      expect(results.html).toMatchSnapshot();
    });
  });

  test(
    `<bolt-modal> slots`,
    async () => {
      const { html, ok } = await render('@bolt-components-modal/modal.twig', {
        content: `<bolt-text slot="header">Header slot</bolt-text>Default slot<bolt-text slot="footer">Footer slot</bolt-text>`,
        width: 'regular',
      });
      expect(ok).toBe(true);
      expect(html).toMatchSnapshot();

      await renderWC('bolt-modal', html, page);

      const screenshots = [];

      for (const item of viewportSizes) {
        const { height, width, size } = item;

        screenshots[size] = [];

        await page.setViewport({ height, width });
        await page.evaluate(async () => {
          const modals = Array.from(document.querySelectorAll('bolt-modal'));
          await customElements.whenDefined('bolt-modal');
          return await Promise.all(
            modals.map(elem => {
              if (elem._wasInitiallyRendered) return;
              return new Promise((resolve, reject) => {
                elem.addEventListener('ready', resolve);
                elem.addEventListener('error', reject);
              });
            }),
          ).then(() => {
            modals[0].show();
          });
        });
        await page.waitFor(500);

        screenshots[size].modalOpened = await page.screenshot();
        expect(screenshots[size].modalOpened).toMatchImageSnapshot(
          vrtDefaultConfig,
        );

        await page.evaluate(() => {
          document.querySelector('bolt-modal').hide();
        });
        await page.waitFor(500);
      }
    },
    timeout,
  );

  modalContent.forEach(async contentChoice => {
    test(`${contentChoice.name} <bolt-modal> with Shadow DOM renders`, async () => {
      const { outerHTML } = await renderWC(
        'bolt-modal',
        `
        <bolt-modal uuid="12345" width="regular">
          <bolt-text slot="header">Header slot</bolt-text>
          ${contentChoice.content}
          <bolt-text slot="footer">Footer slot</bolt-text>
        </bolt-modal>
      `,
        page,
      );

      const screenshots = [];
      for (const item of viewportSizes) {
        const { height, width, size } = item;
        screenshots[size] = [];

        await page.setViewport({ height, width });

        await page.evaluate(() => {
          document.querySelector('bolt-modal').show();
        });
        await page.waitFor(500);
        screenshots[size].modalOpened = await page.screenshot();

        expect(screenshots[size].modalOpened).toMatchImageSnapshot(
          vrtDefaultConfig,
        );
        await page.evaluate(() => {
          document.querySelector('bolt-modal').hide();
        });

        await page.waitFor(500);
      }

      const renderedHTML = await html(outerHTML);
      expect(renderedHTML).toMatchSnapshot();
    });
  });

  modalContent.forEach(async contentChoice => {
    test(`${contentChoice.name} <bolt-modal> w/o Shadow DOM renders`, async () => {
      const { outerHTML } = await renderWC(
        'bolt-modal',
        `
        <bolt-modal uuid="12345" width="regular" no-shadow>
          <bolt-text slot="header">Header slot</bolt-text>
          ${contentChoice.content}
          <bolt-text slot="footer">Footer slot</bolt-text>
        </bolt-modal>
      `,
        page,
      );

      const screenshots = [];

      for (const item of viewportSizes) {
        const { height, width, size } = item;

        screenshots[size] = [];

        await page.setViewport({ height, width });
        await page.evaluate(() => {
          document.querySelector('bolt-modal').show();
        });
        await page.waitFor(500);

        screenshots[size].modalOpened = await page.screenshot();
        expect(screenshots[size].modalOpened).toMatchImageSnapshot(
          vrtDefaultConfig,
        );

        await page.evaluate(() => {
          document.querySelector('bolt-modal').hide();
        });
        await page.waitFor(500);
      }

      const renderedHTML = await html(outerHTML);
      expect(renderedHTML).toMatchSnapshot();
    });
  });

  modalContent.forEach(async contentChoice => {
    test(
      `${contentChoice.name} <bolt-modal> at various viewport sizes`,
      async () => {
        const { html, ok } = await render('@bolt-components-modal/modal.twig', {
          content: `<bolt-text slot="header">Header slot</bolt-text>
            ${contentChoice.content}
            <bolt-text slot="footer">Footer slot</bolt-text>`,
          width: 'regular',
        });
        expect(ok).toBe(true);
        expect(html).toMatchSnapshot();

        await renderWC('bolt-modal', html, page);

        const screenshots = [];

        for (const item of viewportSizes) {
          const { height, width, size } = item;

          screenshots[size] = [];

          await page.setViewport({ height, width });
          await page.evaluate(() => {
            document.querySelector('bolt-modal').show();
          });
          await page.waitFor(500);

          screenshots[size].modalOpened = await page.screenshot();
          expect(screenshots[size].modalOpened).toMatchImageSnapshot(
            vrtDefaultConfig,
          );

          await page.evaluate(() => {
            document.querySelector('bolt-modal').hide();
          });
          await page.waitFor(500);
        }
      },
      timeout,
    );
  });

  modalContent.forEach(async contentChoice => {
    test(
      `${contentChoice.name}<bolt-modal> with band at various viewport sizes`,
      async () => {
        const renderedBand = await render('@bolt-components-band/band.twig', {
          content: contentChoice.content,
          full_bleed: false,
          theme: 'none',
        });

        const { html, ok } = await render('@bolt-components-modal/modal.twig', {
          content: `<bolt-text slot="header">Header slot</bolt-text>
            ${renderedBand.html}
            <bolt-text slot="footer">Footer slot</bolt-text>`,
          width: 'regular',
        });
        expect(ok).toBe(true);
        expect(html).toMatchSnapshot();

        await renderWC('bolt-modal', html, page);

        const screenshots = [];

        for (const item of viewportSizes) {
          const { height, width, size } = item;
          screenshots[size] = [];

          await page.setViewport({ height, width });
          await page.evaluate(() => {
            document.querySelector('bolt-modal').show();
          });
          await page.waitFor(500);

          screenshots[size].modalOpened = await page.screenshot();
          expect(screenshots[size].modalOpened).toMatchImageSnapshot(
            vrtDefaultConfig,
          );

          await page.evaluate(() => {
            document.querySelector('bolt-modal').hide();
          });
          await page.waitFor(500);
        }
      },
      timeout,
    );
  });
});
