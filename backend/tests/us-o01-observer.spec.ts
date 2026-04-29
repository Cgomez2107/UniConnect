import { test, expect, APIRequestContext } from '@playwright/test';

test.describe.serial('US-O01: Observer de Grupos de Estudio', () => {
  // 🔥 ESTA ES LA LÍNEA MÁGICA QUE FUERZA LA URL BASE 🔥
test.use({ baseURL: 'http://localhost:3101' });
  let groupId: string;
  let applicationId: string;
  
  // UUIDs reales de estudiantes de Álgebra Lineal
  const adminId = '03366210-55f1-4902-8bbe-158e77ca823a'; // NATALIA GALLEGO ANGEL
  const applicantId = 'de02577f-3821-452c-b0c4-f7cafee581bc'; // NICOLLE VICTORIA SILVA RESTREPO
  const newAdminId = 'f87b6f87-6597-474e-b9d8-571a0bdd7831'; // JUAN MAURICIO ARIAS HERNANDEZ
  
  const subjectId = '4e1e45fa-7f29-469d-b40d-ea9bf4539d22'; // Álgebra Lineal

  const getNotifications = async (request: APIRequestContext, userId: string) => {
    const response = await request.get('/api/v1/notifications', {
      headers: { 'x-user-id': userId },
    });
    await expect(response, 'GET /api/v1/notifications debe responder OK').toBeOK();
    const payload = await response.json();
    
    if (Array.isArray(payload)) return payload;
    if (payload?.notifications && Array.isArray(payload.notifications)) return payload.notifications;
    if (payload?.data && Array.isArray(payload.data)) return payload.data;
    return [];
  };

  test('Setup: Crear grupo de estudio', async ({ request }) => {
    const createRes = await request.post('/api/v1/study-groups', {
      headers: { 'x-user-id': adminId },
      data: {
        title: 'Grupo de Estudio - Álgebra',
        description: 'Preparación para el parcial E2E',
        subjectId: subjectId, 
        maxMembers: 5,        
      }, 
    });

    await expect(createRes, 'Debe crear el grupo exitosamente').toBeOK();
    const payload = await createRes.json();
    
    groupId = payload.id || payload.data?.id;
    expect(groupId).toBeDefined();
  });

  test('Emisión y persistencia de SOLICITUD_INGRESO', async ({ request }) => {
    const applyRes = await request.post(`/api/v1/study-groups/${groupId}/apply`, {
      headers: { 'x-user-id': applicantId },
      data: { message: '¡Hola! Quiero unirme para estudiar matrices.' }
    });
    await expect(applyRes, 'El apply debe ser exitoso').toBeOK();

    const notifications = await getNotifications(request, adminId);
    expect(
      notifications.some((n: any) => n.type === 'solicitud_ingreso'),
      'Debe existir una notificación solicitud_ingreso para el admin del grupo.'
    ).toBeTruthy();
  });

  test('Setup 2: Obtener ID de la aplicación', async ({ request }) => {
    const appsRes = await request.get(`/api/v1/study-groups/${groupId}/applications`, {
      headers: { 'x-user-id': adminId },
    });
    await expect(appsRes).toBeOK();
    const payload = await appsRes.json();
    const applications = Array.isArray(payload) ? payload : payload.data;
    
    applicationId = applications[0].id;
    expect(applicationId).toBeDefined();
  });

  test('Emisión y persistencia de MIEMBRO_ACEPTADO', async ({ request }) => {
    const reviewRes = await request.put(`/api/v1/study-groups/applications/${applicationId}/review`, {
      headers: { 'x-user-id': adminId },
      data: { status: 'aceptada' },
    });
    await expect(reviewRes, 'La revisión debe ser exitosa').toBeOK();

    const notifications = await getNotifications(request, applicantId);
    expect(
      notifications.some((n: any) => n.type === 'miembro_aceptado'),
      'Debe existir una notificación miembro_aceptado para el aplicante.'
    ).toBeTruthy();
  });

  test('Emisión y persistencia de TRANSFERENCIA_ADMIN_SOLICITADA', async ({ request }) => {
    const transferRes = await request.post(`/api/v1/study-groups/${groupId}/transfer`, {
      headers: { 'x-user-id': adminId },
      data: { targetUserId: newAdminId }, 
    });
    await expect(transferRes, 'La transferencia debe ser exitosa').toBeOK();

    const notifications = await getNotifications(request, newAdminId);
    expect(
      notifications.some((n: any) => n.type === 'transferencia_admin_solicitada'),
      'Debe existir una notificación transferencia_admin_solicitada para el nuevo admin.'
    ).toBeTruthy();
  });
});