import * as importMap from 'esbuild-plugin-import-map';
import { globPlugin } from 'esbuild-plugin-glob';
import esbuild from 'esbuild';
import fs from 'fs';
import replace from 'replace-in-file';

const map = JSON.parse(
  fs.readFileSync('./dist/web_modules/import-map.json', {
    encoding: 'utf8',
    flag: 'r',
  })
) as importMap.ImportMap;

// esinstall will place files in web_modules so we must update the import map.
for (const i in map.imports) {
  map.imports[i] = map.imports[i].replace('./', './web_modules/');
}
// Adding these rikaikun modules to the import map prevents them from being
// bundled. (Add a test to make sure new modules are added?)
// Content scripts aren't modules and aren't included.
map.imports = Object.assign(map.imports, {
  './configuration.js': './configuration.js',
  './data.js': './data.js',
  './texttospeech.js': './texttospeech.js',
  './rikaichan.js': './rikaichan.js',
});

void importMap.load(map);

await esbuild.build({
  entryPoints: [
    // This syntax is enabled via `globPlugin`
    'extension/*.ts',
  ],
  // bundle must be true for plugins like importMap to work.
  // We don't want bundling so we use the workaround above.
  bundle: true,
  format: 'esm',
  minify: false,
  sourcemap: false,
  watch: false,
  target: 'chrome80',
  plugins: [globPlugin(), importMap.plugin()],
  outdir: 'dist',
});

// Replace test only exports when building.
void replace.replaceInFile({
  files: 'dist/*.js',
  from: /export.*TestOnly.*;/gs,
  to: '',
});
