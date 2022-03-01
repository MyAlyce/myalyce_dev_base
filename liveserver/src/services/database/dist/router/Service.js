import { __awaiter } from "tslib";
import { randomId } from "../common/id.utils";
// Browser and Node-Compatible Service Class
export class Service {
    constructor(router) {
        var _a;
        this.id = randomId('service'); // Unique Service ID
        this.name = 'service'; // Service Name
        this.callbacks = new Map(); // Subscriber Callbacks
        this.status = false; // Is connected with server (set externally by router)
        this.serviceType = 'default';
        // Service-Specific Routes
        this.routes = [
        // {route: 'users', delete: (self, args, id) => {}, post: (self, args, id) => {}} // Called every time a user is added or removed via the Router
        ];
        this.delegate = (_a = globalThis === null || globalThis === void 0 ? void 0 : globalThis.document) === null || _a === void 0 ? void 0 : _a.createDocumentFragment();
        this.protocols = {}; // Compatible Communication Protocols (unused in Node)
        this.services = {}; // Object of nested services
        this.setEndpointRoute = (name) => {
            this.route = name;
        };
        // Notify subscribers (e.g. Router / StructsRouter ) of a New Message
        this.notify = (o, // defines the route to activate
        type, // specifies whether the notification is internal (true) OR from a client (false / default). Internal notifications will be only forwarded to route subscribers.
        origin //origin of the call
        ) => __awaiter(this, void 0, void 0, function* () {
            let responses = [];
            // Notify All Subscribers
            yield Promise.all(Array.from(this.callbacks).map((arr, i) => __awaiter(this, void 0, void 0, function* () {
                const res = yield arr[1](o, type, origin);
                if (res && !(res instanceof Error))
                    responses.push(res);
            })));
            // Return First Valid Subscription Response
            return responses === null || responses === void 0 ? void 0 : responses[0];
        });
        // Bind Endpoint
        this.setEndpoint = (endpoint) => {
            this.endpoint = endpoint;
        };
        // Subscribe to Notifications
        this.subscribe = (callback) => {
            if (callback instanceof Function) {
                let id = randomId();
                this.callbacks.set(id, callback);
                return id;
            }
            else
                return;
        };
        // Unsubscribe from Notifications
        this.unsubscribe = (id) => {
            return this.callbacks.delete(id);
        };
        this.router = router;
    }
    // Event Listener Implementation
    addEventListener(...args) {
        var _a;
        (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.addEventListener.apply(this.delegate, args);
    }
    dispatchEvent(...args) {
        var _a;
        return (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.dispatchEvent.apply(this.delegate, args);
    }
    removeEventListener(...args) {
        var _a;
        return (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.removeEventListener.apply(this.delegate, args);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3JvdXRlci9TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFJN0MsNENBQTRDO0FBQzVDLE1BQU0sT0FBTyxPQUFPO0lBc0JoQixZQUFZLE1BQXVCOztRQXBCbkMsT0FBRSxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsQ0FBQSxDQUFDLG9CQUFvQjtRQUM3QyxTQUFJLEdBQVUsU0FBUyxDQUFBLENBQUMsZUFBZTtRQUN2QyxjQUFTLEdBQTRDLElBQUksR0FBRyxFQUFFLENBQUEsQ0FBQyx1QkFBdUI7UUFHdEYsV0FBTSxHQUFZLEtBQUssQ0FBQSxDQUFDLHNEQUFzRDtRQUM5RSxnQkFBVyxHQUErQixTQUFTLENBQUE7UUFJbkQsMEJBQTBCO1FBQzFCLFdBQU0sR0FBa0I7UUFDcEIsZ0pBQWdKO1NBQ25KLENBQUE7UUFFTyxhQUFRLEdBQUksTUFBQSxVQUFVLGFBQVYsVUFBVSx1QkFBVixVQUFVLENBQUUsUUFBUSwwQ0FBRSxzQkFBc0IsRUFBRSxDQUFDO1FBRW5FLGNBQVMsR0FBbUIsRUFBRSxDQUFBLENBQUMsc0RBQXNEO1FBQ3JGLGFBQVEsR0FBdUIsRUFBRSxDQUFBLENBQUMsNEJBQTRCO1FBb0I5RCxxQkFBZ0IsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3hCLElBQUksQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFBO1FBQ3JCLENBQUMsQ0FBQTtRQUdELHFFQUFxRTtRQUNyRSxXQUFNLEdBQUcsQ0FDTCxDQUFnQixFQUFFLGdDQUFnQztRQUNsRCxJQUFrQixFQUFFLGdLQUFnSztRQUNwTCxNQUFnQyxDQUFDLG9CQUFvQjtVQUN0RCxFQUFFO1lBQ0QsSUFBSSxTQUFTLEdBQUcsRUFBRSxDQUFDO1lBRW5CLHlCQUF5QjtZQUN6QixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQU8sR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFO2dCQUM5RCxNQUFNLEdBQUcsR0FBRyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsSUFBSSxFQUFFLE1BQU0sQ0FBQyxDQUFDO2dCQUMxQyxJQUFJLEdBQUcsSUFBSSxDQUFDLENBQUMsR0FBRyxZQUFZLEtBQUssQ0FBQztvQkFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFBO1lBQzNELENBQUMsQ0FBQSxDQUFDLENBQUMsQ0FBQTtZQUVILDJDQUEyQztZQUMzQyxPQUFPLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRyxDQUFDLENBQUMsQ0FBQTtRQUN6QixDQUFDLENBQUEsQ0FBQTtRQUVELGdCQUFnQjtRQUNoQixnQkFBVyxHQUFHLENBQUMsUUFBUSxFQUFFLEVBQUU7WUFDdkIsSUFBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7UUFDNUIsQ0FBQyxDQUFBO1FBRUQsNkJBQTZCO1FBQzdCLGNBQVMsR0FBRyxDQUFDLFFBQWlDLEVBQUUsRUFBRTtZQUM5QyxJQUFJLFFBQVEsWUFBWSxRQUFRLEVBQUM7Z0JBQzdCLElBQUksRUFBRSxHQUFHLFFBQVEsRUFBRSxDQUFBO2dCQUNuQixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsUUFBUSxDQUFDLENBQUE7Z0JBQ2hDLE9BQU8sRUFBRSxDQUFBO2FBQ1o7O2dCQUFNLE9BQU07UUFDakIsQ0FBQyxDQUFBO1FBRUQsaUNBQWlDO1FBQ2pDLGdCQUFXLEdBQUcsQ0FBQyxFQUFTLEVBQUUsRUFBRTtZQUN4QixPQUFPLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFBO1FBQ3BDLENBQUMsQ0FBQTtRQXpERyxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQTtJQUN4QixDQUFDO0lBR0QsZ0NBQWdDO0lBQ2hDLGdCQUFnQixDQUFDLEdBQUcsSUFBUzs7UUFDekIsTUFBQSxJQUFJLENBQUMsUUFBUSwwQ0FBRSxnQkFBZ0IsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUMvRCxDQUFDO0lBRUQsYUFBYSxDQUFDLEdBQUcsSUFBUzs7UUFDdEIsT0FBTyxNQUFBLElBQUksQ0FBQyxRQUFRLDBDQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQsbUJBQW1CLENBQUMsR0FBRyxJQUFTOztRQUM1QixPQUFPLE1BQUEsSUFBSSxDQUFDLFFBQVEsMENBQUUsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekUsQ0FBQztDQTJDSiJ9