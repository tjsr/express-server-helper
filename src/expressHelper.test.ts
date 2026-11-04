import { once } from 'node:events';
import { Server } from 'node:http';

import { ExpressServerHelper } from './expressHelper.ts';

let server: Server | undefined;

afterEach(async () => {
  if (server) {
    await new Promise<void>((resolve, reject) => server!.close((error) => (error ? reject(error) : resolve())));
    server = undefined;
  }
});

test('serves requests and validates unparsed login bodies through Express 5', async () => {
  const helper = new ExpressServerHelper({
    morgan: false,
    sessionOptions: {
      resave: false,
      saveUninitialized: false,
      secret: 'express-helper-test-only-secret',
      userIdNamespace: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    },
  });
  const app = helper.app();
  app.get('/health', (_request, response) => response.json({ ok: true }));
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Expected a TCP listener');
  const origin = `http://127.0.0.1:${address.port}`;

  const health = await fetch(`${origin}/health`);
  expect(health.status).toBe(200);
  expect(await health.json()).toEqual({ ok: true });

  for (const options of [
    undefined,
    { body: 'email=test@example.com', headers: { 'content-type': 'text/plain' }, method: 'POST' },
  ]) {
    const login = await fetch(`${origin}/login`, options);
    expect(login.status).toBe(400);
    expect(login.headers.get('content-type')).toMatch(/application\/json/);
    expect(await login.json()).toEqual({ message: expect.any(String) });
  }
});
