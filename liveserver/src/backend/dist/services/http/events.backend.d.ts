import { Request, Response } from "express";
import { SubscriptionService } from "../../router/SubscriptionService";
export declare class EventsBackend extends SubscriptionService {
    name: string;
    id: string;
    constructor(router: any);
    updateUser: (info: any, request: Request, response: Response) => Promise<any>;
}
export default EventsBackend;
