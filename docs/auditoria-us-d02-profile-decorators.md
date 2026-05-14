# Auditoría US-D02: Patrón Decorator — Perfil de Estudiante

> **Auditor:** Arquitecto de Software Senior  
> **Servicio:** `backend/services/profiles-catalog`  
> **Patrón:** Decorator (GoF)  
> **Fecha:** 2026-05-12  

---

## 1. Reporte de Cumplimiento

| ID | Criterio | Estado | Evidencia |
|---|---|---|---|
| **Estructura** | Interfaz común `IProfile` existe | ✅ **CUMPLIDO** | `IProfile.ts` con `getBaseInfo()`, `getMetadata()`, `render()`, `toJSON()` |
| **Estructura** | Decoradores usan composición, NO heredan de `BaseProfile` | ✅ **CUMPLIDO** | `ProfileDecorator` compone `IProfile`, decoradores `extends ProfileDecorator` |
| **AC-01** | `StatisticsDecorator` añade `indicadores` sin modificar `BaseProfile` | ✅ **CUMPLIDO** | `getMetadata()` hace spread + agrega `indicadores` |
| **AC-02** | `BadgesDecorator` añade `insignias` sin modificar `BaseProfile` | ✅ **CUMPLIDO** | `getMetadata()` hace spread + agrega `insignias` |
| **AC-03** | Decoradores se apilan correctamente | ✅ **CUMPLIDO** | `BadgesDecorator(StatisticsDecorator(BaseProfile))` preserva todas las capas |
| **AC-04** | `GET /perfil/:id?vista=completa` devuelve perfil decorado | ✅ **CUMPLIDO** | Controller invoca `getFullProfileUC.execute()` → cadena de decoradores |
| **AC-05** | `GET /perfil/:id` (sin `vista`) NO ejecuta consultas pesadas | ✅ **CUMPLIDO** | Controller retorna `result` directamente, `GetFullProfile` jamás se toca |
| **Resiliencia** | Caída del repo de indicadores retorna `BaseProfile` graceful | ✅ **CUMPLIDO** | `GetFullProfile.execute()` catch → `return baseProfile` |

---

## 2. Estructura del Patrón

### Diagrama de clases

```
┌─────────────────────────────────────────────────────────────┐
│                    <<interface>>                             │
│                       IProfile                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  +id: string                                          │  │
│  │  +fullName: string                                    │  │
│  │  +avatarUrl: string | null                            │  │
│  │  +getBaseInfo(): Record<string, unknown>               │  │
│  │  +getMetadata(): Record<string, unknown>               │  │
│  │  +render(): string                                     │  │
│  │  +toJSON(): Record<string, unknown>                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
              ▲                        ▲
              │                        │
              │ implements             │ implements
              │                        │
┌─────────────────────────┐  ┌─────────────────────────────────────┐
│      BaseProfile        │  │       ProfileDecorator (abstract)   │
│  (Concrete Component)   │  │  ┌───────────────────────────────┐  │
│─────────────────────────│  │  │ #profile: IProfile            │  │
│  -carrera: string       │  │  │───────────────────────────────│  │
│  -semestre: number|null │  │  │ +getMetadata(): delegado      │  │
│  -asignaturasActivas[]  │  │  │ +render(): delegado           │  │
└─────────────────────────┘  │  └───────────────────────────────┘  │
                             └─────────────────────────────────────┘
                                              ▲
                                              │
                                              │ extends
                                    ┌─────────┴──────────┐
                                    │                    │
                        ┌───────────────────┐  ┌──────────────────┐
                        │StatisticsDecorator│  │ BadgesDecorator  │
                        │ (Concrete Decor.) │  │ (Concrete Decor.)│
                        │───────────────────│  │──────────────────│
                        │ -indicators       │  │ -badges[]        │
                        │───────────────────│  │──────────────────│
                        │ +getMetadata()    │  │ +getMetadata()   │
                        │   spread +        │  │   spread +       │
                        │   indicadores     │  │   insignias      │
                        │ +render()         │  │ +render()        │
                        └───────────────────┘  └──────────────────┘
```

### Composición (NO herencia de la base)

La validación clave del patrón Decorator es que los decoradores **no heredan de `BaseProfile`**, sino que implementan la misma interfaz y **componen** una instancia de `IProfile`:

`ProfileDecorator.ts:4-7`:
```typescript
export abstract class ProfileDecorator implements IProfile {
  protected readonly profile: IProfile;   // ← COMPOSICIÓN

  constructor(profile: IProfile) {        // ← inyectado desde fuera
    this.profile = profile;
  }
}
```

