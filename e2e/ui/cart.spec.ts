/**
 * cart.spec.ts — SauceDemo shopping cart (CT01–CT03).
 *   CT01  add one product
 *   CT02  add several, remove one in the cart
 *   CT03  cart survives a page reload
 * Runs with the saved StandardUser session, so no login step is needed.
 */
import { test } from "../helpers/test";
import { asRole, ROLES } from "../auth/roles";
import { CartPage } from "../page/CartPage";
import { InventoryPage } from "../page/InventoryPage";
import data from "../test-data/cart.json";

test.use(asRole(ROLES.StandardUser));

const { backpack, bikeLight, boltTShirt } = data.products;

let inventoryPage: InventoryPage;
let cartPage: CartPage;

test.beforeEach(async ({ page }) => {
  inventoryPage = new InventoryPage(page);
  cartPage = new CartPage(page);
  await inventoryPage.goto();
});

// CT01
// EN: Adding one product updates the cart badge and shows it in the cart
test("CT01 Add one product to cart", async ({ step }) => {
  await step(`Add ${backpack.name}`, async () => {
    await inventoryPage.addToCart(backpack.id);
    await inventoryPage.verifyCartBadgeCount(1);
  });

  await step("Open cart and verify the product is listed", async () => {
    await inventoryPage.openCart();
    await cartPage.verifyItems([backpack.name]);
  });
});

// CT02
// EN: Removing a product in the cart drops it from the list and lowers the badge
test("CT02 Remove a product from cart", async ({ step }) => {
  await step("Add three products", async () => {
    for (const product of [backpack, bikeLight, boltTShirt]) await inventoryPage.addToCart(product.id);
    await inventoryPage.verifyCartBadgeCount(3);
  });

  await step(`Remove ${bikeLight.name} in the cart`, async () => {
    await inventoryPage.openCart();
    await cartPage.removeItem(bikeLight.id);
  });

  await step("Verify the remaining items and badge", async () => {
    await cartPage.verifyItems([backpack.name, boltTShirt.name]);
    await inventoryPage.verifyCartBadgeCount(2);
  });
});

// CT03
// EN: Cart items are kept after reloading the page
test("CT03 Cart persists after reload", async ({ page, step }) => {
  await step("Add two products", async () => {
    await inventoryPage.addToCart(backpack.id);
    await inventoryPage.addToCart(bikeLight.id);
  });

  await step("Reload and verify the cart is unchanged", async () => {
    await page.reload();
    await inventoryPage.verifyCartBadgeCount(2);
    await inventoryPage.openCart();
    await cartPage.verifyItems([backpack.name, bikeLight.name]);
  });
});
