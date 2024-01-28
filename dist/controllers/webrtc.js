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
})(WebRTCEventType || (WebRTCEventType = {}));
export class WebRTCController {
    eventListeners = new Map();
    iceServers = [];
    connection;
    localStream;
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
    async initConnection(audio, video) {
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
            }
            console.log('BBB 1');
            WebRTC.mediaDevices
                .getUserMedia({
                audio: audio ? this.mediaConstraints.audio : false,
                video: video ? this.mediaConstraints.video : false,
            })
                .then((stream) => {
                console.log('BBB 2');
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
                console.log('BBB 3');
                try {
                    this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                }
                catch (e) {
                    console.log(e);
                }
                console.log('BBB 4');
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
                this.connection?.addEventListener('icecandidate', (event) => {
                    console.log('BBB 6');
                    if (!event.candidate && !!this.connection) {
                        resolve(this.connection.localDescription);
                    }
                });
                console.log('BBB 500');
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
                        console.log('BBB 53');
                    })
                        .catch((error) => {
                        console.log('BBB 54', error);
                        reject(error.message);
                    });
                })
                    .catch((error) => {
                    console.log(error);
                    reject(error.message);
                });
                console.log('BBB 55');
            })
                .catch((error) => reject(error.message));
        });
    }
    async initConnectionAnswering(sdpOffer, audio, video) {
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
                try {
                    this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                }
                catch (e) {
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
                        .then((sdpAnswer) => {
                        this.connection?.setLocalDescription(sdpAnswer);
                        this.connection?.addEventListener('icecandidate', (event) => {
                            if (!event.candidate && !!this.connection) {
                                resolve(this.connection.localDescription);
                            }
                        });
                    })
                        .catch((error) => reject(error.message));
                })
                    .catch((error) => {
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
                .catch((error) => reject(error.message));
        });
    }
    async addAnswer(sdpAnswer) {
        if (!this.connection) {
            console.warn('Trying to set sdpAnswer for non-existing connection');
            return;
        }
        return this.connection.setRemoteDescription(sdpAnswer);
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