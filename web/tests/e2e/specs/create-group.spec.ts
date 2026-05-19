import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { NuevaSolicitudPage } from "../pages/nueva-solicitud.page";
import { testUsers } from "../fixtures/users";

test.describe("C2 - Create study group", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.standard.email, testUsers.standard.password);
    await expect(page).toHaveURL(/.*\/solicitudes/);
  });

  test("should create a group, navigate to its detail page, and show Transferir admin button", async ({ page }) => {
    const groupTitle = `Grupo E2E ${Date.now()}`;

    await page.goto("/nueva-solicitud");
    await expect(page).toHaveURL(/\/nueva-solicitud/);

    const form = new NuevaSolicitudPage(page);

    await form.waitForSubjectsLoaded();
    await form.selectFirstSubject();
    await form.fillForm({
      title: groupTitle,
      description: "Grupo creado durante prueba automatizada E2E",
      maxMembers: 4,
    });
    await form.submit();

    await expect(page).toHaveURL(/.*\/solicitudes/);

    await page.locator(`article:has(h3:text-is("${groupTitle}")) button:has-text("Ver detalles")`).click();

    await expect(page).toHaveURL(/\/grupo\//);

    await expect(page.locator("header button:has-text('Transferir admin')")).toBeVisible();
  });
});
