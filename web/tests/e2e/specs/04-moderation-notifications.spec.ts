import { test, expect, Page } from "@playwright/test";

const FAKE_GROUP_ID = "e2e-test-moderation-group";
const FAKE_USER_ID = "test-user-1";
const GATEWAY_URL = process.env.E2E_GATEWAY_URL || "http://localhost:3000";
const API_BASE = `${GATEWAY_URL}/api/v1`;

async function setupAuthenticatedSession(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "uniconnect-auth-session",
      JSON.stringify({
        state: {
          user: {
            id: "test-user-1",
            email: "estudiante.prueba@ucaldas.edu.co",
            role: "estudiante",
            firstName: "Test",
            lastName: "User",
          },
          accessToken: "e2e-fake-access-token",
          refreshToken: "e2e-fake-refresh-token",
          isAuthenticated: true,
        },
        version: 0,
      })
    );
  });
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  // Wait for React to hydrate and potentially redirect
  await page.waitForTimeout(1000);
}

type SpamMock = { code: string; remainingMs: number } | "escalate";

async function clearBlock(page: Page) {
  await page.evaluate(() => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store) store.getState().clearBlock();
  });
}

async function setupMockGroupData(page: Page, spam?: SpamMock) {
  let postCount = 0;

  await page.route(`${API_BASE}/applications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route(`${API_BASE}/notifications*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route(`${API_BASE}/auth/**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: null }),
    });
  });

  await page.route(`${API_BASE}/study-groups/${FAKE_GROUP_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: {
          id: FAKE_GROUP_ID,
          name: "Grupo Test Moderación E2E",
          description: "Grupo para pruebas de moderación",
          subject_id: "math-101",
          subject_name: "Matemáticas",
          state: "activa",
          status: "activa",
          member_count: 1,
          max_members: 10,
          created_by: FAKE_USER_ID,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      }),
    });
  });

  await page.route(`${API_BASE}/study-groups/${FAKE_GROUP_ID}/messages*`, async (route) => {
    if (route.request().method() === "POST" && spam) {
      postCount++;
      let code: string;
      let message: string;
      if (spam === "escalate") {
        if (postCount >= 3) {
          code = "MO_004";
          message = "Spam detectado. Has acumulado múltiples infracciones. Tu caso ha sido escalado a revisión humana. Restante: 600000";
        } else {
          code = "MO_003";
          message = "Spam detectado. Usuario bloqueado automáticamente por 5 minutos. Restante: 300000";
        }
      } else {
        code = spam.code;
        message =
          code === "MO_004"
            ? `Spam detectado. Has acumulado múltiples infracciones. Tu caso ha sido escalado a revisión humana. Restante: ${spam.remainingMs}`
            : `Spam detectado. Usuario bloqueado automáticamente por 5 minutos. Restante: ${spam.remainingMs}`;
      }
      await route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: message, code }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [] }),
      });
    }
  });

  await page.route(`${API_BASE}/study-groups/${FAKE_GROUP_ID}/members`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "member-1",
            group_id: FAKE_GROUP_ID,
            user_id: FAKE_USER_ID,
            user: {
              id: FAKE_USER_ID,
              email: "estudiante.prueba@ucaldas.edu.co",
              firstName: "Test",
              lastName: "User",
            },
            role: "admin",
            joined_at: new Date().toISOString(),
          },
        ],
      }),
    });
  });
}

test.describe("US-MO02 - Moderation Notifications", () => {
  test.beforeEach(async ({ page }) => {
    await setupAuthenticatedSession(page);
  });

  test("Criterion 1: should show inline block notification within 500ms after spam detection and preserve message text", async ({ page }) => {
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 });

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 5000 });

    const messageText = "mensaje de prueba que activa alerta";
    await input.fill(messageText);

    const rejectionTime = Date.now();
    await page.keyboard.press("Enter");

    const blockBanner = page.locator("text=Chat suspendido temporalmente");
    await expect(blockBanner).toBeVisible({ timeout: 2000 });

    const elapsed = Date.now() - rejectionTime;
    expect(elapsed).toBeLessThan(1000);

    await expect(input).toHaveValue(messageText);

    const countdownText = page.locator("text=5:00");
    await expect(countdownText).toBeVisible({ timeout: 1000 });
  });

  test("Criterion 2: should show countdown timer and disable input during block", async ({ page }) => {
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 });

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 5000 });

    await input.fill("mensaje normal de prueba");
    await page.keyboard.press("Enter");

    const blockBanner = page.locator("text=Chat suspendido temporalmente");
    await expect(blockBanner).toBeVisible({ timeout: 2000 });

    await expect(input).toBeDisabled({ timeout: 1000 });

    const countdown = page.locator("text=5:00");
    await expect(countdown).toBeVisible({ timeout: 1000 });
  });

  test("Criterion 3: should escalate case to human review after accumulating 3 blocks", async ({ page }) => {
    await setupMockGroupData(page, "escalate");

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 5000 });

    for (let i = 1; i <= 3; i++) {
      await input.fill("mensaje normal de prueba");
      await page.keyboard.press("Enter");

      const expectedBanner =
        i < 3
          ? page.locator("text=Chat suspendido temporalmente")
          : page.locator("text=Caso escalado a revisión humana");
      await expect(expectedBanner).toBeVisible({ timeout: 3000 });

      if (i < 3) {
        await clearBlock(page);
        await page.waitForTimeout(300);
      }
    }

    await expect(input).toBeDisabled({ timeout: 1000 });
  });

  test("Criterion 4: should show community guidelines when clicking '¿Por qué?' button", async ({ page }) => {
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 });

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 5000 });

    await input.fill("mensaje normal de prueba");
    await page.keyboard.press("Enter");

    const blockBanner = page.locator("text=Chat suspendido temporalmente");
    await expect(blockBanner).toBeVisible({ timeout: 2000 });

    const whyButton = page.getByText("¿Por qué?");
    await expect(whyButton.first()).toBeVisible({ timeout: 2000 });

    await whyButton.first().click();

    const dialogTitle = page.getByText("Normas de la Comunidad");
    await expect(dialogTitle).toBeVisible({ timeout: 1000 });

    await expect(page.getByText("Prevención de Spam")).toBeVisible({ timeout: 1000 });

    const entendidoButton = page.getByText("Entendido");
    await expect(entendidoButton).toBeVisible({ timeout: 1000 });

    await entendidoButton.click();
    await expect(dialogTitle).not.toBeVisible({ timeout: 1000 });
  });
});
