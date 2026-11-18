/**
 * inventory.spec.ts — SauceDemo product list (IN01–IN05).
 *   IN01       catalog shows every product with a name and a valid price
 *   IN02–IN05  each sort option orders the list correctly (data-driven from inventory.json)
 * Expected order is computed from what the page shows, so it never goes stale.
 */
import { test, expect } from "../helpers/test";
import { asRole, ROLES } from "../auth/roles";
import { InventoryPage, type SortOption } from "../page/InventoryPage";
import data from "../test-data/inventory.json";

test.use(asRole(ROLES.StandardUser));

let inventoryPage: InventoryPage;

test.beforeEach(async ({ page }) => {
  inventoryPage = new InventoryPage(page);
  await inventoryPage.goto();
});

/** Return a sorted copy (names: locale compare, prices: numeric). */
function sorted<T extends string | number>(values: T[], order: string): T[] {
  const copy = [...values].sort((a, b) =>
    typeof a === "number" ? a - (b as number) : String(a).localeCompare(String(b)),
  );
  return order === "desc" ? copy.reverse() : copy;
}

// IN01
// EN: The catalog lists every product, each with a unique name and a price above zero
test("IN01 Catalog shows all products with name and price", async ({ step }) => {
  await step(`Verify ${data.productCount} products are listed`, async () => {
    await expect(inventoryPage.items).toHaveCount(data.productCount);
  });

  await step("Verify names are unique and prices are positive", async () => {
    const names = await inventoryPage.productNames();
    const prices = await inventoryPage.productPrices();
    expect(new Set(names).size, "product names are unique").toBe(names.length);
    for (const price of prices) expect(price).toBeGreaterThan(0);
  });
});

// IN02–IN05
// EN: Each sort option reorders the list by name or price in the right direction
for (const c of data.sortCases) {
  test(`${c.tsn} Sort by ${c.label}`, async ({ step }) => {
    await step(`Select "${c.label}"`, async () => {
      await inventoryPage.sortBy(c.option as SortOption);
    });

    await step(`Verify list is ordered by ${c.by} ${c.order}`, async () => {
      const actual = c.by === "price" ? await inventoryPage.productPrices() : await inventoryPage.productNames();
      expect(actual).toEqual(sorted<string | number>(actual, c.order));
    });
  });
}
