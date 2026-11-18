/**
 * InventoryPage.ts — page object for the SauceDemo product list (/inventory.html)
 * plus the shared header (cart icon, burger menu, logout).
 */
import { expect, type Locator, type Page } from "@playwright/test";
import { parseMoney } from "../helpers/helper";

/** Values of the sort dropdown. */
export type SortOption = "az" | "za" | "lohi" | "hilo";

export class InventoryPage {
  readonly items: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly sortSelect: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(readonly page: Page) {
    this.items = page.locator('[data-test="inventory-item"]');
    this.itemNames = page.locator('[data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="inventory-item-price"]');
    this.sortSelect = page.locator('[data-test="product-sort-container"]');
    this.cartLink = page.locator('[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.menuButton = page.getByRole("button", { name: "Open Menu" });
    this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
  }

  /** Open the product list directly (needs a logged-in session). */
  async goto(): Promise<void> {
    await this.page.goto("/inventory.html");
    await expect(this.items.first()).toBeVisible();
  }

  /** Click "Add to cart" on a product by its data-test id, e.g. "sauce-labs-backpack". */
  async addToCart(productId: string): Promise<void> {
    await this.page.locator(`[data-test="add-to-cart-${productId}"]`).click();
  }

  /** Click "Add to cart" on the product card with this exact name. */
  async addToCartByName(name: string): Promise<void> {
    await this.itemCard(name).getByRole("button", { name: "Add to cart" }).click();
  }

  /** Click "Remove" on the product card with this exact name. */
  async removeFromCartByName(name: string): Promise<void> {
    await this.itemCard(name).getByRole("button", { name: "Remove" }).click();
  }

  /** Product card whose name matches exactly. */
  private itemCard(name: string): Locator {
    return this.items.filter({ has: this.page.getByText(name, { exact: true }) });
  }

  /** Click "Remove" on a product that is already in the cart. */
  async removeFromCart(productId: string): Promise<void> {
    await this.page.locator(`[data-test="remove-${productId}"]`).click();
  }

  /** Pick a sort option from the dropdown. */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortSelect.selectOption(option);
  }

  /** Product names in the order they are shown. */
  async productNames(): Promise<string[]> {
    return this.itemNames.allInnerTexts();
  }

  /** Product prices (as numbers) in the order they are shown. */
  async productPrices(): Promise<number[]> {
    return (await this.itemPrices.allInnerTexts()).map(parseMoney);
  }

  /** Open the cart page from the header icon and wait until it loads. */
  async openCart(): Promise<void> {
    await this.cartLink.click();
    await expect(this.page).toHaveURL(/cart\.html/);
  }

  /** Log out from the burger menu. */
  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
  }

  /** Assert the number on the cart badge (0 = no badge at all). */
  async verifyCartBadgeCount(expectedCount: number): Promise<void> {
    if (expectedCount === 0) await expect(this.cartBadge).toHaveCount(0);
    else await expect(this.cartBadge).toHaveText(String(expectedCount));
  }
}
