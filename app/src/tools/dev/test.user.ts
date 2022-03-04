import { client } from "../scripts/client";
import { DS } from 'brainsatplay-data'
import { ProfileStruct } from "brainsatplay-data/dist/src/types";
import { settings } from 'node_server/server_settings';
import StructRouter from 'src/../../liveserver/src/services/database/structs.router'
import HTTPService from 'src/../../liveserver/src/services/http/http.frontend'

// Create Second Client
import WebsocketService from 'src/../../liveserver/src/services/websocket/websocket.frontend'
export let client2 = new StructRouter(); //hook up the websockets and REST APIs to this router and do whatever init needed
const http = new HTTPService(client2);
const websocket = new WebsocketService(client2);

client2.load(http, 'http')
client2.load(websocket, 'websockets')


// console.log(DS)
//import { randomId } from '../utils';

//dummy profile
export const testuser:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'test1',//randomId('test'),
        email:'test@myalyce.com',
        username:'testuser',
        firstName:'Howard',
        lastName:'Dent',
        sex:'m',
        birthday:'09/10/1993'
})// as ProfileStruct;

//setup the live user

export async function setupTestUser() {

    let endpoint = client.connect({
        target: settings.dataserver,
        credentials: testuser,
        type: 'websocket'
    });

    endpoint.subscribe((o:any) => {
        console.log('Indirect message from socket', o)
    })

    console.log(endpoint);
    
    //test command
    console.log('Sending /routes from Client 1')
    await client.send('routes')
          .then((res:any) => console.log('Routes (Client 1)',res))
          .catch(console.error)
    

    // console.log('setting up')
    // let res = await client.login(undefined,testuser);
    // console.log('login res', res);
    
    console.log('setting up client')
    //let loggedin = await client.login(endpoint, testuser);
    //console.log('loggedin (Client 1)', loggedin);
    return client.setupUser(testuser);
}


//second user test for two way communications testing
export const testpeer:ProfileStruct = DS.ProfileStruct(
    'test',
    {
        _id:'test2',//randomId('test'),
        email:'testpeer@myalyce.com',
        username:'testpeer',
        firstName:'The',
        lastName:'Batman',
        sex:'m',
        birthday:'01/19/1483'
})// as ProfileStruct;


export async function setupTestPeer() {

    let endpoint = client2.connect({
        target: settings.dataserver,
        credentials: testpeer,
        type: 'websocket'
    })
    
    endpoint.subscribe((o:any) => {
        console.log('Indirect message from socket', o)
    })

    //test command
    console.log('Sending /routes from Client 2')
    client2.send('routes')
        .then((res:any) => console.log('Routes (Client 2)',res))
        .catch(console.error)

    console.log('setting up client')
    //let loggedin = await client2.login(endpoint, testpeer);
    //console.log('loggedin (Client 2)', loggedin);

    return client2.setupUser(testpeer);
}

