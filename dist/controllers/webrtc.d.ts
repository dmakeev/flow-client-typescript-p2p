import * as WebRTC from 'react-native-webrtc';
export declare function injectWebRTC(WebRTCWrapper: any): void;
export declare enum WebRTCEventType {
    REMOTE_STREAM = "remote_stream",
    LOCAL_STREAM = "local_stream",
    INTERRUPTED = "interrupted",
    ON_ICE_CANDIDATE = "on_ice_candidate"
}
export type WebRTCEvent = (data?: any) => void;
export declare class WebRTCController {
    private readonly eventListeners;
    private iceServers;
    private connection?;
    private localStream?;
    private outgoingIceCandidates;
    private mediaConstraints;
    get hasConnection(): boolean;
    constructor();
    addEventListener(type: WebRTCEventType, listener: WebRTCEvent): void;
    removeEventListener(type: WebRTCEventType, listener: WebRTCEvent): void;
    setIceServers(iceServers: []): void;
    callStarted(): void;
    initConnection(audio: boolean, video: boolean): Promise<WebRTC.RTCSessionDescription>;
    initConnectionAnswering(sdpOffer: WebRTC.RTCSessionDescription, audio: boolean, video: boolean): Promise<WebRTC.RTCSessionDescription>;
    addAnswer(sdpAnswer: WebRTC.RTCSessionDescription): Promise<void>;
    addCandidate(candidate: WebRTC.RTCIceCandidate): Promise<void>;
    closeConnection(): void;
}
