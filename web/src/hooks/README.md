# 🎣 React Hooks para UniConnect

Colección de 15 hooks reutilizables production-ready para la aplicación web de UniConnect, construidos con React 19.2.5, Zustand y TypeScript.

## 📋 Índice

1. [useAuth](#1-useauth) - Autenticación
2. [useColorScheme](#2-usecolorscheme) - Gestión de temas (light/dark)
3. [useFeed](#3-usefeed) - Feed de solicitudes de grupos de estudio
4. [useFaculties](#4-usefaculties) - Catálogo académico
5. [useProfile](#5-useprofile) - Perfil del usuario actual
6. [useConversations](#6-useconversations) - Chat y conversaciones
7. [useMessages](#7-usemessages) - Gestión de mensajes
8. [useSearchStudents](#8-usesearchstudents) - Búsqueda de estudiantes
9. [useResources](#9-useresources) - Recursos de estudio
10. [useEvents](#10-useevents) - Eventos del campus
11. [useAdmin](#11-useadmin) - Operaciones administrativas
12. [useForm](#12-useform) - Gestión de formularios genérica
13. [useThemeColor](#13-usethemecolor) - Colores de marca UC
14. [useNotifications](#14-usenotifications) - Notificaciones del sistema
15. [useAsync](#15-useasync) - Operaciones asincrónicas genéricas

---

## 1. useAuth

**Ubicación:** `hooks/useAuth.ts`

Hook para gestionar la autenticación del usuario.

### Interfaz

```typescript
const {
  user,              // UserSession | null
  isAuthenticated,   // boolean
  isLoading,         // boolean
  login,             // (email: string, password: string) => Promise<void>
  logout,            // () => Promise<void>
  restoreSession,    // () => Promise<void>
} = useAuth();
```

### Ejemplo

```typescript
function LoginComponent() {
  const { login, isLoading, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login("user@example.com", "password");
    } catch (error) {
      console.error("Error de login:", error);
    }
  };

  if (isAuthenticated) return <Redirect to="/dashboard" />;

  return (
    <button onClick={handleLogin} disabled={isLoading}>
      {isLoading ? "Cargando..." : "Ingresar"}
    </button>
  );
}
```

---

## 2. useColorScheme

**Ubicación:** `hooks/useColorScheme.ts`

Hook para gestionar el esquema de colores (light/dark mode) en la web.

### Interfaz

```typescript
const {
  colors,       // { light: {...}, dark: {...} }
  isDark,       // boolean
  toggleDarkMode, // () => void
  setDarkMode,  // (dark: boolean) => void
} = useColorScheme();
```

### Ejemplo

```typescript
function ThemeToggle() {
  const { isDark, toggleDarkMode, colors } = useColorScheme();
  const currentColors = isDark ? colors.dark : colors.light;

  return (
    <div style={{ backgroundColor: currentColors.background }}>
      <button onClick={toggleDarkMode}>
        {isDark ? "☀️ Modo claro" : "🌙 Modo oscuro"}
      </button>
    </div>
  );
}
```

---

## 3. useFeed

**Ubicación:** `hooks/useFeed.ts`

Hook para cargar y gestionar el feed de solicitudes de grupos de estudio.

### Interfaz

```typescript
const {
  requests,    // StudyRequest[]
  isLoading,   // boolean
  error,       // string | null
  loadRequests, // () => Promise<void>
  refresh,     // () => Promise<void>
} = useFeed({ autoLoad: true });
```

### Opciones

- `autoLoad` (default: `true`): Carga automáticamente al montar el componente

### Ejemplo

```typescript
function FeedComponent() {
  const { requests, isLoading, error, refresh } = useFeed();

  if (isLoading) return <Loading />;
  if (error) return <Error message={error} />;

  return (
    <div>
      {requests.map((request) => (
        <StudyRequestCard key={request.id} request={request} />
      ))}
      <button onClick={refresh}>Actualizar feed</button>
    </div>
  );
}
```

---

## 4. useFaculties

**Ubicación:** `hooks/useFaculties.ts`

Hook para gestionar el catálogo académico (facultades, programas, materias).

### Interfaz

```typescript
const {
  faculties,           // Faculty[]
  programs,            // Program[]
  subjects,            // Subject[]
  loading,             // boolean
  error,               // string | null
  loadFaculties,       // () => Promise<void>
  loadProgramsByFaculty, // (facultyId: string) => Promise<void>
  loadSubjects,        // (programId: string) => Promise<void>
  clear,               // () => void
} = useFaculties();
```

### Ejemplo

```typescript
function AcademicCatalog() {
  const {
    faculties,
    programs,
    loadFaculties,
    loadProgramsByFaculty,
  } = useFaculties();

  useEffect(() => {
    loadFaculties();
  }, []);

  return (
    <select onChange={(e) => loadProgramsByFaculty(e.target.value)}>
      {faculties.map((f) => (
        <option key={f.id} value={f.id}>
          {f.name}
        </option>
      ))}
    </select>
  );
}
```

---

## 5. useProfile

**Ubicación:** `hooks/useProfile.ts`

Hook para gestionar el perfil del usuario actual.

### Interfaz

```typescript
const {
  profile,       // Profile | null
  isLoading,     // boolean
  error,         // string | null
  updateProfile, // (data: EditProfileFormData) => Promise<Profile>
  refresh,       // () => Promise<void>
} = useProfile({ autoLoad: true });
```

### Ejemplo

```typescript
function ProfileEditor() {
  const { profile, updateProfile, isLoading } = useProfile();
  const [name, setName] = useState("");

  if (!profile) return null;

  const handleUpdate = async () => {
    try {
      await updateProfile({ full_name: name });
    } catch (error) {
      console.error("Error actualizando perfil:", error);
    }
  };

  return (
    <form>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={handleUpdate} disabled={isLoading}>
        Guardar
      </button>
    </form>
  );
}
```

---

## 6. useConversations

**Ubicación:** `hooks/useConversations.ts`

Hook para gestionar conversaciones y mensajes.

### Interfaz

```typescript
const {
  conversations,       // Conversation[]
  currentConversation, // Conversation | null
  messages,            // Message[]
  loading,             // boolean
  error,               // string | null
  loadConversations,   // () => Promise<void>
  selectConversation,  // (conversationId: string) => Promise<void>
  sendMessage,         // (content: string) => Promise<Message>
  refresh,             // () => Promise<void>
} = useConversations();
```

### Ejemplo

```typescript
function ChatApp() {
  const {
    conversations,
    currentConversation,
    messages,
    selectConversation,
    sendMessage,
  } = useConversations();

  const handleSendMessage = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  return (
    <div>
      {conversations.map((conv) => (
        <button key={conv.id} onClick={() => selectConversation(conv.id)}>
          {conv.participantName}
        </button>
      ))}
      {currentConversation && (
        <MessageList messages={messages} onSend={handleSendMessage} />
      )}
    </div>
  );
}
```

---

## 7. useMessages

**Ubicación:** `hooks/useMessages.ts`

Hook para gestionar mensajes de una conversación específica.

### Interfaz

```typescript
const {
  messages,    // Message[]
  isLoading,   // boolean
  error,       // string | null
  loadMessages, // (conversationId: string) => Promise<void>
  sendMessage, // (conversationId: string, content: string) => Promise<Message>
  markAsRead,  // (conversationId: string) => Promise<void>
} = useMessages();
```

### Ejemplo

```typescript
function MessageHistory({ conversationId }) {
  const { messages, loadMessages, sendMessage } = useMessages();

  useEffect(() => {
    loadMessages(conversationId);
  }, [conversationId]);

  const handleSend = async (content: string) => {
    await sendMessage(conversationId, content);
  };

  return <MessageList messages={messages} onSend={handleSend} />;
}
```

---

## 8. useSearchStudents

**Ubicación:** `hooks/useSearchStudents.ts`

Hook para buscar estudiantes que comparten una materia.

### Interfaz

```typescript
const {
  students,     // StudentSearchResult[]
  isLoading,    // boolean
  error,        // string | null
  searchBySubject, // (subjectId: string) => Promise<void>
  clear,        // () => void
} = useSearchStudents();
```

### Ejemplo

```typescript
function StudentSearchForm() {
  const { students, searchBySubject, isLoading, clear } = useSearchStudents();

  const handleSearch = async (subjectId: string) => {
    await searchBySubject(subjectId);
  };

  return (
    <div>
      <input onChange={(e) => handleSearch(e.target.value)} />
      {isLoading && <Loading />}
      <StudentList students={students} />
      <button onClick={clear}>Limpiar</button>
    </div>
  );
}
```

---

## 9. useResources

**Ubicación:** `hooks/useResources.ts`

Hook para gestionar recursos de estudio.

### Interfaz

```typescript
const {
  resources,      // Resource[]
  isLoading,      // boolean
  error,          // string | null
  loadResources,  // (subjectId?: string) => Promise<void>
  uploadResource, // (data: FormData | Partial<Resource>) => Promise<Resource>
  deleteResource, // (resourceId: string) => Promise<void>
  refresh,        // (subjectId?: string) => Promise<void>
} = useResources();
```

### Ejemplo

```typescript
function ResourceManager({ subjectId }) {
  const { resources, uploadResource, deleteResource, loadResources } =
    useResources();

  useEffect(() => {
    loadResources(subjectId);
  }, [subjectId]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", subjectId);
    await uploadResource(formData);
  };

  return (
    <div>
      <FileUpload onUpload={handleUpload} />
      {resources.map((res) => (
        <ResourceCard
          key={res.id}
          resource={res}
          onDelete={() => deleteResource(res.id)}
        />
      ))}
    </div>
  );
}
```

---

## 10. useEvents

**Ubicación:** `hooks/useEvents.ts`

Hook para gestionar eventos del campus.

### Interfaz

```typescript
const {
  events,      // Event[]
  isLoading,   // boolean
  error,       // string | null
  loadEvents,  // () => Promise<void>
  createEvent, // (payload: CreateEventPayload) => Promise<Event>
  updateEvent, // (eventId: string, payload: Partial<CreateEventPayload>) => Promise<Event>
  deleteEvent, // (eventId: string) => Promise<void>
  refresh,     // () => Promise<void>
} = useEvents();
```

### Ejemplo

```typescript
function EventsBoard() {
  const { events, createEvent, loadEvents } = useEvents();

  useEffect(() => {
    loadEvents();
  }, []);

  const handleCreateEvent = async (data: CreateEventPayload) => {
    try {
      await createEvent(data);
    } catch (error) {
      console.error("Error creando evento:", error);
    }
  };

  return (
    <div>
      <EventForm onSubmit={handleCreateEvent} />
      <EventList events={events} />
    </div>
  );
}
```

---

## 11. useAdmin

**Ubicación:** `hooks/useAdmin.ts`

Hook para operaciones administrativas.

### Interfaz

```typescript
const {
  users,      // Profile[]
  requests,   // any[]
  resources,  // any[]
  events,     // any[]
  metrics,    // AdminMetrics | null
  loading,    // boolean
  error,      // string | null
  getUsers,   // () => Promise<void>
  getRequests, // () => Promise<void>
  getMetrics, // () => Promise<void>
  refresh,    // () => Promise<void>
} = useAdmin();
```

### Ejemplo

```typescript
function AdminDashboard() {
  const { users, metrics, getUsers, getMetrics, loading } = useAdmin();

  useEffect(() => {
    getUsers();
    getMetrics();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <UsersList users={users} />
      <MetricsPanel metrics={metrics} />
    </div>
  );
}
```

---

## 12. useForm

**Ubicación:** `hooks/useForm.ts`

Hook genérico para gestión de formularios.

### Interfaz

```typescript
const {
  values,         // T
  errors,         // Record<string, string>
  touched,        // Record<string, boolean>
  isSubmitting,   // boolean
  setFieldValue,  // (field: keyof T, value: any) => void
  setFieldError,  // (field: string, error: string) => void
  setFieldTouched, // (field: string) => void
  handleSubmit,   // (e?: React.FormEvent) => Promise<void>
  reset,          // () => void
} = useForm(initialValues, onSubmit, onValidate?);
```

### Ejemplo

```typescript
interface LoginForm {
  email: string;
  password: string;
}

function LoginForm() {
  const { values, errors, setFieldValue, handleSubmit, isSubmitting } =
    useForm(
      { email: "", password: "" },
      async (values) => {
        await authService.login(values);
      },
      (values) => {
        const errors: Record<string, string> = {};
        if (!values.email) errors.email = "Email requerido";
        if (!values.password) errors.password = "Contraseña requerida";
        return errors;
      }
    );

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={values.email}
        onChange={(e) => setFieldValue("email", e.target.value)}
      />
      {errors.email && <span>{errors.email}</span>}

      <input
        type="password"
        value={values.password}
        onChange={(e) => setFieldValue("password", e.target.value)}
      />
      {errors.password && <span>{errors.password}</span>}

      <button type="submit" disabled={isSubmitting}>
        Ingresar
      </button>
    </form>
  );
}
```

---

## 13. useThemeColor

**Ubicación:** `hooks/useThemeColor.ts`

Hook para acceder a los colores de marca de UC (UniConnect).

### Interfaz

```typescript
const {
  colors,  // { ucBlue, ucGold, ucDark, ucLight, ... }
  getColor, // (name: ColorName | string) => string
  toRgb,   // (color: string) => string | null
  toRgba,  // (color: string, alpha?: number) => string | null
} = useThemeColor();
```

### Colores disponibles

- `ucBlue`: #0066cc
- `ucGold`: #ffc107
- `ucDark`: #1a1a1a
- `ucLight`: #f5f5f5
- `primary`: #0066cc
- `secondary`: #ffc107
- `success`: #10b981
- `error`: #ef4444
- `warning`: #f59e0b
- `info`: #3b82f6
- `neutral`: #6b7280

### Ejemplo

```typescript
function BrandedButton() {
  const { getColor, toRgba } = useThemeColor();

  return (
    <button
      style={{
        backgroundColor: getColor("ucBlue"),
        boxShadow: `0 0 10px ${toRgba("ucBlue", 0.3)}`,
      }}
    >
      Botón con marca UC
    </button>
  );
}
```

---

## 14. useNotifications

**Ubicación:** `hooks/useNotifications.ts`

Hook para mostrar notificaciones del sistema.

### Interfaz

```typescript
const {
  show,    // (message: string, type?: NotificationType) => void
  success, // (message: string) => void
  error,   // (message: string) => void
  info,    // (message: string) => void
  warning, // (message: string) => void
  dismiss, // (id: string) => void
  clear,   // () => void
} = useNotifications();
```

### Ejemplo

```typescript
function ProfileForm() {
  const { success, error } = useNotifications();

  const handleSave = async () => {
    try {
      await updateProfile();
      success("Perfil actualizado correctamente");
    } catch (err) {
      error("Error al actualizar el perfil");
    }
  };

  return <button onClick={handleSave}>Guardar cambios</button>;
}
```

---

## 15. useAsync

**Ubicación:** `hooks/useAsync.ts`

Hook genérico para manejar operaciones asincrónicas.

### Interfaz

```typescript
const {
  data,    // T | null
  isLoading, // boolean
  error,   // Error | null
  execute, // () => Promise<T>
  reset,   // () => void
} = useAsync(asyncFn, { autoExecute: false, dependencies: [] });
```

### Opciones

- `autoExecute` (default: `false`): Ejecutar automáticamente al montar
- `dependencies` (default: `[]`): Dependencias para re-ejecutar

### Ejemplo

```typescript
function UsersList() {
  const { data: users, isLoading, error, execute } = useAsync(
    async () => await userService.getAll(),
    { autoExecute: true }
  );

  return (
    <div>
      {isLoading && <Loading />}
      {error && <Error message={error.message} />}
      {users && users.map((user) => <UserCard key={user.id} user={user} />)}
    </div>
  );
}
```

---

## 🎯 Características comunes

Todos los hooks incluyen:

✅ **TypeScript completo** - Tipos genéricos y tipado seguro  
✅ **Error handling** - Manejo de errores con try/catch  
✅ **JSDoc comentarios** - Documentación inline  
✅ **Memoización** - useCallback para funciones estables  
✅ **Clean up** - Cleanup automático de estado  
✅ **Production-ready** - Probados y listos para producción  

---

## 📥 Importación

### Importar individual

```typescript
import useAuth from "@/hooks/useAuth";
import useProfile from "@/hooks/useProfile";
```

### Importar múltiples desde el índice

```typescript
import {
  useAuth,
  useProfile,
  useConversations,
  useNotifications,
} from "@/hooks";
```

---

## 🔄 Patrones de uso

### Composición de hooks

```typescript
function UserProfile() {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const { success, error } = useNotifications();

  const handleUpdate = async (data) => {
    try {
      await updateProfile(data);
      success("Perfil actualizado");
    } catch (err) {
      error("Error actualizando perfil");
    }
  };

  return <ProfileForm profile={profile} onUpdate={handleUpdate} />;
}
```

### Async + Notificaciones

```typescript
function CreateEventForm() {
  const { createEvent } = useEvents();
  const { success, error } = useNotifications();

  const handleSubmit = async (data) => {
    try {
      const result = await createEvent(data);
      success("Evento creado correctamente");
      return result;
    } catch (err) {
      error("Error creando evento");
      throw err;
    }
  };

  return <EventForm onSubmit={handleSubmit} />;
}
```

---

## 📝 Notas importantes

- Los hooks asumen que hay un `apiClient` configurado en `/lib/api/client`
- Los servicios están ubicados en `/lib/services/`
- Los stores Zustand están en `/store/`
- Todos los hooks usan `useCallback` para optimizar el rendimiento
- El error handling es consistente: logs a consola + estado de error en el hook

---

**Versión:** 1.0.0  
**Última actualización:** 7 de mayo de 2026  
**Autor:** UniConnect Development Team  
**React:** 19.2.5  
**TypeScript:** 5+  
