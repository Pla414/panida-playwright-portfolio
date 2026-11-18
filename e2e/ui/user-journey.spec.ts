/**
 * user-journey.spec.ts — end-to-end customer journeys across every SauceDemo page (UJ01–UJ03).
 * Functional specs (login / inventory / cart / checkout) test one page each;
 * these tests chain them like a real customer: login → browse → cart → checkout → logout.
 *   UJ01  new customer buys the cheapest products (happy path, full loop)
 *   UJ02  customer edits the cart before buying
 *   UJ03  customer recovers from input mistakes
 * Starts without a session and logs in through the UI. Products and prices are read from the page.
 */
import { AS_GUEST, credentialsFor, ROLES } from "../auth/roles";
import { expect, test } from "../helpers/test";
import { CartPage } from "../page/CartPage";
import { CheckoutPage } from "../page/CheckoutPage";
import { InventoryPage } from "../page/InventoryPage";
import { LoginPage } from "../page/LoginPage";
import data from "../test-data/user-journey.json";

test.use(AS_GUEST);

let loginPage: LoginPage;
let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutPage: CheckoutPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
  inventoryPage = new InventoryPage(page);
  cartPage = new CartPage(page);
  checkoutPage = new CheckoutPage(page);
  await loginPage.goto();
});

const { username, password } = credentialsFor(ROLES.StandardUser);

// UJ01
// EN: Log in, pick the cheapest products after sorting, buy them, return home and log out
test("UJ01 New customer buys the cheapest products", async ({ page, step }) => {
  let names: string[] = [];
  let prices: number[] = [];

  await step("Log in as a standard user", async () => {
    await loginPage.login(username, password);
    await loginPage.verifyLoginSuccess();
  });

  await step("Sort by price (low to high) and pick the cheapest products", async () => {
    await inventoryPage.sortBy("lohi");
    names = (await inventoryPage.productNames()).slice(0, data.cheapestCount);
    prices = (await inventoryPage.productPrices()).slice(0, data.cheapestCount);
  });

  await step("Add the cheapest products to the cart", async () => {
    for (const name of names) await inventoryPage.addToCartByName(name);
    await inventoryPage.verifyCartBadgeCount(names.length);
  });

  await step("Open the cart and check out", async () => {
    await inventoryPage.openCart();
    await cartPage.verifyItems(names);
    await cartPage.checkout();
  });

  await step("Fill customer info", async () => {
    await checkoutPage.fillCustomerInfo(data.customer);
    await checkoutPage.continue();
  });

  await step("Verify overview items and totals", async () => {
    const summary = await checkoutPage.readOrderSummary();
    await expect(checkoutPage.itemNames).toHaveText(names);
    expect(summary.itemPrices).toEqual(prices);
    expect(summary.itemTotal).toBeCloseTo(prices.reduce((a, b) => a + b, 0), 2);
    expect(summary.total).toBeCloseTo(summary.itemTotal + summary.tax, 2);
  });

  await step("Finish the order", async () => {
    await checkoutPage.finish();
    await checkoutPage.verifyOrderComplete(data.messages.complete);
  });

  await step("Back home with an empty cart", async () => {
    await checkoutPage.backHome();
    await inventoryPage.verifyCartBadgeCount(0);
  });

  await step("Log out and verify the product page is blocked", async () => {
    await inventoryPage.logout();
    await page.goto("/inventory.html");
    await loginPage.verifyLoginError(data.messages.guardedPage);
  });
});

// UJ02
// EN: Add, remove in the cart, go back for one more product, then buy the final cart
test("UJ02 Customer edits the cart before buying", async ({ step }) => {
  const { initial, remove, addLater } = data.editCart;
  const finalItems = [...initial.filter((n) => n !== remove), addLater];

  await step("Log in as a standard user", async () => {
    await loginPage.login(username, password);
    await loginPage.verifyLoginSuccess();
  });

  await step(`Add ${initial.length} products`, async () => {
    for (const name of initial) await inventoryPage.addToCartByName(name);
    await inventoryPage.verifyCartBadgeCount(initial.length);
  });

  await step(`Remove ${remove} in the cart`, async () => {
    await inventoryPage.openCart();
    await cartPage.removeItemByName(remove);
    await cartPage.verifyItems(initial.filter((n) => n !== remove));
  });

  await step(`Continue shopping and add ${addLater}`, async () => {
    await cartPage.continueShopping();
    await inventoryPage.addToCartByName(addLater);
    await inventoryPage.verifyCartBadgeCount(finalItems.length);
  });

  await step("Verify the final cart and check out", async () => {
    await inventoryPage.openCart();
    await cartPage.verifyItems(finalItems);
    await cartPage.checkout();
    await checkoutPage.fillCustomerInfo(data.customer);
    await checkoutPage.continue();
  });

  await step("Verify overview lists the final cart", async () => {
    const summary = await checkoutPage.readOrderSummary();
    await expect(checkoutPage.itemNames).toHaveText(finalItems);
    expect(summary.total).toBeCloseTo(summary.itemTotal + summary.tax, 2);
  });

  await step("Finish the order", async () => {
    await checkoutPage.finish();
    await checkoutPage.verifyOrderComplete(data.messages.complete);
  });
});

// UJ03
// EN: A wrong password and a missing postal code are shown, fixed, and the order still completes
test("UJ03 Customer recovers from input mistakes", async ({ step }) => {
  await step("Log in with a wrong password", async () => {
    await loginPage.login(username, data.recovery.wrongPassword);
    await loginPage.verifyLoginError(data.messages.wrongPassword);
  });

  await step("Log in again with the right password", async () => {
    await loginPage.login(username, password);
    await loginPage.verifyLoginSuccess();
  });

  await step(`Add ${data.recovery.product} and check out`, async () => {
    await inventoryPage.addToCartByName(data.recovery.product);
    await inventoryPage.openCart();
    await cartPage.checkout();
  });

  await step("Submit the form without a postal code", async () => {
    await checkoutPage.fillCustomerInfo({ ...data.customer, postalCode: "" });
    await checkoutPage.continue();
    await checkoutPage.verifyError(data.messages.postalCodeRequired);
  });

  await step("Fix the postal code and continue", async () => {
    await checkoutPage.fillCustomerInfo(data.customer);
    await checkoutPage.continue();
    await checkoutPage.readOrderSummary();
    await expect(checkoutPage.itemNames).toHaveText([data.recovery.product]);
  });

  await step("Finish the order", async () => {
    await checkoutPage.finish();
    await checkoutPage.verifyOrderComplete(data.messages.complete);
  });
});
