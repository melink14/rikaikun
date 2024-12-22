import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { globSync } from 'glob';
import { defineConfig } from 'vite';
import { DynamicPublicDirectory } from 'vite-multiple-assets';
import replace from 'vite-plugin-filter-replace';

export default defineConfig({
  plugins: [
    // Copies files into output directory.
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
  // Instead, we use DynamicPublicDirectory plugin.
  publicDir: false,
  root: 'extension',
  build: {
    target: 'chrome109', // Same as manifest.json
    assetsDir: '', // Keeps files in root of dist.
    outDir: '../dist',
    emptyOutDir: true,
    minify: false,
    modulePreload: false, // Prevents unneeded polyfill in output.
    rollupOptions: {
      // Set all ts files in extension directory as inputs to prevent them from
      // being bundled.
      input: Object.fromEntries(
        globSync(
          // In test mode, marks all tests as inputs as well.
          // This didn't impact local runs at all but without it rikaicontent hangs
          // on Github. From the output, the reason might be delayed just in time loading
          // of deps.
          process.env.NODE_ENV === 'test'
            ? 'extension/**/*.ts'
            : 'extension/*.ts'
        ).map((file) => [
          // This remove `extension/` as well as the file extension from each
          // file, so e.g. extension/nested/foo.ts becomes nested/foo
          path.relative(
            'extension',
            file.slice(0, file.length - path.extname(file).length)
          ),
          // This expands the relative paths to absolute paths, so e.g.
          // src/nested/foo becomes /project/src/nested/foo.js
          fileURLToPath(new URL(file, import.meta.url)),
        ])
      ),
      output: {
        minifyInternalExports: false, // Preserve readability.
        hoistTransitiveImports: false, // Reduce unneeded imports.
        chunkFileNames: '[name].js', // Don't include hashes.
        manualChunks(id: string) {
          // Chunk dependencies based on top level package name.
          if (id.includes('node_modules')) {
            const parts = id.split('/');

            return 'node_modules/' + parts[parts.indexOf('node_modules') + 1];
          }
          return id;
        },
        virtualDirname: 'virtual', // The default `_virtual` breaks chrome extensions.
        entryFileNames: '[name].js', // Don't include hashes.
      },
    },
  },
});
