## Peers

The app is fundamentally based on the idea of Peer2Peer connectivity and data sharing, while still being scalable for private cloud servers, via MongoDB in our current case. This means users can act as their own databases via p2p webrtc servers, or centralized servers can be shared. 

As another layer, users cannot pull each other's data without correct authorizations. General 'peer' authorizations allow full access and editing control of your data by other users save for a few user-owned structs e.g. if you own a group, your peer cannot act as the owner. Users can also give up editing control of their accounts to an 'admin' or several 'admins'. This allows different use cases of the server. 

Users can add any kind of data they want and make them parsable following the struct format - available in [brainsatplay-data](https://github.com/brainsatplay/brainsatplay-data). There are macros and default structures provided for the most important data types and operations, while it's easy to follow along from there to create your own data systems.

Peers will receive notifications from the server when a connected user's data is updated, either by the parent user or a connected peer - if you have permission for that data or are included in a users:['id'] array in the struct. This is generalized. Some data notifications resolve automatically, while charts, data, chats, etc updates will leave persistent notifications until you access that data. Each peer gets their own notifications for each user as well as their own profiles so everybody can keep informed asynchronously and on-access.


## Where to from here:

- Integrate `minimongo` or equivalent so that local in-memory or IndexedDB based clientside databases can be established for full p2p and cloud server parity.

- Connecting handles for WebRTC streams and notifying when a user is online or not. 

- Connecting an SMS and email server for important alerts and chat notifications.


