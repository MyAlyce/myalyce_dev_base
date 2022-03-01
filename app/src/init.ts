import 'src/tools/scripts/init.gapi'


import { settings } from 'node_server/server_settings';

//alert('initializing app');

console.log("using data server URL: ",settings.dataserver);

import { login, onLogin } from 'src/tools/scripts/login';
import {restoreSession, state} from 'src/tools/scripts/state'
import { setupTestUser } from './tools/scripts/dev/test.user';

state.subscribe('route', (route:string) => {
    history.replaceState(undefined, route, location.origin + route); //uhh
});
  
//initial login check, grabs the realm login token if a refresh token exists and applies it


const TESTUSER = true;


if(TESTUSER) {
  setupTestUser().then(async (u) => {
    console.log(u);
    await restoreSession(u);
  });
}
else {

  login().then(
    async (result) => {
      let u = await onLogin(result)
      //if(u) 
      await restoreSession(u);
    }
  );
}
  