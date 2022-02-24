/** @type {import('@stryker-mutator/api/core').StrykerOptions} */
module.exports = {
  testRunner: 'command',
  mutate: ['extension/*.ts'],
  checkers: ['typescript'],
  tsconfigFile: 'tsconfig.json',
  packageManager: 'npm',
  reporters: ['html', 'clear-text', 'progress'],
};
