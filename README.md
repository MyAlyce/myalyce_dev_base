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

Install all liveserver packages in monorepo:
- `npm run yliveserver`
- cd to the individual repos (see package.json) and yarn otherwise to not install all monorepo dependencies

Build all liveserver dists in monorepo:
- `npm run bliveserver`

Build individual dists:
- `npm run bdatabase`
- `npm run bfrontend`
- `npm run bbackend`
- `npm run brouter`

Currently you need to rename node_modules in liveserver/ and liveserver/src to avoid esbuild errors in app/ and data_server/. We just need to add some kind of externals or ignore esbuild plugin but this repo is temporary for testing so it's not a huge priority.

Data server settings:
- see data_server/server_settings.js
- be sure to update the 'dataserver' port set in app/node_server/server_settings.js so frontend knows where it is.

App server settings:
- See app/node_server/server_settings.js




TODO:
- Finish testing/reworking liveserver repo with esbuild for consistency/speed
- Reintegrate datastreams-api
- Dynamic categorization for our data structs on the frontend with some ways to save preferences
- Frontend should be able to snap to data visualizations then roll back/forth in state, right now we can save each page/component state independently via browserfs and update it/restore it as needed
