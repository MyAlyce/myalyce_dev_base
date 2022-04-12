import { RouterInterface, MessageObject, ProtocolObject, RouteConfig, SubscriptionCallbackType, MessageType } from "../common/general.types";
import { Endpoint } from './Endpoint';
export declare class Service {
    id: string;
    name: string;
    callbacks: Map<string, SubscriptionCallbackType>;
    endpoint?: Endpoint;
    route?: string;
    status: boolean;
    serviceType: 'default' | 'subscription';
    router: RouterInterface;
    routes: RouteConfig[];
    private delegate;
    protocols: ProtocolObject;
    services: {
        [x: string]: any;
    };
    constructor(router?: RouterInterface);
    addEventListener(...args: any): void;
    dispatchEvent(...args: any): boolean;
    removeEventListener(...args: any): void;
    setEndpointRoute: (name: any) => void;
    notify: (o: MessageObject, type?: MessageType, origin?: string | number | undefined) => Promise<any>;
    setEndpoint: (endpoint: any) => void;
    subscribe: (callback: SubscriptionCallbackType) => string;
    unsubscribe: (id: string) => boolean;
}
