# 🐞 Reporte de Auditoría de Bugs - UniConnect

$ fly deploy --config fly-web.toml
fly deploy

## 📋 Resumen
Este documento detalla los problemas y bugs encontrados durante la auditoría de la aplicación desplegada en **fly.io**. Se han categorizado según el módulo afectado, describiendo el comportamiento actual, su impacto y sugiriendo posibles causas o soluciones para el equipo de desarrollo.

---

## 🐛 Detalles de los Bugs Encontrados

### 1. 🚨 Fuga de Información en Consola (Perfil de Estudiante)
- **Ruta Afectada:** `/perfil-estudiante/:id`
- **Descripción:** Al visitar el perfil de un estudiante, se está imprimiendo en la consola del navegador un objeto JSON completo con los datos del usuario. El objeto incluye información sensible como `id`, `fullName`, `phoneNumber`, `bio`, y `programName`.
- **Impacto:** **Alto (Seguridad / Privacidad)**. En un entorno de producción, dejar `console.log` con datos de usuarios (especialmente números de teléfono) expone información privada.
- **Acción recomendada:** Buscar en el componente de React que renderiza el perfil y eliminar el `console.log` que imprime la respuesta de la API.

OK

### 2. ⛔ Error HTTP 400 al Subir Recursos
- **Endpoint Afectado:** `POST /api/v1/resources` (Backend)
- **Descripción:** Al intentar subir un recurso, la petición falla con un código `400 (Bad Request)`. En el frontend se muestra la advertencia: *⚠️ El cuerpo de la solicitud no cumple el contrato*.
- **Impacto:** **Alto**. Bloquea completamente una funcionalidad principal.
- **Acción recomendada:** Revisar el contrato de la API. El frontend está enviando un payload que no coincide con el DTO o esquema esperado por Node.js/Supabase. Verificar nombres de propiedades y campos obligatorios. Revisar si es un problema de back o front, o si definitivamente, fue por despliegue.

OK

### 3. 🧩 Visualización Incorrecta de Materias (IDs en lugar de Nombres)
- **Ruta Afectada:** `/edit-profile`
- **Descripción:** En la sección donde se listan o seleccionan las materias, la interfaz está renderizando el identificador único (UUID) en lugar del nombre legible de la asignatura.
- **Impacto:** **Medio**. Afecta negativamente la experiencia de usuario (UX).
- **Acción recomendada:** Revisar el mapeo del arreglo en el frontend. Asegurarse de renderizar `materia.name` en lugar de `materia.id`. Si el endpoint solo devuelve IDs, hacer un cruce de datos o 'join' en el backend.

Ahora el perfil no está leyendo el programa, lo que no me permite editar las materias que estoy viendo 

### 4. 🔣 Problema de Codificación (Mojibake) en Chats Vacíos
- **Módulo Afectado:** Chat
- **Descripción:** Al ingresar a un chat que no contiene mensajes previos, la pantalla muestra una cadena de caracteres extraños (ej: `¡Ãƒâ€šÃ‚Â¬ÃƒÆ’...`).
- **Impacto:** **Medio**. Error visual que denota problemas de codificación de texto.
- **Acción recomendada:** Verificar que el texto estático dentro del componente (ej. un placeholder de "No hay mensajes") esté guardado con codificación `UTF-8` y no presente corrupción de caracteres.

OK

### 5. 🔌 Inconsistencia Bidireccional en WebSockets (Chat)
- **Módulo Afectado:** Chat / WebSockets
- **Descripción:** Si el Usuario A envía un mensaje al Usuario B, este llega al instante. Sin embargo, si el Usuario B responde o intenta enviar un mensaje al Usuario A, el Usuario A no lo recibe en tiempo real, rompiendo la bidireccionalidad.
- **Impacto:** **Alto**. Afecta la experiencia central de mensajería en tiempo real.
- **Acción recomendada:** Verificar el manejo de las salas o canales (rooms) en el servidor de WebSockets. Es probable que el socket del Usuario A no esté correctamente suscrito a su canal de recepción, o que la asociación del `socket.id` con el `userId` se esté perdiendo en una de las direcciones. Solo ocurre en los chats infividuales.

OK

### 6. ❌ Eliminación Errónea de Solicitudes de Grupo (Cruce de Datos)
- **Módulo Afectado:** Grupos
- **Descripción:** Al aplicar a un grupo y cancelar dicha solicitud de inmediato, el sistema elimina por error la solicitud de otra persona distinta en lugar de la propia.
- **Impacto:** **Crítico**. Alteración e integridad de datos de terceros.
- **Acción recomendada:** Revisar urgentemente la consulta `DELETE` en el backend. Es muy probable que se esté borrando el registro filtrando únicamente por `groupId` y se esté omitiendo el `userId` en la cláusula `WHERE`, o que el estado de React esté pasando un ID de solicitud incorrecto.

OK

### 7. ⏱️ Retraso en la Sincronización de Notificaciones
- **Módulo Afectado:** Notificaciones
- **Descripción:** Las notificaciones en la app no llegan al instante; el contador numérico en el ícono de la campanita tarda unos cuantos segundos en aparecer o actualizarse.
- **Impacto:** **Medio**.
- **Acción recomendada:** Confirmar la estrategia de obtención de datos. Si actualmente funciona por *Polling* (llamadas HTTP cada X segundos), se recomienda migrar la actualización del contador a los WebSockets para que funcione mediante eventos *push* en tiempo real.

OK

### 8. 🔔 Notificaciones Duplicadas al Transferir Administración
- **Módulo Afectado:** Grupos / Notificaciones
- **Descripción:** Al utilizar la opción de transferir el rol de administrador de un grupo a otro integrante, el usuario receptor recibe la notificación dos veces.
- **Impacto:** **Bajo / Medio**.
- **Acción recomendada:** Revisar el controlador de transferencia de roles. Es posible que el evento de notificación se esté disparando dos veces: una desde la lógica de la aplicación y otra a través de un trigger en la base de datos, o por un `useEffect` sin dependencias correctas en el frontend.

La notificación ya no tiene descripción ni enlace, antes era así, ahora es así:

Este si

Tienes una solicitud para transferir la administracion del grupo.

20 de may de 2026, 12:57 a. m.

Ver grupo →

ahora:

ese siiiii

Y solo me deja transferir, si solo se mete desde la notificación, por ende, en este caso no me deja, es decir, si me meto nuevamente al grupo, no me aparece el aceptar o rechazar transferencia.

### 9. ⚠️ Error Lógico Severo al Aceptar Transferencia de Administrador
- **Módulo Afectado:** Grupos
- **Descripción:** Cuando la persona receptora acepta la transferencia de administrador, el usuario que la solicitó inicialmente es eliminado del grupo por completo.
- **Impacto:** **Alto**. Provoca la pérdida involuntaria de pertenencia al grupo.
- **Acción recomendada:** Modificar la lógica de actualización en el backend. En lugar de eliminar un registro o sacar al usuario, el endpoint solo debe hacer un `UPDATE` en la tabla intermedia de miembros: cambiar el rol del solicitante a `MEMBER` y el del receptor a `ADMIN`.

no lo pude probar por lo mismo

