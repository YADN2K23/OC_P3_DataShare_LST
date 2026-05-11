import { test, expect } from '@playwright/test';

test('landing page affiche la marque et le bouton connexion', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('nav .logo')).toHaveText('DataShare');
  await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();
});

test('navigation landing vers login', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Se connecter' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
});


