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
// import { Platform } from 'react-native';
// import { request, PERMISSIONS } from 'react-native-permissions';

//let WebRTC: any;
import * as WebRTC from 'react-native-webrtc';

console.log('????????????????????????????????????????????????????????????????????????');
console.log('????????????????????????????????????????????????????????????????????????');
console.log('????????????????????????????????????????????????????????????????????????');
console.log('????????????????????????????????????????????????????????????????????????');
console.log('????????????????????????????????????????????????????????????????????????');

export function injectWebRTC(WebRTCWrapper: any) {
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    //WebRTC = WebRTCWrapper;
    console.log(WebRTCWrapper);
}

export enum WebRTCEventType {
    REMOTE_STREAM = 'remote_stream',
    LOCAL_STREAM = 'local_stream',
    INTERRUPTED = 'interrupted',
    ON_ICE_CANDIDATE = 'on_ice_candidate',
}

export type WebRTCEvent = (data?: any) => void;

export class WebRTCController {
    private readonly eventListeners: Map<WebRTCEventType, Set<WebRTCEvent>> = new Map<WebRTCEventType, Set<WebRTCEvent>>();
    private iceServers: any[] = [];
    private connection?: WebRTC.RTCPeerConnection;
    private localStream?: WebRTC.MediaStream;
    // private incomingIceCandidates: RTCIceCandidate[] = [];
    private outgoingIceCandidates: WebRTC.RTCIceCandidate[] = [];
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

    public setIceServers(iceServers: []): void {
        console.log(iceServers);
        this.iceServers = [{ urls: 'stun:139.59.128.234:3452' }]; //iceServers;
    }

