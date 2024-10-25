import {
  HttpStatusCode,
  SessionStoreDataType,
  UserId,
  UserSessionData,
  getUserIdFromSession
} from '@tjsr/user-session-middleware';

import { ExpressServerConfig } from './types/expressConfig.js';
import { ExpressServerHelper } from './expressHelper.js';
import express from 'express';
import session from 'express-session';
import supertest from 'supertest';

const SESSION_ID_HEADER = 'connect.sid';

interface TestAppConfig extends ExpressServerConfig {

}

export interface TestAppSessionData extends UserSessionData {}

export interface TestAppSessionStoreDataType extends SessionStoreDataType {}

export const startApp = (config: Partial<TestAppConfig>): express.Express => {
  const useConfig = config?.sessionOptions?.name ? config :
    {
      ...config,
      sessionOptions: {
        ...config.sessionOptions,
        name: SESSION_ID_HEADER,
      },
    };
  const expressHelper = new ExpressServerHelper(useConfig);

  const app: express.Express = expressHelper.init().app();
  return app;
};

// initialisePassportToExpressApp(app);

describe('API tests for tags', () => {
  let app: express.Express;
  const testSessionId = 's1234';
  const testUserId = 'u1234';

  beforeAll(async () => {
    const memoryStore = new session.MemoryStore();
    memoryStore.set(testSessionId, {
      cookie: new session.Cookie(),
      userId: testUserId,
    } as TestAppSessionData);
    app = startApp({ sessionOptions: { name: SESSION_ID_HEADER, store: memoryStore } });
    return;
  });

  it('GET /user with sessionId', async () => {
    app.get('/user/:id', async (request, response, next) => {
      console.log('Requested user id:', request.params.id);
      const userId: UserId | undefined = await getUserIdFromSession(request.session);
      expect(userId).toEqual('u1234');
      response.status(HttpStatusCode.OK);
      response.contentType('application/json; charset=utf-8');
      response.send({
        userId: userId,
      });
      next();
    });

    const response = await supertest(app).get('/user/123').set(SESSION_ID_HEADER, testSessionId);
    expect(response.status).toBe(200);
    expect(response.header['content-type']).toBe('application/json; charset=utf-8');
    expect(response.body.userId).toBe('u1234');
    return Promise.resolve();
  });
});
