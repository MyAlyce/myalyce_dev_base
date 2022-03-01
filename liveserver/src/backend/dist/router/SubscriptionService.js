import { __awaiter, __extends, __generator } from "tslib";
import { Service } from './Service';
import { getRouteMatches } from "../common/general.utils";
// Browser and Node-Compatible Service Class
var SubscriptionService = /** @class */ (function (_super) {
    __extends(SubscriptionService, _super);
    function SubscriptionService(router) {
        var _this = _super.call(this, router) || this;
        _this.responses = new Map();
        _this.serviceType = 'subscription';
        // Message Handler
        _this.subscribers = new Map();
        _this.updateSubscribers = function (self, o) {
            _this.subscribers.forEach(function (u) {
                var possibilities = getRouteMatches(o.route, false);
                possibilities.forEach(function (route) {
                    if (u.routes[route]) {
                        // Allow subscribers that aren't logged in
                        // u = self.USERS[u.id]
                        if (u === null || u === void 0 ? void 0 : u.send) {
                            u.send(self.format(o));
                        }
                    }
                });
            });
        };
        _this.add = function (user, endpoint) {
            throw 'Add not implemented';
        };
        _this.addResponse = function (name, f) {
            _this.responses.set(name, f);
        };
        _this.removeResponse = function (name) {
            if (name)
                _this.responses.delete(name);
            else
                _this.responses = new Map();
        };
        _this.send = function (o, options) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw 'Send not implemented';
            });
        }); };
        return _this;
    }
    return SubscriptionService;
}(Service));
export { SubscriptionService };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3Vic2NyaXB0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3JvdXRlci9TdWJzY3JpcHRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBRW5DLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRCw0Q0FBNEM7QUFDNUM7SUFBeUMsdUNBQU87SUE0QjVDLDZCQUFZLE1BQU07UUFBbEIsWUFDSSxrQkFBTSxNQUFNLENBQUMsU0FDaEI7UUF6QkQsZUFBUyxHQUEyQixJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQzdDLGlCQUFXLEdBQW1CLGNBQWMsQ0FBQTtRQUU1QyxrQkFBa0I7UUFDbEIsaUJBQVcsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUN6Qyx1QkFBaUIsR0FBK0MsVUFBQyxJQUFJLEVBQUUsQ0FBQztZQUVwRSxLQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUM7Z0JBQ3RCLElBQUksYUFBYSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUNuRCxhQUFhLENBQUMsT0FBTyxDQUFDLFVBQUEsS0FBSztvQkFDdkIsSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxFQUFFO3dCQUNqQiwwQ0FBMEM7d0JBQzFDLHVCQUF1Qjt3QkFFdkIsSUFBSSxDQUFDLGFBQUQsQ0FBQyx1QkFBRCxDQUFDLENBQUUsSUFBSSxFQUFFOzRCQUNULENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBO3lCQUN6QjtxQkFDSjtnQkFDTCxDQUFDLENBQUMsQ0FBQTtZQUNOLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFBO1FBT0QsU0FBRyxHQUFHLFVBQUMsSUFBd0IsRUFBRSxRQUFlO1lBQzVDLE1BQU0scUJBQXFCLENBQUE7UUFDL0IsQ0FBQyxDQUFBO1FBRUQsaUJBQVcsR0FBRyxVQUFDLElBQUksRUFBRSxDQUFDO1lBQ2xCLEtBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMvQixDQUFDLENBQUE7UUFFRCxvQkFBYyxHQUFHLFVBQUMsSUFBSTtZQUNsQixJQUFJLElBQUk7Z0JBQUUsS0FBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUE7O2dCQUNoQyxLQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxFQUFFLENBQUE7UUFDbkMsQ0FBQyxDQUFBO1FBRUQsVUFBSSxHQUFHLFVBQU8sQ0FBZSxFQUFFLE9BQWE7O2dCQUN4QyxNQUFNLHNCQUFzQixDQUFBOzthQUMvQixDQUFBOztJQWpCRCxDQUFDO0lBa0JMLDBCQUFDO0FBQUQsQ0FBQyxBQWhERCxDQUF5QyxPQUFPLEdBZ0QvQyJ9