`StatisticsDecorator.ts:13-16`:
```typescript
export class StatisticsDecorator extends ProfileDecorator {
  constructor(profile: IProfile, indicators: Indicators) {
    super(profile);   // ← delega al abstract, NO a BaseProfile
    this.indicators = indicators;
  }
}
```

`BaseProfile` jamás aparece en la cadena de herencia de los decoradores. Solo `ProfileDecorator` es la clase base de la que heredan.

---

## 3. Validación AC-01/02/03: Cómo se añaden campos sin modificar BaseProfile

### StatisticsDecorator — añade `indicadores`

```typescript
// StatisticsDecorator.ts:22-27
override getMetadata(): Record<string, unknown> {
  return {
    ...this.profile.getMetadata(),          // ← preserva datos existentes
    indicadores: this.indicators,           // ← agrega campo nuevo
  };
}
```

### BadgesDecorator — añade `insignias`

```typescript
// BadgesDecorator.ts:24-35
override getMetadata(): Record<string, unknown> {
  return {
    ...this.profile.getMetadata(),          // ← preserva stats + base
    insignias: this.badges.map(...),        // ← agrega campo nuevo
  };
}
```

### Cadena completa en `GetFullProfile`

```typescript
// GetFullProfile.ts:22-25
return new BadgesDecorator(
  new StatisticsDecorator(baseProfile, indicators),
  badges,
);
```

El `toJSON()` final produce:

```json
{
  "id": "user-123",
  "fullName": "Carlos Pérez",
  "carrera": "Ingeniería de Sistemas",
  "semestre": 6,
  "asignaturasActivas": [...],
  "indicadores": {
    "gruposCreados": 3,
    "gruposParticipa": 5,
    "mensajesEnviados": 42
  },
  "insignias": [
    { "id": "primer-mensaje", "nombre": "Primer Mensaje", ... },
    { "id": "colaborador", "nombre": "Colaborador", ... }
  ]
}
```

`BaseProfile` no se tocó. `StatisticsDecorator` y `BadgesDecorator` extienden funcionalidad vía composición.

---

## 4. Validación AC-04/05: Controller GET /perfil/:id

### Fragmento clave del controller

```typescript
// ProfilesCatalogController.ts:89-94
if (vista === "completa") {
  const decorado = await this.getFullProfileUC.execute(result);
  sendData(res, 200, decorado.toJSON());
} else {
  sendData(res, 200, result);   // ← perfil base, sin consultas pesadas
}
```

### AC-05: Sin `?vista=completa` — NO se ejecutan consultas pesadas

Cuando la URL es `GET /perfil/:id` (sin query params), el flujo es:

1. `getStudentProfile()` recibe `vista = null`
2. Ejecuta `getPublicProfile.execute(studentId)` → consulta SQL ligera (datos básicos del estudiante)
3. `vista !== "completa"` → **no entra al `if`**
4. Retorna `sendData(res, 200, result)` — el objeto plano del estudiante
5. **`GetFullProfile` jamás se instancia**, `indicatorsRepository.getIndicators()` y `getBadges()` nunca se llaman

Prueba de que no se invocan:
```typescript
// profile.spec.ts:22-29
const fakeIndicatorsRepo = {
  getIndicators: () => { throw new Error("Should not be called"); },
  getBadges: () => { throw new Error("Should not be called"); },
} as any;
// El test pasa → el error NUNCA se lanza
```

### AC-04: Con `?vista=completa` — se envuelve con decoradores

Cuando la URL es `GET /perfil/:id?vista=completa`:

1. `vista = "completa"` 
2. Entra al `if` → ejecuta `getFullProfileUC.execute(result)`
3. `GetFullProfile.execute()` construye:
   ```
   BadgesDecorator(
     StatisticsDecorator(
       BaseProfile(student)
     )
   )
   ```
4. Se serializa con `decorado.toJSON()` → `getMetadata()` en cadena (spread recursivo)

---

## 5. Prueba de Consola (Composición de Decoradores)

El archivo `backend/services/profiles-catalog/src/domain/decorators/decorator.test.ts` ya implementa exactamente la prueba solicitada. Existe desde la implementación original y ejecuta:

```
▶ node backend/services/profiles-catalog/src/domain/decorators/decorator.test.ts
```

