import type { Page, Locator } from "@playwright/test";

export class ChatbotPage {
  readonly page: Page;

  readonly fabButton: Locator;
  readonly chatWindow: Locator;
  readonly headerTitle: Locator;
  readonly headerSubtitle: Locator;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly loadingIndicator: Locator;
  readonly thinkingLongIndicator: Locator;
  readonly messagesContainer: Locator;
  readonly emptyStateMessage: Locator;
  readonly clearHistoryButton: Locator;
  readonly userMessageBubbles: Locator;
  readonly assistantMessageBubbles: Locator;
  readonly referenceTags: Locator;
  readonly suggestionButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.fabButton = page.locator('button[title="UniConnect AI Assistant"]');
    this.chatWindow = page.locator(".fixed.bottom-6.right-6.z-50 > div");
    this.headerTitle = this.chatWindow.locator("h3");
    this.headerSubtitle = this.chatWindow.locator("span.text-\\[10px\\]");
    this.messageInput = this.chatWindow.locator(
      'input[placeholder="Pregúntame algo..."]'
    );
    this.sendButton = this.chatWindow.locator(
      'form button[type="submit"]'
    );
    this.loadingIndicator = this.chatWindow.locator("text=Pensando...");
    this.thinkingLongIndicator = this.chatWindow.locator(
      "text=Pensando detenidamente..."
    );
    this.messagesContainer = this.chatWindow.locator(".overflow-y-auto");
    this.emptyStateMessage = this.chatWindow.locator("text=¡Hola! Soy el asistente virtual de UniConnect");
    this.clearHistoryButton = this.chatWindow.locator(
      'button[title="Limpiar chat"]'
    );
    this.userMessageBubbles = this.chatWindow.locator(
      ".justify-end .rounded-2xl"
    );
    this.assistantMessageBubbles = this.chatWindow.locator(
      ".justify-start .rounded-2xl"
    );
    this.referenceTags = this.chatWindow.locator("text=Manual UniConnect");
    this.suggestionButtons = this.chatWindow.getByRole("button");
  }

  async open(): Promise<void> {
    const isVisible = await this.chatWindow.isVisible().catch(() => false);
    if (!isVisible) {
      await this.fabButton.click();
      await this.page.waitForTimeout(300);
    }
  }

  async close(): Promise<void> {
    const isVisible = await this.chatWindow.isVisible().catch(() => false);
    if (isVisible) {
      await this.page.locator('button[title="Cerrar chat"]').click();
      await this.page.waitForTimeout(200);
    }
  }

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.fill(text);
    await this.sendButton.click();
  }

  async getMessageCount(): Promise<number> {
    return this.userMessageBubbles.count();
  }

  async getAssistantMessageCount(): Promise<number> {
    return this.assistantMessageBubbles.count();
  }

  async getLastAssistantMessageText(): Promise<string> {
    const count = await this.assistantMessageBubbles.count();
    if (count === 0) return "";
    return (await this.assistantMessageBubbles.nth(count - 1).innerText()) ?? "";
  }

  async waitForResponse(timeout = 20000): Promise<void> {
    await this.page.waitForTimeout(500);
    let elapsed = 0;
    const step = 300;
    while (elapsed < timeout) {
      const visible = await this.loadingIndicator.isVisible().catch(() => false);
      if (!visible) return;
      await this.page.waitForTimeout(step);
      elapsed += step;
    }
  }

  async injectAuthSession(sessionJson: string): Promise<void> {
    await this.page.evaluate(
      ({ key, value }) => {
        localStorage.setItem(key, value);
      },
      { key: "uniconnect-auth-session", value: sessionJson }
    );
  }

  async clearAuthSession(): Promise<void> {
    await this.page.evaluate(() => {
      localStorage.removeItem("uniconnect-auth-session");
    });
  }

  async mockChatbotApi(
    handler: (route: any) => Promise<void>
  ): Promise<void> {
    await this.page.route("**/api/v1/chatbot/message", handler);
  }

  async clearChatbotApiMock(): Promise<void> {
    await this.page.unroute("**/api/v1/chatbot/message");
  }

  async getSessionStorageHistory(): Promise<string | null> {
    return this.page.evaluate(() => {
      return sessionStorage.getItem("uniconnect_chatbot_history");
    });
  }
}
