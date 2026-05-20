/**
 * @deprecated Use deps.apiClients.studyGroups directly or import from @uniconnect/shared-api.
 * This file is kept as a thin adapter for backward compatibility.
 */
import { deps } from "@/store/deps";
import { apiClient } from "@/lib/api/client";

const studyGroupsService = {
  async listStudyGroups(subjectId?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = deps.apiClients.studyGroups as any;
    return client.list(subjectId ? { subjectId } : undefined);
  },

  async getStudyGroupById(id: string) {
    return deps.apiClients.studyGroups.getById(id);
  },

  async createStudyGroup(data: { subjectId: string; title: string; description?: string; maxMembers?: number }) {
    return deps.apiClients.studyGroups.create({
      subjectId: data.subjectId,
      title: data.title,
      description: data.description ?? "",
      maxMembers: data.maxMembers ?? 10,
    });
  },

  async getStudyGroupMembers(groupId: string) {
    return deps.apiClients.studyGroups.listMembers(groupId);
  },

  async leaveStudyGroup(groupId: string) {
    return deps.apiClients.studyGroups.leave(groupId);
  },

  async getStudyGroupApplications(groupId: string) {
    return deps.apiClients.studyGroups.listApplications(groupId);
  },

  async listMyApplications() {
    return deps.apiClients.studyGroups.listMyApplications();
  },

  async listMyStudyRequests() {
    return deps.apiClients.studyGroups.listMyStudyRequests();
  },

  async applyToStudyGroup(requestId: string, message?: string) {
    return deps.apiClients.studyGroups.apply(requestId, message ?? "");
  },

  async reviewApplication(applicationId: string, status: "aceptada" | "rechazada") {
    return deps.apiClients.studyGroups.reviewApplication(applicationId, status);
  },

  async cancelStudyRequest(requestId: string) {
    return deps.apiClients.studyGroups.cancel(requestId);
  },

  async listNotifications() {
    return deps.apiClients.studyGroups.listNotifications();
  },

  async requestAdminTransfer(groupId: string, targetUserId: string) {
    return deps.apiClients.studyGroups.requestTransfer(groupId, targetUserId);
  },

  async acceptAdminTransfer(transferId: string) {
    return deps.apiClients.studyGroups.acceptTransfer(transferId);
  },

  async cancelMyApplication(requestId: string) {
    return deps.apiClients.studyGroups.cancel(requestId);
  },

  async getGroupMessages(groupId: string) {
    return deps.apiClients.studyGroups.getMessages(groupId, 50);
  },

  async toggleReaction(groupId: string, messageId: string, emoji: string) {
    const result = await apiClient.post(`/study-groups/${groupId}/messages/${messageId}/reactions`, { emoji });
    return result.data?.data ?? result.data;
  },

  async sendGroupMessage(groupId: string, content: string, options?: { replyToMessageId?: string; mediaUrl?: string; mediaType?: string; mentions?: { userId: string; name: string }[] }) {
    return deps.apiClients.studyGroups.sendMessage(groupId, {
      content,
      ...(options?.replyToMessageId && { replyToMessageId: options.replyToMessageId }),
      ...(options?.mediaUrl && { mediaUrl: options.mediaUrl }),
      ...(options?.mediaType && { mediaType: options.mediaType }),
      ...(options?.mentions && { mentions: options.mentions }),
    });
  },
};

export default studyGroupsService;
