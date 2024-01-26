import { P2PCall, type User } from '../models';
export declare enum P2PCallEventType {
    SIGNALING_CONNECTED = "signaling_connected",
    PAIRED = "paired",
    PAIRING_CANCELLED = "pairing_cancelled",
    INCOMING = "incoming",
    LOCAL_STREAM = "local_stream",
    REMOTE_STREAM = "remote_stream",
    HANGUP = "hangup",
    ERROR = "error"
}
export type P2PCallEvent = (data?: any) => void;
export declare class P2PCallController {
    private call?;
    private readonly transport;
    private readonly eventListeners;
    private readonly userController;
    private readonly webrtcController;
    private incomingCalls;
    private static instance;
    get currentCall(): P2PCall | undefined;
    get currentUser(): User | undefined;
    get signalingConnected(): boolean;
    static getInstance(): P2PCallController;
    constructor();
    addEventListener(type: P2PCallEventType, listener: P2PCallEvent): void;
    removeEventListener(type: P2PCallEventType, listener: P2PCallEvent): void;
    /**
     * Connect to the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    connect(url: string): Promise<void>;
    /**
     * Disconnect from the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    disconnect(): void;
    /**
     * Login user to the signaling server
     *
     * @param {string} userIdentity User ID
     * @param {string} securityToken Any security token, used by the backend to authorize user
     * @returns {Promise<User>}
     */
    login(userIdentity: string, securityToken: string): Promise<User>;
    /**
     * Logout user
     *
     * @returns {Promise<void>}
     */
    logout(): Promise<void>;
    /**
     * Start pairing process
     *
     * @returns {Promise<User>}
     */
    startPairing(): Promise<void>;
    /**
     * Stop pairing process
     *
     * @returns {Promise<void>}
     */
    stopPairing(): Promise<void>;
    /**
     * Start a new call
     *
     * @param {string}  calleeId  Id of user to call to
     * @param {boolean} audio     Should the audio be enabled by default
     * @param {boolean} video     Should the video be enabled by default
     * @returns {Promise<P2PCall>}
     */
    startCall(calleeId: string, audio: boolean, video: boolean): Promise<P2PCall>;
    /**
     * Accept an incoming call
     *
     * @param {string}  callId  Id of user to call to
     * @param {boolean} audio     Should the audio be enabled by default
     * @param {boolean} video     Should the video be enabled by default
     * @returns {Promise<P2PCall>}
     */
    acceptCall(callId: string, audio: boolean, video: boolean): Promise<P2PCall>;
    /**
     * Accept an incoming call
     *
     * @param {string}  callId           Id of user to call to
     * @param {string?} rejectionReason  Optianl reason, will be delivered to caller
     * @returns {Promise<void>}
     */
    rejectCall(callId: string, rejectionReason: string): Promise<void>;
    /**
     * Hangup the call
     *
     * @param {string?} hangupReason     Optianl reason, will be delivered to caller
     * @returns {Promise<void>}
     */
    hangupCall(hangupReason?: string): Promise<void>;
}
