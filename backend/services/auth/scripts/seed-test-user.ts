import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFileFallback(): void {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

interface TestUser {
  email: string;
  password: string;
  fullName: string;
}

const TEST_USERS: TestUser[] = [
  { email: "test@ucaldas.edu.co", password: "Test1234", fullName: "Estudiante Test" },
  { email: "estudiante.prueba@ucaldas.edu.co", password: "Test1234", fullName: "Estudiante Prueba" },
];

async function tryUrl(url: string, user: TestUser): Promise<boolean> {
  try {
    const res = await fetch(`${url}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (res.status === 201) {
      const body = await res.json() as { data?: { accessToken?: string; refreshToken?: string; user?: { id: string; email: string; fullName: string; role: string } } };
      const data = body.data;
      console.log(`\n✅ Usuario creado: ${user.email}`);
      console.log(`   Nombre: ${data?.user?.fullName ?? "?"}`);
      console.log(`   Role: ${data?.user?.role ?? "?"}`);
      console.log(`   Access Token: ${data?.accessToken ?? "?"}`);
      if (data?.refreshToken) {
        console.log(`   Refresh Token: ${data.refreshToken}`);
      }
      return true;
    }

    if (res.status === 409) {
      console.log(`\n⚠️  El usuario ya existe: ${user.email}`);
      return true;
    }

    if (res.status === 400) {
      const body = await res.json().catch(() => null);
      console.log(`\n❌ Error de validación (400): ${JSON.stringify(body)}`);
      return false;
    }

    console.log(`\n❌ Error ${res.status} para ${user.email}: ${await res.text().catch(() => "Unknown")}`);
    return false;
  } catch {
    return false;
  }
}

async function main() {
  loadEnvFileFallback();

  const urls = [
    process.env.AUTH_SERVICE_URL,
    `http://localhost:${process.env.PORT ?? "3102"}`,
    "http://localhost:3102",
    "http://auth:3102",
  ].filter(Boolean) as string[];

  const uniqueUrls = [...new Set(urls)];

  for (const user of TEST_USERS) {
    console.log(`\n🔍 Intentando crear usuario: ${user.email}`);

    let success = false;
    for (const url of uniqueUrls) {
      console.log(`   → Probando ${url}...`);
      success = await tryUrl(url, user);
      if (success) break;
    }

    if (!success) {
      console.log(`\n❌ No se pudo crear ${user.email} en ninguna URL.`);
      console.log(`   Asegúrate de que el auth service esté corriendo.`);
      console.log(`   URLs intentadas: ${uniqueUrls.join(", ")}`);
    }
  }

  console.log("\n---\n📝 Para usar el usuario en la web, inicia sesión con:");
  console.log(`   Email: ${TEST_USERS[0].email}`);
  console.log(`   Password: ${TEST_USERS[0].password}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
