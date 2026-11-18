/**
 * LoginPage.ts — page object for the SauceDemo login screen (/).
 */
import { expect, type Locator, type Page } from "@playwright/test";

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(readonly page: Page) {
    this.usernameInput = page.locator("#user-name");
    this.passwordInput = page.locator("#password");
    this.loginButton = page.locator("#login-button");
    this.errorMessage = page.locator('[data-test="error"]');
  }

  /** Open the login page. */
  async goto(): Promise<void> {
    await this.page.goto("/");
  }

  /** Fill username / password and submit. */
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  /** Assert the user landed on the Products (inventory) page. */
  async verifyLoginSuccess(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory/);
    await expect(this.page.locator(".title")).toHaveText("Products");
  }

  /** Assert the login error banner shows the given message and the user stays on the login page. */
  async verifyLoginError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
    await expect(this.loginButton).toBeVisible();
  }
}
