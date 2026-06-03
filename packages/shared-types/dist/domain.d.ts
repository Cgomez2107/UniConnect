/**
 * Domain Types (UI Layer - camelCase)
 * These are the canonical types used throughout the application
 */
export type UserRole = "estudiante" | "admin";
export type AuthProvider = "email" | "google" | "github";
export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    profileImageUrl?: string;
    isVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AuthProfile extends User {
    isOnboarded: boolean;
    lastLoginAt?: Date;
}
export interface Profile extends User {
    bio?: string;
    phone?: string;
    institution?: string;
    faculty?: string;
    program?: string;
    subjects?: string[];
}
export interface Faculty {
    id: string;
    name: string;
    description?: string;
    code: string;
}
export interface Program {
    id: string;
    name: string;
    facultyId: string;
    description?: string;
    code: string;
}
export interface Subject {
    id: string;
    name: string;
    programId: string;
    code: string;
    description?: string;
    credits?: number;
}
export interface UserSubject {
    id: string;
    userId: string;
    subjectId: string;
    subject: Subject;
    enrolledAt: Date;
}
export interface UserProgram {
    id: string;
    userId: string;
    programId: string;
    program: Program;
    enrolledAt: Date;
}
export type StudyGroupStatus = "activa" | "inactiva" | "finalizada";
export type ApplicationStatus = "pendiente" | "aceptada" | "rechazada";
export type MemberRole = "admin" | "miembro";
export interface StudyGroup {
    id: string;
    name: string;
    description: string;
    subject: Subject;
    subjectId: string;
    status: StudyGroupStatus;
    maxMembers: number;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    memberCount?: number;
}
export interface StudyGroupMember {
    id: string;
    groupId: string;
    userId: string;
    user: User;
    role: MemberRole;
    joinedAt: Date;
}
export interface StudyRequest {
    id: string;
    groupId: string;
    userId: string;
    user?: User;
    message?: string;
    status: ApplicationStatus;
    createdAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
}
export interface StudyApplication {
    id: string;
    groupId: string;
    userId: string;
    user: User;
    message: string;
    status: ApplicationStatus;
    createdAt: Date;
}
export type ConversationType = "direct" | "group";
export type MessageType = "text" | "file" | "mention" | "reaction" | "poll";
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    sender?: User;
    content: string;
    type: MessageType;
    decorations?: MessageDecoration[];
    attachments?: MessageAttachment[];
    reactions?: MessageReaction[];
    poll?: PollData | null;
    isEdited: boolean;
    editedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface PollOption {
    text: string;
    votes: string[];
}
export interface PollData {
    question: string;
    options: PollOption[];
    isOpen: boolean;
    closesAt: string | null;
    createdAt: string;
}
export interface MessageDecoration {
    type: "mention" | "file" | "reaction" | "poll";
    data: Record<string, any>;
}
export interface MessageAttachment {
    id: string;
    type: string;
    url: string;
    name: string;
    size: number;
    mimeType: string;
}
export interface MessageReaction {
    id: string;
    emoji: string;
    userId: string;
    user?: User;
    createdAt: Date;
}
export interface Conversation {
    id: string;
    type: ConversationType;
    name?: string;
    description?: string;
    avatarUrl?: string;
    participants: User[];
    lastMessage?: Message;
    lastMessageAt?: Date;
    messageCount: number;
    unreadCount: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface DirectMessage extends Conversation {
    type: "direct";
    otherUser: User;
}
export interface GroupConversation extends Conversation {
    type: "group";
    groupId?: string;
    memberCount: number;
}
export type NotificationType = "message" | "studyGroupApplication" | "studyGroupAccepted" | "studyGroupRejected" | "mention" | "friendRequest" | "system";
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    description?: string;
    actionUrl?: string;
    read: boolean;
    data?: Record<string, any>;
    createdAt: Date;
    priority?: "normal" | "urgente" | "critica";
    action?: {
        label: string;
        endpoint: string;
        method?: "GET" | "POST" | "PUT" | "DELETE";
    };
}
export interface StudyResource {
    id: string;
    userId: string;
    programId: string;
    subjectId: string;
    title: string;
    description: string | null;
    fileUrl: string;
    fileName: string;
    fileType: string | null;
    fileSizeKb: number | null;
    resourceType: string | null;
    ogTitle: string | null;
    ogImage: string | null;
    ogDescription: string | null;
    createdAt: Date;
    updatedAt: Date;
    profiles?: {
        fullName: string;
        avatarUrl: string | null;
    };
    subjects?: {
        name: string;
    };
}
export interface Event {
    id: string;
    title: string;
    description: string;
    eventDate: Date;
    location?: string;
    category?: string;
    imageUrl?: string;
    creatorId: string;
    creator?: User;
    capacity?: number;
    attendeeCount: number;
    isOnline: boolean;
    eventUrl?: string;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
}
export interface LoginResponse {
    user: AuthProfile;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface SessionData {
    user: AuthProfile;
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}
export interface OAuthSignInUrlResponse {
    url: string;
    state: string;
}
export interface OAuthCallbackResponse {
    user: AuthProfile;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}
//# sourceMappingURL=domain.d.ts.map