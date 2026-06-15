import { PromptStrategyContext } from "../../domain/strategies/PromptStrategyContext.js";

export class SendMessageUseCase {
  private strategyContext: PromptStrategyContext;

  constructor() {
    this.strategyContext = new PromptStrategyContext();
  }

  async execute(role: string, message: string, history?: any[], userId?: string): Promise<{ reply: string; referencias?: any[] }> {
    const startTime = performance.now();
    const systemPrompt = this.strategyContext.buildPromptForRole(role);

    const webhookUrl = process.env.CHATBOT_WEBHOOK_URL;

    if (!webhookUrl || webhookUrl.includes("webhook.site") || webhookUrl === "MOCK_URL") {
      const duration = performance.now() - startTime;
      console.log(JSON.stringify({
        event: "chatbot_mock",
        service: "chatbot",
        duration: `${duration.toFixed(2)}ms`,
        role,
        userId: userId || "",
      }));

      if (role === "admin") {
        return {
          reply: `[Simulación Admin Bot] Hola Administrador. Analizando el sistema con las siguientes directivas:\n- Prompt de Sistema: "${systemPrompt.substring(0, 80)}..."\n- Tu mensaje: "${message}"\n- Respuesta: Todo el sistema está funcionando a niveles óptimos con 0 logs de error.`,
          referencias: [],
        };
      } else {
        return {
          reply: `[Simulación Estudiante Bot] Hola Estudiante. Conectado bajo las directivas:\n- Prompt de Sistema: "${systemPrompt.substring(0, 80)}..."\n- Tu mensaje: "${message}"\n- Respuesta: Recuerda que solo puedo dar información sobre la plataforma UniConnect (foros, chats, grupos de estudio, recursos, etc.).`,
          referencias: [],
        };
      }
    }

    try {
      console.log(JSON.stringify({
        event: "rag_request",
        service: "chatbot",
        webhookUrl,
        role,
        userId: userId || "",
        preguntaLength: message.length,
      }));

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pregunta: message,
          rol: role,
          userId: userId || "",
        }),
      });

      const duration = performance.now() - startTime;

      if (!response.ok) {
        console.error(JSON.stringify({
          event: "rag_error",
          service: "chatbot",
          status: response.status,
          duration: `${duration.toFixed(2)}ms`,
          role,
          userId: userId || "",
        }));
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const reply = data.reply || data.response || JSON.stringify(data);
      const referencias = data.referencias || [];

      console.log(JSON.stringify({
        event: "rag_success",
        service: "chatbot",
        duration: `${duration.toFixed(2)}ms`,
        chunksCount: referencias.length,
        role,
        userId: userId || "",
      }));

      return { reply, referencias };
    } catch (error: any) {
      const duration = performance.now() - startTime;
      console.error(JSON.stringify({
        event: "rag_error",
        service: "chatbot",
        error: error.message,
        duration: `${duration.toFixed(2)}ms`,
        role,
        userId: userId || "",
      }));

      return {
        reply: `[Error de Conexión] No se pudo conectar con el servicio de Inteligencia Artificial. (Detalle: ${error.message})`,
        referencias: [],
      };
    }
  }
}
