import { lazyQueue } from '@bolt/lazy-queue';

lazyQueue(['bolt-select'], async () => {
  await import(
    /* webpackChunkName: "docs-site--version-selector" */ './version-selector.js'
  );
});
