import { SubscriptionService } from '../../router/SubscriptionService';
import { MessageObject, UserObject } from '../../common/general.types';
declare class WebsocketService extends SubscriptionService {
    name: string;
    service: string;
    static type: string;
    subprotocols?: Partial<UserObject>;
    connected: boolean;
    sendQueue: {
        [x: string]: Function[];
    };
    streamUtils: any;
    sockets: Map<string, any>;
    queue: {};
    origin: string;
    constructor(router: any, subprotocols?: Partial<UserObject>, url?: URL | string);
    encodeForSubprotocol: (dict: any) => string;
    add: (user: any, endpoint: any) => Promise<string>;
    addSocket(url?: string | URL, subprotocolObject?: Partial<UserObject>): string;
    getSocket(remote?: string | URL): any;
    send: (message: MessageObject, options?: {
        callback?: Function;
        id?: string;
    }) => Promise<unknown>;
    post: (message: MessageObject, options?: {
        callback?: Function;
        id?: string;
    }) => Promise<unknown>;
    onmessage: (res: any) => void;
    addCallback(name?: string, callback?: (args: any) => void): boolean;
    removeCallback(name?: string): void;
    defaultCallback: (res: any) => void;
    isOpen: (remote: any) => boolean;
    close: (remote: any) => any;
    terminate: (remote: any) => any;
}
export default WebsocketService;
