import { test, expect } from '@playwright/test';

test('parcours metier complet: register -> login -> upload -> share -> download', async ({ page }) => {
  let sharedDownloadCalled = false;
  let shareLinkCreated = false;

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/register$/, async (route) => {
    await route.fulfill({ status: 204, body: '' });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/login$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ token: 'jwt-token' }),
    });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/me$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ login: 'test@datas.fr' }),
    });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/files$/, async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        storedFileName: 'stored.txt',
        originalFileName: 'hello.txt',
        contentType: 'text/plain',
        size: 5,
        createdAt: '2026-04-17T10:00:00Z',
        passwordProtected: true,
        expiresAt: '2026-04-20T10:00:00Z',
      }),
    });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/files\/history$/, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/files\/stored\.txt\/shares\?.*/, async (route) => {
    shareLinkCreated = true;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'abc123',
        shareUrl: 'http://localhost:8080/api/files/shared/abc123',
        storedFileName: 'stored.txt',
        expiresAt: '2026-04-11T20:00:00Z',
      }),
    });
  });

  await page.route(/http:\/\/(localhost|127\.0\.0\.1):8080\/api\/files\/shared\/abc123$/, async (route) => {
    sharedDownloadCalled = true;
    await route.fulfill({
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': 'attachment; filename="shared.txt"',
      },
      body: 'hello',
    });
  });

  await page.goto('/register');
  await page.locator('#register-email').fill('test@datas.fr');
  await page.locator('#register-password').fill('secret123');
  await page.locator('#register-confirm').fill('secret123');
  await page.getByRole('button', { name: 'Creer mon compte' }).click();

  await expect(page).toHaveURL(/\/login$/);

  await page.locator('#email').fill('test@datas.fr');
  await page.locator('#password').fill('secret123');
  await page.getByRole('button', { name: 'Connexion' }).click();

  await expect(page).toHaveURL(/\/my-space$/);

  await page.getByRole('navigation').getByRole('link', { name: 'Ajouter des fichiers' }).click();
  await expect(page).toHaveURL(/\/upload$/);

  await page.locator('#file-input-desktop').setInputFiles({
    name: 'hello.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('hello'),
  });

  await page.getByRole('button', { name: 'Televerser' }).click();
  await expect(page).toHaveURL(/\/upload\/confirm$/);
  await expect.poll(() => shareLinkCreated).toBe(true);

  await page.getByRole('button', { name: 'Copier le lien' }).click();

  await page.goto('/download/abc123?state=pwd');
  await page.locator('#dl-pwd').fill('secret123');

  await page.getByRole('button', { name: 'Telecharger' }).click();
  await expect.poll(() => sharedDownloadCalled).toBe(true);
});


