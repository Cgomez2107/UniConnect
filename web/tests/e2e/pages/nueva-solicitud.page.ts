import { Page, Locator } from "@playwright/test";

export class NuevaSolicitudPage {
  readonly page: Page;
  readonly titleInput: Locator;
  readonly subjectSelect: Locator;
  readonly descriptionInput: Locator;
  readonly maxMembersInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.titleInput = page.getByPlaceholder("Ej: Grupo de estudio de Cálculo I");
    this.subjectSelect = page.locator('select[name="subjectId"]');
    this.descriptionInput = page.getByPlaceholder("Describe el propósito del grupo");
    this.maxMembersInput = page.locator('input[name="maxMembers"]');
    this.submitButton = page.getByRole("button", { name: "Crear grupo" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/nueva-solicitud");
  }

  async waitForSubjectsLoaded(): Promise<void> {
    const options = this.subjectSelect.locator("option:not([value=''])");
    await options.first().waitFor({ state: "attached", timeout: 30000 });
  }

  async selectFirstSubject(): Promise<string> {
    const options = this.subjectSelect.locator("option:not([value=''])");
    const value = await options.first().getAttribute("value");
    if (!value) throw new Error("No subject options available");
    await this.subjectSelect.selectOption(value);
    return value;
  }

  async fillForm(data: {
    title: string;
    description: string;
    maxMembers: number;
  }): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.descriptionInput.fill(data.description);
    await this.maxMembersInput.fill(String(data.maxMembers));
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }
}
