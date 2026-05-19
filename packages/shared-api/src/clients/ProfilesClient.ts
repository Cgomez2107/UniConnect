import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import {
  mapProfileDtoToDomain,
  mapProfileDomainToDto,
  mapFacultyDtoToDomain,
  mapProgramDtoToDomain,
  mapSubjectDtoToDomain,
  mapUserSubjectDtoToDomain,
  mapUserProgramDtoToDomain,
} from "../mappers/index.js";
import type {
  ProfileDTO,
  FacultyDTO,
  ProgramDTO,
  SubjectDTO,
  UserSubjectDTO,
  UserProgramDTO,
  Profile,
  Faculty,
  Program,
  Subject,
  UserSubject,
  UserProgram,
} from "@uniconnect/shared-types";

export interface UpdateProfilePayload {
  fullName?: string;
  bio?: string;
  phone?: string;
  semester?: number;
}

export interface StudentSearchResult {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  semester: number | null;
  programName: string | null;
  facultyName: string | null;
}

export interface StudentPublicProfile {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  bio: string | null;
  semester: number | null;
  programName: string | null;
  facultyName: string | null;
  sharedSubjects: { id: string; name: string }[];
}

export class ProfilesClient extends BaseClient {
  constructor(private transport: ITransport) {
    super();
  }

  async getMyProfile(): Promise<Profile> {
    const response = await this.transport.request<ProfileDTO>({
      method: "GET",
      url: "/students/me",
    });
    return mapProfileDtoToDomain(response.data);
  }

  async createProfile(data: { fullName: string; bio?: string }): Promise<Profile> {
    const response = await this.transport.request<ProfileDTO>({
      method: "POST",
      url: "/students/profile",
      body: { full_name: data.fullName, bio: data.bio },
    });
    return mapProfileDtoToDomain(response.data);
  }

  async updateProfile(data: UpdateProfilePayload): Promise<Profile> {
    const response = await this.transport.request<ProfileDTO>({
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

  async getProfileById(userId: string, currentUserId?: string): Promise<Profile> {
    const response = await this.transport.request<ProfileDTO>({
      method: "GET",
      url: `/students/${userId}`,
      params: currentUserId ? { currentUserId } : undefined,
    });
    return mapProfileDtoToDomain(response.data);
  }

  /**
   * Get profiles by subject — convenience wrapper over searchStudents
   */
  async getBySubject(subjectId: string): Promise<StudentSearchResult[]> {
    return this.searchStudents(subjectId);
  }

  async searchStudents(subjectId?: string): Promise<StudentSearchResult[]> {
    const response = await this.transport.request<any[]>({
      method: "GET",
      url: "/students",
      params: subjectId ? { subjectId } : undefined,
    });
    return this.ensureArray(response.data);
  }

  async getMyPrograms(): Promise<UserProgram[]> {
    const response = await this.transport.request<UserProgramDTO[]>({
      method: "GET",
      url: "/students/me/programs",
    });
    return this.ensureArray(response.data).map((dto) => mapUserProgramDtoToDomain(dto));
  }

  async getMySubjects(): Promise<UserSubject[]> {
    const response = await this.transport.request<UserSubjectDTO[]>({
      method: "GET",
      url: "/students/me/subjects",
    });
    return this.ensureArray(response.data).map((dto) => mapUserSubjectDtoToDomain(dto));
  }

  async addMySubject(subjectId: string): Promise<void> {
    await this.transport.request({
      method: "POST",
      url: "/students/me/subjects",
      body: { subject_id: subjectId },
    });
  }

  async removeMySubject(subjectId: string): Promise<void> {
    await this.transport.request({
      method: "DELETE",
      url: `/students/me/subjects/${subjectId}`,
    });
  }

  async setPrimaryProgram(programId: string): Promise<void> {
    await this.transport.request({
      method: "PATCH",
      url: "/students/me/primary-program",
      body: { program_id: programId },
    });
  }

  async uploadAvatar(userId: string, base64Data: string): Promise<string> {
    const response = await this.transport.request<{ url: string }>({
      method: "POST",
      url: "/students/me/avatar",
      body: { user_id: userId, image: base64Data },
    });
    return response.data.url;
  }

  async getPrograms(): Promise<Program[]> {
    const response = await this.transport.request<ProgramDTO[]>({
      method: "GET",
      url: "/catalog/programs",
    });
    return this.ensureArray(response.data).map((dto) => mapProgramDtoToDomain(dto));
  }

  async getSubjectsByProgram(programId: string): Promise<Subject[]> {
    const response = await this.transport.request<SubjectDTO[]>({
      method: "GET",
      url: `/catalog/programs/${programId}/subjects`,
    });
    return this.ensureArray(response.data).map((dto) => mapSubjectDtoToDomain(dto));
  }

  async getAllSubjects(): Promise<Subject[]> {
    const response = await this.transport.request<SubjectDTO[]>({
      method: "GET",
      url: "/catalog/subjects",
    });
    return this.ensureArray(response.data).map((dto) => mapSubjectDtoToDomain(dto));
  }
}
