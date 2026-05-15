# V05 — Academic Q&A Forum

Chain of Responsibility + Observer para preguntas y respuestas académicas.

## Diagrama de Secuencia — Flujo Completo

```mermaid
sequenceDiagram
    participant A as User A (Admin original)
    participant B as User B (Estudiante)
    participant C as User C (Estudiante)
    participant QNA as Academic Q&A Service
    participant SR as Study Requests
    participant QRepo as ForumQuestionRepo
    participant ARepo as ForumAnswerRepo
    participant Subject as ForumSubject
    participant Obs as ForumRealtimeObserver

    Note over A,C: ST01: Transferencia de administración
    A->>SR: transferir admin a User B
    SR-->>A: OK (author_id ahora es B)

    Note over B,QNA: V05: User B pregunta, User C responde
    B->>QNA: createQuestion(tema)
    QNA->>QRepo: INSERT forum_questions (authorId: B)
    QNA-->>B: question creada

    C->>QNA: createAnswer(questionId)
    QNA->>ARepo: INSERT forum_answers (authorId: C)
    QNA-->>C: answer creada

    Note over A,QNA: User B (nuevo admin) marca solución
    B->>QNA: POST /questions/:id/solution { answerId }

    QNA->>QRepo: findById(questionId)
    QNA->>ARepo: findById(answerId)
    QNA->>QRepo: isAdminOfStudyGroup(questionId, B)
    QRepo->>SR: JOIN study_requests (author_id = B)
    SR-->>QRepo: TRUE (B es admin)

    QNA->>QRepo: markAsSolved(questionId)
    QNA->>Subject: emitSolucionEvent(answerAuthorId: C)
    Subject->>Obs: SOLUCION_MARCADA
    Obs-->>C: notificación en tiempo real (ANSWER_MARKED_AS_SOLUTION)

    QNA-->>B: 200 OK
```

## Caso de cortocircuito — Sin permisos

```mermaid
sequenceDiagram
    participant C as User C (Estudiante)
    participant QNA as Academic Q&A Service

    C->>QNA: POST /questions/:id/solution { answerId }
    QNA->>QRepo: isAdminOfStudyGroup(questionId, C)
    QRepo-->>QNA: FALSE
    QNA-->>C: 403 AuthorizationError
```

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/forum/questions` | Crear pregunta |
| GET | `/api/v1/forum/questions?subjectId=&page=&limit=` | Listar preguntas |
| GET | `/api/v1/forum/questions/:questionId` | Detalle de pregunta |
| POST | `/api/v1/forum/questions/:questionId/answers` | Crear respuesta |
| GET | `/api/v1/forum/questions/:questionId/answers` | Listar respuestas |
| POST | `/api/v1/forum/questions/:questionId/solution` | Marcar respuesta como solución |
| POST | `/api/v1/forum/votes` | Votar (upvote/downvote) |

## Validaciones (Chain of Responsibility)

1. **EnrollmentValidator** — Usuario debe estar matriculado en la asignatura
2. **FormatValidator** — Título ≤ 200 chars, cuerpo ≤ 5000 chars
3. **ContentValidator** — Sin palabras prohibidas (spam, ofensa)
4. **AdminCheck** (en MarcarComoSolucion) — Solo el autor del `study_request` o miembros de `study_request_admins`
