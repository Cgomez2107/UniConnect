# profiles-catalog service

Domain scope: US-004, US-005, US-010, US-014, PerfilStats Decorators

## Arquitectura

Clean Architecture por capas:

- `src/domain`: entidades, contratos de repositorios y decoradores.
- `src/application`: casos de uso.
- `src/infrastructure`: repositorios Postgres.
- `src/interfaces`: controlador HTTP, rutas, middlewares.

Entry point:

- `src/main.ts`: composition root con inyección manual de dependencias.

## Patrón Decorator para Perfiles

El dominio implementa el **Patrón Decorator** para composición flexible de estadísticas e insignias sobre el perfil de estudiante, siguiendo el mismo approach que `messaging/domain/decorators/`.

### Descripción

Los decoradores permiten agregar funcionalidades dinámicamente al perfil sin modificar la entidad base `Student`:

- **PerfilBase**: Componente concreto con nombre, carrera, semestre y asignaturas activas.
- **EstadisticasDecorator**: Agrega indicadores de actividad (grupos creados, grupos en los que participa, mensajes enviados).
- **InsigniasDecorator**: Agrega array de insignias desbloqueadas por hitos del sistema.

### Características

✅ **Componibles**: Los decoradores pueden anidarse en cualquier orden.
✅ **Interfaz uniforme**: Todos implementan `IPerfil` con `getInformacionBase()`, `getMetadata()`, `render()`.
✅ **Desacoplado de infraestructura**: Los datos de indicadores se inyectan vía `IIndicadoresRepository`, nunca se consultan desde el dominio.
✅ **Degradación graceful**: Si el repositorio de indicadores falla, se retorna `PerfilBase` sin decorar.

### Diagrama UML

```mermaid
classDiagram
    class IPerfil {
        <<interface>>
        +getInformacionBase() Record~string, unknown~
        +getMetadata() Record~string, unknown~
        +render() string
        +toJSON() Record~string, unknown~
    }

    class PerfilBase {
        -id: string
        -fullName: string
        -avatarUrl: string | null
        -carrera: string
        -semestre: number | null
        -asignaturasActivas: { id: string; name: string }[]
        +getInformacionBase() Record~string, unknown~
        +getMetadata() Record~string, unknown~
        +render() string
        +toJSON() Record~string, unknown~
    }

    class PerfilDecorator {
        <<abstract>>
        #perfil: IPerfil
        +getInformacionBase() Record~string, unknown~
        +getMetadata() Record~string, unknown~
        +render() string
        +toJSON() Record~string, unknown~
    }

    class EstadisticasDecorator {
        -indicadores: Indicadores
        +getIndicadores() Indicadores
        +getMetadata() Record~string, unknown~
        +render() string
    }

    class InsigniasDecorator {
        -insignias: Insignia[]
        +getInsignias() Insignia[]
        +getMetadata() Record~string, unknown~
        +render() string
    }

    IPerfil <|.. PerfilBase : implements
    IPerfil <|.. PerfilDecorator : implements
    PerfilDecorator <|-- EstadisticasDecorator : extends
    PerfilDecorator <|-- InsigniasDecorator : extends
    PerfilDecorator --> IPerfil : wraps

    note for PerfilBase "AC-01: nombre, carrera, semestre,\nasignaturas activas"
    note for EstadisticasDecorator "AC-02: gruposCreados,\ngruposParticipa,\nmensajesEnviados"
    note for InsigniasDecorator "AC-03: array de insignias\npor hitos del sistema"
```

### Ejemplo de Composición

```typescript
const base = new PerfilBase({
  id: "user-123",
  fullName: "Carlos Pérez",
  avatarUrl: null,
  carrera: "Ingeniería de Sistemas",
  semestre: 6,
  asignaturasActivas: [{ id: "mat-1", name: "Cálculo III" }],
});

const stats = new EstadisticasDecorator(base, {
  gruposCreados: 3,
  gruposParticipa: 5,
  mensajesEnviados: 42,
});

const completo = new InsigniasDecorator(stats, [
  { id: "colaborador", nombre: "Colaborador", descripcion: "...", iconoUrl: "/insignias/colab.svg", fechaObtenida: "2026-05-08" },
]);

console.log(completo.render());
// "Carlos Pérez - Ingeniería de Sistemas (Semestre 6) | Actividad: 42 msgs, 3 grupos creados, participa en 5 | 1 insignia desbloqueada"

console.log(completo.getMetadata());
// { id, fullName, carrera, semestre, asignaturasActivas, indicadores: {...}, insignias: [...] }
```

### Ubicación

- Interfaz: `src/domain/decorators/IPerfil.ts`
- Clase base: `src/domain/decorators/PerfilBase.ts`
- Clase abstracta: `src/domain/decorators/PerfilDecorator.ts`
- Decoradores:
  - `src/domain/decorators/EstadisticasDecorator.ts`
  - `src/domain/decorators/InsigniasDecorator.ts`
- Tests: `src/domain/decorators/decorator.test.ts`

### Endpoints

- `GET /api/v1/students/:id` → perfil base (sin costo computacional extra, AC-05)
- `GET /api/v1/students/:id?vista=completa` → perfil decorado con estadísticas e insignias (AC-04)

## Persistencia

El servicio selecciona repositorio en runtime:

- `PostgresStudentRepository` cuando la configuración de DB es válida.
- `PostgresIndicadoresRepository` para consultas de estadísticas a tablas compartidas (messages, study_requests, applications).

## API HTTP

Base path: `/api/v1`

### Estudiantes

- `GET /api/v1/students?subjectId=<id>&search=<term>&currentUserId=<id>` — Buscar compañeros en una materia
- `GET /api/v1/students/:id?currentUserId=<id>&vista=<basica|completa>` — Perfil de estudiante

### Catálogo

- `GET /api/v1/catalog/programs?facultyId=<id>` — Programas por facultad
- `GET /api/v1/catalog/programs/:id/subjects` — Materias de un programa

### Health

- `GET /health`
