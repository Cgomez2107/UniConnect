import type { Pool } from "pg";
import type { IIndicatorsRepository } from "../../domain/repositories/IIndicatorsRepository.js";
import type { Indicators } from "../../domain/decorators/StatisticsDecorator.js";
import type { Badge } from "../../domain/decorators/BadgesDecorator.js";

interface CountRow {
  count: number;
}

interface GruposRow {
  grupos_bajo_admin: number;
  grupos_participa: number;
}

interface TransferCountRow {
  count: number;
}

export class PostgresIndicatorsRepository implements IIndicatorsRepository {
  constructor(private readonly pool: Pool) {}

  async getIndicators(userId: string): Promise<Indicators> {
    const mensajes = await this.pool.query<CountRow>(
      `SELECT (
         (SELECT COUNT(*)::int FROM messages WHERE sender_id = $1) +
         (SELECT COUNT(*)::int FROM study_group_messages WHERE sender_id = $1)
       ) AS count`,
      [userId],
    );

    const grupos = await this.pool.query<GruposRow>(
      `
        WITH member_union AS (
          SELECT a.request_id, a.applicant_id AS user_id
          FROM applications a
          WHERE a.applicant_id = $1 AND a.status = 'aceptada'
          UNION
          SELECT adm.request_id, adm.user_id
          FROM study_request_admins adm
          WHERE adm.user_id = $1
        )
        SELECT
          COALESCE(SUM(CASE WHEN sr.author_id = $1 THEN 1 ELSE 0 END), 0)::int AS grupos_bajo_admin,
          COALESCE(COUNT(DISTINCT mu.request_id), 0)::int AS grupos_participa
        FROM study_requests sr
        LEFT JOIN member_union mu ON mu.request_id = sr.id
        WHERE (sr.author_id = $1 OR mu.request_id IS NOT NULL) AND sr.is_active = true
      `,
      [userId],
    );

    const row = grupos.rows[0];

    return {
      gruposBajoAdministracion: row?.grupos_bajo_admin ?? 0,
      gruposParticipa: row?.grupos_participa ?? 0,
      mensajesEnviados: mensajes.rows[0]?.count ?? 0,
    };
  }

  async getBadges(userId: string): Promise<Badge[]> {
    const totalMensajes = await this.pool.query<CountRow>(
      `SELECT (
         (SELECT COUNT(*)::int FROM messages WHERE sender_id = $1) +
         (SELECT COUNT(*)::int FROM study_group_messages WHERE sender_id = $1)
       ) AS count`,
      [userId],
    );

    const gruposCount = await this.pool.query<CountRow>(
      `
        WITH member_union AS (
          SELECT a.request_id, a.applicant_id AS user_id
          FROM applications a
          WHERE a.applicant_id = $1 AND a.status = 'aceptada'
          UNION
          SELECT adm.request_id, adm.user_id
          FROM study_request_admins adm
          WHERE adm.user_id = $1
        )
        SELECT COUNT(*)::int AS count FROM member_union
      `,
      [userId],
    );

    const transferenciasAceptadas = await this.pool.query<TransferCountRow>(
      `
        SELECT COUNT(*)::int AS count FROM study_request_admin_transfers
        WHERE to_user_id = $1 AND status = 'aceptada'
      `,
      [userId],
    );

    const transferenciasRealizadas = await this.pool.query<TransferCountRow>(
      `
        SELECT COUNT(*)::int AS count FROM study_request_admin_transfers
        WHERE from_user_id = $1 AND status = 'aceptada'
      `,
      [userId],
    );

    const badges: Badge[] = [];
    const msgs = totalMensajes.rows[0]?.count ?? 0;
    const grupos = gruposCount.rows[0]?.count ?? 0;
    const aceptadas = transferenciasAceptadas.rows[0]?.count ?? 0;
    const cedidas = transferenciasRealizadas.rows[0]?.count ?? 0;

    if (msgs >= 1) {
      badges.push({
        id: "primer-mensaje",
        nombre: "Primer Mensaje",
        descripcion: "Has enviado tu primer mensaje en la plataforma",
        iconoUrl: "/insignias/primer-mensaje.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (msgs >= 50) {
      badges.push({
        id: "conversador",
        nombre: "Conversador",
        descripcion: "Has enviado 50 mensajes en la plataforma",
        iconoUrl: "/insignias/conversador.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (grupos >= 1) {
      badges.push({
        id: "colaborador",
        nombre: "Colaborador",
        descripcion: "Participas en al menos un grupo de estudio",
        iconoUrl: "/insignias/colaborador.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (grupos >= 3) {
      badges.push({
        id: "trabajador-equipo",
        nombre: "Trabajador en Equipo",
        descripcion: "Participas en 3 o más grupos de estudio",
        iconoUrl: "/insignias/trabajador-equipo.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (aceptadas >= 3) {
      badges.push({
        id: "sucesor-confiable",
        nombre: "Sucesor Confiable",
        descripcion: "Has aceptado la administración de 3 o más grupos",
        iconoUrl: "/insignias/sucesor-confiable.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    if (cedidas >= 1) {
      badges.push({
        id: "lider-emerito",
        nombre: "Líder Emérito",
        descripcion: "Has cedido exitosamente la administración de tu grupo",
        iconoUrl: "/insignias/lider-emerito.svg",
        fechaObtenida: new Date().toISOString(),
      });
    }

    return badges;
  }
}
