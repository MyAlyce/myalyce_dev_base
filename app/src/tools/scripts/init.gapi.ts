import {settings} from 'node_server/server_settings'

//gapi init
let gapiResolve: (val: () => gapi.auth2.GoogleAuth) => any;

const addGlobals = {
  log: console.log,
  // resolved only after it's initialized:
  gAuth: new Promise<() => gapi.auth2.GoogleAuth>((res) => gapiResolve = res),
}

Object.keys(addGlobals).forEach((key) => {
  (window as any)[key] = (addGlobals as any)[key];
});

(function initGapiAuth() {
  if (location.hostname === 'localhost' && location.port !== '4000') return;
  
  function onGapiLoad() {
    // https://developers.google.com/identity/sign-in/web/reference
    gapi.load('auth2', () => {
      const GoogleAuth = gapi.auth2.init({
        // for more config options:
        // https://developers.google.com/identity/sign-in/web/reference#gapiauth2clientconfig
        client_id: settings.googleclientid,
        scope: `https://www.googleapis.com/auth/drive`
      });
  
      GoogleAuth.then((gAuth) => {
        gapiResolve(() => gAuth);
      }, (err) => {
        console.log('UNHANDLED');
        console.error(err);
      });
    });
  }

  const script = document.createElement('script');
  script.type = "text/javascript";
  script.src = "https://apis.google.com/js/platform.js";
  script.onload = onGapiLoad;
  document.head.appendChild(script);
})();

