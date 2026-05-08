import type { Pool } from "pg";
import type { IIndicadoresRepository } from "../../domain/repositories/IIndicadoresRepository.js";
import type { Indicadores } from "../../domain/decorators/EstadisticasDecorator.js";
import type { Insignia } from "../../domain/decorators/InsigniasDecorator.js";

interface MensajesCountRow {
  count: number;
}

interface GruposCountRow {
  grupos_creados: number;
  grupos_participa: number;
}

export class PostgresIndicadoresRepository implements IIndicadoresRepository {
  constructor(private readonly pool: Pool) {}

  async getIndicadores(userId: string): Promise<Indicadores> {
    const mensajes = await this.pool.query<MensajesCountRow>(
      "SELECT COUNT(*)::int AS count FROM messages WHERE sender_id = $1",
      [userId],
    );

    const grupos = await this.pool.query<GruposCountRow>(
      `
        SELECT
          COALESCE(SUM(CASE WHEN sr.author_id = $1 THEN 1 ELSE 0 END), 0)::int AS grupos_creados,
          COALESCE(COUNT(DISTINCT a.request_id), 0)::int AS grupos_participa
        FROM study_requests sr
        LEFT JOIN applications a ON a.request_id = sr.id AND a.status = 'aceptada' AND a.applicant_id = $1
        WHERE (sr.author_id = $1 OR a.applicant_id = $1) AND sr.is_active = true
      `,
      [userId],
    );

    const row = grupos.rows[0];

    return {
      gruposCreados: row?.grupos_creados ?? 0,
      gruposParticipa: row?.grupos_participa ?? 0,
      mensajesEnviados: mensajes.rows[0]?.count ?? 0,
    };
  }

  async getInsignias(userId: string): Promise<Insignia[]> {
    const totalMensajes = await this.pool.query<MensajesCountRow>(
      "SELECT COUNT(*)::int AS count FROM messages WHERE sender_id = $1",
      [userId],
    );

    const gruposCount = await this.pool.query<MensajesCountRow>(
      `
        SELECT COUNT(*)::int AS count FROM applications
        WHERE applicant_id = $1 AND status = 'aceptada'
      `,
      [userId],
    );

    const insignias: Insignia[] = [];
    const msgs = totalMensajes.rows[0]?.count ?? 0;
    const grupos = gruposCount.rows[0]?.count ?? 0;

    if (msgs >= 1) {
      insignias.push({
        id: "primer-mensaje",
        nombre: "Primer Mensaje",
        descripcion: "Has enviado tu primer mensaje en la plataforma",
        iconoUrl: "/insignias/primer-mensaje.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (msgs >= 50) {
      insignias.push({
        id: "conversador",
        nombre: "Conversador",
        descripcion: "Has enviado 50 mensajes en la plataforma",
        iconoUrl: "/insignias/conversador.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (grupos >= 1) {
      insignias.push({
        id: "colaborador",
        nombre: "Colaborador",
        descripcion: "Participas en al menos un grupo de estudio",
        iconoUrl: "/insignias/colaborador.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (grupos >= 3) {
      insignias.push({
        id: "trabajador-equipo",
        nombre: "Trabajador en Equipo",
        descripcion: "Participas en 3 o más grupos de estudio",
        iconoUrl: "/insignias/trabajador-equipo.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    return insignias;
  }
}
