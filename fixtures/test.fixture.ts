import { test as base } from '@playwright/test';

type TestFixtures = {
  testUser: {
    username: string;
    password: string;
  };
};

export const test = base.extend<TestFixtures>({
  testUser: async ({}, use) => {
    await use({
      username: process.env.USERNAME || 'standard_user',
      password: process.env.PASSWORD || 'secret_sauce'
    });
  }
});

export { expect } from '@playwright/test';
