/**
 * CheckoutPage.ts — page object for the 3 checkout steps:
 *   step one  /checkout-step-one.html   customer info form
 *   step two  /checkout-step-two.html   order overview (items, item total, tax, total)
 *   complete  /checkout-complete.html   thank-you page
 */
import { expect, type Locator, type Page } from "@playwright/test";
import { parseMoney } from "../helpers/helper";

export interface CustomerInfo {
  firstName: string;
  lastName: string;
  postalCode: string;
}

export interface OrderSummary {
  itemPrices: number[];
  itemTotal: number;
  tax: number;
  total: number;
}

export class CheckoutPage {
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly errorMessage: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly itemTotalLabel: Locator;
  readonly taxLabel: Locator;
  readonly totalLabel: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly backHomeButton: Locator;

  constructor(readonly page: Page) {
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.itemNames = page.locator('[data-test="cart-list"] [data-test="inventory-item-name"]');
    this.itemPrices = page.locator('[data-test="cart-list"] [data-test="inventory-item-price"]');
    this.itemTotalLabel = page.locator('[data-test="subtotal-label"]');
    this.taxLabel = page.locator('[data-test="tax-label"]');
    this.totalLabel = page.locator('[data-test="total-label"]');
    this.finishButton = page.locator('[data-test="finish"]');
    this.completeHeader = page.locator('[data-test="complete-header"]');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
  }

  /** Fill the customer form; fields left out stay empty. */
  async fillCustomerInfo(info: Partial<CustomerInfo>): Promise<void> {
    await this.firstNameInput.fill(info.firstName ?? "");
    await this.lastNameInput.fill(info.lastName ?? "");
    await this.postalCodeInput.fill(info.postalCode ?? "");
  }

  /** Submit the customer form (stays on step one if a field is invalid). */
  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  /** Assert step one shows the given validation error. */
  async verifyError(message: string): Promise<void> {
    await expect(this.errorMessage).toContainText(message);
    await expect(this.page).toHaveURL(/checkout-step-one\.html/);
  }

  /** Wait for the overview page and read item prices and the price labels. */
  async readOrderSummary(): Promise<OrderSummary> {
    await expect(this.page).toHaveURL(/checkout-step-two\.html/);
    await expect(this.totalLabel).toBeVisible();
    return {
      itemPrices: (await this.itemPrices.allInnerTexts()).map(parseMoney),
      itemTotal: parseMoney(await this.itemTotalLabel.innerText()),
      tax: parseMoney(await this.taxLabel.innerText()),
      total: parseMoney(await this.totalLabel.innerText()),
    };
  }

  /** Place the order. */
  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  /** Leave the thank-you page with "Back Home". */
  async backHome(): Promise<void> {
    await this.backHomeButton.click();
    await expect(this.page).toHaveURL(/inventory\.html/);
  }

  /** Assert the thank-you page is shown. */
  async verifyOrderComplete(message: string): Promise<void> {
    await expect(this.page).toHaveURL(/checkout-complete\.html/);
    await expect(this.completeHeader).toHaveText(message);
  }
}
