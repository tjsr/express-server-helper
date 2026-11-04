const assert = require('node:assert/strict');
const { createRequire } = require('node:module');

// TypeScript 7 builds the project; lint still needs the JavaScript compiler API.
const sharedRequire = createRequire(require.resolve('@tjsr/eslint-config'));
const parserRequire = createRequire(sharedRequire.resolve('@typescript-eslint/parser'));
const estreeRequire = createRequire(parserRequire.resolve('@typescript-eslint/typescript-estree'));
const apiRequire = createRequire(estreeRequire.resolve('ts-api-utils'));
const buildVersion = require('typescript/package.json').version;
const lintVersion = sharedRequire('typescript').version;

assert.match(buildVersion, /^7\./, 'Builds must use the requested TypeScript 7');
assert.match(lintVersion, /^6\.0\./, 'Lint must use its supported JavaScript compiler API');
for (const lintRequire of [parserRequire, estreeRequire, apiRequire]) {
  assert.equal(lintRequire.resolve('typescript'), sharedRequire.resolve('typescript'),
    'All lint packages must resolve the same supported compiler');
}
assert.notEqual(require.resolve('typescript'), sharedRequire.resolve('typescript'));
console.log(`Project TypeScript: ${buildVersion}; lint TypeScript: ${lintVersion}`);
