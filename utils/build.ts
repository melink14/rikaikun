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

for (const i in map.imports) {
  map.imports[i] = map.imports[i].replace('./', './web_modules/');
}
map.imports = Object.assign(map.imports, {
  './configuration.js': './configuration.js',
  './data.js': './data.js',
  './texttospeech.js': './texttospeech.js',
  './rikaichan.js': './rikaichan.js',
});

console.log(map.imports);
const replacements = [];
for (const i in map.imports) {
  replacements.push([i, map.imports[i]]);
}

void importMap.load(map);

await esbuild.build({
  entryPoints: [
    //'extension/{background,options,rikaicontent,docs-html-fallback}.ts',
    'extension/*.ts',
  ],
  bundle: true,
  format: 'esm',
  minify: false,
  sourcemap: false,
  watch: false,
  target: 'chrome80',
  plugins: [globPlugin(), importMap.plugin()],
  outdir: 'dist',
});

void replace.replaceInFile({
  files: 'dist/*.js',
  from: /export.*TestOnly.*;/gs,
  to: '',
});
