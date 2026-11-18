/**
 * CartPage.ts — page object for the SauceDemo cart (/cart.html).
 */
import { expect, type Locator, type Page } from "@playwright/test";

export class CartPage {
  readonly itemNames: Locator;
  readonly checkoutButton: Locator;
  readonly continueShoppingButton: Locator;

  constructor(readonly page: Page) {
    // Scoped to the cart list so it never matches product names left over from the inventory page
    this.itemNames = page.locator('[data-test="cart-list"] [data-test="inventory-item-name"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
  }

  /** Open the cart directly. */
  async goto(): Promise<void> {
    await this.page.goto("/cart.html");
  }

  /** Assert a product with the given name is in the cart. */
  async verifyProductInCart(productName: string): Promise<void> {
    await expect(this.itemNames.filter({ hasText: productName })).toBeVisible();
  }

  /** Assert the cart holds exactly these products, in this order. */
  async verifyItems(productNames: string[]): Promise<void> {
    await expect(this.itemNames).toHaveText(productNames);
  }

  /** Click "Remove" on a product in the cart. */
  async removeItem(productId: string): Promise<void> {
    await this.page.locator(`[data-test="remove-${productId}"]`).click();
  }

  /** Click "Remove" on the cart row with this exact product name. */
  async removeItemByName(name: string): Promise<void> {
    await this.page
      .locator('[data-test="inventory-item"]')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .getByRole("button", { name: "Remove" })
      .click();
  }

  /** Go to checkout step one and wait until it loads. */
  async checkout(): Promise<void> {
    await this.checkoutButton.click();
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
  }

  /** Go back to the product list. */
  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
    await expect(this.page).toHaveURL(/inventory\.html/);
  }
}