```
================================================================================
PRUEBA DE COMPOSICIÓN DE DECORADORES DE PERFIL
================================================================================

📝 PASO 1: Crear BaseProfile
--------------------------------------------------------------------------------
BaseProfile creado:
  Nombre: Carlos Pérez
  Carrera: Ingeniería de Sistemas
  Semestre: 6
  Render: Carlos Pérez - Ingeniería de Sistemas (Semestre 6)
  getBaseInfo() contiene: id, fullName, avatarUrl, carrera, semestre, asignaturasActivas

📊 PASO 2: Envolver con StatisticsDecorator
--------------------------------------------------------------------------------
StatisticsDecorator aplicado:
  Render: Carlos Pérez - Ingeniería de Sistemas (Semestre 6) | Actividad: 42 msgs, 3 grupos creados, participa en 5
  Grupos creados: 3
  Grupos participa: 5
  Mensajes enviados: 42

🏅 PASO 3: Envolver con BadgesDecorator
--------------------------------------------------------------------------------
BadgesDecorator aplicado:
  Render: Carlos Pérez ... | Actividad: 42 msgs ... | 2 insignias desbloqueadas
  Badges: 2
    - Primer Mensaje: Has enviado tu primer mensaje
    - Colaborador: Participas en grupos de estudio

📦 PASO 4: getMetadata() - Validar composición completa
--------------------------------------------------------------------------------
Metadata completo:
{
  "id": "user-123",
  "fullName": "Carlos Pérez",
  "carrera": "Ingeniería de Sistemas",
  "semestre": 6,
  "asignaturasActivas": [...],
  "indicadores": { "gruposCreados": 3, "gruposParticipa": 5, "mensajesEnviados": 42 },
  "insignias": [{ "id": "primer-mensaje", ... }, { "id": "colaborador", ... }]
}

✅ RESUMEN DE COMPOSICIÓN

  BaseProfile [Carlos Pérez - Ingeniería de Sistemas (Semestre 6)]
    ↓ (envuelto por)
  StatisticsDecorator [3 grupos creados, 5 participa, 42 msgs]
    ↓ (envuelto por)
  BadgesDecorator [2 badges: Primer Mensaje, Colaborador]
    ↓ (resultado final)
  Perfil completamente decorado

  ✅ AC-01: BaseProfile con nombre, carrera, semestre y asignaturas activas
  ✅ AC-02: StatisticsDecorator con gruposCreados, gruposParticipa, mensajesEnviados
  ✅ AC-03: BadgesDecorator con array de badges
  ✅ AC-04: Render compuesto preserva capas inferiores
```

---

## 6. Resumen de Archivos Auditados

| Archivo | Rol | Líneas |
|---|---|---|
| `.../decorators/IProfile.ts` | Interfaz común del patrón | 10 |
| `.../decorators/BaseProfile.ts` | Componente concreto | 38 |
| `.../decorators/ProfileDecorator.ts` | Decorador abstracto (composición) | 37 |
| `.../decorators/StatisticsDecorator.ts` | Decorador concreto: indicadores | 36 |
| `.../decorators/BadgesDecorator.ts` | Decorador concreto: insignias | 47 |
| `.../use-cases/GetFullProfile.ts` | Orquestador de la cadena | 28 |
| `.../controllers/ProfilesCatalogController.ts` | Controller con lógica `vista` | 127 |
| `.../main.ts` | DI wiring | 91 |
| `.../decorators/decorator.test.ts` | Test de composición en consola | 147 |
| `.../tests/integration/profile.spec.ts` | Tests de integración AC-04/05 | 120 |

---

## 7. Sugerencias de Mejora

1. **Serialización directa con `JSON.stringify`** — `ProfileDecorator` expone getters (`get id()`, `get fullName()`, `get avatarUrl()`) que son no-enumerables y no aparecen en `JSON.stringify()`. El controller usa `toJSON()` que llama a `getMetadata()` y funciona, pero si alguien hace `JSON.stringify(decorado)` directamente, perdería `id`, `fullName`, `avatarUrl`. Solución opcional: agregar `toJSON()` explícito en `ProfileDecorator`.

2. **`/perfil/:id` no es ruteado por el Gateway** — La ruta existe en el service (`profilesCatalogRoutes.ts:51`) pero el Gateway solo matchea `/api/v1/students/*` y `/api/v1/catalog/*`. Cualquier request a `/perfil/:id` desde el frontend recibe `404` del Gateway. El frontend debe usar **`GET /api/v1/students/:id?vista=completa`** para obtener el perfil decorado a través del gateway.

3. **Memoización de caché para `vista=completa`** — Las queries de indicadores e insignias son pesadas (JOINs en mensajes, grupos, aplicaciones). Si un perfil se consulta frecuentemente en modo completo, considerar caché.
