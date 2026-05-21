import type { ITransport } from "../transport/index.js";
import { BaseClient } from "./BaseClient.js";
import type { Profile, Program, Subject, UserSubject, UserProgram } from "@uniconnect/shared-types";
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
    sharedSubjects: {
        id: string;
        name: string;
    }[];
}
export declare class ProfilesClient extends BaseClient {
    private transport;
    constructor(transport: ITransport);
    getMyProfile(): Promise<Profile>;
    createProfile(data: {
        fullName: string;
        bio?: string;
    }): Promise<Profile>;
    updateProfile(data: UpdateProfilePayload): Promise<Profile>;
    getProfileById(userId: string, currentUserId?: string): Promise<Profile>;
    /**
     * Get profiles by subject — convenience wrapper over searchStudents
     */
    getBySubject(subjectId: string): Promise<StudentSearchResult[]>;
    searchStudents(subjectId?: string): Promise<StudentSearchResult[]>;
    getMyPrograms(): Promise<UserProgram[]>;
    getMySubjects(): Promise<UserSubject[]>;
    addMySubject(subjectId: string): Promise<void>;
    removeMySubject(subjectId: string): Promise<void>;
    setPrimaryProgram(programId: string): Promise<void>;
    uploadAvatar(userId: string, base64Data: string): Promise<string>;
    getPrograms(): Promise<Program[]>;
    getSubjectsByProgram(programId: string): Promise<Subject[]>;
    getAllSubjects(): Promise<Subject[]>;
}
//# sourceMappingURL=ProfilesClient.d.ts.map