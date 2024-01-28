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
let WebRTC;
export function injectWebRTC(WebRTCWrapper) {
    WebRTC = WebRTCWrapper;
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
        this.iceServers = iceServers;
    }
    callStarted() {
        this.outgoingIceCandidates.forEach((candidate) => {
            this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                listener({ candidate });
            });
        });
        this.outgoingIceCandidates.length = 0;
        // this.outgoingIceCandidates.push(event.candidate!);
        /*
                        console.log('BBB 70', event);
                        if (!event.candidate && !!this.connection) {
                            console.log('BBB 7');
                            // resolve(this.connection.localDescription!);
                        } else {
                            this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                                listener({ candidate: event.candidate });
                            });
                        }
                        */
    }
    async initConnection(audio, video) {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
            }
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
                console.log('!!!!!!!!!!', this.iceServers);
                this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                if (!this.connection) {
                    reject(new Error('Failed to create RTCPeerConnection'));
                    return;
                }
                for (const track of this.localStream.getTracks()) {
                    this.connection.addTrack(track, this.localStream);
                }
                this.connection.addEventListener('track', (event) => {
                    this.eventListeners
                        .get(WebRTCEventType.REMOTE_STREAM)
                        ?.forEach((listener) => listener({ stream: event.streams[0] }));
                });
                this.connection.addEventListener('iceconnectionstatechange', () => {
                    console.log('A1', this.connection?.iceConnectionState);
                });
                this.connection.addEventListener('icegatheringstatechange', () => {
                    console.log('A2', this.connection?.iceGatheringState);
                });
                this.connection.addEventListener('negotiationneeded', () => {
                    console.log('A3', this.connection?.iceGatheringState);
                });
                this.connection?.addEventListener('icecandidate', (event) => {
                    this.outgoingIceCandidates.push(event.candidate);
                    /*
                    console.log('BBB 70', event);
                    if (!event.candidate && !!this.connection) {
                        console.log('BBB 7');
                        // resolve(this.connection.localDescription!);
                    } else {
                        this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                            listener({ candidate: event.candidate });
                        });
                    }
                    */
                });
                this.connection
                    .createOffer({
                //offerToReceiveAudio: true,
                //offerToReceiveVideo: true,
                // VoiceActivityDetection: true,
                })
                    .then((sdpOffer) => {
                    console.log('BBB 501', sdpOffer.type);
                    console.log('BBB 502', sdpOffer.sdp);
                    this.connection
                        ?.setLocalDescription(sdpOffer)
                        .then(() => {
                        console.log('BBB 53', this.connection?.localDescription);
                        resolve(this.connection?.localDescription);
                    })
                        .catch((error) => {
                        console.log('BBB 54', error);
                        reject(error);
                    });
                })
                    .catch((error) => {
                    console.log(error);
                    reject(error);
                });
                console.log('BBB 55');
            })
                .catch((error) => reject(error));
        });
    }
    async initConnectionAnswering(sdpOffer, audio, video) {
        this.outgoingIceCandidates.length = 0;
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
            }
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
                console.log('!!!!!!!!!! 2', this.iceServers);
                this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                if (!this.connection) {
                    reject(new Error('Unable to create RTCPeerConnection'));
                    return;
                }
                for (const track of this.localStream.getTracks()) {
                    this.connection.addTrack(track, this.localStream);
                }
                this.connection?.addEventListener('icecandidate', (event) => {
                    this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                        listener({ candidate: event.candidate });
                    });
                });
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
                        .then((sdpAnswer) => {
                        this.connection?.setLocalDescription(sdpAnswer);
                        resolve(this.connection?.localDescription);
                    })
                        .catch((error) => reject(error));
                })
                    .catch((error) => {
                    console.warn(error);
                    reject(error);
                });
                this.connection.addEventListener('track', (event) => {
                    this.eventListeners
                        .get(WebRTCEventType.REMOTE_STREAM)
                        ?.forEach((listener) => listener({ stream: event.streams[0] }));
                });
                this.connection.addEventListener('iceconnectionstatechange', () => {
                    console.log('B1', this.connection?.iceConnectionState);
                });
                this.connection.addEventListener('icegatheringstatechange', () => {
                    console.log('B2', this.connection?.iceGatheringState);
                });
                this.connection.addEventListener('negotiationneeded', () => {
                    console.log('B3', this.connection?.iceGatheringState);
                });
            })
                .catch((error) => reject(error));
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
        console.log(this.connection.connectionState);
        // incomingIceCandidates
        return this.connection.addIceCandidate(candidate);
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