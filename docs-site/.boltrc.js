const path = require('path');
const resolve = require('resolve');
const argv = require('yargs').argv;
const deepmerge = require('deepmerge');
const baseConfig = require('@bolt/starter-kit/.boltrc.js');

const config = deepmerge(baseConfig, {
  // array of languages to compile the design system. note, these are ignored when the --i18n flag is set to false
  // Note: if lang is defined, the first item is currently the one used by default in the Pattern Lab build, pending further iterations on this!
  // lang: ['en', 'ja'],

  renderingService: false, // starts PHP service for rendering Twig templates
  openServerAtStart: true,
  // Environmental variable / preset to use
  env: 'pwa',
  compat: false,
  esModules: true,
  srcDir: './src/pages',
  buildDir: '../www/build',
  dataDir: '../www/build/data',
  iconDir: [],
  wwwDir: '../www',
  startPath: '/',
  plConfigFile: './config/config.yml',
  verbosity: 2,
  schemaErrorReporting: 'cli',
  webpackDevServer: {
    enabled: true,
  },
  sourceMaps: !(process.env.TRAVIS || argv.prod),
  enableCache: !(process.env.TRAVIS || argv.prod),
  enableSSR: false, // temp disabled till Travis issue fixed
  extraTwigNamespaces: {
    bolt: {
      recursive: true,
      paths: ['src/templates', '../packages/components'],
    },
    'bolt-blueprints': {
      recursive: true,
      paths: ['./src/pages/pattern-lab/_patterns/03-blueprints'],
    },
    pl: {
      recursive: true,
      paths: [
        './src/pages/pattern-lab',
        /* Example of including additional component paths to include in the main @bolt namespace */
        // path.relative(process.cwd(), path.dirname(require.resolve('@bolt/components-sticky/package.json'))),
      ],
    },
    utils: {
      recursive: true,
      paths: ['./src/components/pattern-lab-utils'],
    },
    'bolt-site': {
      recursive: true,
      paths: ['src/templates', 'src/components'],
    },
  },
  images: {
    sets: [
      {
        base: './src/assets/images',
        glob: '**',
        dist: '../www/images',
      },
      {
        base:
          './src/pages/pattern-lab/_patterns/03-blueprints/00-assets/images',
        glob: '**',
        dist: '../www/images',
      },
    ],
  },

  // Currently only supports a 'scss' key with an array of Sass partials to pull in.
  globalData: {
    scss: [
      // './src/test-overrides.scss' // example of including an additional Sass partial to set / redefine additional default values, globally.
    ],
    js: [
      // './src/global-data.js', // example of including a JS files with a default export to globally include extra data to all Bolt JS components
    ],
  },

  components: {
    global: [
      /* IMPORTANT: Do NOT list components here that are intended to be used
       * outside of the docs site-- those should instead be pulled in through
       * baseConfig.  Use this only for internal components.
       */
      // helper components that are only used internally
      '@bolt/components-page-footer',
      '@bolt/components-page-header',
      '@bolt/docs-search',
      '@bolt/shadow-toggle',
      '@bolt/components-search-filter',
      '@bolt/micro-journeys',
      resolve.sync('./src/index.scss'),
      resolve.sync('./src/index.js'),
    ],
  },
  copy: [
    {
      from: path.join(
        path.dirname(require.resolve(`@bolt/components-typeahead`)),
        '__demos__/typeahead.data.json',
      ),
      to: path.join(__dirname, '../www/build/data'),
    },
    {
      from: `src/assets/bolt-sketch.zip`,
      to: path.join(__dirname, '../www/assets'),
      flatten: true,
    },
    {
      from: `src/assets/videos`,
      to: path.join(__dirname, '../www/videos'),
      flatten: true,
    },
    {
      from: `${path.dirname(
        resolve.sync('@bolt/global/package.json'),
      )}/favicons/bolt`,
      to: path.join(__dirname, '../www/'),
      flatten: true,
    },
  ],
  alterTwigEnv: [
    {
      file: `${path.dirname(
        resolve.sync('@bolt/twig-renderer/package.json'),
      )}/SetupTwigRenderer.php`,
      functions: ['addBoltCoreExtensions', 'addBoltExtraExtensions'],
    },
  ],
});

module.exports = config;
