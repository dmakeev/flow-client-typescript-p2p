export enum UserStatus {
    Online = 'online',
    Away = 'away',
    Busy = 'busy',
    Offline = 'offline',
}

export class User {
    // public id?: string;
    public userIdentity?: string;
    // public email?: string;
    // public name?: string;
    // public surname?: string;
    // public avatar?: string;
    public email?: string;
    public firstName?: string;
    public lastName?: string;
    public avatar?: string;
    public status?: UserStatus;

    constructor(public readonly id: string) {
        this.userIdentity = this.id;
    }
}
