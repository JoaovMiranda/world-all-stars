// D14 merge/unmerge (T1.4): pick two athletes, keep B's slug, merge with a reason, then undo it from the history.
// Needs the seeded dev database with simulated auth (the `admin` dev profile).
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test.beforeEach(async ({ context }) => {
  await context.setExtraHTTPHeaders({ 'x-was-session': 'admin' });
});

test('admin merges two athletes and undoes the merge', async ({ page }) => {
  await page.goto('/admin/merge');
  await expect(page.getByRole('heading', { level: 2 }).first()).toBeVisible();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  // Once A is chosen its search field goes away: the first search field is then B's.
  await page.getByRole('searchbox').first().fill('pel');
  await page.getByRole('button', { name: /pel/i }).first().click();
  await page.getByRole('searchbox').first().fill('ney');
  await page.getByRole('button', { name: /ney/i }).first().click();

  const table = page.getByRole('table');
  await expect(table).toBeVisible();
  await table.getByRole('radio').nth(3).check();
  expect((await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze()).violations).toEqual([]);

  await page.getByRole('button', { name: /B.*A/ }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('textbox').fill('same person, two records');
  await dialog.getByRole('button', { name: /B.*A/ }).click();
  await expect(page.getByRole('status')).toBeVisible();

  const history = page.getByRole('list').filter({ hasText: 'same person, two records' });
  await history.getByRole('button').first().click();
  const undo = page.getByRole('dialog');
  await undo.getByRole('textbox').fill('they are two people');
  await undo.getByRole('button').last().click();
  await expect(history.getByRole('button')).toHaveCount(0);
});
