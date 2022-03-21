# Map of our software hierarchy.

## Goals of the app, in engineering terms.

This app demonstrates a full stack server and frontend for handling persistent user communications and data streaming. It uses a fast and minimal esbuild configuration with PWA capability. It is easily configured for native applications as well.

## Breakdowns

- [Peers](./peers.md)
- [Structs]('./structs.md')
    - [Examples](./examples/)
- [Components]('./components/')

## Principle Folders

### [App](../../app)
- frontend logic

### [Data Server](../../data_server)
- backend logic, mainly instantiates liveserver

### [Liveserver](../../liveserver)
- full stack data and function routing system for general web usage and high performance needs.


