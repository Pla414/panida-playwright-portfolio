import { test } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { InventoryPage } from '../../pages/InventoryPage';
import { CartPage } from '../../pages/CartPage';
import loginData from '../../test-data/login-data.json';
import productData from '../../test-data/products.json';

test('Add Product to Cart - user can add backpack to cart', async ({ page }) => {
  const loginPage = new LoginPage(page);
  const inventoryPage = new InventoryPage(page);
  const cartPage = new CartPage(page);

  await loginPage.goto();
  await loginPage.login(loginData.validUser.username, loginData.validUser.password);
  await loginPage.verifyLoginSuccess();

  await inventoryPage.addBackpackToCart();
  await inventoryPage.verifyCartBadgeCount('1');
  await inventoryPage.openCart();

  await cartPage.verifyProductInCart(productData.backpack.name);
});
