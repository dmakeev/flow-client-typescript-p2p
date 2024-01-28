import { P2PCall, P2PCallStatus, UserPairInfo, type User } from '../models';
import { SignalingEventType, TransportController } from './transport';
import { UserController } from './user';
import { WebRTCController, WebRTCEventType } from './webrtc';

export enum P2PCallEventType {
    SIGNALING_CONNECTED = 'signaling_connected',
    PAIRED = 'paired',
    PAIRING_CANCELLED = 'pairing_cancelled',
    INCOMING = 'incoming',
    LOCAL_STREAM = 'local_stream',
    REMOTE_STREAM = 'remote_stream',
    HANGUP = 'hangup',
    ERROR = 'error',
}

export type P2PCallEvent = (data?: any) => void;

type IncomingCall = {
    call: P2PCall;
    sdpOffer: RTCSessionDescription;
};

export class P2PCallController {
    private call?: P2PCall;
    private readonly transport: TransportController = TransportController.Instance;
    private readonly eventListeners: Map<P2PCallEventType, Set<P2PCallEvent>> = new Map<P2PCallEventType, Set<P2PCallEvent>>();
    private readonly userController: UserController = new UserController();
    private readonly webrtcController: WebRTCController = new WebRTCController();
    private incomingCalls: Map<string, IncomingCall> = new Map<string, IncomingCall>();
    private static instance: P2PCallController;

    public get currentCall(): P2PCall | undefined {
        return this.call;
    }

    public get currentUser(): User | undefined {
        return this.userController.user;
    }

    public get signalingConnected(): boolean {
        return this.transport.hasConnection;
    }

    public static getInstance(): P2PCallController {
        return this.instance || (this.instance = new this());
    }

    constructor() {
        for (const v of Object.values(P2PCallEventType)) {
            this.eventListeners.set(v, new Set());
        }

        this.transport.addEventListener(SignalingEventType.PAIRED, (data: UserPairInfo) => {
            this.eventListeners.get(P2PCallEventType.PAIRED)?.forEach((listener) => listener(data));
        });
        this.transport.addEventListener(SignalingEventType.PAIRING_CANCELLED, (data: UserPairInfo) => {
            this.eventListeners.get(P2PCallEventType.PAIRING_CANCELLED)?.forEach((listener) => listener(data));
        });
        this.transport.addEventListener(SignalingEventType.INCOMING, (data: { call: P2PCall; sdpOffer: RTCSessionDescription }) => {
            this.incomingCalls.set(data.call.id, data);
            this.eventListeners.get(P2PCallEventType.INCOMING)?.forEach((listener) => listener({ call: data.call }));
        });
        this.transport.addEventListener(SignalingEventType.HANGUP, (data: { callId: string }) => {
            this.eventListeners.get(P2PCallEventType.HANGUP)?.forEach((listener) => listener(data));
            this.webrtcController.closeConnection();
        });
        this.webrtcController.addEventListener(WebRTCEventType.LOCAL_STREAM, (data: { stream: MediaStream }) => {
            this.eventListeners.get(P2PCallEventType.LOCAL_STREAM)?.forEach((listener) => listener(data));
        });
        this.webrtcController.addEventListener(WebRTCEventType.REMOTE_STREAM, (data: { stream: MediaStream }) => {
            this.eventListeners.get(P2PCallEventType.REMOTE_STREAM)?.forEach((listener) => listener(data));
        });
        this.transport.addEventListener(SignalingEventType.ACCEPTED, (data: { call: P2PCall; sdpAnswer: RTCSessionDescription }) => {
            console.log('AAAAAAAAAAAAAAAA');
            this.webrtcController.callStarted();
            this.webrtcController.addAnswer(data.sdpAnswer);
        });
        this.transport.addEventListener(SignalingEventType.INCOMING_ICE, (data: { callId: string; candidate: RTCIceCandidate }) => {
            if (data.callId === this.call?.id) {
                this.webrtcController.addCandidate(data.candidate);
            } else {
                console.warn('Incoming candidate for incorrect call');
            }
        });
        this.webrtcController.addEventListener(WebRTCEventType.ON_ICE_CANDIDATE, (data: { candidate: RTCIceCandidate }) => {
            if (!this.call) {
                return;
            }
            this.transport.sendIceCandidate(this.call!.id, data.candidate);
        });

        // this.incomingCalls.delete(callId);
    }

    public addEventListener(type: P2PCallEventType, listener: P2PCallEvent): void {
        this.eventListeners.get(type)?.add(listener);
    }

    public removeEventListener(type: P2PCallEventType, listener: P2PCallEvent): void {
        this.eventListeners.get(type)?.delete(listener);
    }

