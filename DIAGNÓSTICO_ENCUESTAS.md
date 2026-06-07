## US-CB01

Como estudiante universitario autenticado en UniConnect, quiero interactuar con un chatbot embebido en el dashboard web que reconozca mi rol (estudiante, moderador, super_admin) y adapte sus respuestas al contexto de la plataforma, para resolver dudas sin abandonar la interfaz.

### Criterio 1
Dado que
el usuario está autenticado con rol 'estudiante'
Cuando
abre el widget de chatbot en el dashboard
Entonces
ve una interfaz de chat con historial de la sesión actual, el chatbot responde únicamente sobre temas de UniConnect y las respuestas incluyen referencias a la sección del manual consultada
### Criterio 2
Dado que
el usuario tiene rol 'super_admin'
Cuando
realiza una consulta sobre configuración del sistema
Entonces
el chatbot ofrece respuestas con detalle técnico exclusivo del rol y las respuestas están diferenciadas visualmente del flujo de estudiante
### Criterio 3
Dado que
el backend de RAG no responde en menos de 10 segundos
Cuando
el chatbot está esperando respuesta
Entonces
muestra un indicador de carga animado y si supera 15 segundos muestra el mensaje de degradación elegante
### Criterio 4
Dado que
el usuario envía una consulta
Cuando
la respuesta llega del pipeline RAG
Entonces
el mensaje se renderiza con markdown (negritas, listas, bloques de código) y el widget mantiene el historial visible con scroll sin recargar la página


## US-CB02

Como super_admin, quiero subir el manual de usuario de UniConnect en formato PDF para que sea procesado, vectorizado y almacenado en pgvector, de modo que el chatbot pueda responder preguntas con base en documentación oficial actualizada.

### Criterio 1
Dado que
el super_admin accede al panel de administración de documentos
Cuando
sube un archivo PDF de hasta 20 MB
Entonces
el sistema lo divide en chunks de 500 tokens con 50 de solapamiento, genera embeddings usando el modelo configurado en Groq y almacena los vectores en pgvector asociados al documento y su versión
### Criterio 2
Dado que
ya existe una versión del manual en el vector store
Cuando
se sube una versión nueva del mismo documento
Entonces
el sistema elimina los vectores de la versión anterior y carga los nuevos sin duplicados en la colección
### Criterio 3
Dado que
el proceso de ingesta falla por error de red o de parseo
Cuando
ocurre el error
Entonces
el sistema registra el error en el log con timestamp y nombre del archivo, notifica al super_admin con el detalle del fallo vía alerta en el panel y no deja vectores parciales en la base de datos
### Criterio 4
Dado que
la ingesta finaliza correctamente
Cuando
el super_admin consulta el panel de documentos
Entonces
ve el nombre del archivo, fecha de ingesta, número de chunks generados y puede realizar una consulta de prueba directamente desde el panel

## US-CB03

Como equipo de desarrollo, queremos implementar en n8n el pipeline completo de consulta RAG que recibe la pregunta del usuario junto con su rol, recupera los chunks más relevantes de pgvector, construye el prompt con contexto y obtiene la respuesta de Groq, para garantizar que el chatbot responda con base en información real de UniConnect.

### Criterio 1
Dado que
el chatbot recibe una pregunta del usuario
Cuando
el flujo n8n se activa vía webhook POST con payload {pregunta, rol, userId}
Entonces
ejecuta la búsqueda semántica en pgvector recuperando los 5 chunks más relevantes con similitud coseno mayor a 0.75, construye el prompt con el contexto recuperado y el rol del usuario, envía el prompt a Groq con el modelo llama3-8b-8192 y retorna la respuesta junto con las referencias de los chunks usados
### Criterio 2
Dado que
ningún chunk supera el umbral de similitud 0.75
Cuando
el pipeline no encuentra contexto relevante
Entonces
responde con el mensaje configurado: 'No encontré información específica sobre eso en el manual de UniConnect' y registra la consulta sin respuesta en la tabla de feedback para revisión
### Criterio 3
Dado que
el flujo completo se ejecuta correctamente
Cuando
se mide el tiempo de respuesta
Entonces
el pipeline responde en menos de 8 segundos en condiciones normales y el log de n8n registra cada ejecución con duración, chunks recuperados y rol

