import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { testUsers } from "../fixtures/users";

test.describe("C1 - Authentication flow", () => {
  test("should log in with valid credentials and redirect to home", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await expect(page).toHaveURL(/\/login/);

    const { email, password } = testUsers.standard;
    await loginPage.login(email, password);

    await expect(page).toHaveURL(/.*\/solicitudes/);
  });
});
