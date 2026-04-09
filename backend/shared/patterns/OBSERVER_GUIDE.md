/**
 * OBSERVER PATTERN - Guía de Implementación
 * 
 * ===============================================
 * ¿QUÉ ES OBSERVER?
 * ===============================================
 * 
 * Es un patrón de diseño que define una dependencia uno-a-muchos entre objetos
 * tal que cuando uno cambia de estado, todos sus dependientes son notificados automáticamente.
 * 
 * En UniConnect:
 * Cuando ocurre un evento (ej: "SolicitudConexionEnviada"):
 * - AppNotificationObserver reacciona → actualiza badge
 * - EmailNotificationObserver reacciona → envía email
 * - PendingCounterObserver reacciona → incrementa contador
 * 
 * TODO SIMULTÁNEAMENTE e INDEPENDIENTEMENTE.
 * 
 * ===============================================
 * COMPONENTES
 * ===============================================
 * 
 * 1. Subject (Publisher): EventBus
 *    - Mantiene lista de observadores
 *    - Notifica a todos cuando algo cambia
 *    - Es un Singleton para acceso global
 * 
 * 2. DomainEvent: El evento que se emite
 *    - Tipo: 'SolicitudConexionEnviada', 'GrupoCreado', etc
 *    - Datos: Información relevante del evento
 *    - Timestamp: Cuándo ocurrió
 * 
 * 3. Observer: Interfaz que todos implementan
 *    - handle(): reaccionar ante el evento
 *    - getInterestedEvents(): qué eventos me interesan
 * 
 * 4. Observadores Concretos:
 *    ├── AppNotificationObserver (notificaciones en app)
 *    ├── EmailNotificationObserver (emails)
 *    └── PendingCounterObserver (contador de pendientes)
 * 
 * ===============================================
 * FLUJO DE EJECUCIÓN
 * ===============================================
 * 
 * Supongamos: Un usuario envía una solicitud de conexión
 * 
 * 1. Use Case: CreateConnectionRequestUseCase.execute()
 *    └─ Crear solicitud en BD
 *    └─ EMITIR EVENTO:
 *       EventBus.getInstance().emit({
 *         eventType: 'SolicitudConexionEnviada',
 *         data: { userId, senderName, senderEmail, ... }
 *       })
 * 
 * 2. EventBus recibe el evento:
 *    └─ Obtiene lista de observadores interesados
 * 
 * 3. Observadores reaccionan EN PARALELO:
 * 
 *    ├─ AppNotificationObserver:
 *    │  └─ Actualiza badge en app
 *    │  └─ Muestra notificación in-app
 *    │
 *    ├─ EmailNotificationObserver:
 *    │  └─ Genera HTML del email
 *    │  └─ Envía vía SendGrid/Mailgun
 *    │
 *    └─ PendingCounterObserver:
 *       └─ Incrementa contador de pendientes
 *       └─ Guarda en Redis
 * 
 * TODO esto ocurre sin que el Use Case lo sepa.
 * El Use Case SOLO emite el evento y continúa.
 * 
 * ===============================================
 * CÓMO USAR OBSERVER
 * ===============================================
 * 
 * 1. Registrar observadores (en main.ts o app.ts):
 * 
 * ```typescript
 * import {
 *   EventBus,
 *   AppNotificationObserver,
 *   EmailNotificationObserver,
 *   PendingCounterObserver,
 * } from '@uniconnect/shared/patterns/observer';
 * 
 * async function main() {
 *   // Registrar observadores
 *   EventBus.builder()
 *     .addObserver(new AppNotificationObserver())
 *     .addObserver(new EmailNotificationObserver())
 *     .addObserver(new PendingCounterObserver())
 *     .build();
 *   
 *   console.log('✅ Observadores registrados');
 * }
 * ```
 * 
 * 2. Emitir eventos desde Use Cases:
 * 
 * ```typescript
 * import { EventBus, EventFactory } from '@uniconnect/shared/patterns/observer';
 * 
 * export class SendConnectionRequestUseCase {
 *   async execute(dto: SendConnectionRequestDto): Promise<void> {
 *     // Crear solicitud
 *     const request = new ConnectionRequest(...);
 *     
 *     // Guardar en BD
 *     await this.repository.save(request);
 *     
 *     // EMITIR EVENTO - Los observadores reaccionan automáticamente
 *     await EventBus.getInstance().emit(
 *       EventFactory.connectionRequestSent(
 *         senderId,
 *         senderName,
 *         senderEmail,
 *         receiverId,
 *         subjectName
 *       )
 *     );
 *   }
 * }
 * ```
 * 
 * 3. Ver reacciones en logs:
 * 
 * ```
 * [Event] Emitiendo evento: SolicitudConexionEnviada - 3 observadores
 * 📱 [AppNotification] Procesando evento: SolicitudConexionEnviada
 * 📧 [EmailNotification] Enviando email para: SolicitudConexionEnviada
 * ⏳ [PendingCounter] Usuario xyz: 1 solicitudes pendientes
 * ```
 * 
 * ===============================================
 * AGREGAR UN NUEVO OBSERVADOR
 * ===============================================
 * 
 * Si mañana quieres agregar notificaciones por SMS:
 * 
 * 1. Crear clase: SMSNotificationObserver implements Observer
 * 2. Implementar: handle(), getInterestedEvents()
 * 3. Registrar en main.ts: .addObserver(new SMSNotificationObserver())
 * 
 * ¡Listo! No necesitas modificar:
 * - EventBus
 * - Observadores existentes
 * - Use Cases
 * 
 * El nuevo observador se suscribe automáticamente a sus eventos.
 * 
 * ===============================================
 * VENTAJAS DEL OBSERVER PATTERN
 * ===============================================
 * 
 * ✅ Loose Coupling
 *    - Los observadores no conocen unos a otros
 *    - Si falla uno, los otros continúan
 *    - Agregar observador NO afecta código existente
 * 
 * ✅ Single Responsibility
 *    - AppNotification: Solo actualiza badge
 *    - EmailNotification: Solo envía emails
 *    - PendingCounter: Solo cuenta pendientes
 * 
 * ✅ Open/Closed Principle
 *    - Abierto a nuevos observadores
 *    - Cerrado a modificación (cambios existentes)
 * 
 * ✅ Mantenibilidad
 *    - Cada observador tiene lógica clara
 *    - Tests independientes por observador
 *    - Fácil de debuguear
 * 
 * ===============================================
 * EVENTOS SOPORTADOS
 * ===============================================
 * 
 * Estudio/Solicitudes:
 * - SolicitudConexionEnviada
 * - SolicitudRecibida
 * - SolicitudAceptada
 * - SolicitudRechazada
 * 
 * Grupos:
 * - GrupoCreado
 * - MiembroAgregado
 * - MiembroRemovido
 * 
 * Mensajes:
 * - NuevoMensaje
 * - ConversacionIniciada
 * 
 * Eventos Académicos:
 * - EventoCreado
 * - EventoActualizado
 * - EventoCancelado
 * 
 * ===============================================
 * ESTRUCTURA DE CARPETAS
 * ===============================================
 * 
 * /backend/shared/patterns/observer/
 * ├── EventEmitter.ts               (base abstracta)
 * ├── AppNotificationObserver.ts    (notificaciones app)
 * ├── EmailNotificationObserver.ts  (emails)
 * ├── PendingCounterObserver.ts     (contador)
 * ├── EventBus.ts                   (singleton + builder)
 * ├── EventFactory.ts               (factory de eventos)
 * └── index.ts                      (exports)
 * 
 */

export const OBSERVER_PATTERN_GUIDE = true;
