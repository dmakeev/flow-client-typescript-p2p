//import { WebRTC } from '../helpers/webrtc';
// import { WebRTC } from '../index';
/*
console.log(navigator);
// if (typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
let WebRTC: any;
if (typeof localStorage) {
    // WebRTC = WebRTCNative;
    WebRTC = require('react-native-webrtc');
} else {
    WebRTC = { RTCPeerConnection, MediaStream, RTCSessionDescription, mediaDevices: navigator.mediaDevices };
}
*/

let WebRTC: any;

export function injectWebRTC(WebRTCWrapper: any) {
    WebRTC = WebRTCWrapper;
}

export enum WebRTCEventType {
    REMOTE_STREAM = 'remote_stream',
    LOCAL_STREAM = 'local_stream',
    INTERRUPTED = 'interrupted',
}

export type WebRTCEvent = (data?: any) => void;

export class WebRTCController {
    private readonly eventListeners: Map<WebRTCEventType, Set<WebRTCEvent>> = new Map<WebRTCEventType, Set<WebRTCEvent>>();
    private iceServers: [] = [];
    private connection?: RTCPeerConnection;
    private localStream?: MediaStream;
    //private videoStream?: MediaStream;
    private mediaConstraints = {
        audio: true,
        video: true,
        //{
        // frameRate: 30,
        // facingMode: 'user',
        //},
    };

    public get hasConnection(): boolean {
        return !!this.connection;
    }

    constructor() {
        for (const v of Object.values(WebRTCEventType)) {
            this.eventListeners.set(v, new Set());
        }
    }

    public addEventListener(type: WebRTCEventType, listener: WebRTCEvent): void {
        this.eventListeners.get(type)?.add(listener);
    }

    public removeEventListener(type: WebRTCEventType, listener: WebRTCEvent): void {
        this.eventListeners.get(type)?.delete(listener);
    }

    public setIceServers(iceServers: []): any {
        this.iceServers = iceServers;
    }

    public async initConnection(audio: boolean, video: boolean): Promise<RTCSessionDescription> {
        return new Promise((resolve: (sdpAnswer: RTCSessionDescription) => void, reject: (reason?: string) => void) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
            WebRTC.mediaDevices
                .getUserMedia({
                    audio: audio ? this.mediaConstraints.audio : false,
                    video: video ? this.mediaConstraints.video : false,
                })
                .then((stream: MediaStream) => {
                    this.localStream = stream;
                    setTimeout(() => {
                        this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => {
                            // this.videoStream = new WebRTC.MediaStream(this.localStream?.getVideoTracks());
                            // listener({ stream: this.videoStream });
                            listener({ stream });
                        });
                    }, 0);

                    if (!!this.connection) {
                        this.connection.close();
                    }
                    try {
                        this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                    } catch (e) {
                        console.log(e);
                    }

                    if (!this.connection) {
                        reject('Failed to create RTCPeerConnection');
                        return;
                    }
                    //for (const track of this.localStream.getTracks()) {
                    //    this.connection.addTrack(track, this.localStream);
                    //}
                    this.connection.addEventListener('track', (event) => {
                        this.eventListeners
                            .get(WebRTCEventType.REMOTE_STREAM)
                            ?.forEach((listener) => listener({ stream: event.streams[0] }));
                    });

                    this.connection.addEventListener('iceconnectionstatechange', () => {
                        // console.log(this.connection?.iceConnectionState);
                    });

                    this.connection.addEventListener('icegatheringstatechange', () => {
                        // console.log(this.connection?.iceGatheringState);
                    });

                    this.connection
                        .createOffer({
                            //offerToReceiveAudio: true,
                            //offerToReceiveVideo: true,
                            // VoiceActivityDetection: true,
                        })
                        .then((sdpOffer: RTCSessionDescriptionInit) => {
                            this.connection?.setLocalDescription(sdpOffer);
                            this.connection?.addEventListener('icecandidate', (event) => {
                                if (!event.candidate && !!this.connection) {
                                    resolve(this.connection.localDescription!);
                                }
                            });
                        })
                        .catch((error: Error) => reject(error.message));
                })
                .catch((error: Error) => reject(error.message));
        });
    }

    public async initConnectionAnswering(sdpOffer: RTCSessionDescription, audio: boolean, video: boolean): Promise<RTCSessionDescription> {
        return new Promise((resolve: (sdpAnswer: RTCSessionDescription) => void, reject: (reason?: string) => void) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
            }
            WebRTC.mediaDevices
                .getUserMedia({
                    audio: audio ? this.mediaConstraints.audio : false,
                    video: video ? this.mediaConstraints.video : false,
                })
                .then((stream: MediaStream) => {
                    this.localStream = stream;
                    setTimeout(() => {
                        this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => {
                            // this.videoStream = new WebRTC.MediaStream(this.localStream?.getVideoTracks());
                            // listener({ stream: this.videoStream });
                            listener({ stream });
                        });
                    }, 0);
                    if (!!this.connection) {
                        try {
                            this.connection.close();
                        } catch (error: unknown) {}
                    }
                    try {
                        this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                    } catch (e) {
                        console.error(e);
                    }
                    if (!this.connection) {
                        reject('Failed to create RTCPeerConnection');
                        return;
                    }
                    for (const track of this.localStream.getTracks()) {
                        this.connection.addTrack(track, this.localStream);
                    }
                    this.connection
                        .setRemoteDescription(sdpOffer)
                        .then(() => {
                            this.connection
                                ?.createAnswer({
                                    //mandatory: {
                                    //offerToReceiveAudio: true,
                                    //offerToReceiveVideo: true,
                                    //VoiceActivityDetection: true,
                                    // },
                                })
                                .then((sdpAnswer: RTCSessionDescriptionInit) => {
                                    this.connection?.setLocalDescription(sdpAnswer);
                                    this.connection?.addEventListener('icecandidate', (event) => {
                                        if (!event.candidate && !!this.connection) {
                                            resolve(this.connection.localDescription!);
                                        }
                                    });
                                })
                                .catch((error: Error) => reject(error.message));
                        })
                        .catch((error: Error) => {
                            console.warn(error);
                            reject(error.message);
                        });

                    this.connection.addEventListener('track', (event) => {
                        this.eventListeners
                            .get(WebRTCEventType.REMOTE_STREAM)
                            ?.forEach((listener) => listener({ stream: event.streams[0] }));
                    });

                    this.connection.addEventListener('iceconnectionstatechange', () => {
                        // console.log(this.connection?.iceConnectionState);
                    });

                    this.connection.addEventListener('icegatheringstatechange', () => {
                        // console.log(this.connection?.iceGatheringState);
                    });
                })
                .catch((error: Error) => reject(error.message));
        });
    }

    public async addAnswer(sdpAnswer: RTCSessionDescription): Promise<void> {
        if (!this.connection) {
            console.warn('Trying to set sdpAnswer for non-existing connection');
            return;
        }
        return this.connection.setRemoteDescription(sdpAnswer);
    }

    public closeConnection(): void {
        if (!!this.localStream) {
            for (const track of this.localStream.getTracks()) {
                track.stop();
            }
            this.localStream = undefined;
        }
        // this.videoStream = undefined;
        if (!!this.connection) {
            this.connection.close();
            this.connection = undefined;
        }
    }
}
