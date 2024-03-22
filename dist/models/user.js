export var UserStatus;
(function (UserStatus) {
    UserStatus["Online"] = "online";
    UserStatus["Away"] = "away";
    UserStatus["Busy"] = "busy";
    UserStatus["Offline"] = "offline";
})(UserStatus || (UserStatus = {}));
export class User {
    id;
    // public id?: string;
    userIdentity;
    // public email?: string;
    // public name?: string;
    // public surname?: string;
    // public avatar?: string;
    email;
    firstName;
    lastName;
    avatar;
    status;
    constructor(id) {
        this.id = id;
        this.userIdentity = this.id;
    }
}
//# sourceMappingURL=user.js.map