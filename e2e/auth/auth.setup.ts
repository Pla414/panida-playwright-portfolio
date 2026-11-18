/**
 * auth.setup.ts — logs in once per role and saves the session to .auth/<Role>.json.
 * Runs as the "setup" project before every other project (see playwright.config.ts).
 */
import { test as setup } from "@playwright/test";
import { SESSION_ROLES, credentialsFor, storageStateFor } from "./roles";
import { LoginPage } from "../page/LoginPage";

for (const role of SESSION_ROLES) {
  // Log in as the role and store its cookies / local storage
  setup(`authenticate ${role}`, async ({ page }) => {
    const loginPage = new LoginPage(page);
    const { username, password } = credentialsFor(role);

    await setup.step("Open login page and sign in", async () => {
      await loginPage.goto();
      await loginPage.login(username, password);
    });

    await setup.step("Verify login and save session", async () => {
      await loginPage.verifyLoginSuccess();
      await page.context().storageState({ path: storageStateFor(role) });
    });
  });
}
