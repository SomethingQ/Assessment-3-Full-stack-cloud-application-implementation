import { expect, test } from "@playwright/test";

// Observability use case: the dashboard reflects live health and usage data.
test.describe("Operational dashboard", () => {
  test("shows health status, usage statistics and reporting views", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page.getByRole("heading", { name: "Operational Dashboard", level: 1 })).toBeVisible();

    const health = page.getByTestId("dashboard-health");
    await expect(health).toBeVisible();
    await expect(health).toContainText("200 OK");
    await expect(health).toContainText("Database: connected");

    const summary = page.locator('section[aria-labelledby="summary-heading"]');
    await expect(summary.getByText("Successful generations", { exact: true })).toBeVisible();
    await expect(summary.getByText("Failed generations", { exact: true })).toBeVisible();
    await expect(summary.getByText("Average time on page", { exact: true })).toBeVisible();
    await expect(summary.getByText("Most-used activity type", { exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alerts and warnings" })).toBeVisible();
  });

  test("simulates input records and refreshes the dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    const totalCard = page.getByText("Total activities", { exact: true });

    await page.getByTestId("simulate-button").click();
    await expect(page.getByText(/Simulated \d+ activities/)).toBeVisible();
    await expect(totalCard).toBeVisible();
  });
});
