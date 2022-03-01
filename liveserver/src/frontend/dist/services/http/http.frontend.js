import { __extends } from "tslib";
import { SubscriptionService } from "../../router/SubscriptionService";
import { createRoute } from "../../common/general.utils";
var HTTPService = /** @class */ (function (_super) {
    __extends(HTTPService, _super);
    function HTTPService(router) {
        var _this = _super.call(this, router) || this;
        _this.name = 'http';
        _this.service = 'http';
        _this.add = function (user, endpoint) {
            return new Promise(function (resolve) {
                _this.connection = new EventSource(createRoute('', endpoint));
                _this.connection.onopen = function () {
                    _this.connection.onmessage = function (event) {
                        var data = JSON.parse(event.data);
                        if (data.route === 'events/subscribe')
                            resolve(data.message[0]); // Ensure IDs are Linked
                        _this.responses.forEach(function (f) { return f(data); }); // Always trigger responses
                    };
                };
            });
        };
        return _this;
    }
    HTTPService.type = 'client';
    return HTTPService;
}(SubscriptionService));
// let http = new HTTPClient()
// Export Instantiated Session
export default HTTPService;
// export default http
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaHR0cC5mcm9udGVuZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL3NlcnZpY2VzL2h0dHAvaHR0cC5mcm9udGVuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsT0FBTyxFQUFFLG1CQUFtQixFQUFFLE1BQU0sa0NBQWtDLENBQUM7QUFDdkUsT0FBTyxFQUFFLFdBQVcsRUFBRSxNQUFNLDRCQUE0QixDQUFDO0FBRXpEO0lBQTBCLCtCQUFtQjtJQU16QyxxQkFBWSxNQUFNO1FBQWxCLFlBQ0ksa0JBQU0sTUFBTSxDQUFDLFNBQ2hCO1FBTkQsVUFBSSxHQUFHLE1BQU0sQ0FBQTtRQUNiLGFBQU8sR0FBRyxNQUFNLENBQUE7UUFPaEIsU0FBRyxHQUFHLFVBQUMsSUFBSSxFQUFFLFFBQVE7WUFDakIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFBLE9BQU87Z0JBRXRCLEtBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxXQUFXLENBQUMsV0FBVyxDQUFDLEVBQUUsRUFBQyxRQUFRLENBQUMsQ0FBQyxDQUFBO2dCQUMzRCxLQUFJLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRztvQkFDckIsS0FBSSxDQUFDLFVBQVUsQ0FBQyxTQUFTLEdBQUcsVUFBQyxLQUFLO3dCQUNsQyxJQUFJLElBQUksR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQTt3QkFFakMsSUFBSSxJQUFJLENBQUMsS0FBSyxLQUFLLGtCQUFrQjs0QkFBRSxPQUFPLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFBLENBQUMsd0JBQXdCO3dCQUN4RixLQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxVQUFBLENBQUMsSUFBSSxPQUFBLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBUCxDQUFPLENBQUMsQ0FBQSxDQUFDLDJCQUEyQjtvQkFDcEUsQ0FBQyxDQUFBO2dCQUNMLENBQUMsQ0FBQTtZQUNMLENBQUMsQ0FBQyxDQUFBO1FBQ04sQ0FBQyxDQUFBOztJQWZHLENBQUM7SUFKTSxnQkFBSSxHQUFHLFFBQVEsQ0FBQTtJQXFCMUIsa0JBQUM7Q0FBQSxBQXpCRCxDQUEwQixtQkFBbUIsR0F5QjVDO0FBR0QsOEJBQThCO0FBRTlCLDhCQUE4QjtBQUM5QixlQUFlLFdBQVcsQ0FBQTtBQUMxQixzQkFBc0IifQ==