## US-CB04


Como equipo de desarrollo, queremos aplicar el patrón Strategy ya implementado en Sprint 4 para seleccionar el prompt del sistema del chatbot según el rol del usuario autenticado, de modo que cada rol reciba instrucciones de comportamiento distintas sin acoplar esa lógica al pipeline principal.

### Criterio 1
Dado que
el pipeline RAG recibe una solicitud con rol 'estudiante'
Cuando
construye el prompt del sistema
Entonces
aplica la estrategia EstudiantePromptStrategy que limita respuestas a funcionalidades de la plataforma y usa lenguaje accesible
### Criterio 2
Dado que
el pipeline recibe una solicitud con rol 'super_admin'
Cuando
construye el prompt del sistema
Entonces
aplica la estrategia AdminPromptStrategy que incluye contexto técnico y permite preguntas sobre configuración, logs y métricas del sistema
### Criterio 3
Dado que
se agrega un rol nuevo en el futuro
Cuando
se crea la estrategia correspondiente
Entonces
el pipeline la adopta sin modificar el código del servicio de chat y los tests unitarios de la nueva estrategia corren de forma aislada
### Criterio 4
Dado que
el PromptStrategyContext recibe un rol no registrado
Cuando
intenta resolver la estrategia
Entonces
lanza una excepción controlada con mensaje descriptivo y el error queda registrado en el log sin romper la sesión del usuario

## US-CB05

Como estudiante, quiero calificar cada respuesta del chatbot como útil o no útil para que el equipo pueda identificar qué consultas no están siendo resueltas bien y mejorar el manual o el pipeline RAG.

### Criterio 1
Dado que
el chatbot entrega una respuesta
Cuando
el mensaje aparece en el widget
Entonces
se muestran los botones 'Útil' y 'No útil' debajo de la respuesta y el usuario puede seleccionar uno de los dos sin recargar la página
### Criterio 2
Dado que
el usuario selecciona 'No útil'
Cuando
confirma el feedback
Entonces
el sistema guarda en base de datos: userId, pregunta, respuesta, chunks usados, timestamp y calificación, y ofrece opcionalmente un campo de texto para comentario adicional
### Criterio 3
Dado que
el super_admin accede al panel de administración del chatbot
Cuando
consulta la sección de feedback
Entonces
ve una tabla paginada con todas las respuestas calificadas como 'No útil' ordenadas por frecuencia de pregunta similar y puede exportar el reporte en CSV para análisis externo
### Criterio 4
Dado que
una misma pregunta recibe 3 o más calificaciones 'No útil'
Cuando
el sistema detecta el patrón
Entonces
activa el flujo n8n US-N8N03 para notificar al super_admin

## US-EV01

Como super_admin de UniConnect, quiero que las rutas exclusivas de administración estén protegidas por un guardia de autorización que valide mi rol desde el JWT, para que ningún usuario con rol estándar pueda acceder a funciones administrativas aunque conozca la URL.

### Criterio 1
Dado que
un usuario con rol 'user' intenta acceder a un endpoint de administración (prefijo /admin)
Cuando
realiza la petición con JWT válido pero rol incorrecto
Entonces
el servidor retorna HTTP 403 con mensaje 'Acceso restringido a super_admin' y el intento queda registrado en el log de auditoría con userId y timestamp
### Criterio 2
Dado que
el super_admin realiza la misma petición con su JWT
Cuando
el guardia valida el token
Entonces
extrae el rol del payload JWT y permite el acceso y no realiza una consulta adicional a la base de datos para verificar el rol
### Criterio 3
Dado que
el guardia está implementado como Decorator NestJS (@Roles, @UseGuards)
Cuando
se aplica a un nuevo controlador
Entonces
la protección queda activa sin modificar el controlador base y el test unitario del guardia cubre los tres casos: sin token, token inválido, rol insuficiente


## US-EV02

Como super_admin, quiero gestionar las categorías de eventos de UniConnect (académico, cultural, deportivo, etc.) desde el panel de administración para que los creadores de eventos puedan clasificar sus publicaciones con categorías controladas y consistentes.

