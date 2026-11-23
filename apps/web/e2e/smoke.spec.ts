import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('home renders without axe violations', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('main')).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations).toEqual([]);
});
