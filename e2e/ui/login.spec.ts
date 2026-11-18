/**
 * login.spec.ts — SauceDemo authentication (LG01–LG07).
 *   LG01       valid login
 *   LG02       locked-out account
 *   LG03–LG05  invalid credentials (data-driven from login.json)
 *   LG06       protected page without a session
 *   LG07       logout ends the session
 * Starts without a saved session so the login form is always shown.
 */
import { test, expect } from "../helpers/test";
import { AS_GUEST, credentialsFor, ROLES } from "../auth/roles";
import { InventoryPage } from "../page/InventoryPage";
import { LoginPage } from "../page/LoginPage";
import data from "../test-data/login.json";

test.use(AS_GUEST);

let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  await loginPage.goto();
});

test.describe("Login", () => {
  // LG01
  // EN: A valid user logs in and lands on the Products page
  test("LG01 Login succeeds with valid credentials", async ({ step }) => {
    const { username, password } = credentialsFor(ROLES.StandardUser);

    await step("Submit valid username and password", async () => {
      await loginPage.login(username, password);
    });

    await step("Verify Products page is shown", async () => {
      await loginPage.verifyLoginSuccess();
    });
  });

  // LG02
  // EN: A locked-out account is refused even with the right password
  test("LG02 Locked-out user cannot log in", async ({ step }) => {
    const { username, password } = credentialsFor(ROLES.LockedOutUser);

    await step("Submit locked-out account", async () => {
      await loginPage.login(username, password);
    });

    await step("Verify locked-out error", async () => {
      await loginPage.verifyLoginError(data.lockedOutError);
    });
  });

  // LG03–LG05
  // EN: Wrong or missing credentials show the matching error and keep the user on the login page
  for (const c of data.invalidCredentials) {
    test(`${c.tsn} Login fails: ${c.title}`, async ({ step }) => {
      await step(`Submit username="${c.username}" password="${c.password}"`, async () => {
        await loginPage.login(c.username, c.password);
      });

      await step("Verify error message", async () => {
        await loginPage.verifyLoginError(c.error);
      });
    });
  }
});

test.describe("Session", () => {
  // LG06
  // EN: Opening a protected page without logging in redirects to login with an error
  test("LG06 Protected page requires login", async ({ page, step }) => {
    await step(`Open ${data.guardedPage.path} without a session`, async () => {
      await page.goto(data.guardedPage.path);
    });

    await step("Verify redirect to login with access error", async () => {
      await loginPage.verifyLoginError(data.guardedPage.error);
    });
  });

  // LG07
  // EN: After logout the user is back on the login page and cannot reach products again
  test("LG07 Logout ends the session", async ({ page, step }) => {
    const inventoryPage = new InventoryPage(page);
    const { username, password } = credentialsFor(ROLES.StandardUser);

    await step("Log in", async () => {
      await loginPage.login(username, password);
      await loginPage.verifyLoginSuccess();
    });

    await step("Log out from the menu", async () => {
      await inventoryPage.logout();
      await expect(loginPage.loginButton).toBeVisible();
    });

    await step("Verify products page is blocked after logout", async () => {
      await page.goto(data.guardedPage.path);
      await loginPage.verifyLoginError(data.guardedPage.error);
    });
  });
});
