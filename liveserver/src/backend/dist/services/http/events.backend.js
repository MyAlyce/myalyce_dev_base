import { __awaiter, __extends, __generator } from "tslib";
import { SubscriptionService } from "../../router/SubscriptionService";
import { randomId } from "../../common/id.utils";
// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func: Function) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null)
//      result = [];
//   return result;
// }
var EventsBackend = /** @class */ (function (_super) {
    __extends(EventsBackend, _super);
    function EventsBackend(router) {
        var _this = _super.call(this, router) || this;
        _this.name = 'events';
        _this.id = randomId('events');
        _this.updateUser = function (info, request, response) { return __awaiter(_this, void 0, void 0, function () {
            var tempId, id, routes, u, headers;
            var _this = this;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        tempId = (_a = info.message) === null || _a === void 0 ? void 0 : _a[1];
                        id = (_c = (_b = info.id) !== null && _b !== void 0 ? _b : tempId) !== null && _c !== void 0 ? _c : randomId('sse') // temporary id (since EventSource cannot pass a body)
                        ;
                        routes = (_d = info.message) === null || _d === void 0 ? void 0 : _d[0];
                        u = this.subscribers.get(tempId !== null && tempId !== void 0 ? tempId : id);
                        if (!(tempId && u)) return [3 /*break*/, 3];
                        u.id = id;
                        if (!(u.id != tempId)) return [3 /*break*/, 2];
                        this.subscribers.delete(tempId);
                        return [4 /*yield*/, this.notify({ route: 'addUser', message: [{ id: id, send: u.send }] })];
                    case 1:
                        _e.sent();
                        _e.label = 2;
                    case 2:
                        response.send(JSON.stringify({ message: [true] })); // Return to ensure client is not blocked
                        return [3 /*break*/, 4];
                    case 3:
                        if (!u) {
                            // Initialize Subscription
                            u = { id: id, routes: {}, send: function (data) {
                                    if ((data === null || data === void 0 ? void 0 : data.message) && (data === null || data === void 0 ? void 0 : data.route)) {
                                        response.write("data: ".concat(JSON.stringify(data), "\n\n"));
                                    }
                                } };
                            headers = {
                                'Content-Type': 'text/event-stream',
                                'Connection': 'keep-alive',
                                'Cache-Control': 'no-cache'
                            };
                            response.writeHead(200, headers);
                            u.send({ route: 'events/subscribe', message: [id] }); // send initial value
                            // Cancel Subscriptions
                            request.on('close', function () {
                                _this.subscribers.delete(u.id);
                            });
                        }
                        _e.label = 4;
                    case 4:
                        this.subscribers.set(id, u);
                        // Always Add New Routes
                        if (routes) {
                            routes.forEach(function (route) { return __awaiter(_this, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    u.routes[route] = true; // TODO: Toggle off to cancel subscription
                                    return [2 /*return*/];
                                });
                            }); });
                        }
                        return [2 /*return*/, id];
                }
            });
        }); };
        return _this;
    }
    return EventsBackend;
}(SubscriptionService));
export { EventsBackend };
export default EventsBackend;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnRzLmJhY2tlbmQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9zZXJ2aWNlcy9odHRwL2V2ZW50cy5iYWNrZW5kLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQztBQUN2RSxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sdUJBQXVCLENBQUM7QUFFakQsMkRBQTJEO0FBQzNELHFDQUFxQztBQUNyQywyQ0FBMkM7QUFDM0MsNkRBQTZEO0FBQzdELDhGQUE4RjtBQUM5Rix3QkFBd0I7QUFDeEIsb0JBQW9CO0FBQ3BCLG1CQUFtQjtBQUNuQixJQUFJO0FBRUo7SUFBbUMsaUNBQW1CO0lBS2xELHVCQUFZLE1BQU07UUFBbEIsWUFDSSxrQkFBTSxNQUFNLENBQUMsU0FDaEI7UUFMRCxVQUFJLEdBQUcsUUFBUSxDQUFBO1FBQ2YsUUFBRSxHQUFXLFFBQVEsQ0FBQyxRQUFRLENBQUMsQ0FBQTtRQU0vQixnQkFBVSxHQUFHLFVBQU8sSUFBUSxFQUFFLE9BQWdCLEVBQUUsUUFBa0I7Ozs7Ozs7d0JBRXhELE1BQU0sR0FBRyxNQUFBLElBQUksQ0FBQyxPQUFPLDBDQUFHLENBQUMsQ0FBQyxDQUFBO3dCQUMxQixFQUFFLEdBQUcsTUFBQSxNQUFBLElBQUksQ0FBQyxFQUFFLG1DQUFJLE1BQU0sbUNBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLHNEQUFzRDt3QkFBdkQsQ0FBQTt3QkFDekMsTUFBTSxHQUFHLE1BQUEsSUFBSSxDQUFDLE9BQU8sMENBQUcsQ0FBQyxDQUFDLENBQUE7d0JBQzVCLENBQUMsR0FBRyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxNQUFNLGFBQU4sTUFBTSxjQUFOLE1BQU0sR0FBSSxFQUFFLENBQUMsQ0FBQTs2QkFFdEMsQ0FBQSxNQUFNLElBQUksQ0FBQyxDQUFBLEVBQVgsd0JBQVc7d0JBQ1gsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUE7NkJBQ0wsQ0FBQSxDQUFDLENBQUMsRUFBRSxJQUFJLE1BQU0sQ0FBQSxFQUFkLHdCQUFjO3dCQUNkLElBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFBO3dCQUMvQixxQkFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUMsS0FBSyxFQUFFLFNBQVMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFDLEVBQUUsSUFBQSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUMsSUFBSSxFQUFDLENBQUMsRUFBQyxDQUFDLEVBQUE7O3dCQUFwRSxTQUFvRSxDQUFDOzs7d0JBRXpFLFFBQVEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxFQUFDLE9BQU8sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMseUNBQXlDOzs7d0JBQ3ZGLElBQUksQ0FBQyxDQUFDLEVBQUU7NEJBRVgsMEJBQTBCOzRCQUMxQixDQUFDLEdBQUcsRUFBQyxFQUFFLElBQUEsRUFBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxVQUFDLElBQVE7b0NBQ2hDLElBQUcsQ0FBQSxJQUFJLGFBQUosSUFBSSx1QkFBSixJQUFJLENBQUUsT0FBTyxNQUFJLElBQUksYUFBSixJQUFJLHVCQUFKLElBQUksQ0FBRSxLQUFLLENBQUEsRUFBRTt3Q0FDN0IsUUFBUSxDQUFDLEtBQUssQ0FBQyxnQkFBUyxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxTQUFNLENBQUMsQ0FBQztxQ0FDdkQ7Z0NBQ0wsQ0FBQyxFQUFDLENBQUE7NEJBR0ksT0FBTyxHQUFHO2dDQUNaLGNBQWMsRUFBRSxtQkFBbUI7Z0NBQ25DLFlBQVksRUFBRSxZQUFZO2dDQUMxQixlQUFlLEVBQUUsVUFBVTs2QkFDOUIsQ0FBQzs0QkFFRixRQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQzs0QkFFakMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLEtBQUssRUFBQyxrQkFBa0IsRUFBRSxPQUFPLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDLENBQUEsQ0FBQyxxQkFBcUI7NEJBRXZFLHVCQUF1Qjs0QkFDdkIsT0FBTyxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUU7Z0NBQ2hCLEtBQUksQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTs0QkFDakMsQ0FBQyxDQUFDLENBQUM7eUJBQ047Ozt3QkFFRCxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUE7d0JBRTNCLHdCQUF3Qjt3QkFDeEIsSUFBSSxNQUFNLEVBQUM7NEJBQ1AsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFNLEtBQUs7O29DQUN0QixDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLElBQUksQ0FBQSxDQUFDLDBDQUEwQzs7O2lDQUNwRSxDQUFDLENBQUE7eUJBQ0w7d0JBRUQsc0JBQU8sRUFBRSxFQUFBOzs7YUFDWixDQUFBOztJQXBERCxDQUFDO0lBcURMLG9CQUFDO0FBQUQsQ0FBQyxBQTVERCxDQUFtQyxtQkFBbUIsR0E0RHJEOztBQUVELGVBQWUsYUFBYSxDQUFBIn0=