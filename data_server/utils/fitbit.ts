import { RouteConfig } from "../../liveserver/src/common/general.types";
import Router from "../../liveserver/src/router/Router";
import StructService from "../../liveserver/src/services/database/structs.service";

export class FitbitAuth {
    access_token: string = '';
    expires_in: number = 0;
    refresh_token: string = '';
    /** Fitbit user id */
    user_id: string = '';
    
    scope?: string;
    token_type?: 'Bearer';
}

export type FitbitErr = {
    errors: {
        errorType: string;
        message: string;
    }[];
    success: false;
}

export type FitbitAuthResponse = FitbitAuth | FitbitErr;



//mongoose schema


//fetch api

export async function refreshFitbitToken(refreshToken: string) {

    if(!refreshToken) console.error('no refreshToken provided');

    if(!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_KEY|| !process.env.FRONTEND_URL)  console.error('NEED ENV KEYS: FITBIT_CLIENT_ID && FITBIT_KEY && FRONTEND_URL');

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        body: `grant_type=refresh_token&refresh_token=${refreshToken}`,
        headers: {
            'Content-Type': "application/x-www-form-urlencoded",
            "Authorization": `Basic ${process.env.FITBIT_KEY}`
        },
    });

    return (await response.json()) as FitbitAuthResponse;
}

export async function authorizeFitbit(code: string) {

    if(!code) console.error('no code provided');

    if(!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_KEY|| !process.env.FRONTEND_URL)  console.error('NEED ENV KEYS: FITBIT_CLIENT_ID && FITBIT_KEY && FRONTEND_URL');

    const response = await fetch('https://api.fitbit.com/oauth2/token', {
        method: 'POST',
        body: `client_id=${process.env.FITBIT_CLIENT_ID}&grant_type=authorization_code&redirect_uri=${process.env.FRONTEND_URL}&code=${code}`,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${process.env.FITBIT_KEY}`
        }
    });

    return (await response.json()) as FitbitAuthResponse;
}

export async function revokeFitbitAuth(accessToken: string) {

    if(!accessToken) console.error('no accessToken provided');

    if(!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_KEY|| !process.env.FRONTEND_URL)  console.error('NEED ENV KEYS: FITBIT_CLIENT_ID && FITBIT_KEY && FRONTEND_URL');

    const response = await fetch('https://api.fitbit.com/oauth2/revoke', {
        method: 'POST',
        body: "token=" + accessToken,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${process.env.FITBIT_KEY}`
        }
    });

    const data = await response.json();

    if (data.errors)
        return data as FitbitErr;
    else 
        return true;
}

export async function checkFitbitToken(accessToken: string) {

    if(!process.env.FITBIT_CLIENT_ID || !process.env.FITBIT_KEY|| !process.env.FRONTEND_URL)  console.error('NEED ENV KEYS: FITBIT_CLIENT_ID && FITBIT_KEY && FRONTEND_URL');

    const response = await fetch('https://api.fitbit.com/1.1/oauth2/introspect', {
        method: 'POST',
        body: "token=" + accessToken,
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": `Basic ${process.env.FITBIT_KEY}`
        }
    });

    // console.log('CHECK', response)

    
    return (await response.json()) as (FitbitErr | {
        active: true;
        scope: string;
        client_id: string;
        user_id: string;
        token_type: string;
        exp: number;
        iat: number;
    } | {
        active: false;
    });
}




//fitbit router
export function setupFitbitRoutes(structservice:StructService) {
    let router = structservice.router as Router;
    
    let config1:RouteConfig = {
        service:'fitbit',
        route:'refresh', 
        post:async (self,args,origin) => {
            let user = self.USERS[origin];

            //should pull from a secure server or keep a decryption key separate
            let u = (await structservice.getMongoUser(user, args[0]) as any).user;

            if(!user) return undefined;

            let fbauth = u.data?.fitbit;

            if(!fbauth) {
                return undefined;
            } else {
                let res = await refreshFitbitToken(fbauth.refresh_token) as FitbitAuth|FitbitErr;
                if((res as FitbitErr).errors) { return res; }

                u.data.fitbit.access_token = (res as FitbitAuth).access_token;
                u.data.fitbit.expires_in = (res as FitbitAuth).expires_in;
                u.data.fitbit.refresh_token = (res as FitbitAuth).refresh_token;
                u.data.fitbit.expires_on = Date.now() + (((res as FitbitAuth).expires_in - 60) * 1000);

                let usr = await structservice.setMongoUser(user , u);

                return usr;
            }
            
        }
    }

    router.addRoute(config1);
    
    let config2:RouteConfig = {
        service:'fitbit',
        route:'authorize',
        post:async (self, args, origin) => {
            let user = self.USERS[origin];

            //should pull from a secure server or keep a decryption key separate
            let u = (await structservice.getMongoUser(user, args[0]) as any).user;

            if(!user) return undefined;

            let res = await authorizeFitbit(args[1]);

            if((res as FitbitErr).errors) { return res; }

            let fbauth = u.data?.fitbit;

            if(fbauth) delete u.data.fitbit;

            u.data.fitbit = new FitbitAuth();
            Object.assign(u.data.fitbit,{...res});

            let usr = await structservice.setMongoUser(user, u);

            console.log('set user', usr);

            return usr;
        }
    }

    router.addRoute(config2);

    let config3:RouteConfig = {
        service:'fitbit',
        route:'reject',
        post: async (self, args, origin) => {
            let user = self.USERS[origin];

            //should pull from a secure server or keep a decryption key separate
            let u = (await structservice.getMongoUser(user, args[0]) as any).user;

            if(!user) return undefined;

            let fbauth = u.data?.fitbit;

            if(fbauth) delete u.data.fitbit;

            let usr = await structservice.setMongoUser(user, u);

            if(usr) {
                let res = await revokeFitbitAuth(fbauth.access_token);

                if((res as FitbitErr).errors) { return res; }

            }

            return usr;
        }
    }

    router.addRoute(config3);

    let config4:RouteConfig = {
        service:'fitbit',
        route:'check-token',
        post: async (self, args, origin) => {
            let user = self.USERS[origin];

            //should pull from a secure server or keep a decryption key separate
            let u = (await structservice.getMongoUser(user, args[0]) as any).user;

            if(!user) return undefined;

            let fbauth = u.data?.fitbit;

            let res = await checkFitbitToken(fbauth.access_token);

            return res;
        }

    }

    router.addRoute(config4);
    // app.post('/authorize', async (req:Request, res:Response) => {

    // });
    // app.post('/revoke/:userId', async (req:Request, res:Response) => {

    // });
    // app.post('/check-tokens', async (req:Request, res:Response) => {

    // });
}


//setup POST responses