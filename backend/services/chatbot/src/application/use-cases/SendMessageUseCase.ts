import { PromptStrategyContext } from "../../domain/strategies/PromptStrategyContext.js";

export class SendMessageUseCase {
  private strategyContext: PromptStrategyContext;

  constructor() {
    this.strategyContext = new PromptStrategyContext();
  }

  async execute(role: string, message: string, history?: any[], userId?: string): Promise<{ reply: string; referencias?: any[] }> {
    const systemPrompt = this.strategyContext.buildPromptForRole(role);

    const webhookUrl = process.env.CHATBOT_WEBHOOK_URL;

    // ⚠️ MOCK INTEGRATION WARNING COMMENT:
    // ESTE MOCK SE UTILIZA ESTRICTAMENTE PARA PODER AISLAR LA HISTORIA Y CUMPLIR LOS CRITERIOS DE ACEPTACIÓN ACTUALES.
    // UNA VEZ FINALIZADA LA HISTORIA, SE DEBE CAMBIAR EL DESTINO PARA LLAMAR AL FLUJO DE PRODUCCIÓN DE N8N REAL.
    // SI CHATBOT_WEBHOOK_URL APUNTA A WEBHOOK.SITE O SI FALLA, DEVOLVEREMOS UN MENSAJE DE SIMULACIÓN PARA EVITAR QUE SE DETENGA EL FLUJO.
    if (!webhookUrl || webhookUrl.includes("webhook.site") || webhookUrl === "MOCK_URL") {
      console.log(`[SendMessageUseCase Mock] Hitting mock Webhook URL: ${webhookUrl}`);
      console.log(`[SendMessageUseCase Mock] Role: ${role}, Message: "${message}"`);
      console.log(`[SendMessageUseCase Mock] Prompt applied:\n${systemPrompt}`);
      
      // Simulate chatbot response based on the role and prompt rules
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

      if (!response.ok) {
        throw new Error(`Webhook responded with status ${response.status}`);
      }

      const data = (await response.json()) as any;
      const reply = data.reply || data.response || JSON.stringify(data);
      const referencias = data.referencias || [];
      return { reply, referencias };
    } catch (error: any) {
      console.error(`[SendMessageUseCase Error] Failed to call webhook: ${error.message}`);
      return {
        reply: `[Error de Conexión] No se pudo conectar con el servicio de Inteligencia Artificial. (Detalle: ${error.message})`,
        referencias: [],
      };
    }
  }
}
