import { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorBanner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByPlaceholder("tu.nombre@ucaldas.edu.co");
    this.passwordInput = page.getByPlaceholder("Tu contraseña");
    this.submitButton = page.getByRole("button", { name: "Ingresar" });
    this.errorBanner = page.locator(".error-banner");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getError(): Promise<string | null> {
    try {
      await this.errorBanner.waitFor({ state: "visible", timeout: 5000 });
      return this.errorBanner.textContent();
    } catch {
      return null;
    }
  }

  async waitForNavigation(): Promise<void> {
    await this.page.waitForURL(/.*\/solicitudes/, { timeout: 10000 });
  }
}
