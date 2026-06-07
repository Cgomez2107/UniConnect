import { describe, expect, expectTypeOf, it, vi } from "vitest";
import request from "supertest";
import { createStudyGroupsServer } from "../../src/app/createStudyGroupsServer.js";
import { StudyGroupsController } from "../../src/interfaces/http/controllers/StudyGroupsController.js";
import { CreateGroupRequestSchema, type CreateGroupRequest } from "@uniconnect/shared-types/contracts/study-group";
import type { ApiErrorResponse } from "@uniconnect/shared-types";

type UseCaseStub = {
  execute: ReturnType<typeof vi.fn>;
};

function buildStudyGroupsServer() {
  const sampleStudyRequest = {
    id: "req-001",
    authorId: "user-001",
    subjectId: "550e8400-e29b-41d4-a716-446655440111",
    title: "Grupo de Algebra",
    description: "Estudio colaborativo",
    maxMembers: 5,
    status: "abierta",
    isActive: true,
    createdAt: "2026-05-14T12:00:00.000Z",
    updatedAt: "2026-05-14T12:00:00.000Z",
  };
  const sampleMember = { id: "member-1", fullName: "Ana Gomez" };
  const sampleApplication = { id: "app-1", status: "pendiente" };
  const sampleMessage = { id: "msg-1", content: "Hola" };
  const sampleNotification = { id: "notif-1", title: "Nueva notificacion" };
  const sampleTransfer = { id: "transfer-1" };

  const listOpenStudyRequests: UseCaseStub = { execute: vi.fn().mockResolvedValue([sampleStudyRequest]) };
  const getStudyRequestById: UseCaseStub = { execute: vi.fn().mockResolvedValue(sampleStudyRequest) };
  const createStudyRequest: UseCaseStub = {
    execute: vi.fn().mockResolvedValue(sampleStudyRequest),
  };
  const listMembersByRequest: UseCaseStub = { execute: vi.fn().mockResolvedValue([sampleMember]) };
  const listApplicationsByRequest: UseCaseStub = { execute: vi.fn().mockResolvedValue([sampleApplication]) };
  const listStudyGroupMessages: UseCaseStub = { execute: vi.fn().mockResolvedValue([sampleMessage]) };
  const createStudyGroupMessage: UseCaseStub = { execute: vi.fn().mockResolvedValue(sampleMessage) };
  const listUserNotifications: UseCaseStub = { execute: vi.fn().mockResolvedValue([sampleNotification]) };
  const applyToStudyRequest: UseCaseStub = { execute: vi.fn().mockResolvedValue(sampleApplication) };
  const reviewApplication: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const requestAdminTransfer: UseCaseStub = { execute: vi.fn().mockResolvedValue(sampleTransfer) };
  const acceptAdminTransfer: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const leaveStudyGroup: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const rejectAdminTransfer: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const listMyStudyRequests: UseCaseStub = { execute: vi.fn().mockResolvedValue([]) };
  const listMyApplications: UseCaseStub = { execute: vi.fn().mockResolvedValue([]) };
  const cancelStudyRequest: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const toggleStudyGroupMessageReaction: UseCaseStub = { execute: vi.fn().mockResolvedValue(undefined) };
  const createStudySession: UseCaseStub = { execute: vi.fn().mockResolvedValue({ type: "single", session: {} }) };
  const cancelStudySession: UseCaseStub = { execute: vi.fn().mockResolvedValue({}) };
  const updateAvailability: UseCaseStub = { execute: vi.fn().mockResolvedValue({}) };
  const listSessionsByGroup = { execute: vi.fn().mockResolvedValue([]), listAttendees: vi.fn().mockResolvedValue([]) };

  const controller = new StudyGroupsController(
    listOpenStudyRequests as never,
    getStudyRequestById as never,
    createStudyRequest as never,
    listMembersByRequest as never,
    listApplicationsByRequest as never,
    listStudyGroupMessages as never,
    createStudyGroupMessage as never,
    listUserNotifications as never,
    applyToStudyRequest as never,
    reviewApplication as never,
    requestAdminTransfer as never,
    acceptAdminTransfer as never,
    rejectAdminTransfer as never,
    leaveStudyGroup as never,
    listMyStudyRequests as never,
    listMyApplications as never,
    cancelStudyRequest as never,
    toggleStudyGroupMessageReaction as never,
    createStudySession as never,
    cancelStudySession as never,
    updateAvailability as never,
    listSessionsByGroup as never,
  );

  return {
    server: createStudyGroupsServer(controller),
    createStudyRequest,
    listOpenStudyRequests,
    getStudyRequestById,
    listMembersByRequest,
    listApplicationsByRequest,
    listStudyGroupMessages,
    createStudyGroupMessage,
    listUserNotifications,
    applyToStudyRequest,
    reviewApplication,
    requestAdminTransfer,
    acceptAdminTransfer,
    leaveAdminRole,
    rejectAdminTransfer,
    listMyStudyRequests,
    listMyApplications,
    cancelStudyRequest,
    toggleStudyGroupMessageReaction,
    listSessionsByGroup,
  };
}

