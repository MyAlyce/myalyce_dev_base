//
//import { settings } from 'node_server/server_settings';
import StructRouter from 'src/../../liveserver/src/services/database/structs.router'
import HTTPService from 'src/../../liveserver/src/services/http/http.frontend'
import WebsocketService from 'src/../../liveserver/src/services/websocket/websocket.frontend'
export const client = new StructRouter(); //hook up the websockets and REST APIs to this router and do whatever init needed

// add optional services
const http = new HTTPService(client)
const websocket = new WebsocketService(client)

client.load(http, 'http')
client.load(websocket, 'websockets')

//connect to the liveserver endpoint

// client.connect({
//     target: settings.dataserver,
//     credentials: {},
//     type: 'websocket'
// }).subscribe((o:any) => {
//     console.log('Indirect message from socket', o)
// })

// //test command
// client.send('routes')
//       .then((res:any) => console.log('Routes',res))
//       .catch(console.error)
