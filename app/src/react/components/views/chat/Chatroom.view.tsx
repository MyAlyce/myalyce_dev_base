import React, { Component } from 'react';

//these are overlays
//See the figma: https://www.figma.com/file/PFs4wWMt7IZdMm7Dlt9MDz/MyAlyce-Web-Front-End?node-id=0%3A1
interface P {}

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

export class Chatroom extends Component<P>  {

    render() {
        return (
        <div>
            <div>
                Chat header
            </div>
            <div>
                Chat
            </div>
        </div>
        );
    }
}


export class DataStream extends Component<P>  {

    render() {
        return (
        <div>
            <div>
                Data stream header
            </div>
            <div>
                Charts/logs
            </div>
        </div>
        );
    }
}