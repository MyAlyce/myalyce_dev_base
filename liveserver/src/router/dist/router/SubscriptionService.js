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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU3Vic2NyaXB0aW9uU2VydmljZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL1N1YnNjcmlwdGlvblNlcnZpY2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUNBLE9BQU8sRUFBRSxPQUFPLEVBQUUsTUFBTSxXQUFXLENBQUE7QUFFbkMsT0FBTyxFQUFFLGVBQWUsRUFBRSxNQUFNLHlCQUF5QixDQUFDO0FBRTFELDRDQUE0QztBQUM1QyxNQUFNLE9BQU8sbUJBQW9CLFNBQVEsT0FBTztJQTRCNUMsWUFBWSxNQUFNO1FBQ2QsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFBO1FBeEJqQixjQUFTLEdBQTJCLElBQUksR0FBRyxFQUFFLENBQUE7UUFDN0MsZ0JBQVcsR0FBbUIsY0FBYyxDQUFBO1FBRTVDLGtCQUFrQjtRQUNsQixnQkFBVyxHQUFxQixJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQ3pDLHNCQUFpQixHQUErQyxDQUFDLElBQUksRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUV4RSxJQUFJLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsRUFBRTtnQkFDekIsSUFBSSxhQUFhLEdBQUcsZUFBZSxDQUFDLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUE7Z0JBQ25ELGFBQWEsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUU7b0JBQzFCLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRTt3QkFDakIsMENBQTBDO3dCQUMxQyx1QkFBdUI7d0JBRXZCLElBQUksQ0FBQyxhQUFELENBQUMsdUJBQUQsQ0FBQyxDQUFFLElBQUksRUFBRTs0QkFDVCxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQTt5QkFDekI7cUJBQ0o7Z0JBQ0wsQ0FBQyxDQUFDLENBQUE7WUFDTixDQUFDLENBQUMsQ0FBQTtRQUNOLENBQUMsQ0FBQTtRQU9ELFFBQUcsR0FBRyxDQUFDLElBQXdCLEVBQUUsUUFBZSxFQUFlLEVBQUU7WUFDN0QsTUFBTSxxQkFBcUIsQ0FBQTtRQUMvQixDQUFDLENBQUE7UUFFRCxnQkFBVyxHQUFHLENBQUMsSUFBSSxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQ3RCLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQTtRQUMvQixDQUFDLENBQUE7UUFFRCxtQkFBYyxHQUFHLENBQUMsSUFBSSxFQUFFLEVBQUU7WUFDdEIsSUFBSSxJQUFJO2dCQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFBOztnQkFDaEMsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFBO1FBQ25DLENBQUMsQ0FBQTtRQUVELFNBQUksR0FBRyxDQUFPLENBQWUsRUFBRSxPQUFhLEVBQWUsRUFBRTtZQUN6RCxNQUFNLHNCQUFzQixDQUFBO1FBQ2hDLENBQUMsQ0FBQSxDQUFBO0lBakJELENBQUM7Q0FrQkoifQ==