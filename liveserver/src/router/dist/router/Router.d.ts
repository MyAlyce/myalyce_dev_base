import StateManager from 'anotherstatemanager';
import { RouterOptions, AllMessageFormats, EndpointConfig, FetchMethods, MessageObject, MessageType, RouteConfig, RouteSpec, UserObject } from '../common/general.types';
import { Service } from './Service';
import { SubscriptionService } from './SubscriptionService';
import { Endpoint } from './Endpoint';
export declare const DONOTSEND = "DONOTSEND";
export declare class Router {
    id: string;
    USERS: {
        [x: string]: UserObject;
    };
    CONNECTIONS: Map<string, {}>;
    SUBSCRIPTIONS: Function[];
    DEBUG: boolean;
    ENDPOINTS: {
        [x: string]: Endpoint;
    };
    SERVICES: {
        [x: string]: any;
    };
    ROUTES: {
        [x: string]: RouteConfig;
    };
    INTERVAL: number;
    STATE: StateManager;
    DEFAULTROUTES: ({
        route: string;
        get: {
            object: {
                [x: string]: any;
            };
            transform: (reference: any, ...args: any[]) => {};
        };
        aliases?: undefined;
        post?: undefined;
    } | {
        route: string;
        aliases: string[];
        get: {
            object: {
                [x: string]: RouteConfig;
            };
            transform: (reference: any, ...args: any[]) => {};
        };
        post?: undefined;
    } | {
        route: string;
        aliases: string[];
        post: (Router: any, args: any) => any;
        get?: undefined;
    } | {
        route: string;
        post: (Router: any, args: any, origin: any) => any;
        get?: undefined;
        aliases?: undefined;
    } | {
        route: string;
        aliases: string[];
        post: (Router: any, args: any, origin: any) => Promise<{
            message: boolean;
            id: any;
        }>;
        get?: undefined;
    } | {
        route: string;
        aliases: string[];
        post: (Router: any, args: any, origin: any) => boolean;
        get?: undefined;
    })[];
    subscription?: SubscriptionService;
    protocols: {
        http?: SubscriptionService;
        websocket?: SubscriptionService;
    };
    constructor(options?: RouterOptions);
    connect: (config: EndpointConfig, onconnect?: Function) => Endpoint;
    disconnect: (id: any) => Promise<void>;
    _loadBackend: (service: Service | SubscriptionService, name?: string) => void;
    _loadService: (service: Service, name?: string) => Promise<unknown>;
    _loadClient: (service: Service, _?: any, onlySubscribe?: boolean) => Promise<unknown>;
    login(endpoint?: Endpoint, user?: Partial<UserObject>): Promise<boolean>;
    logout(endpoint?: Endpoint): Promise<boolean>;
    get: (routeSpec: RouteSpec, ...args: any[]) => Promise<any>;
    delete: (routeSpec: RouteSpec, ...args: any[]) => Promise<any>;
    post: (routeSpec: RouteSpec, ...args: any[]) => Promise<any>;
    send: (routeSpec: RouteSpec, ...args: any[]) => Promise<any>;
    private _send;
    handleLocalRoute: (o: MessageObject, endpoint?: Endpoint, route?: string) => Promise<any>;
    subscribe: (callback: Function, options?: {
        protocol?: string;
        routes?: string[];
        endpoint?: Endpoint;
        force?: boolean;
    }) => Promise<string>;
    load(service: any, name?: string): Promise<any>;
    format(o: any, info?: {
        service?: string;
        headers?: {
            [x: string]: string;
        };
    }): any;
    runRoute(route: any, method: FetchMethods, args: any[], origin: any, callbackId?: any): Promise<any>;
    addUser(userinfo: Partial<UserObject>): false | UserObject;
    removeUser(user: string | UserObject): boolean;
    blockUser(user: UserObject, userId?: string): boolean;
    handleMessage: (msg: AllMessageFormats, type?: MessageType) => Promise<any>;
    sendMsg(user?: string | UserObject, message?: string, data?: any): boolean;
    addRoute(o: RouteConfig): boolean;
    removeRoute(functionName: any): boolean;
    runCallback(route: any, input?: any[], origin?: any, method?: string): Promise<unknown>;
    checkRoutes(event: any): Promise<any>;
}
export default Router;