    /**
     * Connect to the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    public async connect(url: string): Promise<void> {
        return this.transport
            .connect(url)
            .then(() => {
                this.eventListeners.get(P2PCallEventType.SIGNALING_CONNECTED)?.forEach((listener) => listener());
            })
            .catch((error: Error) => {
                this.eventListeners.get(P2PCallEventType.ERROR)?.forEach((listener) => listener(error));
            });
    }

    /**
     * Disconnect from the signaling server
     *
     * @param {string} url  Url of the signaling server to connect to
     *
     */
    public disconnect(): void {
        return this.transport.disconnect();
    }

    /**
     * Login user to the signaling server
     *
     * @param {string} userIdentity User ID
     * @param {string} securityToken Any security token, used by the backend to authorize user
     * @returns {Promise<User>}
     */
    public async login(userIdentity: string, securityToken: string): Promise<User> {
        return new Promise((resolve: (user: User) => void, reject: (error: Error) => void) => {
            this.userController
                .login(userIdentity, securityToken)
                .then((data: { user: User; iceServers: [] }) => {
                    resolve(data.user);
                    this.webrtcController.setIceServers(data.iceServers);
                })
                .catch((error: Error) => {
                    console.log(error);
                    reject(new Error(error.message));
                });
        });
    }

    /**
     * Logout user
     *
     * @returns {Promise<void>}
     */
    public async logout(): Promise<void> {
        return this.userController.logout();
    }

    /**
     * Start pairing process
     *
     * @returns {Promise<User>}
     */
    public startPairing(): Promise<void> {
        return this.transport.startPairing();
    }

    /**
     * Stop pairing process
     *
     * @returns {Promise<void>}
     */
    public stopPairing(): Promise<void> {
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
    public async startCall(calleeId: string, audio: boolean, video: boolean): Promise<P2PCall> {
        return new Promise(async (resolve: (call: P2PCall) => void, reject: (error: Error) => void) => {
            if (!!this.webrtcController.hasConnection) {
                reject(new Error('Another call is in progress, you should finish it first'));
                return;
            }
            if (!this.currentUser) {
                reject(new Error('You should authenticate first'));
                return;
            }
            const sdpOffer = await this.webrtcController.initConnection(audio, video);
            this.transport
                .call(calleeId, sdpOffer, audio, video)
                .then((call: P2PCall) => {
                    this.call = new P2PCall(call.id, call.caller, call.callee, P2PCallStatus.Pending);
                    resolve(this.call);
                })
                .catch((error: Error) => {
                    reject(error);
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
    public async acceptCall(callId: string, audio: boolean, video: boolean): Promise<P2PCall> {
        return new Promise(async (resolve: (call: P2PCall) => void, reject: (error: Error) => void) => {
            if (!!this.webrtcController.hasConnection) {
                reject(new Error('Another call is in progress, you should finish it first'));
                return;
            }
            if (!this.currentUser) {
                reject(new Error('You should authenticate first'));
                return;
            }
            const incomingCall = this.incomingCalls.get(callId);
            if (!incomingCall) {
                reject(new Error('Call was finished before accepting'));
                return;
            }
            console.log('>>>>> AACCCCCEPT -3');
            const sdpAnswer = await this.webrtcController.initConnectionAnswering(incomingCall.sdpOffer, audio, video);
            console.log('>>>>> AACCCCCEPT -2');
            this.transport
                .accept(callId, sdpAnswer, audio, video)
                .then((call: P2PCall) => {
                    this.call = new P2PCall(callId, call.caller, call.callee, P2PCallStatus.Starting);
                    this.incomingCalls.delete(callId);
                    resolve(this.call);
                })
                .catch((error: Error) => {
                    reject(error);
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
    public async rejectCall(callId: string, rejectionReason: string): Promise<void> {
        return new Promise(async (resolve: () => void, reject: (error: Error) => void) => {
            if (!this.currentUser) {
                reject(new Error('You should authenticate first'));
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
                .catch((error: Error) => {
                    this.call = undefined;
                    this.webrtcController.closeConnection();
                    reject(error);
                });
        });
    }

    /**
     * Hangup the call
     *
     * @param {string?} hangupReason     Optianl reason, will be delivered to caller
     * @returns {Promise<void>}
     */
    public async hangupCall(hangupReason?: string): Promise<void> {
        return new Promise(async (resolve: () => void, reject: (error: Error) => void) => {
            if (!this.currentUser) {
                reject(new Error('You should authenticate first'));
                return;
            }
            if (!this.call) {
                reject(new Error('There is no call to reject'));
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
                .catch((error: Error) => {
                    this.call = undefined;
                    this.webrtcController.closeConnection();
                    reject(error);
                });
        });
    }
}