### Criterio 1
Dado que
el super_admin accede a la gestión de categorías
Cuando
crea una nueva categoría con nombre y descripción opcionales
Entonces
el sistema valida que el nombre no exista ya (case-insensitive), la guarda con slug generado automáticamente a partir del nombre y retorna HTTP 201 con la categoría creada incluyendo id y slug
### Criterio 2
Dado que
el super_admin intenta crear una categoría con nombre duplicado
Cuando
el sistema detecta el conflicto
Entonces
retorna HTTP 409 con mensaje que identifica la categoría existente
### Criterio 3
Dado que
el super_admin edita una categoría existente
Cuando
actualiza el nombre
Entonces
el slug se regenera automáticamente y los eventos que usaban la categoría mantienen la referencia por id sin romperse
### Criterio 4
Dado que
el super_admin elimina una categoría que tiene eventos asociados
Cuando
intenta la eliminación
Entonces
el sistema retorna HTTP 409 indicando cuántos eventos activos la usan y no permite la eliminación hasta que los eventos sean reasignados o eliminados

## US-EV03

Como usuario autenticado de UniConnect, quiero crear, editar y publicar eventos universitarios con un ciclo de vida controlado (borrador, publicado, cancelado, finalizado) para que la comunidad pueda conocer y registrarse en actividades relevantes de la universidad.

### Criterio 1
Dado que
un usuario autenticado crea un evento
Cuando
completa título, descripción, categoría, fecha, lugar y cupo máximo
Entonces
el evento se guarda en estado 'borrador' asociado al userId creador y el creador puede editar todos los campos mientras esté en borrador
### Criterio 2
Dado que
el creador publica el evento
Cuando
cambia el estado a 'publicado' usando el patrón State implementado en S4
Entonces
el sistema valida que la fecha sea futura y el cupo sea mayor a 0, un evento publicado no puede volver a borrador y el evento aparece en la lista pública con paginación
### Criterio 3
Dado que
el creador o el super_admin cancela un evento publicado
Cuando
ejecuta la transición a 'cancelado'
Entonces
el sistema notifica por Observer a todos los usuarios registrados y el evento queda visible como cancelado pero no acepta nuevos registros
### Criterio 4
Dado que
se elimina un evento
Cuando
el super_admin ejecuta el soft delete
Entonces
el campo deletedAt se registra con timestamp, el evento desaparece de todas las listas públicas y permanece recuperable en el panel de administración con filtro 'eliminados'

## US-EV04

Como creador de un evento privado en UniConnect, quiero generar invitaciones con token único por destinatario para que solo las personas invitadas puedan registrarse, controlando el acceso sin exponer el evento en la lista pública general.

### Criterio 2
Dado que
el invitado accede al enlace con token válido
Cuando
el sistema valida el token
Entonces
verifica que no haya expirado y que no haya sido usado, permite el registro del usuario al evento directamente y marca el token como consumido para impedir reusos
### Criterio 3
Dado que
el token ha expirado o ya fue consumido
Cuando
el invitado intenta usarlo
Entonces
retorna HTTP 410 con mensaje descriptivo según el caso y sugiere al invitado contactar al creador del evento para una nueva invitación
### Criterio 4
Dado que
el creador revisa la lista de invitaciones enviadas
Cuando
consulta el panel del evento
Entonces
ve el estado de cada token: pendiente, consumido, expirado

## US-EV05

Como estudiante de UniConnect, quiero explorar los eventos publicados usando filtros por categoría, fecha y estado de disponibilidad para encontrar rápidamente actividades que me interesen sin desplazarme por listas largas.


### Criterio 1
Dado que
el estudiante accede a la sección de eventos
Cuando
la página carga por primera vez
Entonces
ve los primeros 10 eventos publicados y futuros ordenados por fecha ascendente y puede navegar por páginas con los controles de paginación (anterior/siguiente)
### Criterio 2
Dado que
el estudiante aplica el filtro por categoría
Cuando
selecciona una o más categorías
Entonces
la lista se actualiza sin recargar la página mostrando solo los eventos de las categorías seleccionadas y el número total de resultados se actualiza en el encabezado de la sección
### Criterio 3
Dado que
el estudiante escribe texto en el buscador
Cuando
ingresa al menos 3 caracteres
Entonces
el sistema realiza búsqueda en título y descripción con debounce de 300ms para no saturar el backend y resalta los términos coincidentes en los resultados
### Criterio 4
Dado que
un evento tiene cupo lleno
Cuando
aparece en la lista
Entonces
se muestra con etiqueta visible 'Cupo agotado' y el botón de registro está deshabilitado pero el evento sigue siendo visible

