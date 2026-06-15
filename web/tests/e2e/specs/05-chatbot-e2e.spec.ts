import { test, expect, type Page, type Route } from "@playwright/test";
import { ChatbotPage } from "../pages/chatbot.page";
import {
  studentAuthSession,
  adminAuthSession,
  studentMockResponse,
  adminMockResponse,
  markdownRichResponse,
} from "../fixtures/chatbot.fixtures";

async function setupStudentSession(page: Page, chatbotPage: ChatbotPage) {
  await chatbotPage.injectAuthSession(studentAuthSession);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await chatbotPage.open();
}

async function setupAdminSession(page: Page, chatbotPage: ChatbotPage) {
  await chatbotPage.injectAuthSession(adminAuthSession);
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await chatbotPage.open();
}

async function mockChatbotOk(
  page: Page,
  responseBody: Record<string, unknown>
) {
  await page.route("**/api/v1/chatbot/message", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(responseBody),
    });
  });
}

async function mockChatbotWithDelay(
  page: Page,
  delayMs: number,
  responseBody?: Record<string, unknown>
) {
  await page.route("**/api/v1/chatbot/message", async (route: Route) => {
    await new Promise((r) => setTimeout(r, delayMs));
    if (responseBody) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(responseBody),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          studentMockResponse
        ),
      });
    }
  });
}

