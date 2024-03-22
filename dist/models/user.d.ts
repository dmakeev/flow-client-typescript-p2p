export declare enum UserStatus {
    Online = "online",
    Away = "away",
    Busy = "busy",
    Offline = "offline"
}
export declare class User {
    readonly id: string;
    userIdentity?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
    status?: UserStatus;
    constructor(id: string);
}
