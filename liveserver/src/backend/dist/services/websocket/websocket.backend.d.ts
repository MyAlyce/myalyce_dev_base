import { SubscriptionService } from '../../router/SubscriptionService';
import { MessageObject } from '../../common/general.types';
declare class WebsocketService extends SubscriptionService {
    static type: string;
    name: string;
    server: any;
    wss: any;
    constructor(router: any, httpServer: any);
    init(): Promise<void>;
    process: (ws: any, o: any) => Promise<void>;
    defaultCallback: (ws: any, o: any) => Promise<void>;
    addSubscription: (info: MessageObject, ws: any) => Promise<void>;
}
export default WebsocketService;
