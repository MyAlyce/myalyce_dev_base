import { __awaiter, __extends, __generator } from "tslib";
import { safeParse } from "../../common/parse.utils";
import { randomId } from "../..//common/id.utils";
import EventsService from "./events.backend";
import { SubscriptionService } from '../../router/SubscriptionService';
// var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
// var ARGUMENT_NAMES = /([^\s,]+)/g;
// function getParamNames(func: Function) {
//   var fnStr = func.toString().replace(STRIP_COMMENTS, '');
//   var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
//   if(result === null)
//      result = [];
//   return result;
// }
var HTTPService = /** @class */ (function (_super) {
    __extends(HTTPService, _super);
    function HTTPService(router) {
        var _this = _super.call(this, router) || this;
        _this.name = 'http';
        _this.id = randomId('http');
        _this.services = {
            events: null // new EventsService()
        };
        _this.routes = [
            {
                route: 'add',
                post: function (self, args) { return __awaiter(_this, void 0, void 0, function () {
                    var get;
                    var _a;
                    return __generator(this, function (_b) {
                        get = { html: (_a = args[1]) !== null && _a !== void 0 ? _a : "<p>Just a test lol</p>" };
                        self.addRoute({
                            route: args[0],
                            get: get,
                            headers: {
                                'Content-Type': 'text/html',
                            },
                            post: function (self, args) {
                                get.html = args[0];
                                return { message: [get.html] };
                            }
                        });
                        return [2 /*return*/, true];
                    });
                }); }
            }
        ];
        // Use with Express App to Handle Requests Coming through the Specified Route
        _this.controller = function (request, response) { return __awaiter(_this, void 0, void 0, function () {
            var path, route, method, info, toMatch;
            return __generator(this, function (_a) {
                path = request.route.path.replace(/\/?\*?\*/, '');
                route = request.originalUrl.replace(path, '');
                if (route[0] === '/')
                    route = route.slice(1); // Remove leading slash from routes
                method = Object.keys(request.route.methods).find(function (k) { return request.route.methods[k]; });
                info = safeParse(request.body);
                info.method = method; // specify route method
                toMatch = "".concat(this.name, "/subscribe");
                if (route.slice(0, toMatch.length) == toMatch) {
                    // Extract Subscription Endpoint (no join required)
                    if (route.slice(0, toMatch.length) == toMatch) {
                        route = route.slice(toMatch.length); // get subscription path
                        this.services.events.updateUser(info, request, response);
                    }
                }
                else {
                    this.handleRoute(route, info).then(function (res) {
                        var _a, _b;
                        if (res instanceof Error)
                            response.status(404).send(JSON.stringify(res, Object.getOwnPropertyNames(res)));
                        else if (res != null) {
                            for (var header in res === null || res === void 0 ? void 0 : res.headers) {
                                response.setHeader(header, res.headers[header]);
                            }
                            var contentType = response.getHeader('Content-Type');
                            // Only Send HTML for SSR
                            if (contentType === 'text/html') {
                                response.send((_b = (_a = res.message) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.html); // send back  
                            }
                            else {
                                response.setHeader('Content-Type', 'application/json');
                                response.send(JSON.stringify(res)); // send back  
                            }
                        }
                    });
                }
                return [2 /*return*/];
            });
        }); };
        // Generic Route Handler for Any Route + Body
        _this.handleRoute = function (route, info) { return __awaiter(_this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        info.route = route; // specify route
                        return [4 /*yield*/, this.notify(info)];
                    case 1:
                        res = _a.sent();
                        return [2 /*return*/, res];
                }
            });
        }); };
        _this.services.events = new EventsService(router);
        _this.services.events.subscribe(_this.notify); // Pass out to the Router
        _this.updateSubscribers = _this.services.events.updateSubscribers;
        _this.subscribers = _this.services.events.subscribers;
        return _this;
        // this.addRoute(transform(k, {
        //     route: `/${(name) ? `${name}/` : ''}` + k,
        //     post: ((service as any)[k] instanceof Function) ? (service as any)[k] : () => (service as any)[k]
        // }))
    }
    HTTPService.type = 'backend';
    return HTTPService;
}(SubscriptionService));
export default HTTPService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5iYWNrZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2VydmljZXMvaHR0cC9odHRwLmJhY2tlbmQudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUVBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVyRCxPQUFPLEVBQUUsUUFBUSxFQUFFLE1BQU0sd0JBQXdCLENBQUM7QUFDbEQsT0FBTyxhQUFhLE1BQU0sa0JBQWtCLENBQUM7QUFDN0MsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFFdkUsMkRBQTJEO0FBQzNELHFDQUFxQztBQUNyQywyQ0FBMkM7QUFDM0MsNkRBQTZEO0FBQzdELDhGQUE4RjtBQUM5Rix3QkFBd0I7QUFDeEIsb0JBQW9CO0FBQ3BCLG1CQUFtQjtBQUNuQixJQUFJO0FBRUo7SUFBMEIsK0JBQW1CO0lBbUN6QyxxQkFBWSxNQUFNO1FBQWxCLFlBQ0ksa0JBQU0sTUFBTSxDQUFDLFNBWWhCO1FBOUNELFVBQUksR0FBRyxNQUFNLENBQUE7UUFHYixRQUFFLEdBQVcsUUFBUSxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBQzdCLGNBQVEsR0FBRztZQUNQLE1BQU0sRUFBRSxJQUFJLENBQUMsc0JBQXNCO1NBQ3RDLENBQUE7UUFFRCxZQUFNLEdBQUc7WUFDTDtnQkFDRSxLQUFLLEVBQUUsS0FBSztnQkFDWixJQUFJLEVBQUUsVUFBTyxJQUFJLEVBQUUsSUFBSTs7Ozt3QkFFZixHQUFHLEdBQUcsRUFBQyxJQUFJLEVBQUUsTUFBQSxJQUFJLENBQUMsQ0FBQyxDQUFDLG1DQUFJLHdCQUF3QixFQUFDLENBQUE7d0JBRXZELElBQUksQ0FBQyxRQUFRLENBQUM7NEJBQ1osS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUM7NEJBQ2QsR0FBRyxLQUFBOzRCQUNILE9BQU8sRUFBRTtnQ0FDUCxjQUFjLEVBQUUsV0FBVzs2QkFDNUI7NEJBQ0QsSUFBSSxF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