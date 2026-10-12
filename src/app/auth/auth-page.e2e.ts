import { expect, test } from "@playwright/test";

test.describe("Loresay authentication page", () => {
  test("shows the image led sign in surface on desktop", async ({ page }) => {
    await page.setViewportSize({ height: 720, width: 1280 });
    await page.goto("http://localhost:3000/auth");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Sign in to your knowledge",
    );
    const introduction = page.getByRole("heading", {
      level: 2,
      name: "Keep what matters. Find it when you need it.",
    });
    await expect(introduction).toBeVisible();
    const signInPosition = await introduction.boundingBox();
    await expect(
      page.getByAltText(
        "A quiet modern library with rows of books ready to explore",
      ),
    ).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Show password" }),
    ).toBeVisible();
    await page.getByLabel("Password", { exact: true }).fill("example-password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "text",
    );
    await expect(
      page.getByRole("button", { name: "Hide password" }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "password",
    );
    await expect(page.getByText("Private by default")).toHaveCount(0);
    await expect(page.getByText("Google", { exact: false })).toHaveCount(0);
    await page.getByRole("button", { name: "Forgot password?" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Reset your password" }),
    ).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Send reset link" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await page.getByRole("button", { name: "Create an account" }).click();
    const signUpPosition = await introduction.boundingBox();
    expect(signUpPosition?.y).toBe(signInPosition?.y);
    await expect(page.locator("html")).toHaveJSProperty("scrollHeight", 720);
  });

  test("keeps account creation usable on a small screen", async ({ page }) => {
    await page.setViewportSize({ height: 812, width: 375 });
    await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: "Create your workspace" }),
    ).toBeVisible();
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 375);
    await expect(page.locator("html")).toHaveJSProperty("scrollHeight", 812);
  });

  test("keeps the account card clear of the logo on a short narrow screen", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 628, width: 600 });
    await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create an account" }).click();

    const logoBox = await page.getByAltText("Loresay").boundingBox();
    const cardBox = await page.getByTestId("auth-card").boundingBox();

    expect(cardBox?.y).toBeGreaterThanOrEqual(
      (logoBox?.y ?? 0) + (logoBox?.height ?? 0) + 16,
    );
    expect((cardBox?.y ?? 0) + (cardBox?.height ?? 0)).toBeLessThanOrEqual(613);
    await expect(page.locator("html")).toHaveJSProperty("scrollHeight", 628);
  });

  test("uses the sign in action after switching back from account creation", async ({
    page,
  }) => {
    await page.goto("http://localhost:3000/auth", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Create an account" }).click();

    await page.getByLabel("Name").evaluate((input) => {
      input.removeAttribute("required");
    });
    await page.getByLabel("Email").evaluate((input) => {
      input.removeAttribute("required");
    });
    await page.getByLabel("Password", { exact: true }).evaluate((input) => {
      input.removeAttribute("required");
    });
    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Enter your name.",
    );

    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.locator("form").getByRole("alert")).toHaveCount(0);

    await page.getByLabel("Email").evaluate((input) => {
      input.removeAttribute("required");
    });
    await page.getByLabel("Password", { exact: true }).evaluate((input) => {
      input.removeAttribute("required");
    });
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    await expect(page.locator("form").getByRole("alert")).toHaveText(
      "Email and password are required.",
    );
  });

  test("keeps the image and sign in form readable on a tablet", async ({
    page,
  }) => {
    await page.setViewportSize({ height: 1024, width: 768 });
    await page.goto("http://localhost:3000/auth");

    await expect(
      page.getByAltText(
        "A quiet modern library with rows of books ready to explore",
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Sign in to your knowledge",
      }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveJSProperty("scrollWidth", 768);
    await expect(page.locator("html")).toHaveJSProperty("scrollHeight", 1024);
  });
});
