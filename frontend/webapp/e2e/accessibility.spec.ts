import { expect, test } from '@playwright/test';

test('login form exposes labels, alerts and keyboard navigation', async ({ page }) => {
  await page.goto('/login');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();

  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Accueil' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Email')).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('Mot de passe')).toBeFocused();
});

test('register form exposes accessible password fields', async ({ page }) => {
  await page.goto('/register');

  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Verification du mot de passe')).toBeVisible();
});

test('protected upload route redirects anonymous users to the labelled login form', async ({ page }) => {
  await page.goto('/upload');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('Email')).toBeVisible();
  await expect(page.getByLabel('Mot de passe')).toBeVisible();
});
