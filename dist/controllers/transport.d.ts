import type { P2PCall, User } from '../models';
export declare enum SignalingEventType {
    CONNECTED = "connected",
    DISCONNECTED = "disconnected",
    PAIRED = "paired",
    PAIRING_CANCELLED = "pairing_cancelled",
    INCOMING = "incoming",
    ACCEPTED = "accepted",
    HANGUP = "hangup",
    INCOMING_ICE = "incoming_ice"
}
export type SignalingEvent = (data?: any) => void;
export declare class TransportController {
    private readonly logController;
    private readonly eventListeners;
    private connected;
    private socket?;
    private userId?;
    constructor();
    get hasConnection(): boolean;
    addEventListener(type: SignalingEventType, listener: SignalingEvent): void;
    removeEventListener(type: SignalingEventType, listener: SignalingEvent): void;
    /**
     * Connect to the signaling server
     *
     * @param {string} url
     * @returns {Promise<void>}
     */
    connect(url: string): Promise<void>;
    /**
     * Disconnect from the signaling server
     *
     * @returns {void}
     */
    disconnect(): void;
    /**
     * Login user to the signaling server
     *
     * @param {string} userIdentity User ID
     * @param {string} securityToken Any security token, used by the backend to authorize user
     * @returns {Promise<{ user: User; iceServers: [] }>}
     */
    login(userIdentity: string, securityToken: string): Promise<{
        user: User;
        iceServers: [];
    }>;
    /**
     * Logout user
     *
     * @returns {Promise<void>}
     */
    logout(): Promise<void>;
    /**
     * Login user to the signaling server
     *
     * @param {User} userInfo User ID
     * @returns {Promise<{iceServers: []}>}
     */
    setUserInfo(userInfo: User): Promise<{
        iceServers: [];
    }>;
    /**
     * Start pairing process
     *
     */
    startPairing(): Promise<void>;
    /**
     * Stop pairing process
     *
     */
    stopPairing(): Promise<void>;
    /**
     * Reject the incoming call
     *
     * @param {string}  callId  User ID to call to
     * @param {string?} reason  Optional reason of rejecting the call - will be delivered to caller's device
     * @returns {Promise<void>}
     */
    rejectPair(pairId: string, reason?: string): Promise<void>;
    /**
     * Start new call
     *
     * @param {string}                calleeId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @param {boolean}               audio     If audio should be enabled
     * @param {boolean}               video     If video should be enabled
     * @returns {Promise<string>}               Call ID
     */
    call(calleeId: string, sdpOffer: RTCSessionDescription, audio: boolean, video: boolean): Promise<P2PCall>;
    /**
     * Accept the call
     *
     * @param {string}                calleeId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @param {boolean}               audio     If audio should be enabled
     * @param {boolean}               video     If video should be enabled
     * @returns {Promise<void>}               Call ID
     */
    accept(callId: string, sdpAnswer: RTCSessionDescription, audio: boolean, video: boolean): Promise<P2PCall>;
    /**
     * Reject the incoming call
     *
     * @param {string}  callId  User ID to call to
     * @param {string?} reason  Optional reason of rejecting the call - will be delivered to caller's device
     * @returns {Promise<void>}
     */
    reject(callId: string, reason?: string): Promise<void>;
    /**
     * Hangup the call
     *
     * @param {string}  callId  User ID to call to
     * @param {string?} reason  Optional reason of rejecting the call - will be delivered to caller's device
     * @returns {Promise<void>}
     */
    hangup(callId: string, reason?: string): Promise<void>;
    /**
     * Reconnect the call
     *
     * @param {string}                callId  User ID to call to
     * @param {RTCSessionDescription} sdpOffer  Any security token, used by the backend to authorize user
     * @returns {Promise<void>}
     */
    reconnect(callId: string, sdpOffer: RTCSessionDescription): Promise<void>;
    /**
     * Accept the reconnection request
     *
     * @param {string}                callId  User ID to call to
     * @param {RTCSessionDescription} sdpAnswer  Any security token, used by the backend to authorize user
     * @returns {Promise<void>}
     */
    acceptReconnect(callId: string, sdpAnswer: RTCSessionDescription): Promise<void>;
    /**
     * Send ICE candidate to another user
     *
     * @param {string}                callId  User ID to call to
     * @param {RTCSessionDescription} sdpAnswer  Any security token, used by the backend to authorize user
     * @returns {Promise<void>}
     */
    sendIceCandidate(callId: string, candidate: RTCIceCandidate): Promise<void>;
}
