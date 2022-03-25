import { FitbitApi } from "@giveback007/fitbit-api";
import { DS } from "brainsatplay-data";
import { ProfileStruct } from "brainsatplay-data/dist/src/types";
import { settings } from "node_server/server_settings";
import { client } from "./client";
//import { client } from "./client";

export function setupFitbitApi(accesstoken?:string, permissions?:{}, syncRate:number=5*60*1000, parentUser?:Partial<ProfileStruct>) {
    //provide fitbit key

    let api = new FitbitApi(
        accesstoken as string,
        '96SQSV'
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

    
    return api;

}

export function backupFitbit(api:FitbitApi, permissions={}) {

}


//client.tablet.setSort()


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

    let res = await client.send('fitbit/authorize',[userId,fitbitCode]);  

    if(res) client.baseServerCallback(res);

    return res;
}

export async function refreshToken(userId:string) {

    if(!userId) return undefined;

    let res = await client.send('fitbit/refresh',[userId]);

    if(res) client.baseServerCallback(res);

    return res;
}

export async function revokeAuth(userId:string) {

    if(!userId) return undefined;

    let res = await client.send('fitbit/revoke',[userId]);

    if(res) client.baseServerCallback(res);

    return res;
}

export async function checkToken(userId:string) {

    if(!userId) return undefined;

    return await client.send('fitbit/check-token',[userId]); 
}

//REST authorizations to get the refresh token
