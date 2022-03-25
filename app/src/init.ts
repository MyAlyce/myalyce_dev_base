import 'src/tools/scripts/init.gapi'


import { settings } from 'node_server/server_settings';

//alert('initializing app');

console.log("using data server URL: ",settings.dataserver);

import { login, onLogin } from 'src/tools/scripts/login';
import { restoreSession, state } from 'src/tools/scripts/state'
import { setupTestUser } from './tools/dev/test.user';
import { authorizeCode, setupFitbitApi } from './tools/scripts/fitbit';
import { getDictFromUrlParams } from './tools/scripts/utils';
import { ProfileStruct } from 'brainsatplay-data/dist/src/types';

state.subscribe('route', (route:string) => {
    window.history.replaceState(undefined, route, location.origin + route); //uhh
});
  
//initial login check, grabs the realm login token if a refresh token exists and applies it

//check for fitbit response
let params = getDictFromUrlParams();



const TESTUSER = true;


if(TESTUSER) {
  setupTestUser().then(async (u) => {
    console.log(u);
    if(u) state.setState({viewingId: u?._id});

    //in this case we attach the current user to the fitbit code
    if (params.code && params.state && (params.state?.search('is_fitbit=true') > -1)) {
        let res = await authorizeCode(u?._id as string, params.code);
        if(res.errors) alert('Fitbit failed to authorize');
        else alert('Fitbit authorized!');
    }
    
    if((u?.data as any).fitbit?.access_token) {
      let api = setupFitbitApi(((u as ProfileStruct).data as any).fitbit.access_token)
      console.log('fitbit api:', api);
    }

    await restoreSession(u);
  });

}
else {

  login().then(
    async (result) => {
      let u = await onLogin(result);
      if(u) state.setState({viewingId: u?._id});
      
    //in this case we attach the logged in user to the fitbit code
      if (params.code && params.state && (params.state?.search('is_fitbit=true') > -1)) {
        await authorizeCode(u?._id as string, params.code);
        if(res.errors) alert('Fitbit failed to authorize');
        else alert('Fitbit authorized!');
      }

      await restoreSession(u);
    }
  );
}
  