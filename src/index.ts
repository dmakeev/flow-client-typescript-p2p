/*
import * as WebRTC from 'react-native-webrtc';
import { injectWebRTC } from './controllers/webrtc';
injectWebRTC(WebRTC);
*/

export { P2PCallController as P2PEngine, P2PCallEventType } from './controllers/p2p-call';
export type { User as P2PUser, P2PCall, UserPairInfo, UniError } from './models/index';
export type { P2PCallEvent } from './controllers/p2p-call';
