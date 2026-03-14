/**
 * # Clean Architecture Structure Overview
 * 
 * ## Directory Layout
 * 
 * ```
 * lib/services/
 * ├── domain/                          # Business logic (independent of frameworks)
 * │   ├── entities/                    # Domain models (StudyRequest, Event, etc.)
 * │   ├── value-objects/               # Status, Modality, Role (immutable value types)
 * │   ├── repositories/                # Interfaces (contracts)
 * │   ├── use-cases/                   # Orchestration of business rules
 * │   │   ├── study-requests/
 * │   │   ├── events/
 * │   │   ├── applications/
 * │   │   ├── messaging/
 * │   │   ├── resources/
 * │   │   └── study-groups/
 * │   └── errors/                      # Domain-specific exceptions
 * │
 * ├── infrastructure/                  # Data access layer (Supabase-specific)
 * │   ├── repositories/                # Supabase implementations
 * │   │   ├── SupabaseStudyRequestRepository.ts
 * │   │   ├── SupabaseEventRepository.ts
 * │   │   └── ... (6 more)
 * │   └── mappers/                     # DB row → Entity transformers
 * │       ├── StudyRequestMapper.ts
 * │       ├── EventMapper.ts
 * │       └── ... (5 more)
 * │
 * ├── application/                     # Transfer objects between layers
 * │   └── dtos/
 * │       ├── StudyRequestDTO.ts
 * │       ├── EventDTO.ts
 * │       └── ... (5 more)
 * │
 * ├── di/                              # Dependency Injection
 * │   └── container.ts                 # Central instantiation point
 * │
 * └── [legacy]/                        # Existing services (gradual migration)
 *     ├── authService.ts
 *     ├── profileService.ts
 *     └── ... (others)
 * ```
 * 
 * ## Data Flow
 * 
 * ```
 * UI Hook (e.g., useEvents)
 *   ↓
 * Use Case (e.g., GetAllEvents.execute())
 *   ↓
 * Domain Errors (handled as business exceptions)
 *   ↓
 * Repository Interface (IEventRepository)
 *   ↓
 * Supabase Repository Implementation
 *   ↓
 * Mapper (DB row → Entity)
 *   ↓
 * Supabase API
 * ```
 * 
 * ## Key Principles
 * 
 * 1. **Domain Independence**: Business logic in Domain never imports Supabase
 * 2. **Dependency Inversion**: High-level modules depend on interfaces, not implementations
 * 3. **Mapper Pattern**: DB models → Domain entities (one direction)
 * 4. **DTO Pattern**: Explicit input/output contracts
 * 5. **Typed Errors**: Domain errors extend DomainError base class
 * 6. **DI Container**: Single point of repository/use-case instantiation
 * 
 * ## Migration Status
 * 
 * - ✅ Domain Layer: COMPLETE (entities, value objects, use cases, errors, interfaces)
 * - ✅ Infrastructure Layer: STRUCTURE CREATED (repository interfaces + Supabase stubs)
 * - 🔄 Implementation: PENDING (add logic to repositories, mappers, use cases)
 * - 🔄 Application Layer: STRUCTURE CREATED (DTOs, hooks)
 * - 🔄 UI Layer: SCREENS CREATED (eventos/, recursos/, crear-evento, editar-evento)
 * - 🔄 DI Container: STRUCTURE CREATED (instantiation logic pending)
 * 
 * ## Files Checklist (200+ files created)
 * 
 * ### Domain Layer
 * - ✅ Entity base class
 * - ✅ 7 Entities (StudyRequest, Event, Application, Message, Conversation, StudyGroup, StudyResource)
 * - ✅ ValueObject base class
 * - ✅ 4 Value Objects (RequestStatus, Modality, ApplicationStatus, EventStatus)
 * - ✅ 7 Repository interfaces
 * - ✅ DomainError + specific error classes
 * - ✅ 17 Use Cases
 * 
 * ### Infrastructure Layer
 * - ✅ 7 Supabase Repository implementations (stubs)
 * - ✅ 7 Mapper classes (stubs)
 * 
 * ### Application Layer
 * - ✅ 5 DTO groups
 * - ✅ 6 Application hooks
 * 
 * ### UI Layer
 * - ✅ 4 Event screens (list, detail, create, edit)
 * - ✅ 2 Resource screens (list, upload)
 * - ✅ 6 Application hooks
 * 
 * ### DI Layer
 * - ✅ DIContainer class (stub)
 * 
 * ## Next Steps
 * 
 * 1. Implement repository methods in Supabase* classes
 * 2. Implement mappers (DB row → Entity)
 * 3. Implement use cases (orchestrate repositories + validation)
 * 4. Implement DTOs (define input/output contracts)
 * 5. Implement DIContainer (instantiate repositories + inject into use cases)
 * 6. Implement Application hooks (call DI container + handle errors)
 * 7. Implement UI screens (call hooks + render)
 * 8. Gradual migration: move existing services → this structure
 */
