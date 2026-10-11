export default {
  // TODO(espeed): Consider reverting bracket spacing to gts default of none.
  bracketSpacing: true,
  singleQuote: true,
  trailingComma: 'es5',
  arrowParens: 'always',
  // Keep each file's existing line endings so Windows (CRLF) and Unix (LF)
  // checkouts both pass. Git normalizes to LF on commit.
  endOfLine: 'auto',
  plugins: ['./node_modules/prettier-plugin-jsdoc/dist/index.js'],
};
