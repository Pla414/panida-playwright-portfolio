import { Page, expect } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async verifyProductInCart(productName: string): Promise<void> {
    await expect(this.page.locator('.inventory_item_name')).toContainText(productName);
  }
}
