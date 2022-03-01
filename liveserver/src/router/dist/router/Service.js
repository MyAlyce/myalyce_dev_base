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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL1NlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLE9BQU8sRUFBRSxRQUFRLEVBQUUsTUFBTSxvQkFBb0IsQ0FBQTtBQUk3Qyw0Q0FBNEM7QUFDNUMsTUFBTSxPQUFPLE9BQU87SUFzQmhCLFlBQVksTUFBdUI7O1FBcEJuQyxPQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUMsb0JBQW9CO1FBQzdDLFNBQUksR0FBVSxTQUFTLENBQUEsQ0FBQyxlQUFlO1FBQ3ZDLGNBQVMsR0FBNEMsSUFBSSxHQUFHLEVBQUUsQ0FBQSxDQUFDLHVCQUF1QjtRQUd0RixXQUFNLEdBQVksS0FBSyxDQUFBLENBQUMsc0RBQXNEO1FBQzlFLGdCQUFXLEdBQStCLFNBQVMsQ0FBQTtRQUluRCwwQkFBMEI7UUFDMUIsV0FBTSxHQUFrQjtRQUNwQixnSkFBZ0o7U0FDbkosQ0FBQTtRQUVPLGFBQVEsR0FBSSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxRQUFRLDBDQUFFLHNCQUFzQixFQUFFLENBQUM7UUFFbkUsY0FBUyxHQUFtQixFQUFFLENBQUEsQ0FBQyxzREFBc0Q7UUFDckYsYUFBUSxHQUF1QixFQUFFLENBQUEsQ0FBQyw0QkFBNEI7UUFvQjlELHFCQUFnQixHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDeEIsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUE7UUFDckIsQ0FBQyxDQUFBO1FBR0QscUVBQXFFO1FBQ3JFLFdBQU0sR0FBRyxDQUNMLENBQWdCLEVBQUUsZ0NBQWdDO1FBQ2xELElBQWtCLEVBQUUsZ0tBQWdLO1FBQ3BMLE1BQWdDLENBQUMsb0JBQW9CO1VBQ3RELEVBQUU7WUFDRCxJQUFJLFNBQVMsR0FBRyxFQUFFLENBQUM7WUFFbkIseUJBQXlCO1lBQ3pCLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBTyxHQUFHLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Z0JBQzlELE1BQU0sR0FBRyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLENBQUM7Z0JBQzFDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDO29CQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7WUFDM0QsQ0FBQyxDQUFBLENBQUMsQ0FBQyxDQUFBO1lBRUgsMkNBQTJDO1lBQzNDLE9BQU8sU0FBUyxhQUFULFNBQVMsdUJBQVQsU0FBUyxDQUFHLENBQUMsQ0FBQyxDQUFBO1FBQ3pCLENBQUMsQ0FBQSxDQUFBO1FBRUQsZ0JBQWdCO1FBQ2hCLGdCQUFXLEdBQUcsQ0FBQyxRQUFRLEVBQUUsRUFBRTtZQUN2QixJQUFJLENBQUMsUUFBUSxHQUFHLFFBQVEsQ0FBQTtRQUM1QixDQUFDLENBQUE7UUFFRCw2QkFBNkI7UUFDN0IsY0FBUyxHQUFHLENBQUMsUUFBaUMsRUFBRSxFQUFFO1lBQzlDLElBQUksUUFBUSxZQUFZLFFBQVEsRUFBQztnQkFDN0IsSUFBSSxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUE7Z0JBQ25CLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFDaEMsT0FBTyxFQUFFLENBQUE7YUFDWjs7Z0JBQU0sT0FBTTtRQUNqQixDQUFDLENBQUE7UUFFRCxpQ0FBaUM7UUFDakMsZ0JBQVcsR0FBRyxDQUFDLEVBQVMsRUFBRSxFQUFFO1lBQ3hCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUE7UUFDcEMsQ0FBQyxDQUFBO1FBekRHLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFBO0lBQ3hCLENBQUM7SUFHRCxnQ0FBZ0M7SUFDaEMsZ0JBQWdCLENBQUMsR0FBRyxJQUFTOztRQUN6QixNQUFBLElBQUksQ0FBQyxRQUFRLDBDQUFFLGdCQUFnQixDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQy9ELENBQUM7SUFFRCxhQUFhLENBQUMsR0FBRyxJQUFTOztRQUN0QixPQUFPLE1BQUEsSUFBSSxDQUFDLFFBQVEsMENBQUUsYUFBYSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ25FLENBQUM7SUFFRCxtQkFBbUIsQ0FBQyxHQUFHLElBQVM7O1FBQzVCLE9BQU8sTUFBQSxJQUFJLENBQUMsUUFBUSwwQ0FBRSxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUN6RSxDQUFDO0NBMkNKIn0=