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
export function injectWebRTC(WebRTCWrapper) {
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    console.log('###############################################################################');
    //WebRTC = WebRTCWrapper;
    console.log(WebRTCWrapper);
}
export var WebRTCEventType;
(function (WebRTCEventType) {
    WebRTCEventType["REMOTE_STREAM"] = "remote_stream";
    WebRTCEventType["LOCAL_STREAM"] = "local_stream";
    WebRTCEventType["INTERRUPTED"] = "interrupted";
    WebRTCEventType["ON_ICE_CANDIDATE"] = "on_ice_candidate";
})(WebRTCEventType || (WebRTCEventType = {}));
export class WebRTCController {
    eventListeners = new Map();
    iceServers = [];
    connection;
    localStream;
    // private incomingIceCandidates: RTCIceCandidate[] = [];
    outgoingIceCandidates = [];
    //private videoStream?: MediaStream;
    mediaConstraints = {
        audio: true,
        video: true,
        //{
        // frameRate: 30,
        // facingMode: 'user',
        //},
    };
    get hasConnection() {
        return !!this.connection;
    }
    constructor() {
        for (const v of Object.values(WebRTCEventType)) {
            this.eventListeners.set(v, new Set());
        }
    }
    addEventListener(type, listener) {
        this.eventListeners.get(type)?.add(listener);
    }
    removeEventListener(type, listener) {
        this.eventListeners.get(type)?.delete(listener);
    }
    setIceServers(iceServers) {
        console.log(iceServers);
        // this.iceServers = [{ urls: 'stun:139.59.128.234:3452' }]; //iceServers;
        this.iceServers = [{ urls: 'stun:139.59.128.234:3452' }]; //iceServers;
    }
    callStarted() {
        this.outgoingIceCandidates.forEach((candidate) => {
            this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                listener({ candidate });
            });
        });
        this.outgoingIceCandidates.length = 0;
    }
    async initConnection(audio, video) {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
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
                .then((stream) => {
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
                console.log('*************************************************************** 2222', WebRTC.RTCPeerConnection);
                try {
                    this.connection = new WebRTC.RTCPeerConnection({
                        iceServers: this.iceServers,
                    });
                }
                catch (error) {
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
                    .then((sdpOffer) => {
                    this.connection
                        ?.setLocalDescription(sdpOffer)
                        .then(() => resolve(this.connection?.localDescription))
                        .catch((error) => reject(error));
                })
                    .catch((error) => reject(error));
            })
                .catch((error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
        });
    }
    async initConnectionAnswering(sdpOffer, audio, video) {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
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
                .then((stream) => {
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
                    }
                    catch (error) { }
                }
                console.log('***************************************************************', this.iceServers);
                console.log('***************************************************************', this.iceServers);
                console.log('***************************************************************', this.iceServers);
                console.log('***************************************************************', this.iceServers);
                console.log('***************************************************************', this.iceServers);
                console.log('*************************************************************** 1111', WebRTC.RTCPeerConnection);
                try {
                    this.connection = new WebRTC.RTCPeerConnection({
                        iceServers: this.iceServers,
                    });
                    /*
                    [
                            {
                                urls: 'stun:stun.l.google.com:19302',
                            },
                        ]
                        */
                }
                catch (error) {
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
                    ()
                        .then((sdpAnswer) => {
                        this.connection
                            ?.setLocalDescription(sdpAnswer)
                            .then(() => {
                            resolve(this.connection?.localDescription);
                        })
                            .catch((error) => reject(error));
                    })
                        .catch((error) => reject(error));
                })
                    .catch((error) => {
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
                .catch((error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
            //})
            //.catch((error: Error) => reject(error));
        });
    }
    async addAnswer(sdpAnswer) {
        if (!this.connection) {
            console.warn('Trying to set sdpAnswer for non-existing connection');
            return;
        }
        return this.connection.setRemoteDescription(sdpAnswer);
    }
    async addCandidate(candidate) {
        if (!this.connection) {
            console.warn('Trying to set ICE Candidate for non-existing connection');
            return;
        }
        if (!!candidate) {
            return this.connection.addIceCandidate(candidate);
        }
    }
    closeConnection() {
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
//# sourceMappingURL=webrtc.js.map