export var UserStatus;
(function (UserStatus) {
    UserStatus["Online"] = "online";
    UserStatus["Away"] = "away";
    UserStatus["Busy"] = "busy";
    UserStatus["Offline"] = "offline";
})(UserStatus || (UserStatus = {}));
export class User {
    id;
    userIdentity;
    // public id?: string;
    // public userIdentity: string;
    // public email?: string;
    // public name?: string;
    // public surname?: string;
    // public avatar?: string;
    email;
    name;
    surname;
    avatar;
    status;
    constructor(id, userIdentity) {
        this.id = id;
        this.userIdentity = userIdentity;
    }
}
//# sourceMappingURL=user.js.map