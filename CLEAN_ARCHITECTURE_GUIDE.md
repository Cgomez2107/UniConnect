# Clean Architecture Implementation Guide

## Quick Start

### Structure Created ✅

```
✅ Domain Layer (lib/services/domain/)
    - Entities: StudyRequest, Event, Application, Message, Conversation, StudyGroup, StudyResource
    - Value Objects: RequestStatus, Modality, ApplicationStatus, EventStatus
    - Repository Interfaces: 7 contracts defined
    - Use Cases: 17 use cases organized by domain
    - Errors: DomainError + specific exceptions

✅ Infrastructure Layer (lib/services/infrastructure/)
    - 7 Supabase Repository implementations (STUBS)
    - 7 Mappers for DB → Entity transformation (STUBS)

✅ Application Layer (lib/services/application/)
    - 5 DTO groups defining input/output contracts

✅ UI Layer (app/)
    - 4 Event screens
    - 2 Resource screens
    - 6 Application hooks

✅ DI Container (lib/services/di/)
    - Dependency injection service locator (STUB)
```

## File Statistics

- **Domain Layer**: 30+ files
- **Infrastructure Layer**: 15+ files
- **Application Layer**: 8+ files
- **UI Layer**: 8 screens
- **Application Hooks**: 6 hooks
- **Total**: 200+ files created

## Implementation Roadmap

### Phase 1: Infrastructure Implementation (Current)
**Status**: Structure ✅ | Logic ⏳

- [ ] Implement SupabaseXXXRepository methods
- [ ] Implement XXXMapper transformations
- [ ] Implement DTOs (define what fields each operation needs)
- [ ] Test repositories with Supabase client

### Phase 2: Domain Use Cases
**Status**: Structure ✅ | Logic ⏳

- [ ] Implement GetFeedRequests (with filters, pagination)
- [ ] Implement CreateStudyRequest (validate user enrolled)
- [ ] Implement ApplyToStudyRequest (prevent duplicates)
- [ ] Implement ReviewApplication (author authorization)
- [ ] Implement Event CRUD (admin authorization)
- [ ] Implement Messaging (1:1 validation)
- [ ] Implement UploadResource (file validation)

### Phase 3: DI Container
**Status**: Structure ✅ | Logic ⏳

- [ ] Instantiate all Supabase repositories
- [ ] Inject repositories into use cases
- [ ] Provide getter methods for each use case
- [ ] Export from DIContainer.getInstance()

### Phase 4: Application Hooks
**Status**: Structure ✅ | Logic ⏳

- [ ] useEvents() - query DIContainer, call use cases
- [ ] useStudyRequests() - feed with filters
- [ ] useApplications() - apply + review
- [ ] useMessaging() - conversations + messages
- [ ] useResources() - list + upload
- [ ] useStudyGroups() - group management

### Phase 5: UI Implementation
**Status**: Screens Created ✅ | Logic ⏳

- [ ] app/eventos/index.tsx (list all events)
- [ ] app/eventos/[id].tsx (event details)
- [ ] app/crear-evento.tsx (admin create)
- [ ] app/editar-evento/[id].tsx (admin edit)
- [ ] app/recursos/index.tsx (list resources)
- [ ] app/subir-recurso-nuevo.tsx (upload)

### Phase 6: Migration of Existing Code
**Status**: Not Started ⏳

- [ ] Move useFeed → useStudyRequests
- [ ] Move useChat → useMessaging
- [ ] Move useConversations → useMessaging
- [ ] Keep legacy services in parallel until all screens migrated
- [ ] Delete legacy services once migration complete

## Key Patterns Used

### Repository Pattern
```typescript
// Domain (interface only)
export interface IEventRepository {
  getAll(): Promise<Event[]>
  create(event: Event): Promise<void>
}

// Infrastructure (implementation)
export class SupabaseEventRepository implements IEventRepository {
  // Implements interface
}
```

### Use Case Pattern
```typescript
// Domain
export class GetAllEvents {
  constructor(private repo: IEventRepository) {}
  async execute(): Promise<Event[]> {
    // Orchestrate repository + business logic
  }
}
```

### Dependency Injection
```typescript
// DI Container
const container = DIContainer.getInstance()
const useCase = container.getGetAllEvents()
const events = await useCase.execute()
```

### Hook Pattern (UI)
```typescript
// Application hook
export function useEvents() {
  const container = DIContainer.getInstance()
  const useCase = container.getGetAllEvents()
  
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  
  useEffect(() => {
    setLoading(true)
    useCase.execute().then(setEvents)
  }, [])
  
  return { events, loading }
}
```

## File Locations Reference

**New Domain**: `lib/services/domain/**`
**New Infrastructure**: `lib/services/infrastructure/**`
**New Application Layer**: `lib/services/application/**`
**New DI**: `lib/services/di/container.ts`
**New Screens**: `app/eventos/**`, `app/recursos/**`
**New Hooks**: `hooks/application/**`
**New DTOs**: `lib/services/application/dtos/**`

**Legacy (to migrate)**: `lib/services/*.ts`

## Dependencies

All new code is TypeScript-only. No runtime dependencies added.

### Imports Template

```typescript
// Import entities
import { StudyRequest, Event } from '@/lib/services/domain/entities'

// Import value objects
import { RequestStatus, Modality } from '@/lib/services/domain/value-objects'

// Import errors
import { DomainError, NotFoundError } from '@/lib/services/domain/errors'

// Import use cases
import { GetAllEvents } from '@/lib/services/domain/use-cases'

// Import repository interfaces
import { IEventRepository } from '@/lib/services/domain/repositories'

// Import DTOs
import type { CreateEventDTO } from '@/lib/services/application/dtos'

// Import hook
import { useEvents } from '@/hooks/application'

// Import DI
import { DIContainer } from '@/lib/services'
```

## Testing Strategy

Each layer can be tested independently:

1. **Domain Layer Test**: Test use cases with mock repositories
   ```typescript
   const mockRepo = { getAll: jest.fn() }
   const useCase = new GetAllEvents(mockRepo)
   const events = await useCase.execute()
   expect(mockRepo.getAll).toHaveBeenCalled()
   ```

2. **Infrastructure Layer Test**: Test repositories with Supabase mock
3. **Application Hook Test**: Test hooks with mock use cases
4. **UI Test**: Test screens with mock hooks

## Common Errors & Solutions

### Error: "Cannot find module 'domain'"
**Solution**: Ensure directory structure is created. Check `lib/services/domain/index.ts` exists.

### Error: "IEventRepository is not assignable to IEventRepository"
**Solution**: Both SupabaseXXXRepository must extend/implement the interface correctly.

### Error: "DIContainer.getInstance() is undefined"
**Solution**: Fill in DIContainer methods first (Phase 3).

## Next Developer Checklist

- [ ] Read this guide
- [ ] Read `ARCHITECTURE_CLEAN.md`
- [ ] Pick one use case to implement (start with Events)
- [ ] Start with Infrastructure (Repositories + Mappers)
- [ ] Move to Use Cases (call repositories)
- [ ] Add to DI Container
- [ ] Implement Application Hook
- [ ] Implement UI Screen

---

**Last Updated**: March 14, 2026
**Status**: Structure Complete | Implementation Pending
**Estimated Implementation Time**: 5-10 business days
