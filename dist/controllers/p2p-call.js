import { P2PCall, P2PCallStatus, UserPairInfo } from '../models';
import { SignalingEventType, TransportController } from './transport';
import { UserController } from './user';
import { WebRTCController, WebRTCEventType } from './webrtc';
export var P2PCallEventType;
(function (P2PCallEventType) {
    P2PCallEventType["SIGNALING_CONNECTED"] = "signaling_connected";
    P2PCallEventType["PAIRED"] = "paired";
    P2PCallEventType["PAIRING_CANCELLED"] = "pairing_cancelled";
    P2PCallEventType["INCOMING"] = "incoming";
    P2PCallEventType["LOCAL_STREAM"] = "local_stream";
    P2PCallEventType["REMOTE_STREAM"] = "remote_stream";
    P2PCallEventType["HANGUP"] = "hangup";
    P2PCallEventType["ERROR"] = "error";
})(P2PCallEventType || (P2PCallEventType = {}));
export class P2PCallController {
    call;
    transport = TransportController.Instance;
    eventListeners = new Map();
    userController = new UserController();
    webrtcController = new WebRTCController();
    incomingCalls = new Map();
    static instance;
    get currentCall() {
        return this.call;
    }
    get currentUser() {
        return this.userController.user;
    }
    get signalingConnected() {
        return this.transport.hasConnection;
    }
    static getInstance() {
        return this.instance || (this.instance = new this());
    }
    constructor() {
        for (const v of Object.values(P2PCallEventType)) {
            this.eventListeners.set(v, new Set());
        }
        this.transport.addEventListener(SignalingEventType.PAIRED, (data) => {
            this.eventListeners.get(P2PCallEventType.PAIRED)?.forEach((listener) => listener(data));
        });
        this.transport.addEventListener(SignalingEventType.PAIRING_CANCELLED, (data) => {
            this.eventListeners.get(P2PCallEventType.PAIRING_CANCELLED)?.forEach((listener) => listener(data));
        });
        this.transport.addEventListener(SignalingEventType.INCOMING, (data) => {
            this.incomingCalls.set(data.call.id, data);
            this.eventListeners.get(P2PCallEventType.INCOMING)?.forEach((listener) => listener({ call: data.call }));
        });
        this.transport.addEventListener(SignalingEventType.ACCEPTED, (data) => {
            this.webrtcController.addAnswer(data.sdpAnswer);
        });
        this.transport.addEventListener(SignalingEventType.HANGUP, (data) => {
            this.eventListeners.get(P2PCallEventType.HANGUP)?.forEach((listener) => listener(data));
            this.webrtcController.closeConnection();
        });
        this.webrtcController.addEventListener(WebRTCEventType.LOCAL_STREAM, (data) => {
            this.eventListeners.get(P2PCallEventType.LOCAL_STREAM)?.forEach((listener) => listener(data));
        });
        this.webrtcController.addEventListener(WebRTCEventType.REMOTE_STREAM, (data) => {
            this.eventListeners.get(P2PCallEventType.REMOTE_STREAM)?.forEach((listener) => listener(data));
        });
        // this.incomingCalls.delete(callId);
    }
    addEventListener(type, listener) {
        this.eventListeners.get(type)?.add(listener);
    }
    removeEventListener(type, listener) {
        this.eventListeners.get(type)?.delete(listener);
    }
    /**
     * Connect to the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    async connect(url) {
        return this.transport
            .connect(url)
            .then(() => {
            this.eventListeners.get(P2PCallEventType.SIGNALING_CONNECTED)?.forEach((listener) => listener());
        })
            .catch((error) => {
            this.eventListeners.get(P2PCallEventType.ERROR)?.forEach((listener) => listener(error));
        });
    }
    /**
     * Disconnect from the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    disconnect() {
        return this.transport.disconnect();
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
            this.userController
                .login(userIdentity, securityToken)
                .then((data) => {
                resolve(data.user);
                this.webrtcController.setIceServers(data.iceServers);
            })
                .catch((error) => {
                reject(error.message);
            });
        });
    }
    /**
     * Logout user
     *
     * @returns {Promise<void>}
     */
    async logout() {
        return this.userController.logout();
    }
    /**
     * Start pairing process
     *
     * @returns {Promise<User>}
     */
    startPairing() {
        return this.transport.startPairing();
    }
    /**
     * Stop pairing process
     *
     * @returns {Promise<void>}
     */
    stopPairing() {
        return this.transport.stopPairing();
    }
    /**
     * Start a new call
     *
     * @param {string}  calleeId  Id of user to call to
     * @param {boolean} audio     Should the audio be enabled by default
     * @param {boolean} video     Should the video be enabled by default
     * @returns {Promise<P2PCall>}
     */
    async startCall(calleeId, audio, video) {
        console.log('AAA 1');
        return new Promise(async (resolve, reject) => {
            console.log('AAA 2');
            if (!!this.webrtcController.hasConnection) {
                reject('Another call is in progress, you should finish it first');
                return;
            }
            if (!this.currentUser) {
                reject('You should authenticate first');
                return;
            }
            console.log('AAA 3');
            const sdpOffer = await this.webrtcController.initConnection(audio, video);
            console.log('AAA 4');
            this.transport
                .call(calleeId, sdpOffer, audio, video)
                .then((call) => {
                console.log('AAA 5');
                this.call = new P2PCall(call.id, call.caller, call.callee, P2PCallStatus.Pending);
                resolve(this.call);
            })
                .catch((reason) => {
                reject(reason);
            });
        });
    }
    /**
     * Accept an incoming call
     *
     * @param {string}  callId  Id of user to call to
     * @param {boolean} audio     Should the audio be enabled by default
     * @param {boolean} video     Should the video be enabled by default
     * @returns {Promise<P2PCall>}
     */
    async acceptCall(callId, audio, video) {
        return new Promise(async (resolve, reject) => {
            if (!!this.webrtcController.hasConnection) {
                reject('Another call is in progress, you should finish it first');
                return;
            }
            if (!this.currentUser) {
                reject('You should authenticate first');
                return;
            }
            const incomingCall = this.incomingCalls.get(callId);
            if (!incomingCall) {
                reject('Call was finished before accepting');
                return;
            }
            const sdpAnswer = await this.webrtcController.initConnectionAnswering(incomingCall.sdpOffer, audio, video);
            this.transport
                .accept(callId, sdpAnswer, audio, video)
                .then((call) => {
                this.call = new P2PCall(callId, call.caller, call.callee, P2PCallStatus.Starting);
                this.incomingCalls.delete(callId);
                resolve(this.call);
            })
                .catch((reason) => {
                reject(reason);
            });
        });
    }
    /**
     * Accept an incoming call
     *
     * @param {string}  callId           Id of user to call to
     * @param {string?} rejectionReason  Optianl reason, will be delivered to caller
     * @returns {Promise<void>}
     */
    async rejectCall(callId, rejectionReason) {
        return new Promise(async (resolve, reject) => {
            if (!this.currentUser) {
                reject('You should authenticate first');
                return;
            }
            this.incomingCalls.delete(callId);
            this.transport
                .reject(callId, rejectionReason)
                .then(() => {
                this.call = undefined;
                this.webrtcController.closeConnection();
                resolve();
            })
                .catch((reason) => {
                this.call = undefined;
                this.webrtcController.closeConnection();
                reject(reason);
            });
        });
    }
    /**
     * Hangup the call
     *
     * @param {string?} hangupReason     Optianl reason, will be delivered to caller
     * @returns {Promise<void>}
     */
    async hangupCall(hangupReason) {
        return new Promise(async (resolve, reject) => {
            if (!this.currentUser) {
                reject('You should authenticate first');
                return;
            }
            if (!this.call) {
                reject('There is no call to reject');
                return;
            }
            this.incomingCalls.delete(this.call.id);
            this.transport
                .hangup(this.call.id, hangupReason)
                .then(() => {
                this.call = undefined;
                this.webrtcController.closeConnection();
                resolve();
            })
                .catch((reason) => {
                this.call = undefined;
                this.webrtcController.closeConnection();
                reject(reason);
            });
        });
    }
}
//# sourceMappingURL=p2p-call.js.map