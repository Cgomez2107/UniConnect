# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: tests\us-o01-observer.spec.ts >> US-O01: Observer de Grupos de Estudio >> Emisión y persistencia de SOLICITUD_INGRESO
- Location: tests\us-o01-observer.spec.ts:47:3

# Error details

```
Error: Debe existir una notificación solicitud_ingreso para el admin del grupo.

expect(received).toBeTruthy()

Received: false
```

# Test source

```ts
  1   | import { test, expect, APIRequestContext } from '@playwright/test';
  2   | 
  3   | test.describe.serial('US-O01: Observer de Grupos de Estudio', () => {
  4   |   // 🔥 ESTA ES LA LÍNEA MÁGICA QUE FUERZA LA URL BASE 🔥
  5   | test.use({ baseURL: 'http://localhost:3101' });
  6   |   let groupId: string;
  7   |   let applicationId: string;
  8   |   
  9   |   // Intercambiamos los IDs en las variables:
  10  | const adminId = 'de02577f-3821-452c-b0c4-f7cafee581bc'; // Nicolle ahora es la Admin
  11  | const applicantId = '03366210-55f1-4902-8bbe-158e77ca823a'; // Natalia ahora es la Aplicante
  12  | const newAdminId = 'f87b6f87-6597-474e-b9d8-571a0bdd7831'; // Juan sigue siendo el Nuevo Admin
  13  | 
  14  |   const subjectId = '4e1e45fa-7f29-469d-b40d-ea9bf4539d22'; // Álgebra Lineal
  15  | 
  16  |   const getNotifications = async (request: APIRequestContext, userId: string) => {
  17  |     const response = await request.get('/api/v1/notifications', {
  18  |       headers: { 'x-user-id': userId },
  19  |     });
  20  |     await expect(response, 'GET /api/v1/notifications debe responder OK').toBeOK();
  21  |     const payload = await response.json();
  22  |     
  23  |     if (Array.isArray(payload)) return payload;
  24  |     if (payload?.notifications && Array.isArray(payload.notifications)) return payload.notifications;
  25  |     if (payload?.data && Array.isArray(payload.data)) return payload.data;
  26  |     return [];
  27  |   };
  28  | 
  29  |   test('Setup: Crear grupo de estudio', async ({ request }) => {
  30  |     const createRes = await request.post('/api/v1/study-groups', {
  31  |       headers: { 'x-user-id': adminId },
  32  |       data: {
  33  |         title: 'Grupo de Estudio - Álgebra',
  34  |         description: 'Preparación para el parcial E2E',
  35  |         subjectId: subjectId, 
  36  |         maxMembers: 5,        
  37  |       }, 
  38  |     });
  39  | 
  40  |     await expect(createRes, 'Debe crear el grupo exitosamente').toBeOK();
  41  |     const payload = await createRes.json();
  42  |     
  43  |     groupId = payload.id || payload.data?.id;
  44  |     expect(groupId).toBeDefined();
  45  |   });
  46  | 
  47  |   test('Emisión y persistencia de SOLICITUD_INGRESO', async ({ request }) => {
  48  |     const applyRes = await request.post(`/api/v1/study-groups/${groupId}/apply`, {
  49  |       headers: { 'x-user-id': applicantId },
  50  |       data: { message: '¡Hola! Quiero unirme para estudiar matrices.' }
  51  |     });
  52  |     await expect(applyRes, 'El apply debe ser exitoso').toBeOK();
  53  | 
  54  |     const notifications = await getNotifications(request, adminId);
  55  |     expect(
  56  |       notifications.some((n: any) => n.type === 'solicitud_ingreso'),
  57  |       'Debe existir una notificación solicitud_ingreso para el admin del grupo.'
> 58  |     ).toBeTruthy();
      |       ^ Error: Debe existir una notificación solicitud_ingreso para el admin del grupo.
  59  |   });
  60  | 
  61  |   test('Setup 2: Obtener ID de la aplicación', async ({ request }) => {
  62  |     const appsRes = await request.get(`/api/v1/study-groups/${groupId}/applications`, {
  63  |       headers: { 'x-user-id': adminId },
  64  |     });
  65  |     await expect(appsRes).toBeOK();
  66  |     const payload = await appsRes.json();
  67  |     const applications = Array.isArray(payload) ? payload : payload.data;
  68  |     
  69  |     applicationId = applications[0].id;
  70  |     expect(applicationId).toBeDefined();
  71  |   });
  72  | 
  73  |   test('Emisión y persistencia de MIEMBRO_ACEPTADO', async ({ request }) => {
  74  |     const reviewRes = await request.put(`/api/v1/study-groups/applications/${applicationId}/review`, {
  75  |       headers: { 'x-user-id': adminId },
  76  |       data: { status: 'aceptada' },
  77  |     });
  78  |     await expect(reviewRes, 'La revisión debe ser exitosa').toBeOK();
  79  | 
  80  |     const notifications = await getNotifications(request, applicantId);
  81  |     expect(
  82  |       notifications.some((n: any) => n.type === 'miembro_aceptado'),
  83  |       'Debe existir una notificación miembro_aceptado para el aplicante.'
  84  |     ).toBeTruthy();
  85  |   });
  86  | 
  87  |   test('Emisión y persistencia de TRANSFERENCIA_ADMIN_SOLICITADA', async ({ request }) => {
  88  |     const transferRes = await request.post(`/api/v1/study-groups/${groupId}/transfer`, {
  89  |       headers: { 'x-user-id': adminId },
  90  |       data: { targetUserId: newAdminId }, 
  91  |     });
  92  |     await expect(transferRes, 'La transferencia debe ser exitosa').toBeOK();
  93  | 
  94  |     const notifications = await getNotifications(request, newAdminId);
  95  |     expect(
  96  |       notifications.some((n: any) => n.type === 'transferencia_admin_solicitada'),
  97  |       'Debe existir una notificación transferencia_admin_solicitada para el nuevo admin.'
  98  |     ).toBeTruthy();
  99  |   });
  100 | });
```