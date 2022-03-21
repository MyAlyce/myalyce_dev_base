Finish all base components for the three main pages 
 - > dashboard + summaries/data exploration
 - > peer permission + summary page
 - > chatroom menu page with a full list of accessible chats. 

## Backend:
- Scheduler for synchronizing third party APIs i.e. fitbit.
    - Should either set timeout intervals and also just timeout limits based on when  user accesses e.g. don't synchronize until a user synchronizes, then don't allow another sync for another 5 minutes or longer

- CryptoJS AES or more efficient end-to-end encryption for communications.
    - This means creating secrets associated with each account that get passed conditionally for other users in a secure format (e.g. using a login server with its own security)

- Integrate `minimongo` or equivalent so that local in-memory or IndexedDB based clientside databases can be established for full p2p and cloud server parity.

- Connecting handles for WebRTC streams and notifying when a user is online or not. 

- Connecting an SMS and email server for important alerts and chat notifications.


