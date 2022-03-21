## Functional Basis of the App

Liveserver has a key system for this app called StructRouter/StructService for managing persistent user data, sharing permissions, and notifications. This is a minimal system for managing user bases with some basic communications and security infrastructure where users can manage their own data on the server in relation to other users.

The StructService can run mongodb or an in-memory db with shallow mongodb parity (enough for our purposes, may later adopt minimongo). 

Structs simply our name for objects with some basic properties kept consistent across structs, and are outlined in [brainsatplay-data](https://github.com/brainsatplay/brainsatplay-data) with various tools for preparing structs for parsing and notifying on the frontend. The goal is to require as little syntax as possible to create frontend and backend data pipelines with a readable format.

Each struct is made up of some basic info then whatever else in JSON object format. We have prepared a number of structures based on our needs which are templated in the aforementioned library and continue to be added to. See [data examples here](./examples/DataExamples.md) and [user examples here](./examples/UserExamples.md)


