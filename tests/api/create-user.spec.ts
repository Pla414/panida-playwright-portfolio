import { test, expect } from '@playwright/test';
import userData from '../../test-data/users.json';

test('CREATE User API - should create user successfully', async ({ request }) => {
  const response = await request.post('https://jsonplaceholder.typicode.com/users', {
    data: userData.newUser
  });

  expect(response.status()).toBe(201);

  const body = await response.json();

  expect(body.name).toBe(userData.newUser.name);
  expect(body.job).toBe(userData.newUser.job);
  expect(body.id).toBeTruthy();
});