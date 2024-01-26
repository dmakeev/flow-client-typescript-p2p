import type { UniError, User } from '.';
export declare enum P2PCallStatus {
    Pending = "pending",
    Starting = "starting",
    Active = "active",
    Finished = "finished",
    Failed = "failed"
}
export declare class P2PCall {
    readonly id: string;
    readonly caller: User;
    readonly callee: User;
    status: P2PCallStatus;
    error?: UniError;
    constructor(id: string, caller: User, callee: User, status?: P2PCallStatus);
}
