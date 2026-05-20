import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { INotificationStrategy, NotificacionDTO, ResultadoEnvio } from "./INotificationStrategy.js";
import type { IUserRepository } from "./IUserRepository.js";

export interface IEmailGateway {
  enviarEmail(to: string, subject: string, body: string): Promise<void>;
}

export class EmailInstitucionalStrategy implements INotificationStrategy {
  readonly canal = "email_institucional";
  private static supabaseAdminClient: SupabaseClient | null = null;

  constructor(
    private readonly emailGateway: IEmailGateway,
    private readonly userRepository: IUserRepository,
  ) {}

  private getSupabaseAdminClient(): SupabaseClient {
    if (EmailInstitucionalStrategy.supabaseAdminClient) {
      return EmailInstitucionalStrategy.supabaseAdminClient;
    }

    const supabaseUrl = process.env.SUPABASE_URL?.trim();
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL no está configurada");
    }

    if (!supabaseServiceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY no está configurada");
    }

    EmailInstitucionalStrategy.supabaseAdminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return EmailInstitucionalStrategy.supabaseAdminClient;
  }

  async enviar(notificacion: NotificacionDTO): Promise<ResultadoEnvio> {
    console.log("[Strategy: Email] Resolviendo correo para UUID:", notificacion.userId);

    const supabase = this.getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(notificacion.userId);

    if (error) {
      throw error;
    }

    const emailDestino = data.user?.email?.trim();

    if (!emailDestino) {
      throw new Error(`Usuario sin correo registrado tras intentar la lógica de perfiles (UUID: ${notificacion.userId})`);
    }

    console.log(`[Strategy: Email] Correo encontrado exitosamente: ${emailDestino}`);

    const asunto = `[UniConnect] ${notificacion.title}`;
    const cuerpo = `${notificacion.body}\n\n---\nUniConnect - Universidad`;

    try {
      await this.emailGateway.enviarEmail(emailDestino, asunto, cuerpo);
      return { canal: this.canal, exitoso: true, timestamp: new Date().toISOString() };
    } catch (error) {
      console.error("[Strategy: Email] Error de SendGrid:", error);
      throw error;
    }
  }
}
