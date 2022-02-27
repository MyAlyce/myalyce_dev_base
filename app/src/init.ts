import { settings } from 'node_server/server_settings';

//alert('initializing app');

console.log("using data server URL: ",settings.dataserver);

import { login, onLogin } from 'src/scripts/login';
import {restoreSession, state} from 'src/scripts/state'

state.subscribe('route', (route:string) => {
    history.replaceState(undefined, route, location.origin + route); //uhh
})
  
  //initial login check, grabs the realm login information if it exists
login().then(async (result) => {
    if(result.type === 'FAIL') {
        //show login page 
        state.setState({
          isLoggedIn: false
        });
        //then wait for login
    } else {
      await onLogin(result);
      await restoreSession(); //pull the state out of memory to restore the session since we confirmed login 
      //console.log(client);
      //state.data.isLoggedIn is true, trigger the app to re-render (need to add logic)
    }
});
  