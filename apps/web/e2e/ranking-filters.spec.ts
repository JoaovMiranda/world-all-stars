// T2.5: ranking filters live in the URL, are applied by the server-rendered page and survive a reload; the canonical
// URL keeps the filters but never the sort-only params.
import { expect, test } from '@playwright/test';

test('rankings list: methodology and gender filters survive a reload', async ({ page }) => {
  await page.goto('/rankings?gender=women');
  const gender = page.locator('select[name="gender"]');
  await expect(gender).toHaveValue('women');
  await page.reload();
  await expect(gender).toHaveValue('women');

  await gender.selectOption('men');
  await expect(page).toHaveURL(/[?&]gender=men\b/);
  const methodology = page.locator('select[name="methodology"]');
  await methodology.selectOption('bjj-career');
  await expect(page).toHaveURL(/[?&]methodology=bjj-career\b/);

  await page.reload();
  await expect(gender).toHaveValue('men');
  await expect(methodology).toHaveValue('bjj-career');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/rankings\?gender=men&methodology=bjj-career$/);
});

test('ranking table: a filter and the sort survive a reload; the canonical drops the sort', async ({ page }) => {
  await page.goto('/rankings');
  const first = page.locator('a[href^="/rankings/"]').first();
  test.skip((await first.count()) === 0, 'no published ranking in this data source');
  const href = (await first.getAttribute('href')) ?? '';

  await page.goto(`${href}?sort=name`);
  const sort = page.locator('select[name="sort"]');
  await expect(sort).toHaveValue('name');

  // The first filter of the methodology that lists a value.
  const filter = page.locator('.filter-bar select:not([name="sort"])').first();
  test.skip((await filter.count()) === 0, 'this ranking has no filter values');
  const key = (await filter.getAttribute('name')) ?? '';
  const value = await filter.locator('option:not([value=""])').first().getAttribute('value');
  await filter.selectOption(value ?? '');
  await expect(page).toHaveURL(new RegExp(`[?&]${key}=`));

  await page.reload();
  await expect(page.locator(`select[name="${key}"]`)).toHaveValue(value ?? '');
  await expect(sort).toHaveValue('name');
  const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
  expect(canonical).toContain(`${key}=`);
  expect(canonical).not.toContain('sort=');
});
