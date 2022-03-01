import { SubscriptionService } from "../../router/SubscriptionService";
declare class HTTPService extends SubscriptionService {
    name: string;
    service: string;
    static type: string;
    constructor(router: any);
    add: (user: any, endpoint: any) => Promise<unknown>;
}
export default HTTPService;
