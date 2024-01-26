import { io, Socket } from 'socket.io-client';
//import type { RTCSessionDescription } from 'webrtc';
//import { RTCSessionDescription } from 'react-native-webrtc';
// let WebRTC: any;
// const { RTCSessionDescription } = typeof document != 'undefined' ? require('@types/webrtc') : require('react-native-webrtc');
/*
if (typeof document != 'undefined') {
    // React
    WebRTC = require('@types/webrtc');
} else if (typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
    // React Native
    // import { MediaStream, RTCSessionDescription, mediaDevices, RTCPeerConnection } from 'react-native-webrtc';
    WebRTC = require('react-native-webrtc');
}
*/
import { LogController } from './log';
export var SignalingEventType;
(function (SignalingEventType) {
    SignalingEventType["CONNECTED"] = "connected";
    SignalingEventType["DISCONNECTED"] = "disconnected";
    SignalingEventType["PAIRED"] = "paired";
    SignalingEventType["PAIRING_CANCELLED"] = "pairing_cancelled";
    SignalingEventType["INCOMING"] = "incoming";
    SignalingEventType["ACCEPTED"] = "accepted";
    SignalingEventType["HANGUP"] = "hangup";
})(SignalingEventType || (SignalingEventType = {}));
export class TransportController {
    static instance;
    logController = LogController.Instance;
    eventListeners = new Map();
    connected = false;
    socket;
    userId;
    static get Instance() {
        return this.instance || (this.instance = new this());
    }
    constructor() {
        for (const v of Object.values(SignalingEventType)) {
            this.eventListeners.set(v, new Set());
        }
    }
    get hasConnection() {
        return this.connected;
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
     * @param {string} url
     * @returns {Promise<void>}
     */
    async connect(url) {
        return new Promise((resolve, reject) => {
            if (!!this.socket) {
                this.disconnect();
            }
            this.socket = io(url, { path: '/signal/socket.io', transports: ['websocket'] });
            this.socket.on('connect', () => {
                this.logController.log('Signaling socket is connected');
            });
            this.socket.on('disconnect', () => {
                this.connected = false;
                this.logController.log('Signaling socket is disconnected');
            });
            this.socket.on('connect_error', (error) => {
                this.connected = false;
                this.logController.log('Can`t connect to the signaling socket', error.message);
                reject(error.message);
            });
            this.socket.on('/v1/user/connected', () => {
                this.logController.log('Signaling socket is ready for use');
                this.eventListeners.get(SignalingEventType.CONNECTED)?.forEach((listener) => listener());
                resolve();
            });
            this.socket.on('/v1/pairing/matched', (data) => {
                this.eventListeners.get(SignalingEventType.PAIRED)?.forEach((listener) => listener({ pair: data.pair }));
            });
            this.socket.on('/v1/pairing/cancel', (data) => {
                this.eventListeners.get(SignalingEventType.PAIRING_CANCELLED)?.forEach((listener) => listener({ pair: data.pair }));
            });
            this.socket.on('/v1/p2p/incoming', (data) => {
                this.eventListeners
                    .get(SignalingEventType.INCOMING)
                    ?.forEach((listener) => listener({ call: data.call, sdpOffer: data.sdpOffer }));
            });
            this.socket.on('/v1/p2p/accepted', (data) => {
                this.eventListeners
                    .get(SignalingEventType.ACCEPTED)
                    ?.forEach((listener) => listener({ callId: data.callId, sdpAnswer: data.sdpAnswer }));
            });
            this.socket.on('/v1/p2p/hangup', (data) => {
                this.eventListeners.get(SignalingEventType.HANGUP)?.forEach((listener) => listener({ callId: data.callId }));
            });
            ///v1/p2p/hangup
        });
    }
    /**
     * Disconnect from the signaling server
     *
     * @returns {void}
     */
    disconnect() {
        this.logout();
        this.connected = false;
        if (!!this.socket) {
            this.socket.close();
            this.socket = undefined;
        }
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
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (this.userId) {
                reject('You are already logged in');
                return;
            }
            this.socket.emit('/v1/user/login', { userIdentity, securityToken }, (data) => {
                if (!data || !data.user) {
                    reject(data.reason ?? 'Unknown error');
                    return;
                }
                this.userId = data.user.id;
                // TODO: Make a correct object mapping
                resolve({ user: data.user, iceServers: data.iceServers ?? [] });
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
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            this.socket.emit('/v1/user/logout', {}, (error) => {
                if (!!error) {
                    reject(error.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Start pairing process
     *
     */
    async startPairing() {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/pairing/start', {}, (data) => {
                if (!!data.error) {
                    reject(data.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Start pairing process
     *
     */
    async stopPairing() {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/pairing/stop', {}, (error) => {
                if (!!error) {
                    reject(error.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Start new call
     *
     * @param {string}                calleeId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @param {boolean}               audio     If audio should be enabled
     * @param {boolean}               video     If video should be enabled
     * @returns {Promise<string>}               Call ID
     */
    async call(calleeId, sdpOffer, audio, video) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/start', { calleeId, sdpOffer, audio, video }, (data) => {
                if (!!data.error || !data.call) {
                    reject(data.error.reason ?? 'Unknown error');
                    return;
                }
                resolve(data.call);
            });
        });
    }
    /**
     * Accept the call
     *
     * @param {string}                calleeId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @param {boolean}               audio     If audio should be enabled
     * @param {boolean}               video     If video should be enabled
     * @returns {Promise<void>}               Call ID
     */
    async accept(callId, sdpAnswer, audio, video) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/accept', { callId, sdpAnswer, audio, video }, (data) => {
                if (!!data.error || !data.call) {
                    reject(data.error.reason ?? 'Unknown error');
                    return;
                }
                resolve(data.call);
            });
        });
    }
    /**
     * Reject the incoming call
     *
     * @param {string}  callId  User ID to call to
     * @param {string?} reason  Optional reason of rejecting the call - will be delivered to caller's device
     * @returns {Promise<void>}
     */
    async reject(callId, reason) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/reject', { callId, reason }, (error) => {
                if (!!error) {
                    reject(error.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Hangup the call
     *
     * @param {string}  callId  User ID to call to
     * @param {string?} reason  Optional reason of rejecting the call - will be delivered to caller's device
     * @returns {Promise<void>}
     */
    async hangup(callId, reason) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/hangup', { callId, reason });
            resolve();
        });
    }
    /**
     * Reconnect the call
     *
     * @param {string}                callId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @returns {Promise<void>}
     */
    async reconnect(callId, sdpOffer) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/reconnect', { callId, sdpOffer }, (error) => {
                if (!!error || !callId) {
                    reject(error.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
    /**
     * Accept the reconnection request
     *
     * @param {string}                callId  User ID to call to
     * @param {RTCSessionDescription} sdpAnswer  Any security token, used by the backend to authorize user
     * @returns {Promise<void>}
     */
    async acceptReconnect(callId, sdpAnswer) {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject('Socket is not connected');
                return;
            }
            if (!this.userId) {
                reject('You should authenticate first');
                return;
            }
            this.socket.emit('/v1/p2p/acept-reconnect', { callId, sdpAnswer }, (error) => {
                if (!!error || !callId) {
                    reject(error.reason ?? 'Unknown error');
                    return;
                }
                resolve();
            });
        });
    }
}
//# sourceMappingURL=transport.js.map