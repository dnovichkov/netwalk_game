import { test, expect } from '@playwright/test';

test.describe('NetWalk App', () => {
  test('should display the main menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'NetWalk' })).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/NetWalk/);
  });
});
