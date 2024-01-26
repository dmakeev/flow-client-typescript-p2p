export var P2PCallStatus;
(function (P2PCallStatus) {
    P2PCallStatus["Pending"] = "pending";
    P2PCallStatus["Starting"] = "starting";
    P2PCallStatus["Active"] = "active";
    P2PCallStatus["Finished"] = "finished";
    P2PCallStatus["Failed"] = "failed";
})(P2PCallStatus || (P2PCallStatus = {}));
export class P2PCall {
    id;
    caller;
    callee;
    status;
    // public id?: string;
    // public callerId?: string;
    // public calleeId?: string;
    // public created?: number;
    // public accepted?: number;
    // public finished?: number;
    error;
    // public status?: P2PCallStatus;
    constructor(id, caller, callee, status = P2PCallStatus.Pending) {
        this.id = id;
        this.caller = caller;
        this.callee = callee;
        this.status = status;
    }
}
//# sourceMappingURL=call.js.map