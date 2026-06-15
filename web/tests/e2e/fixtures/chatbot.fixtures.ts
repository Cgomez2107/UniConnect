interface AuthProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profileImageUrl?: string;
  isVerified: boolean;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}

export const studentUser: AuthProfile = {
  id: "e2e-student-001",
  email: "estudiante.prueba@ucaldas.edu.co",
  firstName: "Estudiante",
  lastName: "Prueba",
  role: "estudiante",
  isVerified: true,
  isOnboarded: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-06-01"),
};

export const adminUser: AuthProfile = {
  id: "e2e-admin-001",
  email: "admin.prueba@ucaldas.edu.co",
  firstName: "Admin",
  lastName: "Prueba",
  role: "admin",
  isVerified: true,
  isOnboarded: true,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-06-01"),
};

export function buildAuthSession(user: AuthProfile) {
  return JSON.stringify({
    state: {
      user,
      accessToken: "e2e-mock-access-token",
      refreshToken: "e2e-mock-refresh-token",
      isAuthenticated: true,
    },
    version: 0,
  });
}

export const studentAuthSession = buildAuthSession(studentUser);
export const adminAuthSession = buildAuthSession(adminUser);

export function buildChatbotResponse(overrides?: {
  reply?: string;
  referencias?: { id?: string; source?: string; similarity?: number | null }[];
}) {
  return {
    reply:
      overrides?.reply ??
      "Puedes crear un grupo de estudio desde la sección 'Grupos de Estudio' en el menú principal. Allí encontrarás un botón 'Crear Grupo'.",
    referencias: overrides?.referencias ?? [
      { id: "chunk-1", source: "Manual UniConnect", similarity: 0.85 },
    ],
  };
}

export const studentMockResponse = buildChatbotResponse();

export const adminMockResponse = buildChatbotResponse({
  reply:
    "Para **configurar** un nuevo evento institucional:\n\n1. Ve a *Eventos* en el panel de administración.\n2. Selecciona `Crear Evento`.\n3. Rellena los campos: nombre, fecha, capacidad.\n4. Asigna un **moderador** responsable.\n\n```json\n{\n  \"evento\": \"nombre\",\n  \"fecha\": \"2025-08-01\"\n}\n```",
  referencias: [
    { id: "chunk-3", source: "Manual Admin", similarity: 0.92 },
  ],
});

export const markdownRichResponse = buildChatbotResponse({
  reply:
    "# Bienvenido a UniConnect\n\nAquí tienes una lista de **funcionalidades**:\n\n- Crear *grupos de estudio*\n- Ver *próximos eventos*\n- Subir **recursos académicos**\n\n> Nota: Algunas funciones requieren verificación.\n\nEjemplo de código:\n\n```ts\nconst grupo = new GrupoEstudio({\n  nombre: \"Matemáticas\",\n  materia: \"Cálculo I\"\n});\n```\n\n---\n\nPara más información, consulta el manual.",
  referencias: [
    { id: "chunk-1", source: "Manual UniConnect", similarity: 0.91 },
    { id: "chunk-2", source: "Manual UniConnect", similarity: 0.78 },
  ],
});

export const slowDelay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));
