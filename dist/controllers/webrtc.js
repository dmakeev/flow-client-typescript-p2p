//const { MediaStream, RTCSessionDescription, mediaDevices, RTCPeerConnection } =
//    typeof document != 'undefined' ? require('@types/webrtc') : require('react-native-webrtc');
/*
let WebRTC: any;
if (typeof document != 'undefined') {
    // React
    WebRTC = require('@types/webrtc');
} else if (typeof navigator != 'undefined' && navigator.product == 'ReactNative') {
    // React Native
    // import { MediaStream, RTCSessionDescription, mediaDevices, RTCPeerConnection } from 'react-native-webrtc';
    WebRTC = require('react-native-webrtc');
}
*/
export var WebRTCEventType;
(function (WebRTCEventType) {
    WebRTCEventType["REMOTE_STREAM"] = "remote_stream";
    WebRTCEventType["LOCAL_STREAM"] = "local_stream";
    WebRTCEventType["INTERRUPTED"] = "interrupted";
})(WebRTCEventType || (WebRTCEventType = {}));
export class WebRTCController {
    eventListeners = new Map();
    connection;
    localStream;
    mediaConstraints = {
        audio: true,
        video: {
            // frameRate: 30,
            facingMode: 'user',
        },
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
    async initConnection(audio, video) {
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
            }
            navigator.mediaDevices
                .getUserMedia({
                audio: audio ? this.mediaConstraints.audio : false,
                video: video ? this.mediaConstraints.video : false,
            })
                .then((stream) => {
                this.localStream = stream;
                this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => listener({ stream }));
                if (!!this.connection) {
                    this.connection.close();
                }
                this.connection = new RTCPeerConnection();
                for (const track of this.localStream.getTracks()) {
                    this.connection.addTrack(track, this.localStream);
                }
                this.connection.addEventListener('track', (event) => {
                    this.eventListeners
                        .get(WebRTCEventType.REMOTE_STREAM)
                        ?.forEach((listener) => listener({ stream: event.streams[0] }));
                });
                this.connection.addEventListener('iceconnectionstatechange', () => {
                    console.log(this.connection?.iceConnectionState);
                });
                this.connection.addEventListener('icegatheringstatechange', () => {
                    console.log(this.connection?.iceGatheringState);
                });
                this.connection
                    .createOffer({
                //mandatory: {
                //    OfferToReceiveAudio: true,
                //    OfferToReceiveVideo: true,
                //    // VoiceActivityDetection: true,
                //},
                })
                    .then((sdpOffer) => {
                    this.connection?.setLocalDescription(sdpOffer);
                    this.connection?.addEventListener('icecandidate', (event) => {
                        if (!event.candidate && !!this.connection) {
                            resolve(this.connection.localDescription);
                        }
                    });
                })
                    .catch((error) => reject(error.message));
            })
                .catch((error) => reject(error.message));
        });
    }
    async initConnectionAnswering(sdpOffer, audio, video) {
        return new Promise((resolve, reject) => {
            if (!!this.localStream) {
                this.localStream.getTracks().forEach((track) => track.stop());
            }
            navigator.mediaDevices
                .getUserMedia({
                audio: audio ? this.mediaConstraints.audio : false,
                video: video ? this.mediaConstraints.video : false,
            })
                .then((stream) => {
                this.localStream = stream;
                this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => listener({ stream }));
                if (!!this.connection) {
                    this.connection.close();
                }
                this.connection = new RTCPeerConnection();
                for (const track of this.localStream.getTracks()) {
                    this.connection.addTrack(track, this.localStream);
                }
                this.connection
                    .setRemoteDescription(new RTCSessionDescription(sdpOffer))
                    .then(() => {
                    this.connection
                        ?.createAnswer({
                    //mandatory: {
                    //    OfferToReceiveAudio: true,
                    //    OfferToReceiveVideo: true,
                    //    // VoiceActivityDetection: true,
                    //},
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
                    .catch((error) => reject(error.message));
                this.connection.addEventListener('track', (event) => {
                    this.eventListeners
                        .get(WebRTCEventType.REMOTE_STREAM)
                        ?.forEach((listener) => listener({ stream: event.streams[0] }));
                });
                this.connection.addEventListener('iceconnectionstatechange', () => {
                    console.log(this.connection?.iceConnectionState);
                });
                this.connection.addEventListener('icegatheringstatechange', () => {
                    console.log(this.connection?.iceGatheringState);
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
        if (!!this.connection) {
            this.connection.close();
            this.connection = undefined;
        }
    }
}
//# sourceMappingURL=webrtc.js.map