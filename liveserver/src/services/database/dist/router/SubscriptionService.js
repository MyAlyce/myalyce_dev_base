import { __awaiter } from "tslib";
import { Service } from './Service';
import { getRouteMatches } from "../common/general.utils";
// Browser and Node-Compatible Service Class
export class SubscriptionService extends Service {
    constructor(router) {
        super(router);
        this.responses = new Map();
        this.serviceType = 'subscription';
        // Message Handler
        this.subscribers = new Map();
        this.updateSubscribers = (self, o) => {
            this.subscribers.forEach(u => {
                let possibilities = getRouteMatches(o.route, false);
                possibilities.forEach(route => {
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
        this.add = (user, endpoint) => {
            throw 'Add not implemented';
        };
        this.addResponse = (name, f) => {
            this.responses.set(name, f);
        };
        this.removeResponse = (name) => {
            if (name)
                this.responses.delete(name);
            else
                this.responses = new Map();
        };
        this.send = (o, options) => __awaiter(this, void 0, void 0, function* () {
            throw 'Send not implemented';
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3Vic2NyaXB0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3JvdXRlci9TdWJzY3JpcHRpb25TZXJ2aWNlLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFDQSxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sV0FBVyxDQUFBO0FBRW5DLE9BQU8sRUFBRSxlQUFlLEVBQUUsTUFBTSx5QkFBeUIsQ0FBQztBQUUxRCw0Q0FBNEM7QUFDNUMsTUFBTSxPQUFPLG1CQUFvQixTQUFRLE9BQU87SUE0QjVDLFlBQVksTUFBTTtRQUNkLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQTtRQXhCakIsY0FBUyxHQUEyQixJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQzdDLGdCQUFXLEdBQW1CLGNBQWMsQ0FBQTtRQUU1QyxrQkFBa0I7UUFDbEIsZ0JBQVcsR0FBcUIsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUN6QyxzQkFBaUIsR0FBK0MsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLEVBQUU7WUFFeEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksYUFBYSxHQUFHLGVBQWUsQ0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFBO2dCQUNuRCxhQUFhLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxFQUFFO29CQUMxQixJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEVBQUU7d0JBQ2pCLDBDQUEwQzt3QkFDMUMsdUJBQXVCO3dCQUV2QixJQUFJLENBQUMsYUFBRCxDQUFDLHVCQUFELENBQUMsQ0FBRSxJQUFJLEVBQUU7NEJBQ1QsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7eUJBQ3pCO3FCQUNKO2dCQUNMLENBQUMsQ0FBQyxDQUFBO1lBQ04sQ0FBQyxDQUFDLENBQUE7UUFDTixDQUFDLENBQUE7UUFPRCxRQUFHLEdBQUcsQ0FBQyxJQUF3QixFQUFFLFFBQWUsRUFBZSxFQUFFO1lBQzdELE1BQU0scUJBQXFCLENBQUE7UUFDL0IsQ0FBQyxDQUFBO1FBRUQsZ0JBQVcsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUN0QixJQUFJLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUE7UUFDL0IsQ0FBQyxDQUFBO1FBRUQsbUJBQWMsR0FBRyxDQUFDLElBQUksRUFBRSxFQUFFO1lBQ3RCLElBQUksSUFBSTtnQkFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQTs7Z0JBQ2hDLElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQTtRQUNuQyxDQUFDLENBQUE7UUFFRCxTQUFJLEdBQUcsQ0FBTyxDQUFlLEVBQUUsT0FBYSxFQUFlLEVBQUU7WUFDekQsTUFBTSxzQkFBc0IsQ0FBQTtRQUNoQyxDQUFDLENBQUEsQ0FBQTtJQWpCRCxDQUFDO0NBa0JKIn0=