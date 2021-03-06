

//Initialize the Google API
import 'src/tools/scripts/init.gapi'


import { settings } from 'node_server/server_settings';
console.log("using data server URL: ",settings.dataserver);

import { login, onLogin } from 'src/tools/scripts/login';
import { restoreSession, state } from 'src/tools/scripts/state'
import { setupTestUser } from './tools/dev/test.user';
import { authorizeCode, refreshToken, setupFitbitApi } from './tools/scripts/fitbit';
import { getDictFromUrlParams } from './tools/scripts/utils';
import { ProfileStruct } from 'brainsatplay-data/dist/src/types';

state.subscribe('route', (route:string) => {
    window.history.replaceState(undefined, route, location.origin + route); //uhh
});
  
//initial login check, grabs the realm login token if a refresh token exists and applies it

//grab url redirect codes
let params = getDictFromUrlParams();



//get fitbit api ready for querying
async function initThirdPartyAPIs(u:Partial<ProfileStruct>) {
    //in this case we attach the current user to the fitbit code
    if (params.code && params.state && (params.state?.search('is_fitbit=true') > -1)) {
      let res = await authorizeCode(u?._id as string, params.code);
      if(res.errors || res.html) alert('Fitbit failed to authorize');
      else alert('Fitbit authorized!');
  }
  
  //if we have an access token let's setup the fitbit api
  if((u?.data as any)?.fitbit?.access_token) {
    
    if(((u as ProfileStruct).data as any).fitbit.expires_on < Date.now()) {
      u = await refreshToken((u as ProfileStruct)._id as string);
    }
    
    let api = setupFitbitApi(((u as ProfileStruct).data as any).fitbit.access_token, ((u as ProfileStruct).data as any).fitbit.user_id)
    console.log('fitbit api:', api);
  }
}




const TESTUSER = true;

//spaghetti tests
if(TESTUSER) {
  setupTestUser().then(async (u) => {
    console.log('test user:',u);
    if(u) {
      
      state.setState({viewingId: u?._id});

      initThirdPartyAPIs(u);

      await restoreSession(u);

    }
  });

}
else {

  login().then(
    async (result) => {
      let u = await onLogin(result);

      if(u) {
        state.setState({viewingId: u?._id});
      
        //in this case we attach the logged in user to the fitbit code
        
        initThirdPartyAPIs(u);
        
        await restoreSession(u);
      }
    }
  );
}
  