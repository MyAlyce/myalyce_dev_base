import { EndpointConfig, EndpointType, RouteSpec, MessageObject, UserObject } from '../common/general.types';
import { SubscriptionService } from './SubscriptionService';
import Router from './core';
export declare class Endpoint {
    id: string;
    target: URL;
    type: EndpointType;
    link: Endpoint;
    credentials: Partial<UserObject>;
    connection?: {
        service: SubscriptionService;
        id: string;
        protocol: string;
    };
    services: {
        available: {
            [x: string]: string;
        };
        connecting: {
            [x: string]: Function;
        };
        queue: {
            [x: string]: Function[];
        };
    };
    router: Router;
    clients: {
        [x: string]: any;
    };
    user: string;
    status: boolean;
    responses: {
        [x: string]: Function;
    };
    constructor(config?: EndpointConfig, clients?: any, router?: Router);
    setCredentials: (o?: Partial<UserObject>) => void;
    check: () => Promise<any>;
    send: (route: RouteSpec, o?: Partial<MessageObject>, progressCallback?: (ratio: number, total: number) => void) => Promise<any>;
    _subscribe: (opts?: any) => Promise<any>;
    subscribe: (callback: any) => string;
    unsubscribe: (id: any) => void;
}
