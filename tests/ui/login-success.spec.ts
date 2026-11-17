import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import loginData from '../../test-data/login-data.json';

test('Login Success - user can login with valid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.goto();
  await loginPage.login(loginData.validUser.username, loginData.validUser.password);
  await loginPage.verifyLoginSuccess();
});
