import { FitbitApi } from "@giveback007/fitbit-api";
import { DS } from "brainsatplay-data";
import { DataStruct, ProfileStruct } from "brainsatplay-data/dist/src/types";
import { settings } from "node_server/server_settings";
import { client } from "./client";
import { parseISOString } from "./utils";
//import { client } from "./client";

export function setupFitbitApi(accesstoken:string, fitbitId:string, syncRate:number=5*60*1000, parentUser?:Partial<ProfileStruct>) {
    //provide fitbit key

    let api = new FitbitApi(
        accesstoken as string,
        fitbitId as string
    );

    console.log(api);

    //backup heartrate
    //api.heartRate
    
    //backup nutrition
    //api.nutrition

    //backup sleep
    //api.sleep

    //backup body
    //api.body

    //backup activity
    //api.activity

    //backup body
    //api.body

    // DS.DataStruct(
    //     'fitbit',
    //     {permissions:{synced:Date.now(), syncRate, ...permissions}},
    //     parentUser
    // );

    console.log('get lifetime stats',api.activity.getLifetimeStats());

    backupFitbit(api);

    return api;

}

export async function backupFitbit(api:FitbitApi) {
    let sleep = await api.sleep.getByDateRange({startDate:Date.now()-1000*60*60*24*100, endDate:Date.now()})

    console.log(sleep);
}


//client.tablet.setSort()


//REST authorizations to get the refresh token
//opens the fitbit authorization portal to authorize our app for this client. We then can get the refresh token 
export async function authorizeRedirect() {
    const appRedirect = "https://app.myalyce.com"; // DON'T TOUCH. fitbit wont authorize on 'localhost'.
    const clientId = '22C7QK';
    const scope = [ "activity", "heartrate", "location", "nutrition", "profile", "settings", "sleep", "social", "weight"] as const;
    let reState = `is_fitbit=true,path=${window.location.pathname}`; //let the site know where to redirect back to

    if (window.location.hostname === 'localhost') {
        const { hostname, port } = window.location;
        reState = reState + `,localhost_redirect=${hostname}:${port}`;
    }

    // TODO: https://dev.fitbit.com/build/reference/web-api/oauth2/#redirect-uris
    // state: Fitbit strongly recommend including an anti-forgery token in this parameter and confirming its value in the redirect
    // 1. Make server request -> server returns obj id it generates for "preFitBitAuthObj: { realmId, _id, time: Date.now() }"
    // 2. redirect with state=re_fitbit_auth
    // 3. fitbitTokenApi.authorizeCode({ code, realmId, preAuthId });
    // 4. server validates that (preAuthId === preFitBitAuthObj._id) => send fitbit_auth_token

    const redirectUrl = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${appRedirect}&scope=${scope.join('%20')}&expires_in=604800&${reState ? 'state=' + reState : ''}`;
    
    //listen for the url to change back

    window.location.replace(redirectUrl);
    //will return with the new refresh code
}

export async function authorizeCode(userId:string, fitbitCode: string) {

    if(!userId || !fitbitCode) return undefined;

    let res = (await client.send('fitbit/authorize',userId,fitbitCode))[0];  
    
    console.log(res);

    if(res && !res.errors && !res.html) client.baseServerCallback(res);

    return res;
}

export async function refreshToken(userId:string) {

    if(!userId) return undefined;

    let res = (await client.send('fitbit/refresh',userId))[0];

    if(res && !res.errors && !res.html) client.baseServerCallback(res);

    return res;
}

export async function revokeAuth(userId:string) {

    if(!userId) return undefined;

    let res = (await client.send('fitbit/revoke',userId))[0];

    if(res && !res.errors && !res.html) client.baseServerCallback(res);

    return res;
}

export async function checkToken(userId:string) {

    if(!userId) return undefined;

    return (await client.send('fitbit/check-token',userId))[0]; 
}


//take a sleep data array returned from the fitbit api and process it into struct data, including event structs for each sleep interval and a time series data struct with abbreviated information for time series display
export async function fitbitSleepToStructs(sleepData:[], parentUser:Partial<ProfileStruct>) {
    //create an event struct for each sleep interval
    let structs = [];

    //append a time series struct with the base sleep data. 
    //this struct we can pull the whole thing but larger time series e.g. heart rate we should push directly to mongo and only slice data as we need to view it. 
    let timeseries = (await client.query('data',{ownerId:parentUser._id, tag:'sleep'},true))[0];

    if(!timeseries) {
        timeseries = DS.DataStruct(
            'sleep',
            {data:[DS.Data('sleep',{} as any)]},
            parentUser
        ) as DataStruct;
    }
    
    sleepData.forEach((data:any) => {
        data.source = 'fitbit'; 

        let timestamp = parseISOString(data.endTime).getUTCMilliseconds();

        let event = DS.EventStruct('sleep',{data, timestamp},parentUser);

        timeseries.data[0][timestamp] = {
            startTime:data.startTime,
            endTime:data.endTime,
            awake:data.minutesAwake, //min
            asleep:data.minutesAsleep //min
        }

        structs.push(event);

    });

    structs.push(timeseries);

    return await client.setData(structs); //update data
}

export function fitbitHeartrateToStructs(hr, parentUser:Partial<ProfileStruct>) {

}

export function fitbitLogsToStructs(logs, parentUser:Partial<ProfileStruct>) {

}

export function fitbitNutritionToStructs(logs, parentUser:Partial<ProfileStruct>) {
    
}

export function fitbitBodyToStructs(logs, parentUser:Partial<ProfileStruct>) {
    
}


//setup the access 