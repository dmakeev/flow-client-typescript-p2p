export declare enum WebRTCEventType {
    REMOTE_STREAM = "remote_stream",
    LOCAL_STREAM = "local_stream",
    INTERRUPTED = "interrupted"
}
export type WebRTCEvent = (data?: any) => void;
export declare class WebRTCController {
    private readonly eventListeners;
    private connection?;
    private localStream?;
    private mediaConstraints;
    get hasConnection(): boolean;
    constructor();
    addEventListener(type: WebRTCEventType, listener: WebRTCEvent): void;
    removeEventListener(type: WebRTCEventType, listener: WebRTCEvent): void;
    initConnection(audio: boolean, video: boolean): Promise<RTCSessionDescription>;
    initConnectionAnswering(sdpOffer: RTCSessionDescription, audio: boolean, video: boolean): Promise<RTCSessionDescription>;
    addAnswer(sdpAnswer: RTCSessionDescription): Promise<void>;
    closeConnection(): void;
}
