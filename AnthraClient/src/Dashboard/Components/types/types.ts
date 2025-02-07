// src/types/types.ts

export enum InvitationActionType {
    None = "None",
    Skipped = "Skipped",
    Connected = "Connected",
    Accepted = "Accepted",
    Declined = "Declined"
}

export interface ApplicationUser {
    id: string;
    firstName: string;
    lastName: string;
    institution: string;
    profilePictureUrl: string;
    connectedAt: string;
}



export interface Attachment {
    id: number;
    fileName: string;
    fileUrl: string;
}

export interface Message {
    id: number;
    senderId: string;
    receiverId: string;
    content: string;
    timestamp: string;
    isGroupInvitation: boolean;
    isReferralCard: boolean;
    groupId: number | null;
    groupName?: string;
    attachments?: Attachment[];
    invitationStatus?: boolean;
    actionType: InvitationActionType;
}

export interface UserProfile {
    id: string;
    userName: string;
    email: string;
    firstName: string;
    lastName: string;
    location: string;
    institution: string;
    work: string;
    courses: { courseName: string; courseLink: string }[];
    subjects: string[];
    aboutMe: string;
    age: number;
    profilePictureUrl: string;
    statuses: string[];
    createdProfile: Date;
    stageOfLife: string;
    selfStudyingSubjects: string[];
}
