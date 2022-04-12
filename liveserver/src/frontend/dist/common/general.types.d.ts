import { Router } from '../router/Router';
import { Endpoint } from '../router/Endpoint';
export declare type RouterInterface = Partial<Router>;
export declare type ArbitraryObject = {
    [x: string]: any;
};
export declare type RouteConfig = {
    route: string;
    id?: string;
    private?: boolean;
    aliases?: string[];
    protocols?: ProtocolObject;
    headers?: any;
    service?: string;
    args?: string[];
    get?: any | {
        object: any;
        transform: (o: any, ...args: any[]) => any;
    };
    post?: (self: Router, args: any[], id: string) => any;
    delete?: (self: Router, args: any[], id: string) => any;
};
export declare type RouterOptions = {
    endpoints?: EndpointConfig[];
    debug?: boolean;
    safe?: boolean;
    interval?: number;
};
export declare type EndpointType = 'http' | 'websocket' | 'webrtc';
export declare type EndpointConfig = string | URL | {
    type?: EndpointType;
    target?: string | URL;
    link?: Endpoint;
    credentials: Partial<UserObject>;
};
export declare type RouteSpec = string | {
    route: string;
    endpoint?: Endpoint;
    service?: string;
};
export declare type SubscriptionCallbackType = (o: MessageObject, name?: MessageType, origin?: string | number | undefined) => any;
export declare type ProtocolObject = {
    websocket?: boolean;
    http?: boolean;
    osc?: boolean;
};
export declare type AllMessageFormats = MessageObject | string | any[];
export declare type MessageObject = {
    id?: string;
    _id?: string;
    route?: string;
    method?: FetchMethods;
    callbackId?: string;
    message?: [] | any;
    suppress?: boolean;
    headers?: {
        [x: string]: string;
    };
    block?: boolean;
};
export declare type ClientObject = {
    id: string;
    routes: Map<string, RouteConfig>;
};
export declare type SettingsObject = {
    id?: string;
    appname?: string;
    type?: string;
    object?: {};
    propnames?: string[];
    settings?: {
        keys?: any[];
    };
};
export declare type MessageType = 'local' | 'remote' | 'subscribers';
export declare type FetchMethods = 'GET' | 'POST' | 'DELETE';
export declare type UserObject = {
    id: string;
    _id: string;
    username: string;
    password?: string;
    origin: string;
    send?: Function;
    webrtc?: RTCPeerConnection;
    props: {};
    updatedPropNames: string[];
    sessions: string[];
    blocked: string[];
    lastUpdate: number;
    lastTransmit: number;
    latency: number;
    routes: Map<string, RouteConfig>;
    userRoles?: any[];
    email?: string;
};
