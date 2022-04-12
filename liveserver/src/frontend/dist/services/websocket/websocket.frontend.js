//Joshua Brewster, Garrett Flynn   -   GNU Affero GPL V3.0 License
//import { streamUtils } from "./streamSession";
import { __awaiter, __extends, __generator } from "tslib";
import { SubscriptionService } from '../../router/SubscriptionService';
import { safeStringify } from '../../common/parse.utils';
import { settings } from '../../server_settings';
var WebsocketService = /** @class */ (function (_super) {
    __extends(WebsocketService, _super);
    function WebsocketService(router, subprotocols, url) {
        if (subprotocols === void 0) { subprotocols = {}; }
        var _this = _super.call(this, router) || this;
        _this.name = 'websocket';
        _this.service = 'websocket';
        _this.connected = false;
        _this.sendQueue = {};
        _this.sockets = new Map();
        _this.queue = {};
        _this.origin = "client".concat(Math.floor(Math.random() * 10000000000000)); //randomid you can use
        //creates a url to be posted to the socket backend for parsing, mainly user info
        _this.encodeForSubprotocol = function (dict) {
            var subprotocol = [];
            if (dict._id) {
                dict.id = dict._id;
                delete dict._id;
            }
            Object.keys(dict).forEach(function (str) { return subprotocol.push("brainsatplay.com/".concat(str, "/").concat(dict[str], "?arr=") + Array.isArray(dict[str])); });
            var res = encodeURIComponent(subprotocol.join(';'));
            return res || undefined;
        };
        _this.add = function (user, endpoint) { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.addSocket(endpoint, user)];
            });
        }); };
        // //add a callback to a worker
        // async addFunction(functionName,fstring,origin,id,callback=(result)=>{}) {
        //     if(functionName && fstring) {
        //         if(typeof fstring === 'function') fstring = fstring.toString();
        //         let dict = {route:'addfunc',message:[functionName,fstring], id:origin}; //post to the specific worker
        //         if(!id) {
        //             this.sockets.forEach((s) => {this.send(dict,{id: s.id});});
        //             return true;
        //         } //post to all of the workers
        //         else return await this.send(dict,{callback,id});
        //     }
        //   }
        // async run(functionName:string,args:[]|object=[],id:string,origin:string,callback=(result)=>{}) {
        //     if(functionName) {
        //         if(functionName === 'transferClassObject') {
        //           if(typeof args === 'object' && !Array.isArray(args)) {
        //             for(const prop in args) {
        //               if(typeof args[prop] === 'object' && !Array.isArray(args[prop])) args[prop] = args[prop].toString();
        //             }
        //           }
        //         }
        //         let dict = {route:functionName, message:args, id:origin};
        //         return await this.send(dict,{callback, id});
        //     }
        // }
        // runFunction = this.run;
        // //a way to set variables on a thread
        // async setValues(values={}, id, origin) {
        //     if(id)
        //         return await this.run('setValues',values,id,origin);
        //     else {
        //         this.sockets.forEach((s) => {
        //         this.run('setValues',values,s.id,origin);
        //         });
        //         return true;
        //     } 
        // }
        _this.send = function (message, options) {
            if (options === void 0) { options = {}; }
            return new Promise(function (resolve) {
                var resolver = function (res) {
                    if (options.callback)
                        options.callback(res);
                    resolve(res);
                };
                var callbackId = '' + Math.random(); //randomId()
                if (typeof message === 'object') {
                    if (Array.isArray(message))
                        message.splice(1, 0, callbackId); // add callbackId before arguments
                    else
                        message.callbackId = callbackId; // add callbackId key
                } // TODO: Handle string-encoded messsages
                _this.queue[callbackId] = { resolve: resolve, suppress: message.suppress };
                var socket;
                var remote = new URL(options.id);
                socket = _this.getSocket(remote);
                // message = JSON.stringifyWithCircularRefs(message)
                if (!socket)
                    return;
                var toSend = function () { return socket.send(safeStringify(message), resolver); };
                if (socket.readyState === socket.OPEN)
                    toSend();
                else {
                    if (!_this.sendQueue[remote.origin])
                        _this.sendQueue[remote.origin] = [];
                    _this.sendQueue[remote.origin].push(toSend);
                }
            });
        };
        _this.post = _this.send; //alias
        _this.onmessage = function (res) {
            var data;
            try {
                data = JSON.parse(res.data);
            }
            catch (_a) {
                data = res;
            }
            //this.streamUtils.processSocketMessage(res);
            var runResponses = function () {
                _this.responses.forEach(function (foo, i) {
                    foo(data);
                });
            };
            var callbackId = data.callbackId;
            if (callbackId) {
                delete data.callbackId;
                var item = _this.queue[callbackId];
                if (item === null || item === void 0 ? void 0 : item.resolve)
                    item.resolve(data); // Run callback
                if (!(item === null || item === void 0 ? void 0 : item.suppress))
                    runResponses();
                delete _this.queue[callbackId];
            }
            else {
                runResponses();
                _this.defaultCallback(data);
            }
            // State.data.serverResult = res;
            // UI.platform.receivedServerUpdate(res);
        };
        _this.defaultCallback = function (res) {
            // console.error('default',res)
        };
        _this.isOpen = function (remote) {
            var socket = _this.getSocket(remote);
            if (socket)
                return socket.readyState === 1;
            else
                return false;
        };
        _this.close = function (remote) {
            var socket = _this.getSocket(remote);
            if (socket)
                return socket.close();
            else
                return false;
        };
        _this.terminate = _this.close; //alias
        _this.subprotocols = subprotocols;
        if (url)
            _this.addSocket(url, subprotocols);
        return _this;
    }
    WebsocketService.prototype.addSocket = function (url, subprotocolObject) {
        if (url === void 0) { url = new URL("".concat(settings.protocol, "://").concat(settings.host, ":").concat(settings.port)); }
        if (subprotocolObject === void 0) { subprotocolObject = this.subprotocols; }
        var socket;
        if (!(url instanceof URL))
            url = new URL(url);
        var remote = url.origin;
        try {
            if (url.protocol === 'http:') {
                socket = new WebSocket('ws://' + url.host, // We're always using :80
                this.encodeForSubprotocol(subprotocolObject));
                //this.streamUtils = new streamUtils(auth,socket);
            }
            else if (url.protocol === 'https:') {
                socket = new WebSocket('wss://' + url.host, // We're always using :80
                this.encodeForSubprotocol(subprotocolObject));
                //this.streamUtils = new streamUtils(auth,socket);
            }
            else {
                console.log('invalid protocol');
                return undefined;
            }
            socket.onmessage = this.onmessage;
            this.sockets.set(remote, socket);
            return remote;
        }
        catch (err) {
            console.error('Error with socket creation!', err);
            return undefined;
        }
    };
    WebsocketService.prototype.getSocket = function (remote) {
        if (typeof remote === 'string')
            remote = new URL(remote);
        if (!remote)
            return this.sockets.values().next().value;
        return this.sockets.get(remote.origin);
    };
    WebsocketService.prototype.addCallback = function (name, callback) {
        if (name === void 0) { name = ''; }
        if (callback === void 0) { callback = function (args) { }; }
        if (name.length > 0 && !this.responses.has(name)) {
            this.responses.set(name, callback);
        }
        else
            return false;
    };
    WebsocketService.prototype.removeCallback = function (name) {
        if (name === void 0) { name = ''; }
        this.responses.delete(name);
    };
    WebsocketService.type = 'client';
    return WebsocketService;
}(SubscriptionService));
export default WebsocketService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid2Vic29ja2V0LmZyb250ZW5kLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vc2VydmljZXMvd2Vic29ja2V0L3dlYnNvY2tldC5mcm9udGVuZC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxrRUFBa0U7QUFDbEUsZ0RBQWdEOztBQUVoRCxPQUFPLEVBQUUsbUJBQW1CLEVBQUUsTUFBTSxrQ0FBa0MsQ0FBQTtBQUV0RSxPQUFPLEVBQUUsYUFBYSxFQUFFLE1BQU8sMEJBQTBCLENBQUM7QUFFMUQsT0FBTyxFQUFDLFFBQVEsRUFBQyxNQUFNLHVCQUF1QixDQUFBO0FBRTlDO0lBQStCLG9DQUFtQjtJQWdCOUMsMEJBQ0ksTUFBTSxFQUNOLFlBQW1DLEVBQ25DLEdBQWU7UUFEZiw2QkFBQSxFQUFBLGlCQUFtQztRQUZ2QyxZQUtJLGtCQUFNLE1BQU0sQ0FBQyxTQUdoQjtRQXRCRCxVQUFJLEdBQUcsV0FBVyxDQUFBO1FBQ2xCLGFBQU8sR0FBRyxXQUFXLENBQUE7UUFJckIsZUFBUyxHQUFHLEtBQUssQ0FBQztRQUNsQixlQUFTLEdBQTZCLEVBQUUsQ0FBQTtRQUV4QyxhQUFPLEdBQW9CLElBQUksR0FBRyxFQUFFLENBQUM7UUFFckMsV0FBSyxHQUFHLEVBQUUsQ0FBQztRQUVYLFlBQU0sR0FBRyxnQkFBUyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsR0FBQyxjQUFjLENBQUMsQ0FBRSxDQUFDLENBQUMsc0JBQXNCO1FBWXBGLGdGQUFnRjtRQUNoRiwwQkFBb0IsR0FBRyxVQUFDLElBQUk7WUFDeEIsSUFBSSxXQUFXLEdBQUcsRUFBRSxDQUFBO1lBRXBCLElBQUcsSUFBSSxDQUFDLEdBQUcsRUFBRTtnQkFDVCxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUE7Z0JBQ2xCLE9BQU8sSUFBSSxDQUFDLEdBQUcsQ0FBQTthQUNsQjtZQUVELE1BQU0sQ0FBQyxJQUFJLENBQUMs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