## US-EV06

Como estudiante autenticado, quiero registrarme en un evento publicado y poder cancelar mi registro antes de la fecha límite para que el cupo quede disponible para otro estudiante interesado.

### Criterio 1
Dado que
el estudiante accede a un evento con cupo disponible
Cuando
hace clic en 'Registrarme'
Entonces
el sistema crea el registro en la tabla evento_usuario con timestamp, decrementa atómicamente el contador de cupos disponibles y notifica al estudiante con confirmación en pantalla y correo electrónico
### Criterio 2
Dado que
el último cupo es tomado simultáneamente por dos usuarios
Cuando
ambas peticiones llegan al servidor
Entonces
el mecanismo de bloqueo optimista garantiza que solo una triunfa y el segundo usuario recibe HTTP 409 con mensaje 'Cupo agotado'
### Criterio 3
Dado que
el estudiante ya está registrado y quiere cancelar
Cuando
cancela antes de 24 horas de la fecha del evento
Entonces
el sistema elimina su registro y restaura el cupo y envía confirmación de cancelación al estudiante
### Criterio 4
Dado que
el estudiante intenta cancelar con menos de 24 horas de anticipación
Cuando
ejecuta la cancelación
Entonces
el sistema lo impide con mensaje que indica la política de cancelación y sugiere contactar al organizador directamente

## US-EV07

Como estudiante registrado en un evento de UniConnect, quiero recibir un código QR único que sirva como pase de acceso para que el organizador pueda verificar mi registro desde la aplicación móvil en la entrada del evento.

### Criterio 1
Dado que
el estudiante está registrado en un evento
Cuando
accede a la sección 'Mis eventos' en web o móvil
Entonces
ve su pase de acceso como código QR generado desde el token de registro cifrado con HMAC-SHA256 y puede hacer zoom al QR o descargarlo como imagen PNG
### Criterio 2
Dado que
el organizador abre el escáner QR en la aplicación móvil
Cuando
apunta la cámara al código del estudiante
Entonces
la app realiza la petición de verificación al backend, el backend valida la firma HMAC y confirma que el registro está activo, y la app muestra nombre del estudiante, foto de perfil y estado 'Válido' con fondo verde en menos de 2 segundos
### Criterio 3
Dado que
el QR ya fue escaneado previamente (intento de reutilización)
Cuando
el organizador vuelve a escanearlo
Entonces
la app muestra 'Ya verificado' con timestamp del primer escaneo y el acceso no se registra por segunda vez
### Criterio 4
Dado que
el QR corresponde a un registro cancelado o expirado
Cuando
se escanea
Entonces
la app muestra 'No válido' con fondo rojo y el motivo específico

## US-N8N01

Como estudiante registrado en un evento, quiero recibir un correo de recordatorio 24 horas antes de la fecha del evento para no olvidar mi asistencia y tener a mano el enlace a mi pase QR.

### Criterio 1
Dado que
el flujo n8n se ejecuta cada hora con trigger de cron
Cuando
detecta eventos cuya fecha está entre 23h y 25h en el futuro
Entonces
consulta todos los registros activos de esos eventos y envía un correo personalizado a cada registrado con nombre del evento, fecha, lugar y enlace directo al QR de su pase
### Criterio 2
Dado que
un usuario canceló su registro antes de que se ejecute el recordatorio
Cuando
el flujo procesa la lista de registros
Entonces
excluye los registros con estado 'cancelado' o 'cancelado_tarde' y no envía correo a usuarios no registrados
### Criterio 3
Dado que
el flujo de correo falla para un destinatario específico
Cuando
ocurre el error de envío
Entonces
registra el fallo en el log de n8n con userId y eventoId y continúa procesando los demás registros sin abortar el flujo completo
### Criterio 4
Dado que
el flujo ejecuta correctamente
Cuando
finaliza el ciclo
Entonces
almacena en la tabla n8n_executions el resumen: fecha, total enviados, total fallidos y duración de la ejecución

