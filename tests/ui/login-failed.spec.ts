import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import loginData from '../../test-data/login-data.json';

test('Login Failed - user cannot login with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(loginData.invalidUser.username, loginData.invalidUser.password);
  await loginPage.verifyLoginError();
});
