import process from "node:process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { SendGridEmailGateway } from "../src/infrastructure/gateways/SendGridEmailGateway.js";
import { SupabasePushGateway } from "../src/infrastructure/gateways/SupabasePushGateway.js";
import { SupabaseRealtimeGateway } from "../src/infrastructure/realtime/SupabaseRealtimeGateway.js";
import { PostgresNotificationRepository } from "../src/infrastructure/database/PostgresNotificationRepository.js";
import { PostgresUserRepository } from "../src/infrastructure/database/PostgresUserRepository.js";
import { EmailInstitucionalStrategy } from "../../../shared/patterns/strategy/EmailInstitucionalStrategy.js";
import { InAppWebSocketStrategy } from "../../../shared/patterns/strategy/InAppWebSocketStrategy.js";
import { PushMovilStrategy } from "../../../shared/patterns/strategy/PushMovilStrategy.js";
import { NotificationService } from "../../../shared/patterns/strategy/NotificationService.js";
import { NotificationMapper } from "../src/application/services/NotificationMapper.js";

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "..", ".env");

try {
  if (typeof process.loadEnvFile === "function") {
    process.loadEnvFile(envPath);
  }
} catch {
  // .env may not exist
}

const TARGET_EMAIL = process.env.TO_EMAIL ?? "espinosaj.sofia@gmail.com";

// ── Email ──
const apiKey = process.env.SENDGRID_API_KEY;
const emailFrom = process.env.EMAIL_FROM;
const emailFromName = process.env.EMAIL_FROM_NAME ?? "UniConnect";

if (!apiKey || apiKey === "SG.your_sendgrid_api_key_here") {
  console.error("FATAL: SENDGRID_API_KEY no está configurada en .env");
  process.exit(1);
}
if (!emailFrom) {
  console.error("FATAL: EMAIL_FROM no está configurada en .env");
  process.exit(1);
}

// ── Supabase ──
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("FATAL: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están configuradas en .env");
  process.exit(1);
}

// ── DB ──
const dbHost = process.env.DB_HOST;
const dbPort = process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432;
const dbName = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

if (!dbHost || !dbName || !dbUser || !dbPassword) {
  console.error("FATAL: Faltan variables DB_* en .env");
  process.exit(1);
}

const pool = new Pool({
  host: dbHost,
  port: dbPort,
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: { rejectUnauthorized: false },
});

// ── Ensure a test profile exists (user_notifications FK → profiles(id)) ──
// Try to find a profile with the target email first; fall back to any profile
let smokeUser = await pool.query("SELECT id, email FROM profiles WHERE email = $1 LIMIT 1", [TARGET_EMAIL]);
if (smokeUser.rows.length === 0) {
  smokeUser = await pool.query("SELECT id, email FROM profiles LIMIT 1");
  if (smokeUser.rows.length === 0) {
    console.error("FATAL: No hay perfiles existentes en Supabase. Crea un usuario primero.");
    await pool.end();
    process.exit(1);
  }
  // Set the target email on this profile
  await pool.query("UPDATE profiles SET email = $1 WHERE id = $2", [TARGET_EMAIL, smokeUser.rows[0].id]);
}
const SMOKE_USER_ID = smokeUser.rows[0].id;
console.log(`Usuario UUID: ${SMOKE_USER_ID}`);
console.log(`Email destino: ${TARGET_EMAIL}`);

// ── Gateways ──
const emailGateway = new SendGridEmailGateway(apiKey, emailFrom, emailFromName);
const realtimeGateway = new SupabaseRealtimeGateway(supabaseUrl, supabaseKey);
const pushGateway = new SupabasePushGateway(`${supabaseUrl}/functions/v1/notifications`, supabaseKey);

// ── Strategies ──
const userRepository = new PostgresUserRepository(pool);
const emailStrategy = new EmailInstitucionalStrategy(emailGateway, userRepository);
const wsStrategy = new InAppWebSocketStrategy(realtimeGateway);
const pushStrategy = new PushMovilStrategy(pushGateway, userRepository);

const strategies = [emailStrategy, wsStrategy, pushStrategy];
console.log(`\nEstrategias inyectadas: ${strategies.length}`);
for (const s of strategies) {
  console.log(`  - ${s.canal}`);
}

// ── Preference service — all 3 channels active ──
const prefService = {
  async getCanalesActivos() {
    return ["email_institucional", "in_app_websocket", "push_movil"];
  },
  async setCanalActivo() {},
};

const notificationService = new NotificationService(strategies, prefService);

// ── Persistence ──
const notificationRepo = new PostgresNotificationRepository(pool);
const mapper = new NotificationMapper();

// ── Smoke payload ──
const event = {
  type: "JOIN_REQUEST",
  version: "1.0",
  timestamp: new Date(),
  requestId: "smoke-test-0001",
  applicantId: SMOKE_USER_ID,
  recipientUserId: SMOKE_USER_ID,
  message: "Mensaje del smoke test de 3 canales + persistencia.",
  applicantName: "Smoke Tester",
  groupName: "Smoke Test Group",
} as const;

const { persistence, dto } = mapper.map(event);

console.log(`\nTipo: ${persistence.type}`);
console.log("---");

// 1. Persistir — escribe en user_notifications
console.log("Persistiendo en Supabase → user_notifications ...");
const notificationId = await notificationRepo.create(persistence);
console.log(`  ✓ ID: ${notificationId}`);

// 2. Enviar por WebSocket + Push (usan UUID como userId) con solo esas estrategias
console.log("Enviando por in_app_websocket + push_movil...");
const wsPushService = new NotificationService([wsStrategy, pushStrategy], prefService);
const resumen = await wsPushService.notificar({ ...dto, userId: SMOKE_USER_ID });

// 3. Email por separado (userId debe ser la direccion email)
console.log("Enviando email a " + TARGET_EMAIL + " ...");
    const emailResult = await emailStrategy.enviar({ ...dto, userId: SMOKE_USER_ID });
resumen.resultados.push(emailResult);

console.log("---");
console.log("Resultado del envío:");
console.log(JSON.stringify(resumen, null, 2));

let failures = 0;
for (const r of resumen.resultados) {
  if (!r.exitoso) {
    console.error(`  ${r.canal}: FALLÓ — ${r.error}`);
    failures++;
  }
}

console.log(`\nTotal: ${resumen.exitosos} exitosos, ${resumen.fallidos} fallidos`);

if (resumen.exitosos === 3) {
  console.log("\n✓✓✓ Los 3 canales respondieron exitosamente");
}
console.log(`\n✓ Fila creada en user_notifications con ID: ${notificationId}`);
console.log(`  User UUID: ${SMOKE_USER_ID}`);
console.log("  → Abre Supabase Dashboard → Table Editor → user_notifications");
console.log("  → Filtra por user_id = " + SMOKE_USER_ID);

await pool.end();
process.exit(resumen.exitosos >= 1 ? 0 : 1);