## US-N8N02


Como nuevo usuario de UniConnect, quiero recibir un correo de bienvenida al completar mi registro para conocer las funcionalidades principales de la plataforma y los pasos iniciales recomendados.

### Criterio 1
Dado que
un usuario completa el registro y verifica su correo institucional
Cuando
el backend emite el evento 'usuario.verificado' vía webhook a n8n
Entonces
el flujo se activa y espera 5 minutos antes de enviar el correo y envía el email personalizado con nombre del usuario, enlace al dashboard y los 3 pasos iniciales recomendados
### Criterio 2
Dado que
el webhook llega a n8n
Cuando
el flujo procesa el payload
Entonces
valida que el campo email contenga dominio @ucaldas.edu.co y si el dominio no corresponde detiene el flujo y registra la anomalía
### Criterio 3
Dado que
el correo de bienvenida es enviado
Cuando
el usuario lo recibe
Entonces
el asunto es 'Bienvenido a UniConnect, [nombre]', el cuerpo incluye el logo de UniConnect, saludo personalizado y botón de llamado a la acción hacia el dashboard, y el correo es responsive para móvil

## US-N8N03


Como super_admin, quiero recibir una alerta automática cuando el chatbot acumule un volumen alto de respuestas calificadas como 'No útil' para intervenir oportunamente actualizando el manual o ajustando el pipeline.

### Criterio 1
Dado que
el flujo n8n se ejecuta cada 6 horas
Cuando
consulta la tabla de feedback del chatbot
Entonces
agrupa las calificaciones 'No útil' de las últimas 24 horas y si el porcentaje supera el 30% del total de respuestas del período envía alerta al super_admin
### Criterio 2
Dado que
la alerta se activa
Cuando
el flujo prepara el correo
Entonces
incluye: total de consultas, total 'No útil', porcentaje, top 5 preguntas sin respuesta útil y enlace directo al panel de feedback
### Criterio 3
Dado que
ya se envió una alerta en las últimas 6 horas
Cuando
el flujo vuelve a ejecutarse
Entonces
no envía una segunda alerta aunque el umbral siga superado y registra en el log que la alerta fue suprimida por período de enfriamiento
### Criterio 4
Dado que
el flujo n8n mismo falla al ejecutarse
Cuando
ocurre el error
Entonces
n8n reintenta automáticamente 2 veces con intervalo de 5 minutos y si los tres intentos fallan envía notificación al correo del super_admin vía canal alternativo (SMTP directo sin pasar por el flujo principal)

## US-MO01

Como equipo de desarrollo, queremos extender la cadena Chain of Responsibility implementada en Sprint 4 para que los mensajes del chat de UniConnect pasen por filtros de moderación en cascada antes de ser almacenados, garantizando que el contenido publicado cumple las normas de la comunidad universitaria.

### Criterio 1
Dado que
un usuario envía un mensaje en el chat
Cuando
el mensaje entra al pipeline de moderación
Entonces
pasa secuencialmente por los handlers: LongitudHandler → PalabrasProhibidasHandler → SpamHandler → EnlacesExternosHandler y cada handler puede aprobar y pasar al siguiente, o rechazar y detener la cadena
### Criterio 2
Dado que
el mensaje supera los 1000 caracteres
Cuando
el LongitudHandler lo evalúa
Entonces
lo rechaza con código MO_001 y motivo 'Mensaje demasiado largo' y el mensaje no llega a los handlers siguientes
### Criterio 3
Dado que
el mensaje contiene palabras de la lista de términos prohibidos
Cuando
el PalabrasProhibidasHandler lo evalúa
Entonces
lo rechaza con código MO_002 registrando el término detectado y no revela al usuario qué término específico activó el filtro
### Criterio 4
Dado que
un usuario envía más de 5 mensajes en menos de 30 segundos
Cuando
el SpamHandler evalúa el patrón
Entonces
rechaza el mensaje con código MO_003 y bloquea al usuario por 5 minutos automáticamente y el bloqueo queda registrado en el historial de moderación



## US-MO02


