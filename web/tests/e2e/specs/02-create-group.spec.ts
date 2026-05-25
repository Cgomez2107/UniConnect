import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { NuevaSolicitudPage } from "../pages/nueva-solicitud.page";
import { testUsers } from "../fixtures/users";

test.describe("C2 - Create study group", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.standard.email, testUsers.standard.password);
    await loginPage.waitForNavigation();
    await expect(page).toHaveURL(/.*\/solicitudes/);
  });

  test("should create a group, navigate to its detail page, and show Transferir admin button", async ({ page }) => {
    const groupTitle = `Grupo E2E ${Date.now()}`;

    const token = await page.evaluate(() => {
      const raw = localStorage.getItem("uniconnect-auth-session");
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        return parsed?.state?.accessToken ?? null;
      } catch {
        return null;
      }
    });
    expect(token).toBeTruthy();

    const gatewayUrl = process.env.E2E_GATEWAY_URL || "http://localhost:3000";

    const existingResponse = await page.request.get(`${gatewayUrl}/api/v1/study-groups/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (existingResponse.ok()) {
      const body = await existingResponse.json();
      const groups: any[] = body?.data ?? body ?? [];
      for (const g of groups) {
        if (g.title && ((g.title as string).startsWith("Grupo E2E") || (g.title as string).startsWith("Limite E2E"))) {
          await page.request.post(`${gatewayUrl}/api/v1/study-groups/${g.id}/cancel`, {
            headers: { Authorization: `Bearer ${token}` },
          });
        }
      }
    }

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