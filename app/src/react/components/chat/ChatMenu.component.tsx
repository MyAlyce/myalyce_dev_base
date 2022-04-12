import React, {Component} from 'react'


//explore chatrooms, should have a minimal and full info setting for each chatroom (so it squishes down without needing more components)

type P = {
    
}

export class ChatMenu extends Component<P> {
    render() {
        return (
            <div>
                <div>
                    Chatrooms:
                </div>
                <div>
                    Chatroom tools (e.g. create, add peer, etc.)
                </div>
            </div>
        );
    }
}