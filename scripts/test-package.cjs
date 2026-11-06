const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

function firstNpmRecord(value) {
  return Array.isArray(value) ? value[0] : value.filename ? value : Object.values(value)[0];
}

const root = path.resolve(__dirname, '..');
const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'express-helper-package-test-'));
const run = (command, args) => execFileSync(command, args, { cwd: directory, stdio: 'pipe' });
try {
  const npm = process.env.npm_execpath || fs.realpathSync(execFileSync('which', ['npm'], { encoding: 'utf8' }).trim());
  assert.ok(npm, 'Run this check with npm run test:package');
  fs.writeFileSync(path.join(directory, '.npmrc'), 'registry=https://registry.npmjs.org\n@tjsr:registry=https://npm.pkg.github.com\n');
  const packed = JSON.parse(run(process.execPath, [npm, 'pack', process.env.PACKAGE_TEST_SPEC || root, '--ignore-scripts', '--dry-run=false', '--json']));
  const packageDirectory = path.join(directory, 'node_modules/@tjsr/express-server-helper');
  fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({
    name: 'express-helper-production-consumer', private: true,
    dependencies: { '@tjsr/express-server-helper': 'file:' + path.resolve(directory, firstNpmRecord(packed).filename) },
  }));
  // Install only the real published dependency closure, with no package hooks.
  run(process.execPath, [npm, 'install', '--dry-run=false', '--omit=dev', '--ignore-scripts', '--strict-peer-deps',
    '--no-package-lock', '--no-audit', '--no-fund']);
  for (const developmentOnly of ['vitest', 'typescript', 'eslint']) {
    assert.ok(!fs.existsSync(path.join(directory, 'node_modules', developmentOnly)),
      `Consumer must not inherit development-only ${developmentOnly}`);
  }
  const manifest = JSON.parse(fs.readFileSync(path.join(packageDirectory, 'package.json'), 'utf8'));
  assert.equal(manifest.name, require('../package.json').name);
  assert.equal(manifest.version, require('../package.json').version);
  for (const condition of ['import', 'require']) {
    for (const field of ['types', 'default']) {
      assert.ok(fs.existsSync(path.join(packageDirectory, manifest.exports['.'][condition][field])), `${condition}.${field} is missing from the packed distribution`);
    }
  }
  const fixture = `import { ExpressServerHelper, type ExpressServerConfig } from '@tjsr/express-server-helper';
const config: Partial<ExpressServerConfig> = {
  json: true,
  sessionOptions: { secret: Buffer.from('consumer-key'), cookie: request => ({ path: request.path }) },
};
const helper: ExpressServerHelper = new ExpressServerHelper(config);
// @ts-expect-error The public config must retain the boolean JSON option type.
new ExpressServerHelper({ json: 'yes' });
export { helper };
`;
  for (const extension of ['mts', 'cts']) {
    fs.writeFileSync(path.join(directory, `consumer.${extension}`), fixture);
    run(process.execPath, [path.join(root, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noEmit', '--strict', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--target', 'ES2022', '--lib', 'ES2022', '--types', 'node', `consumer.${extension}`]);
  }
  const assertion = `if (typeof utils.ExpressServerHelper !== 'function' || typeof utils.ExpressServerHelper.prototype.app !== 'function') throw new Error('Missing runtime export');`;
  const httpCheck = `
(async () => {
  const helper = new utils.ExpressServerHelper({
    morgan: false,
    sessionOptions: {
      name: 'usm.sid', resave: false, saveUninitialized: false,
      secret: Buffer.from('packed-helper-session-key-for-http-test'),
      cookie: request => ({ httpOnly: true, path: request.path, secure: false, sameSite: 'lax' }),
      store: new session.MemoryStore(),
      userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    },
  });
  const app = helper.app();
  app.get('/counter', (request, response) => {
    request.session.email = String(Number(request.session.email || '0') + 1);
    response.json({ id: request.sessionID, visits: Number(request.session.email) });
  });
  const server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  try {
    const origin = 'http://127.0.0.1:' + server.address().port;
    const initial = await fetch(origin + '/counter');
    assert.equal(initial.status, 200);
    const first = await initial.json();
    assert.equal(first.visits, 1);
    const cookie = initial.headers.get('set-cookie');
    assert.ok(cookie?.includes('Path=/counter'));
    assert.ok(cookie?.includes('HttpOnly'));
    const reused = await fetch(origin + '/counter', { headers: { cookie: cookie.split(';')[0] } });
    assert.equal(reused.status, 200);
    assert.deepEqual(await reused.json(), { id: first.id, visits: 2 });
    for (const options of [undefined, { method: 'POST', body: 'email=fixture@example.com', headers: { 'content-type': 'text/plain' } }]) {
      const response = await fetch(origin + '/login', options);
      assert.equal(response.status, 400);
      assert.equal(response.headers.get('content-type')?.split(';')[0], 'application/json');
      assert.equal(typeof (await response.json()).message, 'string');
    }
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
`;
  fs.writeFileSync(path.join(directory, 'runtime.mjs'), `import assert from 'node:assert/strict';\nimport session from 'express-session';\nimport * as utils from '@tjsr/express-server-helper';\n${assertion}\n${httpCheck}`);
  fs.writeFileSync(path.join(directory, 'runtime.cjs'), `const assert = require('node:assert/strict');\nconst session = require('express-session');\nconst utils = require('@tjsr/express-server-helper');\n${assertion}\n${httpCheck}`);
  run(process.execPath, ['runtime.mjs']);
  run(process.execPath, ['runtime.cjs']);
  console.log('Production-only packed ESM/CommonJS declarations, runtime, cookie reuse and HTTP error responses passed.');
} catch (error) {
  if (error.stdout) process.stderr.write(error.stdout);
  if (error.stderr) process.stderr.write(error.stderr);
  throw error;
} finally {
  fs.rmSync(directory, { recursive: true, force: true });
}