test.describe("US-CB01 - Role-Aware Chatbot E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
  });

  test.describe("Criterion 1: Estudiante - respuestas con referencias e historial", () => {
    test("should display student-themed header and respond with references", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await expect(chatbot.headerTitle).toHaveText("UniConnect AI");
      await expect(chatbot.headerSubtitle).toHaveText("Asistente Virtual");

      await mockChatbotOk(page, studentMockResponse);

      await chatbot.sendMessage("¿Cómo crear un grupo de estudio?");
      await chatbot.waitForResponse();

      await expect(chatbot.assistantMessageBubbles.first()).toBeVisible();
      const replyText = await chatbot.getLastAssistantMessageText();
      expect(replyText).toContain("grupo de estudio");

      await expect(chatbot.referenceTags.first()).toBeVisible();
    });

    test("should persist session history in sessionStorage", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, studentMockResponse);
      await chatbot.sendMessage("¿Cómo crear un grupo?");
      await chatbot.waitForResponse();

      const history = await chatbot.getSessionStorageHistory();
      expect(history).not.toBeNull();

      if (history) {
        const parsed = JSON.parse(history);
        expect(parsed.length).toBeGreaterThanOrEqual(2);
        expect(parsed[0].role).toBe("user");
        expect(parsed[0].content).toContain("grupo");
        expect(parsed[parsed.length - 1].role).toBe("assistant");
      }
    });

    test("should preserve messages after closing and reopening the widget", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, studentMockResponse);
      await chatbot.sendMessage("¿Cómo crear un grupo?");
      await chatbot.waitForResponse();

      const bubbleCountBefore = await chatbot.getAssistantMessageCount();

      await chatbot.close();
      await chatbot.open();

      const bubbleCountAfter = await chatbot.getAssistantMessageCount();
      expect(bubbleCountAfter).toBe(bubbleCountBefore);
    });
  });

  test.describe("Criterion 2: Super Admin - respuestas técnicas con diferenciación visual", () => {
    test("should display admin-themed header with technical subtitle", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupAdminSession(page, chatbot);

      await expect(chatbot.headerTitle).toHaveText("UniConnect Admin AI");
      await expect(chatbot.headerSubtitle).toHaveText(
        "Soporte Técnico Especializado"
      );
    });

    test("should show admin-oriented suggestions instead of student ones", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupAdminSession(page, chatbot);

      const suggestionTexts = await chatbot.suggestionButtons.allInnerTexts();
      const allSuggestions = suggestionTexts.join(" ");

      expect(allSuggestions).toContain("moderar");
      expect(allSuggestions).toContain("evento institucional");
      expect(allSuggestions).not.toContain("subir un recurso");
    });

    test("should return technically detailed response with admin references", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupAdminSession(page, chatbot);

      await mockChatbotOk(page, adminMockResponse);

      await chatbot.sendMessage("¿Cómo configurar un evento institucional?");
      await chatbot.waitForResponse();

      const replyText = await chatbot.getLastAssistantMessageText();
      expect(replyText).toContain("configurar");
      expect(replyText).toContain("Eventos");

      await expect(chatbot.referenceTags.first()).toBeVisible();
    });
  });

  test.describe("Criterion 3: Degradación elegante ante timeout >15s", () => {
    test("should show loading indicator immediately after sending message", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotWithDelay(page, 20000);

      await chatbot.sendMessage("consulta lenta");
      await expect(chatbot.loadingIndicator).toBeVisible({ timeout: 3000 });
    });

    test('should show "Pensando detenidamente..." after 10 seconds', async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotWithDelay(page, 20000);

      chatbot.sendMessage("consulta lenta");
      await expect(chatbot.thinkingLongIndicator).toBeVisible({
        timeout: 12000,
      });
    });

    test("should display graceful degradation message after 15 seconds and re-enable input", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotWithDelay(page, 20000);

      await chatbot.sendMessage("consulta lenta");

      const degradationMsg = page.locator(
        "text=El asistente está tomando más tiempo de lo esperado"
      );
      await expect(degradationMsg).toBeVisible({ timeout: 20000 });

      await expect(chatbot.messageInput).toBeEnabled({ timeout: 3000 });
    });
  });

  test.describe("Criterion 4: Renderizado Markdown y scroll automático", () => {
    test("should render bold text with <strong> tag", async ({ page }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, markdownRichResponse);
      await chatbot.sendMessage("dame info detallada");
      await chatbot.waitForResponse();

      const boldElement = chatbot.assistantMessageBubbles.locator("strong");
      await expect(boldElement.first()).toBeVisible();
    });

    test("should render unordered lists with <ul> and <li>", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, markdownRichResponse);
      await chatbot.sendMessage("dame info detallada");
      await chatbot.waitForResponse();

      const list = chatbot.assistantMessageBubbles.locator("ul");
      await expect(list).toBeVisible();
      const items = list.locator("li");
      const count = await items.count();
      expect(count).toBeGreaterThanOrEqual(2);
    });

    test("should render code blocks with <pre> and <code>", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, markdownRichResponse);
      await chatbot.sendMessage("dame info detallada");
      await chatbot.waitForResponse();

      const preBlock = chatbot.assistantMessageBubbles.locator("pre");
      await expect(preBlock).toBeVisible();
      const codeBlock = preBlock.locator("code");
      await expect(codeBlock).toBeVisible();
    });

    test("should auto-scroll to bottom after receiving response", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, markdownRichResponse);

      const scrollContainer = chatbot.messagesContainer;

      await chatbot.sendMessage("dame info detallada");
      await chatbot.waitForResponse();

      const scrollTop = await scrollContainer.evaluate((el) => el.scrollTop);
      const scrollHeight = await scrollContainer.evaluate(
        (el) => el.scrollHeight
      );
      const clientHeight = await scrollContainer.evaluate(
        (el) => el.clientHeight
      );

      expect(scrollTop + clientHeight).toBeGreaterThanOrEqual(
        scrollHeight - 10
      );
    });

    test("should clear input and re-enable it after response", async ({
      page,
    }) => {
      const chatbot = new ChatbotPage(page);
      await setupStudentSession(page, chatbot);

      await mockChatbotOk(page, markdownRichResponse);

      await chatbot.sendMessage("dame info detallada");
      await chatbot.waitForResponse();

      await expect(chatbot.messageInput).toBeEnabled();
      await expect(chatbot.messageInput).toHaveValue("");
    });
  });
});