Como usuario de UniConnect, quiero recibir una notificación inmediata y clara cuando uno de mis mensajes es rechazado por el sistema de moderación para entender qué ocurrió y ajustar mi comportamiento sin confundirme pensando que hubo un error técnico.

### Criterio 1
Dado que
el pipeline de moderación rechaza un mensaje del usuario
Cuando
el rechazo ocurre
Entonces
el usuario recibe en menos de 500ms una notificación inline debajo del campo de escritura con el motivo general del bloqueo y el mensaje rechazado permanece en el campo de texto para que pueda editarlo
### Criterio 2
Dado que
el rechazo es por spam y el usuario fue bloqueado temporalmente
Cuando
recibe la notificación
Entonces
ve un contador regresivo que indica cuántos segundos faltan para poder enviar mensajes nuevamente y el campo de escritura queda deshabilitado durante el bloqueo
### Criterio 3
Dado que
el mismo usuario acumula 3 bloqueos en menos de 1 hora
Cuando
se registra el tercer bloqueo
Entonces
el sistema escala el caso al super_admin vía notificación en el panel de moderación y correo electrónico y el usuario recibe aviso de que su caso fue escalado a revisión humana
### Criterio 4
Dado que
el usuario recibe la notificación de bloqueo
Cuando
hace clic en '¿Por qué?' en la notificación
Entonces
ve una explicación de las normas de la comunidad relacionadas con el tipo de infracción detectada

## US-MO03

Como super_admin, quiero acceder a un panel de moderación que me muestre el historial de mensajes bloqueados, los usuarios con mayor número de infracciones y las herramientas para tomar acciones correctivas, para mantener el ambiente de la comunidad universitaria en UniConnect.

### Criterio 1
Dado que
el super_admin accede al panel de moderación
Cuando
carga la vista principal
Entonces
ve una tabla paginada con los últimos 50 eventos de moderación que incluye: timestamp, userId, tipo de infracción (código MO_xxx), fragmento del mensaje (primeros 100 caracteres) y acción tomada
### Criterio 2
Dado que
el super_admin filtra por tipo de infracción o rango de fechas
Cuando
aplica los filtros
Entonces
la tabla se actualiza mostrando solo los registros correspondientes y el conteo total de infracciones filtradas aparece en el encabezado
### Criterio 3
Dado que
el super_admin selecciona un usuario en el panel
Cuando
accede a su perfil de moderación
Entonces
ve el historial completo de infracciones del usuario con línea de tiempo y puede ejecutar acciones: advertencia, suspensión temporal (días) o suspensión permanente, y cada acción queda registrada con el userId del super_admin que la ejecutó
### Criterio 4
Dado que
el super_admin exporta el reporte de moderación
Cuando
selecciona un rango de fechas y hace clic en exportar
Entonces
descarga un CSV con todos los campos del historial sin límite de filas y el nombre del archivo incluye el rango de fechas seleccionado

## US-T06

Como equipo de QA, queremos cubrir con tests unitarios cada handler de la cadena de moderación de forma aislada y en combinación para garantizar que el pipeline detecta correctamente todas las infracciones definidas antes de que el código llegue a producción.

### Criterio 1
Dado que
se ejecuta la suite de tests del pipeline de moderación
Cuando
todos los tests corren
Entonces
la cobertura de líneas del módulo de moderación es igual o superior al 90% y cada handler tiene mínimo un test para el caso de aprobación y uno para rechazo
### Criterio 2
Dado que
los handlers se prueban en cadena completa
Cuando
un mensaje activa el rechazo en el tercer handler
Entonces
el test verifica que los handlers 1 y 2 fueron invocados y que el handler 4 no fue invocado (cadena detenida correctamente)
### Criterio 3
Dado que
el SpamHandler evalúa frecuencia de mensajes
Cuando
el test simula 6 mensajes en 25 segundos del mismo userId
Entonces
el handler rechaza el sexto mensaje con código MO_003 y el test usa mocks del repositorio de mensajes sin tocar la base de datos real
### Criterio 4
Dado que
se modifica la lista de palabras prohibidas en la configuración
Cuando
se ejecutan los tests del PalabrasProhibidasHandler
Entonces
los tests leen la lista desde la misma fuente de configuración que usa producción y no tienen la lista hardcodeada en el test