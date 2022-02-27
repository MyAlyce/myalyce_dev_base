## MyAlyce app base -- preconfigured monorepo for testing separated app and data servers, with the liveserver source for debugging.

### Build and run

The package.json in this root is configured for you. The liveserver includes the dist so nothing needs to be installed and built. 

Install yarn for best results. `npm i -g yarn`

From this root folder:

Get the app and data server packages:
- `npm run ydev`

Get all of the packages including for liveserver (only if you need to rebuild the dist).
- `npm run yarnall`

Start:
- `npm start`

Build all liveserver dists in monorepo:
- `npm run bliveserver`

Build individual dists:
- `npm run bdatabase`
- `npm run bfrontend`
- `npm run bbackend`
- `npm run brouter`



Data server settings:
- see server_settings.js in data_server/
- be sure to update the 'dataserver' port set in app/node_server/server_settings.js so frontend knows where it is.

App server settings:
- See app/node_server/server_settings.js
