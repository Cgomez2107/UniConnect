import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { NuevaSolicitudPage } from "../pages/nueva-solicitud.page";
import { testUsers } from "../fixtures/users";

test.describe("C3 - Group limit per subject", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.standard.email, testUsers.standard.password);
    await expect(page).toHaveURL(/.*\/solicitudes/);
  });

  test("should reject creating a 4th group for the same subject", async ({ page }) => {
    const groupTitle = `Limite E2E ${Date.now()}`;

    await page.goto("/nueva-solicitud");
    await expect(page).toHaveURL(/\/nueva-solicitud/);

    const form = new NuevaSolicitudPage(page);
    await form.waitForSubjectsLoaded();
    const subjectId = await form.selectFirstSubject();

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

    const gatewayUrl = process.env.E2E_GATEWAY_URL || "https://uniconnect-backend-grupo-2.fly.dev";

    for (let i = 0; i < 3; i++) {
      const response = await page.request.post(`${gatewayUrl}/api/v1/study-groups`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: {
          subjectId,
          name: `${groupTitle} ${i}`,
          description: "Grupo para test de límite",
          maxMembers: 4,
        },
      });
      if (!response.ok() && response.status() !== 409) {
        throw new Error(`API error: ${response.status()} ${await response.text()}`);
      }
    }

    await page.goto("/nueva-solicitud");
    await expect(page).toHaveURL(/\/nueva-solicitud/);

    const form2 = new NuevaSolicitudPage(page);
    await form2.waitForSubjectsLoaded();
    await form2.selectFirstSubject();
    await form2.fillForm({
      title: `${groupTitle} excedido`,
      description: "Este grupo debería ser rechazado por límite",
      maxMembers: 4,
    });
    await form2.submit();

    await expect(page).toHaveURL(/\/nueva-solicitud/);
    await expect(page.getByText(/No puedes crear más grupos|Esta materia ya alcanzó/)).toBeVisible();
  });
});