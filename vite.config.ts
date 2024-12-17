import { DynamicPublicDirectory } from 'vite-multiple-assets';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { globSync } from 'glob';
import path from 'node:path';
import replace from 'vite-plugin-filter-replace';

console.log(process.env.NODE_ENV);

export default defineConfig({
  plugins: [
    DynamicPublicDirectory([
      '{\x01,data}/**',
      '{\x01,images}/**',
      '{\x01,css}/**',
      'manifest.json',
      '*.html',
    ]),
    process.env.NODE_ENV !== 'test'
      ? replace([
          {
            filter: /.*/,
            replace: {
              // Remove test only exports

              from: /export.*TestOnly.*\n/,
              to: '',
            },
          },
        ])
      : undefined,
  ],
  publicDir: false,
  root: 'extension',
  build: {
    target: 'chrome109',
    assetsDir: '',
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    modulePreload: false,
    rollupOptions: {
      // preserveEntrySignatures: 'exports-only',
      // input: {
      //   background: 'extension/background.ts',
      //   options: 'extension/options.ts',
      //   offscreen: 'extension/offscreen.ts',
      //   rikaicontent: 'extension/rikaicontent.ts',
      //   'docs-annotate-canvas': 'extension/docs-annotate-canvas.ts',
      // },
      input: Object.fromEntries(
        globSync(
          process.env.NODE_ENV === 'test'
            ? 'extension/**/*.ts'
            : 'extension/*.ts'
        ).map((file) => [
          // This remove `extension/` as well as the file extension from each
          // file, so e.g. extension/nested/foo.js becomes nested/foo
          path.relative(
            'extension',
            file.slice(0, file.length - path.extname(file).length)
          ),
          // This expands the relative paths to absolute paths, so e.g.
          // src/nested/foo becomes /project/src/nested/foo.js
          fileURLToPath(new URL(file, import.meta.url)),
        ])
        // .concat([
        //   ['lit/index', 'node_modules/lit/index.js'],
        //   ['lit/directives/until', 'node_modules/lit/directives/until.js'],
        //   ['lit-toast/lit-toast', 'node_modules/lit-toast/lit-toast.js'],
        // ])
      ),
      output: {
        // preserveModules: true,
        // preserveModulesRoot: 'extension',
        minifyInternalExports: false,
        hoistTransitiveImports: false,
        chunkFileNames: '[name].js',
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            const parts = id.split('/');

            return 'node_modules/' + parts[parts.indexOf('node_modules') + 1];
          }
          return id;
        },
        // The default `_virtual` breaks chrome extensions.
        virtualDirname: 'virtual',
        entryFileNames: '[name].js',
        sanitizeFileName: false,
      },
    },
  },
});
