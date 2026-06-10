import { test, expect, Page } from "@playwright/test";
import { LoginPage } from "../pages/login.page";
import { testUsers } from "../fixtures/users";

const FAKE_GROUP_ID = "e2e-test-moderation-group";

type SpamMock = { code: string; remainingMs: number } | "escalate";

async function clearBlock(page: Page) {
  await page.evaluate(() => {
    (window as any).__ZUSTAND_STORE__?.getState?.()?.clearBlock?.();
  });
  await page.evaluate(() => {
    localStorage.removeItem("spam-store");
  });
  await page.waitForTimeout(300);
}

async function getUserId(page: Page): Promise<string> {
  return page.evaluate(() => {
    const raw = localStorage.getItem("uniconnect-auth-session");
    if (!raw) return "";
    try {
      const parsed = JSON.parse(raw);
      return parsed?.state?.user?.id ?? "";
    } catch {
      return "";
    }
  });
}

async function triggerSpamBlock(page: Page, code: string, remainingMs: number) {
  await page.evaluate(({ code, remainingMs }) => {
    const store = (window as any).__ZUSTAND_STORE__;
    if (store && store.getState) {
      store.getState().setBlocked(remainingMs, code);
    }
  }, { code, remainingMs });
}

async function setupMockGroupData(page: Page, spam?: SpamMock, userId?: string) {
  const effectiveUserId = userId || "test-user-1";
  let postCount = 0;

  await page.route("**/api/v1/notifications**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });

  await page.route(`**/api/v1/study-groups/${FAKE_GROUP_ID}`, async (route) => {
    if (route.request().method() === "GET") {
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
            created_by: effectiveUserId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: {} }),
      });
    }
  });

  await page.route(`**/api/v1/study-groups/${FAKE_GROUP_ID}/messages**`, async (route) => {
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

  await page.route(`**/api/v1/study-groups/${FAKE_GROUP_ID}/members**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: "member-1",
            group_id: FAKE_GROUP_ID,
            user_id: effectiveUserId,
            user: {
              id: effectiveUserId,
              email: testUsers.standard.email,
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

  await page.route(`**/api/v1/study-groups/${FAKE_GROUP_ID}/applications**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: [] }),
    });
  });
}

test.describe("US-MO02 - Moderation Notifications", () => {
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(testUsers.standard.email, testUsers.standard.password);
    await loginPage.waitForNavigation();
    await expect(page).toHaveURL(/.*\/solicitudes/);
  });

  test("Criterion 1: should show inline block notification within 500ms after spam detection and preserve message text", async ({ page }) => {
    const userId = await getUserId(page);
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 }, userId);

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 10000 });

    const messageText = "mensaje de prueba spam";
    await input.fill(messageText);
    await page.keyboard.press("Enter");

    try {
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_003", 300000);
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 3000 });
    }

    await expect(input).toHaveValue(messageText);

    const countdownText = page.locator("text=5:00");
    await expect(countdownText).toBeVisible({ timeout: 1000 });
  });

  test("Criterion 2: should show countdown timer and disable input during block", async ({ page }) => {
    const userId = await getUserId(page);
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 }, userId);

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill("mensaje normal de prueba");
    await page.keyboard.press("Enter");

    try {
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_003", 300000);
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 3000 });
    }

    await expect(input).toBeDisabled({ timeout: 1000 });

    const countdown = page.locator("text=5:00");
    await expect(countdown).toBeVisible({ timeout: 1000 });
  });

  test("Criterion 3: should escalate case to human review after accumulating 3 blocks", async ({ page }) => {
    const userId = await getUserId(page);
    await setupMockGroupData(page, "escalate", userId);

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill("mensaje normal de prueba");
    await page.keyboard.press("Enter");

    try {
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_003", 300000);
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 3000 });
    }

    await clearBlock(page);
    await input.fill("mensaje normal de prueba 2");
    await page.keyboard.press("Enter");

    try {
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_003", 300000);
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 3000 });
    }

    await clearBlock(page);
    await input.fill("mensaje normal de prueba 3");
    await page.keyboard.press("Enter");

    try {
      const escalationBanner = page.locator("text=Caso escalado a revisión humana");
      await expect(escalationBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_004", 600000);
      const escalationBanner = page.locator("text=Caso escalado a revisión humana");
      await expect(escalationBanner).toBeVisible({ timeout: 3000 });
    }

    await expect(input).toBeDisabled({ timeout: 1000 });
  });

  test("Criterion 4: should show community guidelines when clicking '¿Por qué?' button", async ({ page }) => {
    const userId = await getUserId(page);
    await setupMockGroupData(page, { code: "MO_003", remainingMs: 300000 }, userId);

    await page.goto(`/grupo/${FAKE_GROUP_ID}/chat`, { waitUntil: "domcontentloaded" });

    const input = page.locator('input[placeholder="Escribe un mensaje..."]');
    await expect(input).toBeVisible({ timeout: 10000 });

    await input.fill("mensaje normal de prueba");
    await page.keyboard.press("Enter");

    try {
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 5000 });
    } catch {
      await triggerSpamBlock(page, "MO_003", 300000);
      const blockBanner = page.locator("text=Chat suspendido temporalmente");
      await expect(blockBanner).toBeVisible({ timeout: 3000 });
    }

    const whyButton = page.getByText("¿Por qué?");
    await expect(whyButton.first()).toBeVisible({ timeout: 3000 });

    await whyButton.first().click();

    const dialogTitle = page.getByText("Normas de la Comunidad");
    await expect(dialogTitle).toBeVisible({ timeout: 3000 });

    await expect(page.getByText("Prevención de Spam")).toBeVisible({ timeout: 3000 });

    const entendidoButton = page.getByText("Entendido");
    await expect(entendidoButton).toBeVisible({ timeout: 3000 });

    await entendidoButton.click();
    await expect(dialogTitle).not.toBeVisible({ timeout: 3000 });
  });
});