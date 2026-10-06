import { expect, test } from "@playwright/test";

// Builder use case: full CRUD over a word list / activity configuration.
test.describe("Word list builder CRUD", () => {
  test("creates, edits, adds a word and deletes an activity", async ({ page }) => {
    const name = `E2E Activity ${Date.now()}`;

    await page.goto("/activities");
    await expect(page.getByRole("heading", { name: "Saved Activities", level: 1 })).toBeVisible();

    // CREATE -----------------------------------------------------------------
    await page.getByLabel("Activity Name").fill(name);
    await page.getByLabel("Activity Type").selectOption("WORD_SEARCH");
    await page.getByLabel("Difficulty").first().selectOption("EASY");
    await page.getByLabel("Word 1 phonemes").fill("k æ t");
    await page.getByLabel("Word 1 English (optional)").fill("cat");
    await page.getByRole("button", { name: "Save Activity" }).click();

    const card = page.locator(
      `[data-testid="activity-card"][data-activity-name="${name}"]`,
    );
    await expect(card).toBeVisible();
    await expect(card.getByText("1 word", { exact: true })).toBeVisible();

    // UPDATE configuration ---------------------------------------------------
    await card.getByLabel("Difficulty").selectOption("HARD");
    await card.getByRole("button", { name: "Save Settings" }).click();
    await expect(card.getByLabel("Difficulty")).toHaveValue("HARD");

    // ADD a second word ------------------------------------------------------
    await card.getByLabel(`New word phonemes for ${name}`).fill("d ɒ ɡ");
    await card.getByRole("button", { name: "+ Add Word" }).click();
    await expect(card.getByText("2 words", { exact: true })).toBeVisible();

    // DELETE -----------------------------------------------------------------
    page.on("dialog", (dialog) => dialog.accept());
    await card.getByRole("button", { name: "Delete Activity" }).click();
    await expect(
      page.locator(`[data-testid="activity-card"][data-activity-name="${name}"]`),
    ).toHaveCount(0);
  });
});
