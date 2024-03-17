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
        if (this.eventListeners.has(type) && this.eventListeners.get(type)?.size) {
            this.eventListeners.get(type)?.clear();
        }
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
    }
    async getVideoDevices() {
        return new Promise((resolve, reject) => {
            WebRTC.mediaDevices
                .enumerateDevices()
                .then((list) => {
                list.forEach((item) => console.log(item));
                const videoDevices = list.filter((item) => item.kind === 'videoinput');
                resolve(videoDevices);
            })
                .catch((error) => reject(error));
        });
    }
    async setVideoDevice(deviceId) {
        return new Promise((resolve, reject) => {
            this.mediaConstraints.video = !!deviceId ? { deviceId } : true;
            if (!!this.localStream) {
                WebRTC.mediaDevices
                    .getUserMedia(this.mediaConstraints)
                    .then((stream) => {
                    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ +++', stream.id);
                    const currentVideoTrack = this.localStream?.getVideoTracks().length ? this.localStream?.getVideoTracks()[0] : null;
                    const newVideoTrack = stream.getVideoTracks().length ? this.localStream?.getVideoTracks()[0] : null;
                    const currentAudioTrack = this.localStream?.getAudioTracks().length ? this.localStream?.getAudioTracks()[0] : null;
                    const newAudioTrack = stream.getAudioTracks().length ? this.localStream?.getAudioTracks()[0] : null;
                    this.connection?.getSenders().forEach((sender) => {
                        console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ +++  1', sender);
                        // if (!!currentVideoTrack && !!newVideoTrack && sender.track?.id === currentVideoTrack.id) {
                        if (!!currentVideoTrack && !!newVideoTrack && sender.track?.kind === 'video') {
                            console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ +++  2', newVideoTrack);
                            sender.replaceTrack(newVideoTrack);
                        }
                        // if (!!currentAudioTrack && !!newAudioTrack && sender.track?.id === currentAudioTrack.id) {
                        if (!!currentAudioTrack && !!newAudioTrack && sender.track?.kind === 'audio') {
                            console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ +++  3', newAudioTrack);
                            sender.replaceTrack(newAudioTrack);
                        }
                    });
                    this.localStream = stream;
                    this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => {
                        // this.videoStream = new WebRTC.MediaStream(this.localStream?.getVideoTracks());
                        // listener({ stream: this.videoStream });
                        listener({ stream });
                    });
                    currentVideoTrack?.stop();
                    newAudioTrack?.stop();
                    resolve();
                })
                    .catch((error) => reject(error));
            }
        });
        // com.apple.avfoundation.avcapturedevice.built-in_video:1
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
                    console.log('$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$', stream.id);
                    this.eventListeners.get(WebRTCEventType.LOCAL_STREAM)?.forEach((listener) => {
                        // this.videoStream = new WebRTC.MediaStream(this.localStream?.getVideoTracks());
                        // listener({ stream: this.videoStream });
                        listener({ stream });
                    });
                }, 0);
                if (!!this.connection) {
                    this.connection.close();
                }
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
                    // console.log('ICE connection state', this.connection?.iceConnectionState);
                });
                this.connection.addEventListener('icegatheringstatechange', () => {
                    // console.log('ICE gathering state', this.connection?.iceGatheringState);
                });
                this.connection.addEventListener('negotiationneeded', () => {
                    // console.log('Negotiation needed');
                });
                this.connection?.addEventListener('icecandidate', (event) => {
                    if (event.candidate) {
                        this.outgoingIceCandidates.push(event.candidate);
                    }
                });
                this.connection
                    .createOffer({
                //offerToReceiveAudio: true,
                //offerToReceiveVideo: true,
                // VoiceActivityDetection: true,
                })
                    .then((sdpOffer) => {
                    console.log('Setting local description - offer', sdpOffer.sdp);
                    this.connection
                        ?.setLocalDescription(sdpOffer)
                        .then(() => {
                        resolve(this.connection?.localDescription);
                    })
                        .catch((error) => {
                        reject(error);
                    });
                })
                    .catch((error) => {
                    reject(error);
                });
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
                this.connection = new WebRTC.RTCPeerConnection({ iceServers: this.iceServers });
                if (!this.connection) {
                    reject(new Error('Unable to create RTCPeerConnection'));
                    return;
                }
                for (const track of this.localStream.getTracks()) {
                    this.connection.addTrack(track, this.localStream);
                }
                this.connection?.addEventListener('icecandidate', (event) => {
                    if (!event.candidate) {
                        return;
                    }
                    this.eventListeners.get(WebRTCEventType.ON_ICE_CANDIDATE)?.forEach((listener) => {
                        listener({ candidate: event.candidate });
                    });
                });
                console.log('Setting remote description', sdpOffer.sdp);
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
                        console.log('Setting local description - answer', sdpAnswer.sdp);
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
                this.connection.addEventListener('track', (event) => {
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
        console.log('Setting remote description - answer', sdpAnswer.sdp);
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