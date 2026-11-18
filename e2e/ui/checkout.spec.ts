/**
 * checkout.spec.ts — SauceDemo checkout (CO01–CO04).
 *   CO01       end-to-end purchase: cart → customer info → overview math → order complete
 *   CO02–CO04  each required field is validated (data-driven from checkout.json)
 * Prices and totals are read from the page at runtime, never hard-coded.
 */
import { test, expect } from "../helpers/test";
import { asRole, ROLES } from "../auth/roles";
import { CartPage } from "../page/CartPage";
import { CheckoutPage, type CustomerInfo } from "../page/CheckoutPage";
import { InventoryPage } from "../page/InventoryPage";
import data from "../test-data/checkout.json";

test.use(asRole(ROLES.StandardUser));

let inventoryPage: InventoryPage;
let cartPage: CartPage;
let checkoutPage: CheckoutPage;

test.beforeEach(async ({ page }) => {
  inventoryPage = new InventoryPage(page);
  cartPage = new CartPage(page);
  checkoutPage = new CheckoutPage(page);
  await inventoryPage.goto();
});

// CO01
// EN: A user buys two products; the overview totals add up and the cart is empty afterwards
test("CO01 Complete a purchase end to end", async ({ step }) => {
  const names = data.products.map((p) => p.name);
  let shelfPrices: number[] = [];

  await step("Add products and note their shelf prices", async () => {
    const allNames = await inventoryPage.productNames();
    const allPrices = await inventoryPage.productPrices();
    shelfPrices = names.map((name) => allPrices[allNames.indexOf(name)]);
    for (const product of data.products) await inventoryPage.addToCart(product.id);
  });

  await step("Open cart and start checkout", async () => {
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
    expect(summary.itemPrices, "overview prices match the shelf prices").toEqual(shelfPrices);

    const sum = shelfPrices.reduce((a, b) => a + b, 0);
    expect(summary.itemTotal, "item total = sum of item prices").toBeCloseTo(sum, 2);
    expect(summary.tax, "tax is charged").toBeGreaterThan(0);
    expect(summary.total, "total = item total + tax").toBeCloseTo(summary.itemTotal + summary.tax, 2);
  });

  await step("Finish order and verify confirmation", async () => {
    await checkoutPage.finish();
    await checkoutPage.verifyOrderComplete(data.completeMessage);
    await inventoryPage.verifyCartBadgeCount(0);
  });
});

// CO02–CO04
// EN: Leaving one required field empty blocks checkout with that field's error
for (const c of data.requiredFields) {
  test(`${c.tsn} Checkout requires ${c.field}`, async ({ step }) => {
    await step("Add a product and go to checkout", async () => {
      await inventoryPage.addToCart(data.products[0].id);
      await inventoryPage.openCart();
      await cartPage.checkout();
    });

    await step(`Submit the form with ${c.field} empty`, async () => {
      const info: Partial<CustomerInfo> = { ...data.customer, [c.field]: "" };
      await checkoutPage.fillCustomerInfo(info);
      await checkoutPage.continue();
    });

    await step("Verify validation error", async () => {
      await checkoutPage.verifyError(c.error);
    });
  });
}
