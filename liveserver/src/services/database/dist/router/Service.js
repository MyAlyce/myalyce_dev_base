import { __awaiter, __generator } from "tslib";
import { randomId } from "../common/id.utils";
// Browser and Node-Compatible Service Class
var Service = /** @class */ (function () {
    function Service(router) {
        var _this = this;
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
        this.setEndpointRoute = function (name) {
            _this.route = name;
        };
        // Notify subscribers (e.g. Router / StructsRouter ) of a New Message
        this.notify = function (o, // defines the route to activate
        type, // specifies whether the notification is internal (true) OR from a client (false / default). Internal notifications will be only forwarded to route subscribers.
        origin //origin of the call
        ) { return __awaiter(_this, void 0, void 0, function () {
            var responses;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        responses = [];
                        // Notify All Subscribers
                        return [4 /*yield*/, Promise.all(Array.from(this.callbacks).map(function (arr, i) { return __awaiter(_this, void 0, void 0, function () {
                                var res;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0: return [4 /*yield*/, arr[1](o, type, origin)];
                                        case 1:
                                            res = _a.sent();
                                            if (res && !(res instanceof Error))
                                                responses.push(res);
                                            return [2 /*return*/];
                                    }
                                });
                            }); }))
                            // Return First Valid Subscription Response
                        ];
                    case 1:
                        // Notify All Subscribers
                        _a.sent();
                        // Return First Valid Subscription Response
                        return [2 /*return*/, responses === null || responses === void 0 ? void 0 : responses[0]];
                }
            });
        }); };
        // Bind Endpoint
        this.setEndpoint = function (endpoint) {
            _this.endpoint = endpoint;
        };
        // Subscribe to Notifications
        this.subscribe = function (callback) {
            if (callback instanceof Function) {
                var id = randomId();
                _this.callbacks.set(id, callback);
                return id;
            }
            else
                return;
        };
        // Unsubscribe from Notifications
        this.unsubscribe = function (id) {
            return _this.callbacks.delete(id);
        };
        this.router = router;
    }
    // Event Listener Implementation
    Service.prototype.addEventListener = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.addEventListener.apply(this.delegate, args);
    };
    Service.prototype.dispatchEvent = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.dispatchEvent.apply(this.delegate, args);
    };
    Service.prototype.removeEventListener = function () {
        var _a;
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        return (_a = this.delegate) === null || _a === void 0 ? void 0 : _a.removeEventListener.apply(this.delegate, args);
    };
    return Service;
}());
export { Service };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3JvdXRlci9TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sb0JBQW9CLENBQUE7QUFJN0MsNENBQTRDO0FBQzVDO0lBc0JJLGlCQUFZLE1BQXVCO1FBQW5DLGlCQUVDOztRQXRCRCxPQUFFLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxDQUFBLENBQUMsb0JBQW9CO1FBQzdDLFNBQUksR0FBVSxTQUFTLENBQUEsQ0FBQyxlQUFlO1FBQ3ZDLGNBQVMsR0FBNEMsSUFBSSxHQUFHLEVBQUUsQ0FBQSxDQUFDLHVCQUF1QjtRQUd0RixXQUFNLEdBQVksS0FBSyxDQUFBLENBQUMsc0RBQXNEO1FBQzlFLGdCQUFXLEdBQStCLFNBQVMsQ0FBQTtRQUluRCwwQkFBMEI7UUFDMUIsV0FBTSxHQUFrQjtRQUNwQixnSkFBZ0o7U0FDbkosQ0FBQTtRQUVPLGFBQVEsR0FBSSxNQUFBLFVBQVUsYUFBVixVQUFVLHVCQUFWLFVBQVUsQ0FBRSxRQUFRLDBDQUFFLHNCQUFzQixFQUFFLENBQUM7UUFFbkUsY0FBUyxHQUFtQixFQUFFLENBQUEsQ0FBQyxzREFBc0Q7UUFDckYsYUFBUSxHQUF1QixFQUFFLENBQUEsQ0FBQyw0QkFBNEI7UUFvQjlELHFCQUFnQixHQUFHLFVBQUMsSUFBSTtZQUNwQixLQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQTtRQUNyQixDQUFDLENBQUE7UUFHRCxxRUFBcUU7UUFDckUsV0FBTSxHQUFHLFVBQ0wsQ0FBZ0IsRUFBRSxnQ0FBZ0M7UUFDbEQsSUFBa0IsRUFBRSxnS0FBZ0s7UUFDcEwsTUFBZ0MsQ0FBQyxvQkFBb0I7Ozs7Ozs7d0JBRWpELFNBQVMsR0FBRyxFQUFFLENBQUM7d0JBRW5CLHlCQUF5Qjt3QkFDekIscUJBQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsVUFBTyxHQUFHLEVBQUUsQ0FBQzs7OztnREFDOUMscUJBQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsTUFBTSxDQUFDLEVBQUE7OzRDQUFuQyxHQUFHLEdBQUcsU0FBNkI7NENBQ3pDLElBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxHQUFHLFlBQVksS0FBSyxDQUFDO2dEQUFFLFNBQVMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7Ozs7aUNBQzFELENBQUMsQ0FBQzs0QkFFSCwyQ0FBMkM7MEJBRnhDOzt3QkFKSCx5QkFBeUI7d0JBQ3pCLFNBR0csQ0FBQTt3QkFFSCwyQ0FBMkM7d0JBQzNDLHNCQUFPLFNBQVMsYUFBVCxTQUFTLHVCQUFULFNBQVMsQ0FBRyxDQUFDLENBQUMsRUFBQTs7O2FBQ3hCLENBQUE7UUFFRCxnQkFBZ0I7UUFDaEIsZ0JBQVcsR0FBRyxVQUFDLFFBQVE7WUFDbkIsS0FBSSxDQUFDLFFBQVEsR0FBRyxRQUFRLENBQUE7UUFDNUIsQ0FBQyxDQUFBO1FBRUQsNkJBQTZCO1FBQzdCLGNBQVMsR0FBRyxVQUFDLFFBQWlDO1lBQzFDLElBQUksUUFBUSxZQUFZLFFBQVEsRUFBQztnQkFDN0IsSUFBSSxFQUFFLEdBQUcsUUFBUSxFQUFFLENBQUE7Z0JBQ25CLEtBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxRQUFRLENBQUMsQ0FBQTtnQkFDaEMsT0FBTyxFQUFFLENBQUE7YUFDWjs7Z0JBQU0sT0FBTTtRQUNqQixDQUFDLENBQUE7UUFFRCxpQ0FBaUM7UUFDakMsZ0JBQVcsR0FBRyxVQUFDLEVBQVM7WUFDcEIsT0FBTyxLQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQTtRQUNwQyxDQUFDLENBQUE7UUF6REcsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUE7SUFDeEIsQ0FBQztJQUdELGdDQUFnQztJQUNoQyxrQ0FBZ0IsR0FBaEI7O1FBQWlCLGNBQVk7YUFBWixVQUFZLEVBQVoscUJBQVksRUFBWixJQUFZO1lBQVoseUJBQVk7O1FBQ3pCLE1BQUEsSUFBSSxDQUFDLFFBQVEsMENBQUUsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDL0QsQ0FBQztJQUVELCtCQUFhLEdBQWI7O1FBQWMsY0FBWTthQUFaLFVBQVksRUFBWixxQkFBWSxFQUFaLElBQVk7WUFBWix5QkFBWTs7UUFDdEIsT0FBTyxNQUFBLElBQUksQ0FBQyxRQUFRLDBDQUFFLGFBQWEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsQ0FBQztJQUNuRSxDQUFDO0lBRUQscUNBQW1CLEdBQW5COztRQUFvQixjQUFZO2FBQVosVUFBWSxFQUFaLHFCQUFZLEVBQVosSUFBWTtZQUFaLHlCQUFZOztRQUM1QixPQUFPLE1BQUEsSUFBSSxDQUFDLFFBQVEsMENBQUUsbUJBQW1CLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDekUsQ0FBQztJQTJDTCxjQUFDO0FBQUQsQ0FBQyxBQWpGRCxJQWlGQyJ9