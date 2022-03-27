import { MessageObject, UserObject } from "../common/general.types";
import { Service } from './Service';
import Router from './core';
export declare class SubscriptionService extends Service {
    service?: string;
    connection?: any;
    responses?: Map<string, Function>;
    serviceType: 'subscription';
    subscribers: Map<string, any>;
    updateSubscribers?: (router: Router, o: MessageObject) => any;
    constructor(router: any);
    add: (user: Partial<UserObject>, endpoint: string) => Promise<any>;
    addResponse: (name: any, f: any) => void;
    removeResponse: (name: any) => void;
    send: (o: MessageObject, options?: any) => Promise<any>;
}
