import { expect, test } from "@playwright/test";

// User use case: generating and viewing a Wordle / Word Search activity.
test.describe("Activity generation and preview", () => {
  test("generates and previews a Wordle from the builder", async ({ page }) => {
    await page.goto("/wordle");
    await page.getByLabel("Phoneme Word").fill("k æ t");
    await page.getByLabel("English Word").fill("cat");
    await page.getByLabel("Attempts").fill("5");
    await page.getByLabel("Hints").selectOption("first-letter");
    await page.getByRole("button", { name: "Generate Preview" }).click();

    await expect(page.getByRole("button", { name: "Download HTML File" })).toBeVisible();

    const preview = page.frameLocator('iframe[title="Wordle Preview"]');
    await expect(preview.locator("h1")).toHaveText("Phoneme Wordle");
    await expect(preview.locator("#keyboard .key").first()).toBeVisible();
  });

  test("generates and previews a Word Search from the builder", async ({ page }) => {
    await page.goto("/wordsearch");
    await page.getByLabel("Phoneme Words").fill("k æ t\nd ɒ ɡ");
    await page.getByLabel("Rows").fill("10");
    await page.getByLabel("Columns").fill("10");
    await page.getByRole("button", { name: "Generate Preview" }).click();

    await expect(page.getByRole("button", { name: "Download HTML File" })).toBeVisible();

    const preview = page.frameLocator('iframe[title="Word Search Preview"]');
    await expect(preview.locator("h1")).toHaveText("Phoneme Word Search");
    await expect(preview.locator("#wordsearchGrid")).toBeVisible();
  });

  test("shows an error and records a failed generation for empty input", async ({ page }) => {
    await page.goto("/wordle");
    await page.getByRole("button", { name: "Generate Preview" }).click();
    await expect(page.locator('p[role="alert"]')).toContainText(/non-empty array/i);
  });
});
