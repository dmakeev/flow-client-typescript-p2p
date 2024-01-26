import type { UniError, User } from '.';

export enum P2PCallStatus {
    Pending = 'pending',
    Starting = 'starting',
    Active = 'active',
    Finished = 'finished',
    Failed = 'failed',
}

export class P2PCall {
    // public id?: string;
    // public callerId?: string;
    // public calleeId?: string;
    // public created?: number;
    // public accepted?: number;
    // public finished?: number;
    public error?: UniError;
    // public status?: P2PCallStatus;

    constructor(
        public readonly id: string,
        public readonly caller: User,
        public readonly callee: User,
        public status: P2PCallStatus = P2PCallStatus.Pending
    ) {}
}
