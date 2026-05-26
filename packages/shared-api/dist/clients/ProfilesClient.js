import { BaseClient } from "./BaseClient.js";
import { mapProfileDtoToDomain, mapProgramDtoToDomain, mapSubjectDtoToDomain, mapUserSubjectDtoToDomain, mapUserProgramDtoToDomain, } from "../mappers/index.js";
export class ProfilesClient extends BaseClient {
    transport;
    constructor(transport) {
        super();
        this.transport = transport;
    }
    async getMyProfile() {
        const response = await this.transport.request({
            method: "GET",
            url: "/students/me",
        });
        return mapProfileDtoToDomain(response.data);
    }
    async createProfile(data) {
        const response = await this.transport.request({
            method: "POST",
            url: "/students/profile",
            body: { full_name: data.fullName, bio: data.bio },
        });
        return mapProfileDtoToDomain(response.data);
    }
    async updateProfile(data) {
        const response = await this.transport.request({
            method: "PATCH",
            url: "/students/me",
            body: {
                ...(data.fullName !== undefined && { full_name: data.fullName }),
                ...(data.bio !== undefined && { bio: data.bio }),
                ...(data.phone !== undefined && { phone_number: data.phone }),
                ...(data.semester !== undefined && { semester: data.semester }),
            },
        });
        return mapProfileDtoToDomain(response.data);
    }
    async getProfileById(userId, currentUserId) {
        const response = await this.transport.request({
            method: "GET",
            url: `/students/${userId}`,
            params: currentUserId ? { currentUserId } : undefined,
        });
        return mapProfileDtoToDomain(response.data);
    }
    /**
     * Get profiles by subject — convenience wrapper over searchStudents
     */
    async getBySubject(subjectId) {
        return this.searchStudents(subjectId);
    }
    async searchStudents(subjectId) {
        const response = await this.transport.request({
            method: "GET",
            url: "/students",
            params: subjectId ? { subjectId } : undefined,
        });
        return this.ensureArray(response.data);
    }
    async getMyPrograms() {
        const response = await this.transport.request({
            method: "GET",
            url: "/students/me/programs",
        });
        return this.ensureArray(response.data).map((dto) => mapUserProgramDtoToDomain(dto));
    }
    async getMySubjects() {
        const response = await this.transport.request({
            method: "GET",
            url: "/students/me/subjects",
        });
        return this.ensureArray(response.data).map((dto) => mapUserSubjectDtoToDomain(dto));
    }
    async addMySubject(subjectId) {
        await this.transport.request({
            method: "POST",
            url: "/students/me/subjects",
            body: { subject_id: subjectId },
        });
    }
    async removeMySubject(subjectId) {
        await this.transport.request({
            method: "DELETE",
            url: `/students/me/subjects/${subjectId}`,
        });
    }
    async setPrimaryProgram(programId) {
        await this.transport.request({
            method: "PATCH",
            url: "/students/me/primary-program",
            body: { program_id: programId },
        });
    }
    async uploadAvatar(userId, base64Data) {
        const response = await this.transport.request({
            method: "POST",
            url: "/students/me/avatar",
            body: { user_id: userId, image: base64Data },
        });
        return response.data.url;
    }
    async getPrograms() {
        const response = await this.transport.request({
            method: "GET",
            url: "/catalog/programs",
        });
        return this.ensureArray(response.data).map((dto) => mapProgramDtoToDomain(dto));
    }
    async getSubjectsByProgram(programId) {
        const response = await this.transport.request({
            method: "GET",
            url: `/catalog/programs/${programId}/subjects`,
        });
        return this.ensureArray(response.data).map((dto) => mapSubjectDtoToDomain(dto));
    }
    async getAllSubjects() {
        const response = await this.transport.request({
            method: "GET",
            url: "/catalog/subjects",
        });
        return this.ensureArray(response.data).map((dto) => mapSubjectDtoToDomain(dto));
    }
}
//# sourceMappingURL=ProfilesClient.js.map