    public callStarted(): void {
        this.outgoingIceCandidates.forEach((candidate: WebRTC.RTCIceCandidate) => {
            this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                listener({ candidate });
            });
        });
        this.outgoingIceCandidates.length = 0;
    }

    public async initConnection(audio: boolean, video: boolean): Promise<WebRTC.RTCSessionDescription> {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve: (sdpAnswer: WebRTC.RTCSessionDescription) => void, reject: (error: Error) => void) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track: WebRTC.MediaStreamTrack) => track.stop());
            }
            //request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
            //    .then((result) => {
            //        request(Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO)
            //            .then((result) => {
            WebRTC.mediaDevices
                .getUserMedia({
                    audio: audio ? this.mediaConstraints.audio : false,
                    video: video ? this.mediaConstraints.video : false,
                })
                .then((stream: WebRTC.MediaStream) => {
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
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', WebRTC.RTCPeerConnection);
                    try {
                        this.connection = new WebRTC.RTCPeerConnection({
                            iceServers: [
                                {
                                    urls: ['stun:stun.l.google.com:19302'],
                                },
                            ],
                        });
                    } catch (error: any) {
                        console.log(error);
                    }
                    console.log('***************************************************************');
                    if (!this.connection) {
                        reject(new Error('Failed to create RTCPeerConnection'));
                        return;
                    }
                    for (const track of this.localStream.getTracks()) {
                        this.connection.addTrack(track, this.localStream);
                    }
                    /*
                    this.connection.addEventListener('track', (event: any) => {
                        this.eventListeners
                            .get(WebRTCEventType.REMOTE_STREAM)
                            ?.forEach((listener) => listener({ stream: event.streams[0] }));
                    });

                    this.connection.addEventListener('iceconnectionstatechange', () => {
                        // console.log('ICE connection state', this.connection?.iceConnectionState);
                    });

                    this.connection.addEventListener('icegatheringstatechange', () => {
                        // console.log('ICE gathering state', this.connection?.iceGatheringState);
                    });

                    this.connection.addEventListener('negotiationneeded', () => {
                        // console.log('Negotiation needed');
                    });

                    this.connection?.addEventListener('icecandidate', (event: any) => {
                        if (event.candidate) {
                            this.outgoingIceCandidates.push(event.candidate!);
                        }
                    });
                    */
                    this.connection
                        .createOffer({
                            //offerToReceiveAudio: true,
                            //offerToReceiveVideo: true,
                            // VoiceActivityDetection: true,
                        })
                        .then((sdpOffer: WebRTC.RTCSessionDescription) => {
                            this.connection
                                ?.setLocalDescription(sdpOffer)
                                .then(() => resolve(this.connection?.localDescription!))
                                .catch((error: Error) => reject(error));
                        })
                        .catch((error: Error) => reject(error));
                })
                .catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
        });
    }

    public async initConnectionAnswering(
        sdpOffer: WebRTC.RTCSessionDescription,
        audio: boolean,
        video: boolean
    ): Promise<WebRTC.RTCSessionDescription> {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve: (sdpAnswer: WebRTC.RTCSessionDescription) => void, reject: (error: Error) => void) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track: WebRTC.MediaStreamTrack) => track.stop());
            }
            //request(Platform.OS === 'ios' ? PERMISSIONS.IOS.CAMERA : PERMISSIONS.ANDROID.CAMERA)
            //    .then((result) => {
            //        request(Platform.OS === 'ios' ? PERMISSIONS.IOS.MICROPHONE : PERMISSIONS.ANDROID.RECORD_AUDIO)
            //            .then((result) => {
            WebRTC.mediaDevices
                .getUserMedia({
                    audio: audio ? this.mediaConstraints.audio : false,
                    video: video ? this.mediaConstraints.video : false,
                })
                .then((stream: WebRTC.MediaStream) => {
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
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', this.iceServers);
                    console.log('***************************************************************', WebRTC.RTCPeerConnection);
                    try {
                        this.connection = new WebRTC.RTCPeerConnection({
                            iceServers: [
                                {
                                    urls: ['stun:stun.l.google.com:19302'],
                                },
                            ],
                        });
                    } catch (error: any) {
                        console.log(error);
                    }
                    console.log('***************************************************************');
                    if (!this.connection) {
                        reject(new Error('Unable to create RTCPeerConnection'));
                        return;
                    }
                    for (const track of this.localStream.getTracks()) {
                        this.connection.addTrack(track, this.localStream);
                    }

                    /*
                    this.connection?.addEventListener('icecandidate', (event: any) => {
                        if (!event.candidate) {
                            return;
                        }
                        this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                            listener({ candidate: event.candidate });
                        });
                    });
                    */

                    this.connection
                        .setRemoteDescription(sdpOffer)
                        .then(() => {
                            this.connection
                                ?.createAnswer //{
                                //mandatory: {
                                //offerToReceiveAudio: true,
                                //offerToReceiveVideo: true,
                                //VoiceActivityDetection: true,
                                // },
                                //}
                                ()
                                .then((sdpAnswer: WebRTC.RTCSessionDescription) => {
                                    this.connection
                                        ?.setLocalDescription(sdpAnswer)
                                        .then(() => {
                                            resolve(this.connection?.localDescription!);
                                        })
                                        .catch((error: Error) => reject(error));
                                })
                                .catch((error: Error) => reject(error));
                        })
                        .catch((error: Error) => {
                            console.warn(error);
                            reject(error);
                        });

                    /*
                    this.connection.addEventListener('track', (event: any) => {
                        this.eventListeners
                            .get(WebRTCEventType.REMOTE_STREAM)
                            ?.forEach((listener) => listener({ stream: event.streams[0] }));
                    });

                    this.connection.addEventListener('iceconnectionstatechange', () => {
                        // console.log('ICE connection state', this.connection?.iceConnectionState);
                    });

                    this.connection.addEventListener('icegatheringstatechange', () => {
                        // console.log('ICE gathering state', this.connection?.iceGatheringState);
                    });

                    this.connection.addEventListener('negotiationneeded', () => {
                        // console.log('Negotiation needed');
                    });
                    */
                })
                .catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
        });
    }

    public async addAnswer(sdpAnswer: WebRTC.RTCSessionDescription): Promise<void> {
        if (!this.connection) {
            console.warn('Trying to set sdpAnswer for non-existing connection');
            return;
        }
        return this.connection.setRemoteDescription(sdpAnswer);
    }

    public async addCandidate(candidate: WebRTC.RTCIceCandidate): Promise<void> {
        if (!this.connection) {
            console.warn('Trying to set ICE Candidate for non-existing connection');
            return;
        }
        if (!!candidate) {
            return this.connection.addIceCandidate(candidate);
        }
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
