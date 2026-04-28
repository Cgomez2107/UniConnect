import { expect, test } from "@playwright/test";

const clearWebStorage = async (page: import("@playwright/test").Page) => {
  await page.goto("/");
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
};

const MOCK_USER = {
  id: "e2e-user",
  email: "e2e.user@ucaldas.edu.co",
  fullName: "E2E Usuario",
  avatarUrl: null,
  phoneNumber: null,
  role: "estudiante" as const,
  semester: null,
  bio: null,
};

const seedMockAuth = async (
  page: import("@playwright/test").Page,
  user = MOCK_USER,
) => {
  await page.addInitScript((mockUser) => {
    (window as any).__E2E_MOCK_AUTH__ = mockUser;
  }, user);
};

const toBase64Url = (value: string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");

const buildFakeAccessToken = (email: string) => {
  const header = toBase64Url(JSON.stringify({ alg: "none", typ: "JWT" }));
  const payload = toBase64Url(JSON.stringify({ email }));
  return `${header}.${payload}.`;
};

test.describe("US-W01 - Login web institucional", () => {
  test("C1/C4: OAuth inicia con Google (mock)", async ({ page }) => {
    await seedMockAuth(page);
    await clearWebStorage(page);

    await page.goto("/");
    await expect(page.getByText("Feed", { exact: true })).toBeVisible();
    expect(page.url()).not.toContain("/login");
  });

  test("C2: sesion persiste al recargar (mock)", async ({ page }) => {
    await seedMockAuth(page);
    await clearWebStorage(page);

    await page.goto("/");
    await expect(page.getByText("Feed", { exact: true })).toBeVisible();

    await page.reload();
    await expect(page.getByText("Feed", { exact: true })).toBeVisible();
    expect(page.url()).not.toContain("/login");
  });

  test("C3: correo no institucional rechaza acceso", async ({ page }) => {
    await clearWebStorage(page);

    const fakeToken = buildFakeAccessToken("e2e.bad@gmail.com");
    await page.goto(`/oauth-callback#access_token=${fakeToken}`);
    await page.waitForURL(/login\?error_type=domain_rejected/i, { timeout: 60_000 });
    await expect(
      page.getByText(/Debes usar tu correo institucional/i),
    ).toBeVisible();
  });
});