describe("Study Groups integration /study-groups", () => {
  it("permite crear una solicitud cuando el body cumple el contrato", async () => {
    const { server, createStudyRequest } = buildStudyGroupsServer();
    const validBody: CreateGroupRequest["body"] = {
      name: "Grupo de Algebra",
      description: "Estudio colaborativo",
      subjectId: "550e8400-e29b-41d4-a716-446655440111",
      maxMembers: 5,
    };

    expectTypeOf(validBody).toEqualTypeOf<CreateGroupRequest["body"]>();

    const response = await request(server as any)
      .post("/api/v1/study-groups")
      .set("Content-Type", "application/json")
      .set("x-user-id", "user-001")
      .send(validBody)
      .expect(201);

    expect(createStudyRequest.execute).toHaveBeenCalledTimes(1);
    expect(createStudyRequest.execute).toHaveBeenCalledWith({
      actorUserId: "user-001",
      subjectId: validBody.subjectId,
      title: validBody.name,
      description: validBody.description,
      maxMembers: validBody.maxMembers,
    });
    expect(response.body.data.id).toBe("req-001");
    expect(response.body.data.title).toBe("Grupo de Algebra");
  });

  it("responde VALIDATION_ERROR cuando falta subjectId", async () => {
    const { server, createStudyRequest } = buildStudyGroupsServer();

    const response = await request(server as any)
      .post("/api/v1/study-groups")
      .set("Content-Type", "application/json")
      .set("x-user-id", "user-001")
      .send({
        name: "Grupo de Algebra",
        description: "Estudio colaborativo",
        maxMembers: 5,
      })
      .expect(400);

    const body = response.body as ApiErrorResponse & { details?: { source?: string; fieldErrors?: Record<string, string[]>; formErrors?: string[] } };

    expect(body.error).toBe("VALIDATION_ERROR");
    expect(body.message).toBe("El cuerpo de la solicitud no cumple el contrato");
    expect(body.details?.source).toBe("body");
    expect(body.details?.fieldErrors?.subjectId?.length).toBeGreaterThan(0);
    expect(createStudyRequest.execute).not.toHaveBeenCalled();
  });

  it("cubre el resto de rutas HTTP del controlador", async () => {
    const {
      server,
      listOpenStudyRequests,
      getStudyRequestById,
      listMembersByRequest,
      listApplicationsByRequest,
      listStudyGroupMessages,
      createStudyGroupMessage,
      listUserNotifications,
      applyToStudyRequest,
      reviewApplication,
      requestAdminTransfer,
      acceptAdminTransfer,
    leaveStudyGroup,
    } = buildStudyGroupsServer();

    await request(server as any).get("/health").expect(200);
    await request(server as any).get("/api/v1/study-groups").expect(200);
    await request(server as any).get("/api/v1/study-groups/req-001").expect(200);
    await request(server as any).get("/api/v1/study-groups/req-001/members").set("x-user-id", "user-001").expect(200);
    await request(server as any).get("/api/v1/study-groups/req-001/applications").set("x-user-id", "user-001").expect(200);
    await request(server as any).get("/api/v1/study-groups/req-001/messages").set("x-user-id", "user-001").expect(200);
    await request(server as any).post("/api/v1/study-groups/req-001/apply").set("x-user-id", "user-001").send({ message: "Me interesa" }).expect(201);
    await request(server as any).post("/api/v1/study-groups/req-001/messages").set("x-user-id", "user-001").send({ content: "Hola" }).expect(201);
    await request(server as any).get("/api/v1/notifications").set("x-user-id", "user-001").expect(200);
    await request(server as any).post("/api/v1/study-groups/req-001/leave").set("x-user-id", "user-001").expect(200);
    await request(server as any).post("/api/v1/study-groups/req-001/transfer").set("x-user-id", "user-001").send({ targetUserId: "user-002" }).expect(201);
    await request(server as any).put("/api/v1/study-groups/applications/app-001/review").set("x-user-id", "user-001").send({ status: "aceptada" }).expect(200);
    await request(server as any).post("/api/v1/study-groups/transfers/tr-001/accept").set("x-user-id", "user-001").expect(200);

    expect(listOpenStudyRequests.execute).toHaveBeenCalled();
    expect(getStudyRequestById.execute).toHaveBeenCalled();
    expect(listMembersByRequest.execute).toHaveBeenCalled();
    expect(listApplicationsByRequest.execute).toHaveBeenCalled();
    expect(listStudyGroupMessages.execute).toHaveBeenCalled();
    expect(createStudyGroupMessage.execute).toHaveBeenCalled();
    expect(listUserNotifications.execute).toHaveBeenCalled();
    expect(applyToStudyRequest.execute).toHaveBeenCalled();
    expect(reviewApplication.execute).toHaveBeenCalled();
    expect(requestAdminTransfer.execute).toHaveBeenCalled();
    expect(acceptAdminTransfer.execute).toHaveBeenCalled();
    expect(leaveAdminRole.execute).toHaveBeenCalled();
  });

  it("responde VALIDATION_ERROR cuando review no trae status", async () => {
    const { server, reviewApplication } = buildStudyGroupsServer();

    const response = await request(server as any)
      .put("/api/v1/study-groups/applications/app-001/review")
      .set("x-user-id", "user-001")
      .send({})
      .expect(400);

    const body = response.body as ApiErrorResponse & { details?: { source?: string; fieldErrors?: Record<string, string[]>; formErrors?: string[] } };

    expect(body.error).toBe("VALIDATION_ERROR");
    expect(body.details?.source).toBe("body");
    expect(reviewApplication.execute).not.toHaveBeenCalled();
  });

  it("responde VALIDATION_ERROR cuando transfer no trae targetUserId", async () => {
    const { server, requestAdminTransfer } = buildStudyGroupsServer();

    const response = await request(server as any)
      .post("/api/v1/study-groups/req-001/transfer")
      .set("x-user-id", "user-001")
      .send({})
      .expect(400);

    const body = response.body as ApiErrorResponse & { details?: { source?: string; fieldErrors?: Record<string, string[]>; formErrors?: string[] } };

    expect(body.error).toBe("VALIDATION_ERROR");
    expect(body.details?.source).toBe("body");
    expect(requestAdminTransfer.execute).not.toHaveBeenCalled();
  });
});