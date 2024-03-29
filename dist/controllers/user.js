import { User } from '../models';
import { TransportController } from './transport';
export class UserController {
    transport; // = TransportController.Instance;
    _user;
    get user() {
        return this._user;
    }
    setTransportController(transport) {
        this.transport = transport;
    }
    /**
     * Login user to the signaling server
     *
     * @param {string} userIdentity User ID
     * @param {string} securityToken Any security token, used by the backend to authorize user
     * @returns {Promise<User>}
     */
    async login(userIdentity, securityToken) {
        return new Promise((resolve, reject) => {
            this.transport.login(userIdentity, securityToken)
                .then((data) => {
                this._user = data.user; // new User(user.id, userIdentity);
                resolve(data);
            })
                .catch((reasoon) => {
                reject(reasoon);
            });
        });
    }
    /**
     * Logout user
     *
     * @returns {Promise<void>}
     */
    async logout() {
        return new Promise((resolve, reject) => {
            this.transport.logout()
                .then(() => {
                this._user = undefined;
                resolve();
            })
                .catch((reasoon) => {
                reject(reasoon);
            });
        });
    }
    /**
     * Login user to the signaling server
     *
     * @param {User} user User ID
     * @returns {Promise<User>}
     */
    async setUser(user) {
        this._user = user;
        return this.transport.setUserInfo(user);
    }
}
//# sourceMappingURL=user.js.map