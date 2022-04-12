import { Request, Response } from "express";
import { MessageObject } from "../../common/general.types";
import { SubscriptionService } from '../../router/SubscriptionService';
declare class HTTPService extends SubscriptionService {
    name: string;
    static type: string;
    id: string;
    services: {
        events: any;
    };
    routes: {
        route: string;
        post: (self: any, args: any) => Promise<boolean>;
    }[];
    constructor(router: any);
    controller: (request: Request, response: Response) => Promise<void>;
    handleRoute: (route: string, info: MessageObject) => Promise<any>;
}
export default HTTPService;
