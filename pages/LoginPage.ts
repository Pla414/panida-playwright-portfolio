import { Page, expect } from '@playwright/test';

export class LoginPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.page.locator('#user-name').fill(username);
    await this.page.locator('#password').fill(password);
    await this.page.locator('#login-button').click();
  }

  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory/);
    await expect(this.page.locator('.title')).toHaveText('Products');
  }

  async verifyLoginError(): Promise<void> {
    await expect(this.page.locator('[data-test="error"]')).toBeVisible();
  }
}
