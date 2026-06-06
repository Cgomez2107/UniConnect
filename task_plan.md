# Diagnóstico: Notificaciones no se muestran en Web

## Objetivo
Investigar por qué las notificaciones (en particular las de recordatorio) no llegan/se muestran en la web.

## Fases

### Fase 1: Trazar el pipeline completo de notificaciones
- [ ] Backend: dominio → evento → NotificationMapper → NotificationObserver → API
- [ ] Web: API call → hook/state → componente UI
- [ ] Identificar dónde se rompe la cadena

### Fase 2: Revisar backend
- [ ] ¿El NotificationObserver está registrado/wired?
- [ ] ¿El endpoint de notificaciones existe y expone datos?
- [ ] ¿El reminder (SessionScheduler) realmente invoca al notification service?
- [ ] Revisar logs/errores

### Fase 3: Revisar web
- [ ] ¿Cómo fetch notificaciones el frontend?
- [ ] ¿El componente de notificaciones renderiza los datos?
- [ ] ¿Hay errores de red/API en el frontend?

### Fase 4: Corregir y verificar
- [ ] Aplicar correcciones
- [ ] Verificar end-to-end
