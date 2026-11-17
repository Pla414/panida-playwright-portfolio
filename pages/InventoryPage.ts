import { Page, expect } from '@playwright/test';

export class InventoryPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async addBackpackToCart(): Promise<void> {
    await this.page.locator('[data-test="add-to-cart-sauce-labs-backpack"]').click();
  }

  async openCart(): Promise<void> {
    await this.page.locator('.shopping_cart_link').click();
  }

  async verifyCartBadgeCount(expectedCount: string): Promise<void> {
    await expect(this.page.locator('.shopping_cart_badge')).toHaveText(expectedCount);
  }
}
